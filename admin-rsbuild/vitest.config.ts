import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import Icons from 'unplugin-icons/vite';

/**
 * 解决 vite 模块解析无法正确处理 # 前缀文件名的问题。
 *
 * rsbuild 正常处理 `./my-todo/#TodoTable` 这类导入路径，
 * 但 vite 将 # 视为 URL hash 分隔符，导致解析失败。
 *
 * 策略：
 * 1. transform: 将 `./foo/#Bar` 导入重写为 `./foo/hash_Bar`
 * 2. resolveId: 将 `hash_` 路径映射回实际的 `#` 文件
 * 3. load: 拦截 vite import analysis 生成的 `?import#` URL，返回文件内容
 */
function hashPrefixResolver() {
  /* 匹配 from './dir/#Name' 或 from './#Name'，dir 部分可选 */
  const HASH_IMPORT_RE = /((?:from\s+|import\s+)['"])(\.\/(?:[^'"]*\/)?)(#[^'"]+)(['"])/g;

  /** 解析包含 # 的文件路径，尝试不同扩展名 */
  function resolveHashFile(dir: string, hashName: string): string | null {
    /* 去掉可能的前导 #，再移除已知代码扩展名 */
    const cleanName = hashName
      .replace(/^#/, '')
      .replace(/\.(tsx|ts|jsx|js)$/, '');
    for (const ext of ['.tsx', '.ts', '.jsx', '.js', '']) {
      const candidate = path.join(dir, `#${cleanName}${ext}`);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  /** 重写代码中所有 # 前缀导入为 hash_ 前缀 */
  function rewriteHashImports(code: string): { code: string; changed: boolean } {
    let changed = false;
    const rewritten = code.replace(
      HASH_IMPORT_RE,
      (_match, prefix, dir, hashPart, suffix) => {
        changed = true;
        return `${prefix}${dir}hash_${hashPart.slice(1)}${suffix}`;
      },
    );
    return { code: rewritten, changed };
  }

  return {
    name: 'hash-prefix-resolver',
    enforce: 'pre' as const,

    transform(code: string, id: string) {
      if (!id.includes('/routes/') && !id.includes(`${path.sep}routes${path.sep}`)) {
        return null;
      }
      if (!code.includes('/#') && !code.includes('./#')) {
        return null;
      }
      const result = rewriteHashImports(code);
      if (result.changed) {
        return { code: result.code, map: null };
      }
      return null;
    },

    resolveId(source: string, importer: string | undefined) {
      if (!importer) {
        return null;
      }
      /* 处理重写后的 `hash_` 相对路径 */
      if (source.includes('hash_') && (source.startsWith('./') || source.startsWith('../'))) {
        let dir: string;

        /* importer 含 ?import# 时，需从 URL 中提取实际目录 */
        if (importer.includes('?import#')) {
          const importMatch = importer.match(/(.+?)\?import#(.+)/);
          if (importMatch) {
            const [, dirPart] = importMatch;
            /* 去掉尾部斜杠，防止 path.dirname 把目录误判为上一级 */
            const normalizedDir = dirPart.replace(/\/+$/, '');
            /** 判断路径是否看起来像文件（有已知代码扩展名） */
            const looksLikeFile = /\.(tsx|ts|jsx|js)$/.test(normalizedDir);
            if (path.isAbsolute(normalizedDir) && fs.existsSync(normalizedDir)) {
              dir = looksLikeFile ? path.dirname(normalizedDir) : normalizedDir;
            } else if (!looksLikeFile && fs.existsSync(path.resolve(__dirname, normalizedDir.replace(/^\//, '')))) {
              /* dirPart 是目录路径（如 /src/routes/agile-board） */
              dir = path.resolve(__dirname, normalizedDir.replace(/^\//, ''));
            } else {
              /* dirPart 是文件路径，取其父目录 */
              dir = path.dirname(path.resolve(__dirname, normalizedDir.replace(/^\//, '')));
            }
          } else {
            return null;
          }
        } else {
          const importerClean = importer.split('?')[0];
          dir = path.dirname(importerClean);
        }

        const hashPath = source.replace(/hash_/g, '#');
        const resolved = path.resolve(dir, hashPath);
        const found = resolveHashFile(path.dirname(resolved), path.basename(resolved));
        if (found) {
          return found;
        }
      }
      return null;
    },

    load(id: string) {
      /* 拦截 vite import analysis 生成的 ?import# URL */
      if (!id.includes('?import#')) {
        return null;
      }
      const match = id.match(/(.+?)\?import#(.+)/);
      if (!match) {
        return null;
      }
      const [, dirPart, fileName] = match;
      /* dirPart 可能是绝对路径（以 / 开头），也可能是类似 /src/routes/... 的项目相对路径 */
      const normalizedDir = dirPart.replace(/\/+$/, '');
      const looksLikeFile = /\.(tsx|ts|jsx|js)$/.test(normalizedDir);
      let baseDir: string;
      if (path.isAbsolute(normalizedDir) && fs.existsSync(normalizedDir)) {
        baseDir = looksLikeFile ? path.dirname(normalizedDir) : normalizedDir;
      } else {
        const resolved = path.resolve(__dirname, normalizedDir.replace(/^\//, ''));
        baseDir = looksLikeFile ? path.dirname(resolved) : resolved;
      }
      const found = resolveHashFile(baseDir, fileName);
      if (found) {
        const content = fs.readFileSync(found, 'utf-8');
        /* 加载的文件内容中可能还有 # 导入，一并重写 */
        return rewriteHashImports(content).code;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    hashPrefixResolver(),
    Icons({ compiler: 'jsx', jsx: 'react' }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

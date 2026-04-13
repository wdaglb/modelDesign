import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';
import { pluginLess } from '@rsbuild/plugin-less';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import * as path from 'path';
import Icons from 'unplugin-icons/rspack';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

export default defineConfig({
  plugins: [pluginReact(), pluginLess(), pluginStyledComponents()],

  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './src'),
    },
  },

  html: {
    title: process.env.TITLE,
    template: './index.html',
  },

  performance: {
    /**
     * 关闭全量 preload，避免构建产物把按路由拆分的异步脚本全部注入首屏。
     * 这些脚本在页面加载后的短时间内不会立即执行，浏览器会持续打印
     * “preloaded but not used” 提示，反而干扰真实问题排查。
     */
    preload: false,
  },

  output: {
    cssModules: {
      exportGlobals: true,
    },
  },

  tools: {
    rspack: (_, { prependPlugins, appendPlugins }) => {
      appendPlugins(
        TanStackRouterRspack({
          target: 'react',
          autoCodeSplitting: true,
          routeFileIgnorePrefix: '#',
          routeFileIgnorePattern: '^(components|styles|__[^.]+)$',
        }),
      );

      prependPlugins([
        Icons({
          compiler: 'jsx',
          autoInstall: true,
        }),
      ]);

      if (process.env.RSDOCTOR) {
        appendPlugins(new RsdoctorRspackPlugin({}));
      }
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },

  source: {
    define: {
      'process.env.TITLE': JSON.stringify(process.env.TITLE),
    },
  },
});

import type { ClipboardEvent } from 'react';

import type { MarkdownImageUploadResult } from './types';

/**
 * 默认编辑器高度。
 */
export const DEFAULT_EDITOR_HEIGHT = 420;

/**
 * 解析编辑器高度。
 */
export const resolveEditorHeight = (height?: number | string) => {
  if (height === undefined) {
    return DEFAULT_EDITOR_HEIGHT;
  }

  return height;
};

/**
 * 规范化编辑器值。
 */
export const normalizeMarkdownValue = (value?: string) => {
  if (!value) {
    return '';
  }

  return value;
};

/**
 * 收集预览区域中的图片地址。
 *
 * 这里统一从最终渲染后的 DOM 读取图片地址，避免 Markdown 语法、
 * HTML 标签和编辑器内部转换规则不一致时出现漏抓。
 */
export const collectMarkdownPreviewImageUrls = (
  container: HTMLElement | null,
) => {
  if (!container) {
    return [];
  }

  const imageElements = Array.from(container.querySelectorAll('img'));
  const imageUrls = imageElements
    .map((imageElement) => {
      return imageElement.getAttribute('src') || '';
    })
    .filter((imageUrl) => {
      return Boolean(imageUrl);
    });

  return Array.from(new Set(imageUrls));
};

/**
 * 解析当前点击图片在预览组中的索引。
 *
 * 统一封装索引查找，便于后续单测覆盖点击放大的核心行为。
 */
export const resolveMarkdownPreviewImageIndex = (
  imageUrls: string[],
  currentImageUrl: string,
) => {
  return imageUrls.findIndex((imageUrl) => {
    return imageUrl === currentImageUrl;
  });
};

/**
 * 提取粘贴图片文件。
 */
export const getPastedImageFiles = (event: ClipboardEvent<HTMLDivElement>) => {
  const files = Array.from(event.clipboardData.files);

  return files.filter((file) => {
    return file.type.startsWith('image/');
  });
};

/**
 * 在指定选区插入文本。
 */
export const insertTextAtSelection = (
  content: string,
  insertedText: string,
  start: number,
  end: number,
) => {
  const before = content.slice(0, start);
  const after = content.slice(end);

  return `${before}${insertedText}${after}`;
};

/**
 * 构造 markdown 图片文本。
 */
export const buildMarkdownImageText = (
  images: MarkdownImageUploadResult[],
) => {
  return images
    .map((image) => {
      let altText = '';
      if (image.alt) {
        altText = image.alt;
      }

      let titleText = '';
      if (image.title) {
        titleText = ` "${image.title}"`;
      }

      return `![${altText}](${image.url}${titleText})`;
    })
    .join('\n');
};

const MARKDOWN_TODO_PATTERN = /^(\s*[-*]\s+\[)( |x|X)(\]\s.*)$/;

/**
 * 切换指定索引的 Markdown 待办事项。
 *
 * 这里按“源文里出现的第 N 个待办项”进行切换，而不是依赖渲染后的 DOM 文本，
 * 这样可以避免强调、链接等内联语法影响匹配结果，也更适合由预览组件统一复用。
 *
 * @param content 原始 Markdown
 * @param todoIndex 待办索引
 * @return 切换结果；若索引无效则返回 null
 */
export const toggleMarkdownTodoByIndex = (
  content: string,
  todoIndex: number,
) => {
  const lines = content.split('\n');
  let currentTodoIndex = -1;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const currentLine = lines[lineIndex];
    const matchedTodo = currentLine.match(MARKDOWN_TODO_PATTERN);

    if (!matchedTodo) {
      continue;
    }

    currentTodoIndex += 1;

    if (currentTodoIndex !== todoIndex) {
      continue;
    }

    const checked = matchedTodo[2].toLowerCase() !== 'x';
    lines[lineIndex] = `${matchedTodo[1]}${checked ? 'x' : ' '}${matchedTodo[3]}`;

    return {
      checked,
      nextValue: lines.join('\n'),
    };
  }

  return null;
};

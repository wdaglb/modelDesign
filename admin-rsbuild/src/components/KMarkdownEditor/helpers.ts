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

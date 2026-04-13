import { describe, expect, it } from 'vitest';

import {
  collectMarkdownPreviewImageUrls,
  resolveMarkdownPreviewImageIndex,
} from '../helpers';

describe('collectMarkdownPreviewImageUrls', () => {
  it('应提取预览容器中的图片地址并去重', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="md-editor-preview">
        <img src="https://example.com/a.png" />
        <p>说明文本</p>
        <img src="https://example.com/b.png" />
        <img src="https://example.com/a.png" />
      </div>
    `;

    expect(collectMarkdownPreviewImageUrls(container)).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
    ]);
  });
});

describe('resolveMarkdownPreviewImageIndex', () => {
  it('应返回当前图片在预览组中的索引', () => {
    const imageUrls = [
      'https://example.com/a.png',
      'https://example.com/b.png',
      'https://example.com/c.png',
    ];

    expect(
      resolveMarkdownPreviewImageIndex(
        imageUrls,
        'https://example.com/b.png',
      ),
    ).toBe(1);
  });

  it('未命中时应返回 -1', () => {
    expect(
      resolveMarkdownPreviewImageIndex(
        ['https://example.com/a.png'],
        'https://example.com/unknown.png',
      ),
    ).toBe(-1);
  });
});

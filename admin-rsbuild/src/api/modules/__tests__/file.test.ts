import { describe, expect, it } from 'vitest';

import { normalizeFileAccessUrl } from '../file';

describe('normalizeFileAccessUrl', () => {
  it('会优先使用访问域名拼接图片访问地址', () => {
    expect(
      normalizeFileAccessUrl(
        '/system/file/image/content/test-id',
        'http://localhost:9999',
      ),
    ).toBe('http://localhost:9999/system/file/image/content/test-id');
  });

  it('会为系统相对路径补齐 api 前缀', () => {
    expect(normalizeFileAccessUrl('/system/file/image/content/test-id')).toBe(
      '/api/system/file/image/content/test-id',
    );
  });

  it('不会重复补齐已带 api 前缀的地址', () => {
    expect(
      normalizeFileAccessUrl('/api/system/file/image/content/test-id'),
    ).toBe('/api/system/file/image/content/test-id');
  });

  it('不会修改绝对地址和特殊协议地址', () => {
    expect(normalizeFileAccessUrl('https://example.com/image.png')).toBe(
      'https://example.com/image.png',
    );

    expect(normalizeFileAccessUrl('blob:test-image')).toBe('blob:test-image');

    expect(normalizeFileAccessUrl('data:image/png;base64,test')).toBe(
      'data:image/png;base64,test',
    );
  });
});

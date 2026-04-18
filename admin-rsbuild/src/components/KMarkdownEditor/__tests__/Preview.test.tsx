import { useEffect } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import KMarkdownPreview from '../Preview';

vi.mock('md-editor-rt', () => {
  return {
    MdPreview: (props: {
      value?: string;
      onHtmlChanged?: () => void;
      id?: string;
    }) => {
      useEffect(() => {
        props.onHtmlChanged?.();
      }, []);

      return (
        <div
          id={props.id}
          data-testid={'md-preview'}
          dangerouslySetInnerHTML={{ __html: props.value || '' }}
        />
      );
    },
  };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  const PreviewGroup = (props: {
    items?: string[];
    preview?: {
      visible?: boolean;
      current?: number;
      onChange?: (current: number) => void;
      onVisibleChange?: (visible: boolean) => void;
    };
  }) => {
    const itemsText = JSON.stringify(props.items || []);

    return (
      <div>
        <div
          data-testid={'preview-group-state'}
          data-current={String(props.preview?.current ?? -1)}
          data-visible={String(Boolean(props.preview?.visible))}
          data-items={itemsText}
        />
        <button
          type={'button'}
          data-testid={'preview-next'}
          onClick={() => {
            props.preview?.onChange?.(1);
          }}
        >
          next
        </button>
        <button
          type={'button'}
          data-testid={'preview-close'}
          onClick={() => {
            props.preview?.onVisibleChange?.(false);
          }}
        >
          close
        </button>
      </div>
    );
  };

  return {
    ...actual,
    Image: {
      ...actual.Image,
      PreviewGroup,
    },
  };
});

describe('KMarkdownPreview', () => {
  it('多图预览切换时应同步 current 索引', async () => {
    /**
     * 用内联 html 模拟预览结果，验证点击图片打开后可切到下一张。
     */
    render(
      <KMarkdownPreview
        value={
          '<img src="https://example.com/a.png" />' +
          '<img src="https://example.com/b.png" />'
        }
      />,
    );

    const allImages = document.querySelectorAll('img');
    expect(allImages.length).toBe(2);

    fireEvent.click(allImages[0] as HTMLImageElement);

    expect(
      screen.getByTestId('preview-group-state').getAttribute('data-visible'),
    ).toBe('true');
    expect(
      screen.getByTestId('preview-group-state').getAttribute('data-current'),
    ).toBe('0');

    fireEvent.click(screen.getByTestId('preview-next'));

    expect(
      screen.getByTestId('preview-group-state').getAttribute('data-current'),
    ).toBe('1');

    fireEvent.click(screen.getByTestId('preview-close'));

    expect(
      screen.getByTestId('preview-group-state').getAttribute('data-visible'),
    ).toBe('false');
  });
});

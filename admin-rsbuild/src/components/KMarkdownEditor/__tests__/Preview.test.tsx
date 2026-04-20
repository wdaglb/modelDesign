import { useEffect } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import KMarkdownPreview, {
  buildMarkdownPreviewWrapperStyle,
} from '../Preview';
import { toggleMarkdownTodoByIndex } from '../helpers';

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

      const markdownValue = props.value || '';
      if (markdownValue.includes('- [')) {
        const todoNodes = markdownValue.split('\n').map((line, index) => {
          const isChecked = line.includes('- [x]') || line.includes('- [X]');

          return (
            <label key={`todo-${index}`}>
              <input type={'checkbox'} checked={isChecked} readOnly />
              <span>{line}</span>
            </label>
          );
        });

        return (
          <div id={props.id} data-testid={'md-preview'}>
            {todoNodes}
          </div>
        );
      }

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

  it('预览外框应复用 Ant Design 边框 token', () => {
    expect(buildMarkdownPreviewWrapperStyle('auto')).toMatchObject({
      height: 'auto',
      overflow: 'auto',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--ant-colorBorder, #d9d9d9)',
      borderRadius: 'var(--ant-borderRadius, 8px)',
      padding: 16,
      backgroundColor: 'var(--ant-colorBgContainer, #fff)',
    });
  });

  it('点击待办事项时应向外抛出切换后的 Markdown 内容', () => {
    const onTodoToggle = vi.fn();

    render(
      <KMarkdownPreview
        value={'- [ ] 第一项\n- [x] 第二项'}
        onTodoToggle={onTodoToggle}
      />,
    );

    const todoCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(todoCheckboxes[1] as HTMLInputElement);

    expect(onTodoToggle).toHaveBeenCalledWith({
      todoIndex: 1,
      checked: false,
      nextValue: '- [ ] 第一项\n- [ ] 第二项',
    });
  });

  it('应按索引切换 Markdown 源文中的待办状态', () => {
    expect(
      toggleMarkdownTodoByIndex('- [ ] 第一项\n- [x] 第二项', 1),
    ).toEqual({
      checked: false,
      nextValue: '- [ ] 第一项\n- [ ] 第二项',
    });
  });

  it('已完成待办项的文本应显示删除线', () => {
    render(<KMarkdownPreview value={'- [ ] 第一项\n- [x] 第二项'} />);

    const todoTexts = screen.getAllByText(/^\- \[[ x]\] /);

    expect((todoTexts[0] as HTMLElement).style.textDecoration).toBe('none');
    expect((todoTexts[1] as HTMLElement).style.textDecoration).toBe(
      'line-through',
    );
  });

  it('图片悬停时应展示 Ant Design 风格的预览提示', () => {
    render(
      <KMarkdownPreview value={'<img src="https://example.com/c.png" />'} />,
    );

    const imageElement = document.querySelector('img');
    const imageShell = imageElement?.parentElement as HTMLElement;
    const imageBadge = screen.getByText('预览').parentElement as HTMLElement;

    expect(imageShell.dataset.markdownPreviewImageShell).toBe('true');
    expect((imageElement as HTMLImageElement).style.cursor).toBe('zoom-in');
    expect(imageBadge.style.backdropFilter).toBe('blur(12px)');
    expect(imageBadge.style.borderRadius).toBe('999px');
    expect(imageBadge.style.opacity).toBe('0');

    fireEvent.mouseEnter(imageShell);

    expect(imageBadge.style.opacity).toBe('1');
    expect(imageBadge.style.transform).toBe('translateY(0) scale(1)');
    expect((imageElement as HTMLImageElement).style.boxShadow).toContain(
      'rgba(0, 0, 0, 0.12)',
    );
  });
});

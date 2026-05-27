import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import KMarkdownEditor from '../index';

const markdownEditorMock = vi.hoisted(() => {
  return {
    getSelectedText: vi.fn<() => string | undefined>(),
    insert: vi.fn(),
  };
});

vi.mock('@/api', () => {
  return {
    ApiFile: {
      uploadImage: vi.fn(),
    },
  };
});

vi.mock('md-editor-rt', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    config: vi.fn(),
    MdEditor: React.forwardRef(
      (
        props: {
          defToolbars?: React.ReactElement[];
          style?: {
            height?: number | string;
            borderColor?: string;
            borderRadius?: string;
            backgroundColor?: string;
          };
        },
        ref,
      ) => {
        React.useImperativeHandle(ref, () => {
          return {
            getSelectedText: markdownEditorMock.getSelectedText,
            insert: markdownEditorMock.insert,
          };
        });

        /**
         * 测试替身只渲染本组件关心的外观属性和自定义工具栏，避免把
         * md-editor-rt 的完整 DOM 结构引入单元测试造成脆弱断言。
         */
        const renderCustomToolbars = () => {
          if (!props.defToolbars) {
            return null;
          }

          return props.defToolbars.map((toolbar, index) => {
            return React.cloneElement(toolbar, { key: index });
          });
        };

        return (
          <div
            data-testid={'md-editor-root'}
            data-height={String(props.style?.height)}
            data-border-color={String(props.style?.borderColor)}
            data-border-radius={String(props.style?.borderRadius)}
            data-background-color={String(props.style?.backgroundColor)}
          >
            {renderCustomToolbars()}
          </div>
        );
      },
    ),
  };
});

describe('KMarkdownEditor', () => {
  afterEach(() => {
    vi.clearAllMocks();
    markdownEditorMock.getSelectedText.mockReturnValue(undefined);
  });

  it('编辑器外框应复用 Ant Design 边框 token', () => {
    render(<KMarkdownEditor value={''} onChange={vi.fn()} />);

    const editorRoot = screen.getByTestId('md-editor-root');

    expect(editorRoot.getAttribute('data-height')).toBe('420');
    expect(editorRoot.getAttribute('data-border-color')).toBe(
      'var(--ant-colorBorder, #d9d9d9)',
    );
    expect(editorRoot.getAttribute('data-border-radius')).toBe(
      'var(--ant-borderRadius, 8px)',
    );
    expect(editorRoot.getAttribute('data-background-color')).toBe(
      'var(--ant-colorBgContainer, #fff)',
    );
  });

  it('点击紧凑工具栏链接按钮后应通过弹窗插入 Markdown 链接', async () => {
    markdownEditorMock.getSelectedText.mockReturnValue('需求文档');
    const user = userEvent.setup();

    render(
      <KMarkdownEditor
        value={'请查看需求文档'}
        onChange={vi.fn()}
        toolbarPreset={'compact'}
      />,
    );

    await user.click(screen.getByRole('button', { name: '链接' }));

    expect(screen.getByPlaceholderText('链接文字')).toHaveProperty(
      'value',
      '需求文档',
    );
    await user.type(
      screen.getByPlaceholderText('链接地址，例如 https://example.com'),
      'https://example.com/spec',
    );
    await user.click(screen.getByRole('button', { name: '插入链接' }));

    expect(markdownEditorMock.insert).toHaveBeenCalledTimes(1);

    const insertGenerator = markdownEditorMock.insert.mock.calls[0][0];
    expect(insertGenerator('')).toEqual({
      targetValue: '[需求文档](https://example.com/spec)',
      select: false,
      deviationStart: 7,
      deviationEnd: -1,
    });
  });

  it('选中已有 Markdown 链接时应拆分文字和地址便于修改', async () => {
    markdownEditorMock.getSelectedText.mockReturnValue(
      '[旧文档](https://example.com/old)',
    );
    const user = userEvent.setup();

    render(
      <KMarkdownEditor
        value={'[旧文档](https://example.com/old)'}
        onChange={vi.fn()}
        toolbarPreset={'compact'}
      />,
    );

    await user.click(screen.getByRole('button', { name: '链接' }));

    expect(screen.getByPlaceholderText('链接文字')).toHaveProperty(
      'value',
      '旧文档',
    );
    expect(
      screen.getByPlaceholderText('链接地址，例如 https://example.com'),
    ).toHaveProperty('value', 'https://example.com/old');
  });

  it('选中裸链接时应自动填入链接地址并允许补充文字', async () => {
    markdownEditorMock.getSelectedText.mockReturnValue(
      'https://example.com/direct',
    );
    const user = userEvent.setup();

    render(
      <KMarkdownEditor
        value={'https://example.com/direct'}
        onChange={vi.fn()}
        toolbarPreset={'compact'}
      />,
    );

    await user.click(screen.getByRole('button', { name: '链接' }));

    expect(screen.getByPlaceholderText('链接文字')).toHaveProperty(
      'value',
      '',
    );
    expect(
      screen.getByPlaceholderText('链接地址，例如 https://example.com'),
    ).toHaveProperty('value', 'https://example.com/direct');
  });
});

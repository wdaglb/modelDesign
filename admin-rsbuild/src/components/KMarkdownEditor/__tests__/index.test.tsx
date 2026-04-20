import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import KMarkdownEditor from '../index';

vi.mock('@/api', () => {
  return {
    ApiFile: {
      uploadImage: vi.fn(),
    },
  };
});

vi.mock('md-editor-rt', () => {
  return {
    MdEditor: (props: {
      style?: {
        height?: number | string;
        borderColor?: string;
        borderRadius?: string;
        backgroundColor?: string;
      };
    }) => {
      return (
        <div
          data-testid={'md-editor-root'}
          data-height={String(props.style?.height)}
          data-border-color={String(props.style?.borderColor)}
          data-border-radius={String(props.style?.borderRadius)}
          data-background-color={String(props.style?.backgroundColor)}
        />
      );
    },
  };
});

describe('KMarkdownEditor', () => {
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
});

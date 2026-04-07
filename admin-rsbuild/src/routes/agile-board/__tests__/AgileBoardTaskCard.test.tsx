import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import type { AgileBoardTask } from '@/routes/agile-board/#types';
import { AgileBoardTaskCardPreview } from '@/routes/agile-board/components/AgileBoardTaskCard';

const previewTask = {
  id: 201,
  projectId: 88,
  title: '拖拽浮层保持强调感',
  status: 'todo',
  priority: 'high',
  assignee: '小王',
  dueTime: '2026-04-07',
  projectName: '火星项目',
  workDays: 2,
} as AgileBoardTask;

describe('AgileBoardTaskCardPreview', () => {
  it('拖拽浮层保留既有宽度并增强强调边框', () => {
    const { container } = render(
      createElement(AgileBoardTaskCardPreview as never, {
        task: previewTask,
        accentColor: '#2563eb',
      }),
    );

    const shellNode = container.firstElementChild;

    expect(shellNode).toBeTruthy();

    if (!shellNode) {
      return;
    }

    const shellStyle = window.getComputedStyle(shellNode);

    expect(shellStyle.width).toBe('248px');
    expect(shellStyle.borderTopWidth).toBe('1px');
    expect(shellStyle.boxShadow).not.toBe('none');
  });
});

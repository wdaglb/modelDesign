import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { ProjectTaskType } from '@/api/modules/project-task-type';
import type { AgileBoardTask } from '@/routes/agile-board/#types';
import { AgileBoardTaskCardPreview } from '@/routes/agile-board/components/AgileBoardTaskCard';
import useAuthStore from '@/store/auth.ts';

vi.mock('@/store/auth.ts', () => {
  return {
    default: vi.fn(),
  };
});

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
  taskNo: 'TASK-201',
  typeId: 2,
  typeName: '缺陷',
} as AgileBoardTask;

const taskTypes: ProjectTaskType[] = [
  {
    id: 2,
    name: '缺陷',
    sort: 1,
    gitBranchPrefixGroup: 'bugfix',
  },
];

describe('AgileBoardTaskCardPreview', () => {
  it('拖拽浮层保留既有宽度并增强强调边框', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      return selector({
        currentInfo: {
          gitUsername: 'alice-dev',
        },
      });
    });
    const { container } = render(
      createElement(AgileBoardTaskCardPreview as never, {
        task: previewTask,
        taskTypes,
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
    expect(screen.getByText('火星项目')).toBeTruthy();
    expect(screen.getByText('小王')).toBeTruthy();
    expect(screen.queryByText('bugfix/alice-dev/TASK-201')).toBeNull();
    expect(screen.queryByText('2 人天')).toBeNull();
    expect(screen.queryByText('截止 2026-04-07')).toBeNull();
  });
});

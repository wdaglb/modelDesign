import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import TaskDetailDrawerRoute from './task-detail-drawer-demo.route';

describe('task-detail-drawer-demo.route', () => {
  it('应渲染任务详情抽屉标题与底部操作', async () => {
    render(<TaskDetailDrawerRoute />);

    expect(await screen.findByText('优化任务详情抽屉结构与编辑体验')).toBeTruthy();
    expect(screen.getByRole('button', { name: '复制链接' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '编辑任务' })).toBeTruthy();
  });

  it('应渲染三个页签标签', async () => {
    render(<TaskDetailDrawerRoute />);

    expect(await screen.findByText('详情')).toBeTruthy();
    expect(screen.getByText('子任务 2')).toBeTruthy();
    expect(screen.getByText('变更日志 2')).toBeTruthy();
  });
});

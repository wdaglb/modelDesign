import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

import type { AgileBoardColumnMeta } from '@/routes/agile-board/#types';
import BoardColumn from '@/routes/agile-board/components/BoardColumn';

const column: AgileBoardColumnMeta = {
  status: 'todo',
  title: '待处理',
  isCompleted: false,
  accentColor: '#2563eb',
  background: 'rgba(37, 99, 235, 0.05)',
};

describe('BoardColumn', () => {
  it('列无数据时展示 Empty 说明', () => {
    render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[]}
          subtaskMap={new Map()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByText('拖拽任务到这里')).toBeDefined();
  });
});

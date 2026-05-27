import { Card } from 'antd';
import styled from 'styled-components';

/**
 * 任务详情抽屉整体容器。
 */
export const TaskDetailDrawerSurface = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
`;

/**
 * 抽屉正文滚动区域。
 */
export const TaskDetailDrawerScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 20px;
`;

/**
 * 抽屉固定底部。
 */
export const TaskDetailDrawerFooterBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  margin: 0 28px 24px;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.06);
`;

/**
 * 抽屉正文纵向布局。
 */
export const TaskDetailDrawerStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

/**
 * 实体信息卡。
 */
export const TaskDetailEntityCard = styled(Card)`
  border-radius: 8px;
  border: 1px solid #e5e6eb;
  box-shadow: none;

  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }
`;

/**
 * 实体标题栈。
 */
export const TaskDetailEntityTitleStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

/**
 * 实体编号行。
 */
export const TaskDetailIdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

/**
 * 详情头部可点击复制的短文本。
 *
 * 任务编号和分支名都属于高频复制信息，直接在文本本身提供交互，
 * 可以减少额外“复制”按钮占位；下划线用于明确提示这是可点击区域。
 */
export const TaskDetailCopyText = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: #4e5969;
  font-size: 10px;
  line-height: 16px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: #1677ff;
  }

  &:focus-visible {
    outline: 2px solid rgba(22, 119, 255, 0.35);
    outline-offset: 2px;
    border-radius: 3px;
  }
`;

/**
 * 实体主标题。
 */
export const TaskDetailEntityTitle = styled.h3<{ $clickable?: boolean }>`
  margin: 0;
  color: #1d2129;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  cursor: ${(props) => {
    if (props.$clickable) {
      return 'pointer';
    }

    return 'default';
  }};
  transition: color 0.2s ease;

  &:hover {
    color: ${(props) => {
      if (props.$clickable) {
        return '#1677ff';
      }

      return '#1d2129';
    }};
  }
`;

/**
 * 标签行。
 */
export const TaskDetailChipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

/**
 * 摘要标签。
 */
export const TaskDetailChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f8fafc;
  color: #1d2129;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  cursor: pointer;
`;

/**
 * 摘要标签字段名。
 */
export const TaskDetailChipLabel = styled.span`
  color: #667085;
  font-size: 11px;
  line-height: 18px;
  font-weight: 500;
`;

/**
 * 摘要标签字段值。
 */
export const TaskDetailChipValue = styled.span`
  color: #1d2129;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
`;

/**
 * 蓝色状态标签。
 */
export const TaskDetailPrimaryChip = styled(TaskDetailChip)`
  background: #e8f3ff;
`;

/**
 * 蓝色状态标签字段名。
 */
export const TaskDetailPrimaryChipLabel = styled(TaskDetailChipLabel)`
  color: #4e5969;
`;

/**
 * 蓝色状态标签字段值。
 */
export const TaskDetailPrimaryChipValue = styled(TaskDetailChipValue)`
  color: #1677ff;
`;

/**
 * Tabs 胶囊容器。
 */
export const TaskDetailTabsShell = styled.div`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }

  .ant-tabs-nav-list {
    padding: 6px;
    border-radius: 12px;
    background: #f0f2f5;
  }

  .ant-tabs-tab {
    margin: 0;
    padding: 10px 16px;
    border-radius: 10px;
    color: #4e5969;
    transition: all 0.2s ease;
  }

  .ant-tabs-tab.ant-tabs-tab-active {
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #1677ff;
    font-weight: 600;
  }

  .ant-tabs-ink-bar {
    display: none;
  }
`;

/**
 * 通用内容卡。
 */
export const TaskDetailPanelCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid #e5e6eb;
  box-shadow: none;

  .ant-card-head {
    min-height: 0;
    padding: 18px 20px 0;
    border-bottom: none;
  }

  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px 20px 20px;
  }
`;

/**
 * 预览信息块列表。
 */
export const TaskDetailPreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/**
 * 预览信息块。
 */
export const TaskDetailPreviewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #e5e6eb;
  background: #fcfcfd;
`;

/**
 * 编辑态的标题输入卡。
 */
export const TaskEditTitleCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid #e5e6eb;
  background: #fafbfc;
  box-shadow: none;

  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
  }
`;

/**
 * 编辑态两列字段网格。
 */
export const TaskEditMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

/**
 * 编辑态标签文本。
 */
export const TaskEditFieldLabel = styled.div`
  margin-bottom: 6px;
  color: #344054;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
`;

/**
 * 子任务表格容器。
 */
export const TaskDetailSubtaskTable = styled.div`
  overflow: hidden;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  background: #ffffff;
`;

/**
 * 子任务快捷操作区。
 */
export const TaskDetailSubtaskToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

/**
 * 子任务提示文案。
 */
export const TaskDetailSubtaskHint = styled.div`
  color: #667085;
  font-size: 13px;
  line-height: 20px;
`;

/**
 * 子任务表头。
 */
export const TaskDetailSubtaskHeadRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) 120px 120px 120px 140px;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  color: #344054;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
`;

/**
 * 子任务数据行。
 */
export const TaskDetailSubtaskRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) 120px 120px 120px 140px;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-top: 1px solid #eef2f6;
  background: #ffffff;

  &:nth-child(odd) {
    background: #fcfcfd;
  }
`;

/**
 * 子任务标题单元格。
 */
export const TaskDetailSubtaskTitleCell = styled.div`
  min-width: 0;
  color: #1d2129;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
`;

/**
 * 子任务普通单元格。
 */
export const TaskDetailSubtaskCell = styled.div`
  color: #344054;
  font-size: 13px;
  line-height: 20px;
`;

/**
 * 时间线列表。
 */
export const TaskDetailTimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

/**
 * 时间线条目。
 */
export const TaskDetailTimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 0 0 16px 16px;
  border-left: 2px solid #d0d5dd;
`;

/**
 * 时间线标题。
 */
export const TaskDetailTimelineTitle = styled.div`
  color: #344054;
  font-family: 'IBM Plex Mono', 'SFMono-Regular', 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
`;

/**
 * 时间线正文。
 */
export const TaskDetailTimelineBody = styled.div`
  color: #475467;
  font-size: 14px;
  line-height: 24px;
`;

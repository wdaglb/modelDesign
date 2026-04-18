import { Card } from 'antd';
import styled from 'styled-components';

/**
 * 任务详情抽屉根容器。
 */
export const TaskPreviewDrawerRoot = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f7f9fc;
`;

/**
 * 抽屉头部区域。
 */
export const TaskPreviewDrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`;

/**
 * 抽屉正文滚动区域。
 */
export const TaskPreviewDrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px;
`;

/**
 * 概览页分组容器。
 */
export const TaskPreviewSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

/**
 * 抽屉底部区域。
 */
export const TaskPreviewDrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 28px 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  background: #f7f9fc;
`;

/**
 * 抽屉底部操作行。
 */
export const TaskPreviewFooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

/**
 * 抽屉底部右侧按钮组。
 */
export const TaskPreviewFooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Tabs 外层壳，用于贴合设计稿的胶囊导航背景。
 */
export const TaskPreviewTabsShell = styled.div`
  .ant-tabs-nav-list {
    padding: 4px;
    border-radius: 12px;
    background: #f5f7fa;
  }

  .ant-tabs-tab {
    margin: 0;
    padding: 6px 12px;
    border-radius: 10px;
  }

  .ant-tabs-tab-active {
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  }

  .ant-tabs-ink-bar {
    display: none;
  }
`;

/**
 * 概览卡片内描述布局，避免大段内联样式。
 */
export const TaskPreviewDescription = styled.div`
  .ant-descriptions-item-label {
    width: 88px;
    color: rgba(15, 23, 42, 0.62);
  }
`;

/**
 * 子任务头部信息区。
 */
export const TaskPreviewSubtaskHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

/**
 * 子任务基础字段网格。
 */
export const TaskPreviewSubtaskMetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

/**
 * 日志头部信息区。
 */
export const TaskPreviewChangeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

/**
 * 变更块值行。
 */
export const TaskPreviewChangeValue = styled.div`
  margin-top: 6px;
`;

/**
 * 日志操作者次级信息。
 */
export const TaskPreviewOperatorMeta = styled.div`
  margin-top: 4px;
`;

/**
 * 任务编号统一等宽字体样式。
 */
export const TaskPreviewTaskNumberText = styled.span`
  font-size: 12px;
  letter-spacing: 0.3px;
  font-family: 'SFMono-Regular', 'Cascadia Code', 'JetBrains Mono', monospace;
`;

/**
 * 摘要区项目文案。
 */
export const TaskPreviewProjectText = styled.span`
  font-size: 12px;
  letter-spacing: 0.3px;
`;

/**
 * 概览与子面板纵向堆叠容器。
 */
export const TaskPreviewVerticalStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

/**
 * 全宽容器辅助类。
 */
export const TaskPreviewFullWidth = styled.div`
  width: 100%;
`;

/**
 * 摘要标题。
 */
export const TaskPreviewTitle = styled.h3`
  margin: 0;
  line-height: 30px;
  font-size: 24px;
  font-weight: 600;
`;

/**
 * 抽屉底部提示卡片。
 */
export const TaskPreviewFooterCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);

  .ant-card-body {
    padding: 14px 20px;
  }
`;

/**
 * 摘要头卡片。
 */
export const TaskPreviewSummaryCard = styled(Card)`
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);

  .ant-card-body {
    padding: 20px;
  }
`;

/**
 * 摘要头主区域。
 */
export const TaskPreviewSummaryMain = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

/**
 * 摘要头左侧信息区。
 */
export const TaskPreviewSummaryMeta = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * 快速操作区外层。
 */
export const TaskPreviewQuickActions = styled.div`
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
`;

/**
 * Tabs 与正文区域容器。
 */
export const TaskPreviewBodyPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

/**
 * 通用预览分组卡片。
 */
export const TaskPreviewSectionCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);

  .ant-card-head {
    min-height: 0;
    padding: 16px 20px 0;
    border-bottom: none;
  }

  .ant-card-body {
    padding: 20px;
  }
`;

/**
 * 子任务列表区域。
 */
export const TaskPreviewSubtaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

/**
 * 子任务项卡片。
 */
export const TaskPreviewSubtaskCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: none;

  .ant-card-body {
    padding: 14px 16px;
  }
`;

/**
 * 变更日志列表区域。
 */
export const TaskPreviewChangeLogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

/**
 * 变更日志项卡片。
 */
export const TaskPreviewChangeLogCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: none;

  .ant-card-body {
    padding: 18px;
  }
`;

/**
 * 变更日志明细块。
 */
export const TaskPreviewChangeBlock = styled.div`
  padding: 12px 14px;
  border-left: 2px solid rgba(22, 119, 255, 0.28);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.03);
`;

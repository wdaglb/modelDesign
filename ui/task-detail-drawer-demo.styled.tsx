import styled from 'styled-components';

/**
 * 页面级背景，模拟设计稿中的灰色工作区。
 */
export const TaskDrawerPageRoot = styled.div`
  min-height: 100vh;
  padding: 32px;
  background: #f5f7fa;
`;

/**
 * 用于把抽屉固定在页面右侧，保持和设计稿一致的观感。
 */
export const TaskDrawerStage = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/**
 * 抽屉主体采用固定宽度，便于还原设计稿中的宽抽屉布局。
 */
export const TaskDrawerShell = styled.section`
  display: flex;
  flex-direction: column;
  width: 840px;
  min-height: calc(100vh - 64px);
  border-radius: 16px 0 0 16px;
  background: #ffffff;
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.08);
  overflow: hidden;
`;

/**
 * 正文区独立滚动，确保底部操作区始终固定可见。
 */
export const TaskDrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 20px;
`;

/**
 * 首屏结构采用紧凑纵向节奏，减少信息区对正文的挤压。
 */
export const TaskDrawerSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * 顶部摘要头保持单卡片，但只保留标题与摘要条，避免冗余嵌套。
 */
export const SummaryHeaderCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #ffffff;
`;

/**
 * 标题区把编号和复制入口放在一行，标题独占下一行。
 */
export const SummaryTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

/**
 * 编号与复制入口都属于轻量元信息，因此用更弱的视觉层级表达。
 */
export const SummaryMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

/**
 * 摘要条采用单行胶囊信息，强调“读一眼就知道关键信息”。
 */
export const SummaryChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

/**
 * Tabs 外壳统一为胶囊背景，减少默认 Ant Design 标签栏的重量感。
 */
export const TabsShell = styled.div`
  .ant-tabs-nav {
    margin-bottom: 12px;
  }

  .ant-tabs-nav-list {
    padding: 4px;
    background: #f5f7fa;
    border-radius: 12px;
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
 * Markdown 内容卡片保持白底，依靠内部块级元素制造阅读节奏。
 */
export const MarkdownSurface = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 32px;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  background: #ffffff;

  h1,
  h2,
  p,
  ul {
    margin: 0;
  }

  ul {
    padding-left: 18px;
  }

  blockquote {
    margin: 0;
    padding: 14px 16px;
    border-left: 4px solid #91caff;
    border-radius: 8px;
    background: #f8fbff;
    color: #4e5969;
  }

  pre {
    margin: 0;
    overflow-x: auto;
  }
`;

/**
 * 子任务和变更日志都采用统一信息卡，确保结构复用时视觉稳定。
 */
export const PreviewSectionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  background: #ffffff;
`;

/**
 * 底部操作区固定在抽屉底部右侧，是交互收束点。
 */
export const TaskDrawerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #e5e6eb;
  background: #ffffff;
  box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.06);
`;

/**
 * 右下角按钮组统一放在单独容器中，方便后续扩展 loading / disabled 状态。
 */
export const TaskDrawerFooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

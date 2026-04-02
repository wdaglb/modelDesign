import { Card } from 'antd';
import styled from 'styled-components';

/**
 * 页面根容器。
 */
export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * 页面头部区域。
 */
export const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 4px 0;
`;

/**
 * 页面标题块。
 */
export const HeaderTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/**
 * 页面标题。
 */
export const PageTitle = styled.h1`
  margin: 0;
  color: #1f1f1f;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
`;

/**
 * 页面副标题。
 */
export const PageDescription = styled.p`
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.6;
`;

/**
 * 工具栏卡片。
 */
export const ToolbarCard = styled(Card)`
  border-radius: 16px;
  border-color: #e9edf5;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);

  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
`;

/**
 * 筛选行。
 */
export const FilterRow = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 1.8fr) repeat(2, minmax(200px, 1fr));
  gap: 12px;
`;

/**
 * 提示条。
 */
export const NoticeBar = styled.div`
  padding: 10px 14px;
  border-radius: 10px;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 13px;
  line-height: 1.6;
`;

/**
 * 状态标签与选择栏。
 */
export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

/**
 * 快捷状态标签容器。
 */
export const SummaryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

/**
 * 选择栏。
 */
export const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
`;

/**
 * 选择栏文案。
 */
export const SelectionText = styled.span`
  color: #595959;
  font-size: 13px;
  line-height: 1;
`;

/**
 * 项目卡片网格。
 */
export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
`;

/**
 * 底部栏。
 */
export const FooterBar = styled(Card)`
  border-radius: 14px;
  border-color: #e5e7eb;

  .ant-card-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
  }
`;

/**
 * 底部统计文案。
 */
export const FooterText = styled.span`
  color: #8c8c8c;
  font-size: 13px;
`;

/**
 * 空状态卡片。
 */
export const EmptyCard = styled(Card)`
  border-radius: 14px;
  border-color: #e5e7eb;

  .ant-card-body {
    padding: 32px 20px;
  }
`;

/**
 * 单个项目卡片容器。
 */
export const ProjectCardSurface = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 280px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #bfd3ff;
    box-shadow: 0 12px 30px rgba(22, 119, 255, 0.08);
  }
`;

/**
 * 卡片头部。
 */
export const ProjectCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

/**
 * 卡片标题区。
 */
export const ProjectCardTitleBlock = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
`;

/**
 * 卡片标题。
 */
export const ProjectCardTitle = styled.h3`
  margin: 0;
  color: #1f1f1f;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
`;

/**
 * 卡片副标题。
 */
export const ProjectCardMeta = styled.span`
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.5;
`;

/**
 * 卡片正文块。
 */
export const ProjectCardContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
`;

/**
 * 卡片正文文本。
 */
export const ProjectCardText = styled.p`
  margin: 0;
  color: #595959;
  font-size: 13px;
  line-height: 1.7;
`;

/**
 * 卡片底部信息区。
 */
export const ProjectCardInfoBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fafafa;
`;

/**
 * 卡片底部信息文本。
 */
export const ProjectCardInfoText = styled.span`
  color: #1f1f1f;
  font-size: 13px;
`;

/**
 * 卡片操作区。
 */
export const ProjectCardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

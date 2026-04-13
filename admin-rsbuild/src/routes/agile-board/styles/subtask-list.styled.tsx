import styled from 'styled-components';

/**
 * 子任务列表容器。
 */
export const SubtaskListRoot = styled.div`
  margin-top: 8px;
`;

/**
 * 子任务列表头部。
 */
export const SubtaskListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-left: 24px;
`;

/**
 * 子任务列表内容。
 */
export const SubtaskListContent = styled.div`
  margin-top: 8px;
  padding-left: 24px;
  border-left: 1px dashed rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * 子任务卡片容器。
 */
export const SubtaskItem = styled.div`
  width: 100%;
`;

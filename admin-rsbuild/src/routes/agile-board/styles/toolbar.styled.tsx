import { Input, Select, Space } from 'antd';
import styled from 'styled-components';

/**
 * 工具栏根容器。
 */
export const ToolbarRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

/**
 * 工具栏标题。
 */
export const ToolbarTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--ant-colorText);
`;

/**
 * 工具栏面板。
 */
export const ToolbarSurface = styled.div`
  width: 100%;
  padding: 10px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(15, 23, 42, 0.06);
`;

/**
 * 操作行容器。
 */
export const ToolbarRow = styled(Space)`
  width: 100%;
`;

/**
 * 工具栏字段容器。
 */
export const ToolbarField = styled.div<{ $width: number }>`
  width: ${(props) => `${props.$width}px`};
`;

/**
 * 标题搜索输入框。
 */
export const ToolbarSearchInput = styled(Input.Search)`
  width: 100%;
`;

/**
 * 工具栏选择器。
 */
export const ToolbarSelect = styled(Select)`
  width: 100%;
`;

import { Button, Form } from 'antd';
import styled from 'styled-components';

/**
 * 注册弹窗内容壳。
 *
 * 通过分区卡片与更大的留白，提升注册弹窗的信息层级，
 * 让用户先理解租户归属，再填写账号信息。
 */
export const RegisterModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 8px;
`;

/**
 * 静态步骤轨道。
 *
 * 该轨道只强化步骤感，不引入真正的页面切换，
 * 避免为轻量注册流程增加额外认知成本。
 */
export const RegisterProgress = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;

/**
 * 单个步骤卡片。
 */
export const RegisterStep = styled.div<{ $active?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  min-height: 64px;
  border-radius: 16px;
  border: 1px solid
    ${(props) => {
      if (props.$active) {
        return 'rgba(37, 99, 235, 0.22)';
      }
      return 'rgba(59, 107, 255, 0.08)';
    }};
  background: ${(props) => {
    if (props.$active) {
      return 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, #ffffff 100%)';
    }
    return 'rgba(255, 255, 255, 0.76)';
  }};
`;

/**
 * 步骤编号徽标。
 */
export const RegisterStepBadge = styled.div<{ $active?: boolean }>`
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 13px;
  line-height: 1;
  font-weight: 700;
  color: ${(props) => {
    if (props.$active) {
      return '#ffffff';
    }
    return '#1d4ed8';
  }};
  background: ${(props) => {
    if (props.$active) {
      return '#2563eb';
    }
    return '#dbeafe';
  }};
`;

/**
 * 步骤文案区。
 */
export const RegisterStepContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 30px;
`;

/**
 * 步骤标题。
 */
export const RegisterStepTitle = styled.div`
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
  color: var(--login-text);
`;

/**
 * 步骤说明。
 */
export const RegisterStepText = styled.div`
  font-size: 12px;
  line-height: 1.6;
  color: var(--login-text-secondary);
`;

/**
 * 顶部说明区。
 */
export const RegisterModalHero = styled.section`
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(59, 107, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(243, 247, 255, 0.94) 100%
  );
  box-shadow: 0 12px 28px rgba(17, 26, 51, 0.06);
`;

/**
 * 说明区眉标。
 */
export const RegisterModalEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.24em;
  color: var(--login-primary);
  text-transform: uppercase;
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

/**
 * 说明区标题。
 */
export const RegisterModalTitle = styled.h3`
  margin: 10px 0 8px;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--login-text);
`;

/**
 * 注册表单样式。
 */
export const RegisterForm = styled(Form)`
  width: 100%;

  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-form-item:last-child {
    margin-bottom: 0;
  }

  .ant-form-item-label {
    padding-bottom: 8px;
  }

  .ant-form-item-label > label {
    color: var(--login-text-secondary);
    font-size: 12px;
    line-height: 18px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family:
      'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
      'Liberation Mono', monospace;
  }

  .ant-form-item-explain-error {
    margin-top: 6px;
    color: #d4380d;
    font-size: 13px;
  }

  .ant-input,
  .ant-input-affix-wrapper,
  .ant-select-selector {
    min-height: 48px;
    padding: 10px 14px;
    color: var(--login-text);
    background: #ffffff;
    border: 1px solid rgba(17, 26, 51, 0.12);
    border-radius: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .ant-select-single {
    height: 48px;
  }

  .ant-select-single .ant-select-selector {
    display: flex;
    align-items: center;
  }

  .ant-select-single .ant-select-selection-placeholder,
  .ant-select-single .ant-select-selection-item {
    line-height: 26px;
  }

  .ant-input::placeholder,
  .ant-input-affix-wrapper input::placeholder,
  .ant-select-selection-placeholder {
    color: rgba(90, 107, 154, 0.6);
  }

  .ant-input-affix-wrapper .ant-input {
    min-height: auto;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .ant-input:hover,
  .ant-input-affix-wrapper:hover,
  .ant-select:hover .ant-select-selector {
    border-color: var(--login-border-strong);
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper-focused,
  .ant-input-affix-wrapper:focus-within,
  .ant-select-focused .ant-select-selector {
    border-color: var(--login-primary);
    box-shadow: 0 0 0 3px rgba(59, 107, 255, 0.1);
  }
`;

/**
 * 注册表单分区。
 */
export const RegisterSection = styled.section`
  padding: 16px 18px 18px;
  border-radius: 16px;
  border: 1px solid rgba(59, 107, 255, 0.08);
  background: rgba(255, 255, 255, 0.72);
`;

/**
 * 分区标题。
 */
export const RegisterSectionTitle = styled.div`
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 22px;
  font-weight: 700;
  color: var(--login-text);
`;

/**
 * 底部行动区。
 */
export const RegisterActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(59, 107, 255, 0.08);
  background: rgba(255, 255, 255, 0.82);
`;

/**
 * 行动区按钮组。
 */
export const RegisterActionButtons = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
`;

/**
 * 次按钮。
 */
export const RegisterGhostButton = styled(Button)`
  && {
    height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    border: 1px solid rgba(17, 26, 51, 0.08);
    color: var(--login-text-secondary);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: none;
  }

  &&:hover,
  &&:focus {
    color: var(--login-text);
    border-color: rgba(59, 107, 255, 0.2);
    background: #ffffff;
  }
`;

/**
 * 主按钮。
 */
export const RegisterPrimaryButton = styled(Button)`
  && {
    height: 46px;
    padding: 0 22px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    background: linear-gradient(135deg, #3b6bff 0%, #5f83ff 100%);
    box-shadow: 0 10px 24px rgba(59, 107, 255, 0.24);
  }

  &&:hover,
  &&:focus {
    color: #ffffff;
    background: linear-gradient(135deg, #4a76ff 0%, #6d90ff 100%);
  }

  &&[disabled],
  &&[disabled]:hover {
    color: rgba(255, 255, 255, 0.72);
    background: #b4c4e0;
    box-shadow: none;
  }
`;

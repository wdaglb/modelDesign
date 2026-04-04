import { Button, Form } from 'antd';
import styled, { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const motionReduce = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    transform: none;
  }
`;

/** 登录表单卡片容器 */
export const CardWrapper = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid var(--login-border);
  background: var(--login-surface);
  backdrop-filter: blur(22px);
  box-shadow: var(--login-shadow);
  animation: ${fadeInUp} 0.82s ease-out both;

  ${motionReduce}
`;

/** 卡片头部区域 */
export const CardHeader = styled.div`
  margin-bottom: 26px;
`;

/** 卡片眉标 */
export const CardEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.24em;
  color: var(--login-primary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

/** 卡片标题 */
export const CardTitle = styled.h2`
  margin: 12px 0 10px;
  font-size: 32px;
  line-height: 1.18;
  font-weight: 700;
  color: var(--login-text);
`;

/** 卡片描述文字 */
export const CardDescription = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--login-text-secondary);
`;

/** 登录表单样式覆写 */
export const StyledForm = styled(Form)`
  width: 100%;

  .ant-form-item {
    margin-bottom: 18px;
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
  .ant-input-affix-wrapper {
    min-height: 46px;
    padding: 10px 14px;
    color: var(--login-text);
    background: #ffffff;
    border: 1px solid rgba(17, 26, 51, 0.12);
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .ant-input::placeholder,
  .ant-input-affix-wrapper input::placeholder {
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
  .ant-input-affix-wrapper:hover {
    border-color: var(--login-border-strong);
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper-focused,
  .ant-input-affix-wrapper:focus-within {
    border-color: var(--login-primary);
    box-shadow: 0 0 0 3px rgba(59, 107, 255, 0.1);
  }
`;

/** 警告提示横幅 */
export const WarningBanner = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--login-warning-border);
  background: var(--login-warning-bg);
  color: #b54708;
  font-size: 14px;
  line-height: 1.6;
`;

/** 登录提交按钮 */
export const StyledSubmitButton = styled(Button)`
  && {
    height: 46px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    background: var(--login-primary);
    box-shadow: 0 4px 12px rgba(59, 107, 255, 0.3);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  &&:hover,
  &&:focus {
    color: #ffffff;
    background: #5580ff;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 107, 255, 0.35);
  }

  &&:active {
    transform: translateY(0);
  }

  &&[disabled],
  &&[disabled]:hover {
    color: rgba(255, 255, 255, 0.72);
    background: #b4c4e0;
    transform: none;
    box-shadow: none;
  }

  ${motionReduce}
`;

/** 底部提示信息 */
export const FooterHint = styled.div`
  margin-top: 6px;
  color: var(--login-text-secondary);
  font-size: 13px;
  line-height: 1.8;
`;

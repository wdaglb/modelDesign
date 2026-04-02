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

export const CardWrapper = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  border-radius: 32px;
  border: 1px solid var(--login-border);
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.015) 100%
    ),
    var(--login-surface);
  backdrop-filter: blur(22px);
  box-shadow: var(--login-shadow);
  animation: ${fadeInUp} 0.82s ease-out both;

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 31px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }

  @media (max-width: 1023px) {
    padding: 28px 22px;
    border-radius: 24px;

    &::before {
      border-radius: 23px;
    }
  }

  ${motionReduce}
`;

export const CardHeader = styled.div`
  margin-bottom: 26px;
`;

export const CardEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.24em;
  color: var(--login-primary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

export const CardTitle = styled.h2`
  margin: 12px 0 10px;
  font-size: 32px;
  line-height: 1.18;
  font-weight: 700;
  color: var(--login-text);
`;

export const CardDescription = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--login-text-secondary);
`;

/**
 * 表单输入面板统一处理标签、输入框与焦点态，避免散落在页面组件中。
 */
export const StyledForm = styled(Form)`
  width: 100%;

  .ant-form-item {
    margin-bottom: 18px;
  }

  .ant-form-item-label {
    padding-bottom: 8px;
  }

  .ant-form-item-label > label {
    color: rgba(139, 163, 199, 0.96);
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
    color: #ffb37d;
    font-size: 13px;
  }

  .ant-input,
  .ant-input-affix-wrapper {
    min-height: 52px;
    padding: 12px 16px;
    color: var(--login-text);
    background: rgba(8, 16, 32, 0.9);
    border: 1px solid rgba(116, 146, 189, 0.22);
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 10px 24px rgba(4, 10, 22, 0.16);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;
  }

  .ant-input {
    font-size: 15px;
  }

  .ant-input::placeholder,
  .ant-input-affix-wrapper input::placeholder {
    color: rgba(139, 163, 199, 0.62);
  }

  .ant-input-affix-wrapper .ant-input {
    min-height: auto;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .ant-input-affix-wrapper .ant-input-password-icon {
    color: rgba(139, 163, 199, 0.78);
  }

  .ant-input:hover,
  .ant-input-affix-wrapper:hover {
    border-color: rgba(99, 230, 255, 0.3);
    background: rgba(9, 18, 36, 0.96);
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper-focused,
  .ant-input-affix-wrapper:focus-within {
    border-color: var(--login-border-strong);
    box-shadow:
      0 0 0 3px rgba(99, 230, 255, 0.14),
      0 12px 30px rgba(12, 40, 81, 0.24);
    background: rgba(9, 18, 36, 1);
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: var(--login-text);
    -webkit-box-shadow: 0 0 0 1000px rgba(9, 18, 36, 1) inset;
    transition: background-color 9999s ease-in-out 0s;
  }
`;

export const WarningBanner = styled.div`
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid var(--login-warning-border);
  background: var(--login-warning-bg);
  color: #ffd2a6;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
`;

export const FormHint = styled.div`
  margin: 2px 0 18px;
  color: rgba(139, 163, 199, 0.86);
  font-size: 13px;
  line-height: 1.7;
`;

export const StyledSubmitButton = styled(Button)`
  && {
    height: 54px;
    border: none;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 700;
    color: #04111f;
    background: linear-gradient(
      135deg,
      var(--login-secondary) 0%,
      var(--login-primary) 100%
    );
    box-shadow:
      0 16px 32px rgba(15, 96, 163, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      filter 0.2s ease;
  }

  &&:hover,
  &&:focus {
    color: #04111f;
    background: linear-gradient(
      135deg,
      #5c89ff 0%,
      #7beaff 100%
    );
    transform: translateY(-1px);
    box-shadow:
      0 18px 36px rgba(15, 96, 163, 0.42),
      0 0 0 4px rgba(99, 230, 255, 0.12);
    filter: brightness(1.02);
  }

  &&:active {
    transform: translateY(0);
    filter: brightness(0.98);
  }

  &&:focus-visible {
    outline: none;
    box-shadow:
      0 18px 36px rgba(15, 96, 163, 0.42),
      0 0 0 4px rgba(99, 230, 255, 0.18);
  }

  &&[disabled],
  &&[disabled]:hover {
    color: rgba(4, 17, 31, 0.72);
    background: linear-gradient(135deg, #4b607d 0%, #6f88a8 100%);
    transform: none;
    box-shadow: none;
    filter: none;
  }

  ${motionReduce}
`;

export const FooterHint = styled.div`
  margin-top: 6px;
  color: rgba(139, 163, 199, 0.78);
  font-size: 13px;
  line-height: 1.8;
`;

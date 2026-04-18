import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Form as AntForm } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';

import { modalContext } from '@/components/KModal/Modal';

import Form from '../Form';

/**
 * 渲染表单组件并注入最小上下文。
 */
function renderForm(onFinish?: (values: any) => Promise<any>) {
  let formInstance: any;

  function TestWrapper() {
    const [form] = AntForm.useForm();
    formInstance = form;

    return (
      <modalContext.Provider
        value={{
          resolve: vi.fn(),
          close: vi.fn(),
        }}
      >
        <Form form={form} onFinish={onFinish}>
          <div className={'md-editor'}>
            <div data-testid={'markdown-inner'} tabIndex={0}>
              Markdown 区域
            </div>
          </div>
          <input data-testid={'normal-input'} />
        </Form>
      </modalContext.Provider>
    );
  }

  render(<TestWrapper />);

  return {
    submitSpy: vi.spyOn(formInstance, 'submit'),
  };
}

describe('KModal Form', () => {
  it('在 Markdown 编辑器内按回车不触发表单提交', () => {
    const { submitSpy } = renderForm();

    fireEvent.keyDown(screen.getByTestId('markdown-inner'), {
      key: 'Enter',
    });

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('在普通输入框按回车触发表单提交', () => {
    const { submitSpy } = renderForm();

    fireEvent.keyDown(screen.getByTestId('normal-input'), {
      key: 'Enter',
    });

    expect(submitSpy).toHaveBeenCalledTimes(1);
  });
});

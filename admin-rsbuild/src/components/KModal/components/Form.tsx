import React, { KeyboardEvent, ReactNode, useContext, useState } from 'react';
import { Button, Flex, Form as AntForm, FormProps, message } from 'antd';
import { modalContext } from '@/components/KModal/Modal.tsx';

interface Props extends Omit<FormProps, 'onFinish'> {
  children: ReactNode;
  onFinish?: (values: any) => Promise<any>;
}

const Form = (props: Props) => {
  const context = useContext(modalContext);
  const [submitIng, setSubmitIng] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const tagName = target.tagName.toLowerCase();
    const isTextArea = tagName === 'textarea';
    const isButton = tagName === 'button';
    const isSelectLike = Boolean(
      target.closest('.ant-select') ||
        target.closest('.ant-picker-dropdown') ||
        target.closest('.ant-select-dropdown'),
    );

    if (isTextArea || isButton || isSelectLike) {
      return;
    }

    event.preventDefault();
    props.form?.submit();
  };

  return (
    <AntForm
      {...props}
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        ...props.style,
      }}
      onKeyDown={handleKeyDown}
      onFinish={async (values) => {
        setSubmitIng(true);
        try {
          const res = await props.onFinish?.(values);
          if (res !== false) {
            context.resolve(res);
          }
          if (res === undefined || res === true) {
            message.success('提交成功');
          }
        } finally {
          setSubmitIng(false);
        }
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>{props.children}</div>

      <div style={{ flexShrink: 0 }}>
        <AntForm.Item style={{ marginBottom: 0, marginTop: 20 }}>
          <Flex gap={8} justify={'flex-end'}>
            <Button onClick={() => context.close()}>取消</Button>

            <Button type={'primary'} htmlType={'submit'} loading={submitIng}>
              提交
            </Button>
          </Flex>
        </AntForm.Item>
      </div>
    </AntForm>
  );
};

export default Form;

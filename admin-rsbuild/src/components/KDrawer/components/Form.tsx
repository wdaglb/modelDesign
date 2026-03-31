import React, { ReactNode, useContext, useState } from 'react';
import { Button, Flex, Form as AntForm, FormProps, message } from 'antd';
import { drawerContext } from '@/components/KDrawer/Drawer.tsx';

interface Props extends Omit<FormProps, 'onFinish'> {
  children: ReactNode;
  onFinish?: (values: any) => Promise<any>;
}

const Form = (props: Props) => {
  const context = useContext(drawerContext);
  const [submitIng, setSubmitIng] = useState(false);

  return (
    <AntForm
      {...props}
      scrollToFirstError
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        ...props.style,
      }}
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
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: 16,
        }}
      >
        {props.children}
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: 12,
          borderTop: '1px solid var(--ant-colorBorderSecondary)',
          background: 'var(--ant-colorBgElevated)',
        }}
      >
        <Flex gap={8} justify={'flex-end'}>
          <Button onClick={() => context.close()} disabled={submitIng}>
            取消
          </Button>

          <Button type={'primary'} htmlType={'submit'} loading={submitIng}>
            提交
          </Button>
        </Flex>
      </div>
    </AntForm>
  );
};

export default Form;

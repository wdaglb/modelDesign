import React, { ReactNode, useContext, useState } from 'react';
import { Button, Flex, Form as AntForm, FormProps, message } from 'antd';
import { modalContext } from '@/components/KModal/Modal.tsx';

interface Props extends Omit<FormProps, 'onFinish'> {
  children: ReactNode;
  onFinish?: (values: any) => Promise<any>;
}

const Form = (props: Props) => {
  const context = useContext(modalContext);
  const [submitIng, setSubmitIng] = useState(false);

  return (
    <AntForm
      {...props}
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
      {props.children}

      <AntForm.Item>
        <Flex gap={8} justify={'flex-end'} style={{ marginTop: 20 }}>
          <Button onClick={() => context.close()}>取消</Button>

          <Button type={'primary'} htmlType={'submit'} loading={submitIng}>
            提交
          </Button>
        </Flex>
      </AntForm.Item>
    </AntForm>
  );
};

export default Form;

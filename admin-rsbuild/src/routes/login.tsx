import { createFileRoute, useLocation } from '@tanstack/react-router';
import { Alert, Button, Form, Input } from 'antd';

import styles from './login.module.less';
import { useMutation } from '@tanstack/react-query';
import { ApiPassport } from '@/api';
import useAuthStore from '@/store/auth.ts';
import { z } from 'zod';

const searchSchema = z.object({
  redirect: z.string().optional().default('/'),
});

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  validateSearch: searchSchema,
  context: () => {
    return {
      title: '后台登录',
    };
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const setToken = useAuthStore((state) => state.setToken);

  const mutation = useMutation({
    mutationFn: ApiPassport.passwordLogin,
    onSuccess: (data) => {
      setToken(data.token);
      navigate({ to: search.redirect, replace: true });
    },
  });
  return (
    <div className={styles.bg}>
      <div className={styles.main}>
        <div className={styles.left}></div>
        <div className={styles.content}>
          <div className={styles.title}>登录后台</div>
          <Form style={{ width: 300 }} onFinish={mutation.mutateAsync}>
            {mutation.isError && (
              <Alert
                title={mutation.error.message}
                showIcon
                type={'warning'}
                style={{
                  marginBottom: 8,
                }}
              />
            )}

            <Form.Item
              name={'username'}
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder={'请输入'} />
            </Form.Item>

            <Form.Item
              name={'password'}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder={'请输入'} />
            </Form.Item>

            <Form.Item className={styles.submit}>
              <Button
                type="primary"
                size={'large'}
                loading={mutation.isPending}
                block
                htmlType="submit"
              >
                确认登录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

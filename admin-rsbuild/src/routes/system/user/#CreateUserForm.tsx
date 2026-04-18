import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Descriptions,
  Form,
  Input,
  Radio,
  Space,
  Typography,
  message,
} from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiUser } from '@/api';
import KModal from '@/components/KModal';
import { modalContext } from '@/components/KModal/Modal.tsx';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';
import { copyTextToClipboard } from '@/utils';

/**
 * 密码录入模式。
 *
 * `system` 表示由前端生成随机初始密码，`custom` 表示手动输入。
 */
type PasswordMode = 'system' | 'custom';

interface CreateUserFormValues {
  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 用户名。
   */
  username: string;

  /**
   * 默认租户 ID。
   */
  tenantId?: number;

  /**
   * 密码模式。
   */
  passwordMode: PasswordMode;

  /**
   * 初始密码。
   */
  password: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

interface CreateResult {
  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 用户名。
   */
  username: string;

  /**
   * 初始密码。
   */
  password: string;

  /**
   * 状态文案。
   */
  statusText: string;
}

/**
 * 随机密码字符集。
 *
 * 避免引入一次性工具文件，直接在表单内维护本地生成逻辑。
 */
const PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * 生成随机初始密码。
 *
 * 仅用于新增用户场景，生成后仍走现有前端 md5 + 后端 BCrypt 的链路。
 */
const generatePassword = (length = 12) => {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * PASSWORD_CHARS.length);
    return PASSWORD_CHARS[index];
  }).join('');
};

/**
 * 用户新增表单。
 *
 * 新增成功后不立即关闭弹窗，而是在当前弹窗内展示结果信息，
 * 方便用户确认本次新增的账号、状态与初始密码。
 */
const CreateUserForm = () => {
  const [form] = Form.useForm<CreateUserFormValues>();
  const queryClient = useQueryClient();
  const modal = useContext(modalContext);
  const [result, setResult] = useState<CreateResult>();
  const currentInfo = useAuthStore((state) => state.currentInfo);

  /**
   * 在“系统生成”模式下刷新表单中的密码值。
   */
  const refreshSystemPassword = () => {
    form.setFieldValue('password', generatePassword());
  };

  /**
   * 复制新增结果中的初始密码。
   */
  const copyPassword = async () => {
    if (!result?.password) {
      return;
    }

    await copyTextToClipboard(result.password);
    message.success('初始密码已复制');
  };

  useEffect(() => {
    const initialValues: Partial<CreateUserFormValues> = {
      passwordMode: 'system',
      password: generatePassword(),
      isDisable: false,
    };
    if (currentInfo?.tenantId !== undefined) {
      initialValues.tenantId = currentInfo.tenantId;
    }
    form.setFieldsValue(initialValues);
  }, [currentInfo?.tenantId, form]);

  if (result) {
    return (
      <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
        <Typography.Text type={'secondary'}>
          请妥善保存以下初始密码，关闭弹窗后将无法再次查看。
        </Typography.Text>

        <Descriptions bordered column={1} size={'small'}>
          <Descriptions.Item label={'昵称'}>
            {result.nickname}
          </Descriptions.Item>
          <Descriptions.Item label={'用户名'}>
            <Typography.Text copyable>{result.username}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={'初始密码'}>
            <Typography.Text copyable>{result.password}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={'状态'}>
            {result.statusText}
          </Descriptions.Item>
        </Descriptions>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button type={'primary'} onClick={() => modal.resolve(result)}>
            完成
          </Button>
        </Space>
      </Space>
    );
  }

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        passwordMode: 'system' as PasswordMode,
        password: generatePassword(),
        isDisable: false,
      }}
      onFinish={async (values) => {
        const { passwordMode: _passwordMode, ...submitValues } = values;
        await ApiUser.add(submitValues);
        await queryClient.invalidateQueries({ queryKey: queryKey.user.list() });
        setResult({
          nickname: values.nickname,
          username: values.username,
          password: values.password,
          statusText: values.isDisable ? '禁用' : '启用',
        });
        return false;
      }}
    >
      <Form.Item
        name={'nickname'}
        label={'昵称'}
        rules={[{ required: true, message: '请输入昵称' }]}
      >
        <Input placeholder={'请输入昵称'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'username'}
        label={'用户名'}
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder={'请输入用户名'} />
      </Form.Item>

      <Form.Item name={'passwordMode'} label={'密码模式'} required>
        <Radio.Group
          optionType={'button'}
          options={[
            { label: '系统生成', value: 'system' },
            { label: '自定义', value: 'custom' },
          ]}
          onChange={(event) => {
            const value = event.target.value as PasswordMode;
            if (value === 'system') {
              refreshSystemPassword();
              return;
            }
            form.setFieldValue('password', undefined);
          }}
        />
      </Form.Item>

      <Form.Item noStyle dependencies={['passwordMode']}>
        {({ getFieldValue }) => {
          const passwordMode = getFieldValue('passwordMode') as
            | PasswordMode
            | undefined;
          const isSystemPassword = passwordMode === 'system';

          let passwordPlaceholder = '请输入初始密码';
          let passwordExtra = '请输入自定义初始密码';

          if (isSystemPassword) {
            passwordPlaceholder = '系统将自动生成初始密码';
            passwordExtra = '';
          }

          return (
            <Form.Item label={'初始密码'} extra={passwordExtra} required>
              {isSystemPassword ? (
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name={'password'}
                    noStyle
                    rules={[{ required: true, message: '请输入初始密码' }]}
                  >
                    <Input placeholder={passwordPlaceholder} readOnly />
                  </Form.Item>
                  <Button onClick={refreshSystemPassword}>重新生成</Button>
                </Space.Compact>
              ) : (
                <Form.Item
                  name={'password'}
                  noStyle
                  rules={[{ required: true, message: '请输入初始密码' }]}
                >
                  <Input.Password placeholder={passwordPlaceholder} />
                </Form.Item>
              )}
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item
        name={'isDisable'}
        label={'状态'}
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Radio.Group
          optionType={'button'}
          options={[
            { label: '启用', value: false },
            { label: '禁用', value: true },
          ]}
        />
      </Form.Item>
    </KModal.Form>
  );
};

export default CreateUserForm;

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Form, Input, Modal, Select } from 'antd';

import { ApiTenant } from '@/api';

import type { RegisterSubmitValues } from './#LoginPage';
import {
  RegisterActionBar,
  RegisterActionButtons,
  RegisterGhostButton,
  RegisterForm,
  RegisterModalBody,
  RegisterModalEyebrow,
  RegisterModalHero,
  RegisterPrimaryButton,
  RegisterProgress,
  RegisterSection,
  RegisterSectionTitle,
  RegisterStep,
  RegisterStepBadge,
  RegisterStepContent,
  RegisterStepTitle,
  RegisterModalTitle,
} from './#register-modal.styled';

const DEFAULT_TENANT_ID = 1;

interface RegisterFormValues extends RegisterSubmitValues {
  /**
   * 确认密码。
   */
  confirmPassword: string;
}

interface LoginRegisterModalProps {
  /**
   * 是否打开弹窗。
   */
  open: boolean;

  /**
   * 是否正在提交注册。
   */
  loading: boolean;

  /**
   * 关闭弹窗回调。
   */
  onClose: () => void;

  /**
   * 注册提交回调。
   */
  onSubmit: (values: RegisterSubmitValues) => Promise<void> | void;
}

/**
 * 真实注册弹窗。
 *
 * 当前注册入口挂在登录页中，因此弹窗只负责字段采集、租户查询
 * 与表单校验，注册成功后的 token 持久化和跳转由路由层统一处理。
 */
function LoginRegisterModal(props: LoginRegisterModalProps) {
  const [form] = Form.useForm<RegisterFormValues>();

  const tenantQuery = useQuery({
    queryKey: ['passport-register-tenant-options'],
    queryFn: ApiTenant.getOptions,
    enabled: props.open,
  });

  useEffect(() => {
    if (!props.open) {
      form.resetFields();
    }
  }, [form, props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    const currentTenantId = form.getFieldValue('tenantId');
    if (currentTenantId) {
      return;
    }

    const defaultTenant = tenantQuery.data?.find((item) => {
      return item.id === DEFAULT_TENANT_ID;
    });
    if (defaultTenant) {
      form.setFieldValue('tenantId', defaultTenant.id);
    }
  }, [form, props.open, tenantQuery.data]);

  /**
   * 关闭时重置表单，避免下次打开时保留上一次输入。
   */
  const handleCancel = () => {
    form.resetFields();
    props.onClose();
  };

  /**
   * 提交注册表单。
   */
  const handleFinish = async (values: RegisterFormValues) => {
    await props.onSubmit({
      nickname: values.nickname,
      username: values.username,
      tenantId: values.tenantId,
      password: values.password,
    });
    form.resetFields();
    props.onClose();
  };

  /**
   * 生成租户下拉选项。
   */
  const tenantOptions = tenantQuery.data
    ?.map((item) => {
      let label = `${item.name} (${item.code})`;
      if (item.id === DEFAULT_TENANT_ID) {
        label = `${item.name} (${item.code})`;
      }
      return {
        label,
        value: item.id,
      };
    })
    ?.sort((current, next) => {
      if (current.value === DEFAULT_TENANT_ID) {
        return -1;
      }
      if (next.value === DEFAULT_TENANT_ID) {
        return 1;
      }
      return 0;
    });

  return (
    <Modal
      title={null}
      open={props.open}
      width={560}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
    >
      <RegisterModalBody>
        <RegisterModalHero>
          <RegisterModalEyebrow>Register Access</RegisterModalEyebrow>
          <RegisterModalTitle>创建你的工作区账号</RegisterModalTitle>
        </RegisterModalHero>

        <RegisterProgress>
          <RegisterStep $active>
            <RegisterStepBadge $active>1</RegisterStepBadge>
            <RegisterStepContent>
              <RegisterStepTitle>确认租户</RegisterStepTitle>
            </RegisterStepContent>
          </RegisterStep>

          <RegisterStep>
            <RegisterStepBadge>2</RegisterStepBadge>
            <RegisterStepContent>
              <RegisterStepTitle>完成注册</RegisterStepTitle>
            </RegisterStepContent>
          </RegisterStep>
        </RegisterProgress>

        <RegisterForm
          form={form}
          layout="vertical"
          preserve={false}
          requiredMark={false}
          onFinish={handleFinish}
        >
          <RegisterSection>
            <RegisterSectionTitle>第一步：选择租户</RegisterSectionTitle>
            <Form.Item
              name="tenantId"
              label="所属租户"
              rules={[{ required: true, message: '请选择所属租户' }]}
            >
              <Select
                showSearch
                loading={tenantQuery.isLoading}
                options={tenantOptions}
                placeholder="请选择所属租户"
                optionFilterProp="label"
              />
            </Form.Item>
          </RegisterSection>

          <RegisterSection>
            <RegisterSectionTitle>第二步：填写账号信息</RegisterSectionTitle>
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input placeholder="请输入昵称" autoFocus />
            </Form.Item>

            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              label="登录密码"
              rules={[{ required: true, message: '请输入登录密码' }]}
            >
              <Input.Password
                placeholder="请输入登录密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入登录密码' },
                ({ getFieldValue }) => {
                  return {
                    validator: async (_, value) => {
                      const password = getFieldValue('password');
                      if (!value || value === password) {
                        return;
                      }
                      throw new Error('两次输入的密码不一致');
                    },
                  };
                },
              ]}
            >
              <Input.Password
                placeholder="请再次输入登录密码"
                autoComplete="new-password"
              />
            </Form.Item>
          </RegisterSection>
          <RegisterActionBar>
            <RegisterActionButtons>
              <RegisterGhostButton htmlType="button" onClick={handleCancel}>
                取消
              </RegisterGhostButton>
              <RegisterPrimaryButton
                type="primary"
                htmlType="submit"
                loading={props.loading}
              >
                注册并进入系统
              </RegisterPrimaryButton>
            </RegisterActionButtons>
          </RegisterActionBar>
        </RegisterForm>
      </RegisterModalBody>
    </Modal>
  );
}

export default LoginRegisterModal;

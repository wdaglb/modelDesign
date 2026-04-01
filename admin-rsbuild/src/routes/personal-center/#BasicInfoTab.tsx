import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Descriptions, Form, Input, Space, Typography, message } from 'antd';

import { ApiPassport } from '@/api';
import type {
  CurrentInfoVo,
  UpdateCurrentProfileParams,
} from '@/api/modules/passport.types.ts';
import { KUpload } from '@/components';

interface BasicInfoTabProps {
  currentInfo?: CurrentInfoVo;
  onUpdated: (currentInfo: CurrentInfoVo) => void;
}

interface BasicInfoFormValues {
  nickname: string;
  avatarId?: string;
}

/**
 * 基础信息页签。
 */
const BasicInfoTab = (props: BasicInfoTabProps) => {
  const [form] = Form.useForm<BasicInfoFormValues>();

  const updateProfileMutation = useMutation({
    mutationFn: (values: UpdateCurrentProfileParams) => {
      return ApiPassport.updateCurrentProfile(values);
    },
    onSuccess: (nextCurrentInfo) => {
      props.onUpdated(nextCurrentInfo);
      message.success('基础信息保存成功');
    },
  });

  useEffect(() => {
    if (!props.currentInfo) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      nickname: props.currentInfo.nickname,
      avatarId: props.currentInfo.avatarId,
    });
  }, [form, props.currentInfo]);

  return (
    <Space direction={'vertical'} size={16} style={{ width: '100%' }}>
      <Card
        size={'small'}
        title={'不可修改信息'}
        styles={{ body: { paddingBlock: 12 } }}
      >
        <Descriptions column={2} size={'small'}>
          <Descriptions.Item label={'登录账号'}>
            {getDisplayText(props.currentInfo?.username)}
          </Descriptions.Item>
          <Descriptions.Item label={'用户 ID'}>
            {getDisplayText(props.currentInfo?.userId)}
          </Descriptions.Item>
          <Descriptions.Item label={'当前租户 ID'}>
            {getDisplayText(props.currentInfo?.tenantId)}
          </Descriptions.Item>
          <Descriptions.Item label={'登录流水号'}>
            {getDisplayText(props.currentInfo?.loginId)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={'可编辑信息'}>
        <Typography.Text type={'secondary'}>
          第一版支持编辑头像和昵称，登录账号与租户信息暂时保持只读。
        </Typography.Text>

        <Form<BasicInfoFormValues>
          form={form}
          layout={'vertical'}
          style={{ marginTop: 20 }}
          onFinish={async (values) => {
            await updateProfileMutation.mutateAsync({
              nickname: values.nickname.trim(),
              avatarId: normalizeAvatarId(values.avatarId),
            });
          }}
        >
          <Form.Item name={'avatarId'} label={'头像'}>
            <KUpload.Image
              deleteOnRemove={false}
              buttonText={'上传头像'}
              maxSizeInMb={5}
              tips={'支持 JPG、PNG，建议使用 1:1 图片，大小不超过 5MB。'}
            />
          </Form.Item>

          <Form.Item
            name={'nickname'}
            label={'昵称'}
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 50, message: '昵称长度不能超过 50 个字符' },
            ]}
          >
            <Input placeholder={'请输入昵称'} maxLength={50} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  if (!props.currentInfo) {
                    form.resetFields();
                    return;
                  }
                  form.setFieldsValue({
                    nickname: props.currentInfo.nickname,
                    avatarId: props.currentInfo.avatarId,
                  });
                }}
              >
                重置
              </Button>
              <Button
                type={'primary'}
                htmlType={'submit'}
                loading={updateProfileMutation.isPending}
                disabled={!props.currentInfo}
              >
                保存基础信息
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

const normalizeAvatarId = (avatarId?: string) => {
  if (typeof avatarId !== 'string') {
    return '';
  }
  const normalizedAvatarId = avatarId.trim();
  if (!normalizedAvatarId) {
    return '';
  }
  return normalizedAvatarId;
};

const getDisplayText = (value?: string | number) => {
  if (value === undefined) {
    return '-';
  }
  if (value === null) {
    return '-';
  }
  if (value === '') {
    return '-';
  }
  return String(value);
};

export default BasicInfoTab;

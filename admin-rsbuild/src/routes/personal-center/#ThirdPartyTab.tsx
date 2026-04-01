import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, Alert, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { Icon } from '@iconify/react';

import { ApiQywork } from '@/api';
import queryKey from '@/constants/queryKey';

/**
 * 第三方账号页签。
 */
const ThirdPartyTab = () => {
  const navigate = useNavigate();
  const qyworkQuery = useQuery({
    queryKey: queryKey.qywork.current(),
    queryFn: ApiQywork.getCurrentConfig,
  });

  const qyworkStatus = buildQyworkStatus(qyworkQuery);

  return (
    <Space direction={'vertical'} size={16} style={{ width: '100%' }}>
      <Alert
        type={'info'}
        showIcon
        message={'第一版先提供第三方账号接入状态查看，个人绑定与解绑能力暂未开放。'}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <PlatformCard
            icon={'mdi:wechat'}
            title={'企业微信'}
            description={qyworkStatus.description}
            capabilityStatus={qyworkStatus.capabilityStatus}
            capabilityColor={qyworkStatus.capabilityColor}
            bindingStatus={'即将支持'}
            bindingColor={'blue'}
            note={'当前用户绑定功能预留在个人中心，待后续接入扫码或授权流程后开放。'}
            actionLabel={qyworkStatus.actionLabel}
            actionLoading={qyworkQuery.isFetching}
            onAction={() => {
              if (qyworkStatus.actionType === 'refetch') {
                qyworkQuery.refetch();
                return;
              }
              navigate({ to: '/system/third-party/qywork' });
            }}
          />
        </Col>

        <Col xs={24} lg={8}>
          <PlatformCard
            icon={'mdi:wechat'}
            title={'微信开放平台'}
            description={'预留个人微信账号绑定入口，用于后续统一通知、身份映射与开放平台联动。'}
            capabilityStatus={'即将支持'}
            capabilityColor={'blue'}
            bindingStatus={'未开放'}
            bindingColor={'purple'}
            note={'当前版本仅保留结构占位，不包含真实绑定流程。'}
            actionLabel={'敬请期待'}
            actionDisabled
          />
        </Col>

        <Col xs={24} lg={8}>
          <PlatformCard
            icon={'mdi:message-outline'}
            title={'飞书'}
            description={'预留飞书账号绑定能力，后续可用于组织通讯录同步与登录态扩展。'}
            capabilityStatus={'即将支持'}
            capabilityColor={'blue'}
            bindingStatus={'未开放'}
            bindingColor={'purple'}
            note={'当前版本仅保留结构占位，不包含真实绑定流程。'}
            actionLabel={'敬请期待'}
            actionDisabled
          />
        </Col>
      </Row>
    </Space>
  );
};

interface PlatformCardProps {
  icon: string;
  title: string;
  description: string;
  capabilityStatus: string;
  capabilityColor: string;
  bindingStatus: string;
  bindingColor: string;
  note: string;
  actionLabel: string;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  onAction?: () => void;
}

/**
 * 平台状态卡片。
 */
const PlatformCard = (props: PlatformCardProps) => {
  return (
    <Card
      style={{ height: '100%' }}
      styles={{ body: { height: '100%', padding: 20 } }}
    >
      <Space direction={'vertical'} size={16} style={{ width: '100%' }}>
        <Space size={12} align={'start'}>
          <Avatar
            size={48}
            style={{
              background:
                'linear-gradient(135deg, rgba(22, 119, 255, 0.15) 0%, rgba(22, 119, 255, 0.04) 100%)',
              color: '#1677ff',
            }}
            icon={<Icon icon={props.icon} />}
          />

          <Space direction={'vertical'} size={4}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {props.title}
            </Typography.Title>
            <Typography.Text type={'secondary'}>
              {props.description}
            </Typography.Text>
          </Space>
        </Space>

        <Space size={8} wrap>
          <Tag color={props.capabilityColor} bordered={false}>
            能力状态：{props.capabilityStatus}
          </Tag>
          <Tag color={props.bindingColor} bordered={false}>
            个人绑定：{props.bindingStatus}
          </Tag>
        </Space>

        <Typography.Text type={'secondary'}>{props.note}</Typography.Text>

        <Button
          type={'primary'}
          ghost
          disabled={props.actionDisabled}
          loading={props.actionLoading}
          onClick={props.onAction}
        >
          {props.actionLabel}
        </Button>
      </Space>
    </Card>
  );
};

interface QyworkStatus {
  capabilityStatus: string;
  capabilityColor: string;
  description: string;
  actionLabel: string;
  actionType: 'navigate' | 'refetch';
}

const buildQyworkStatus = (
  query: UseQueryResult<Awaited<ReturnType<typeof ApiQywork.getCurrentConfig>>>,
): QyworkStatus => {
  if (query.isLoading) {
    return {
      capabilityStatus: '检查中',
      capabilityColor: 'processing',
      description: '正在读取当前租户的企业微信配置状态，请稍候。',
      actionLabel: '刷新状态',
      actionType: 'refetch',
    };
  }

  if (query.isError) {
    return {
      capabilityStatus: '检查失败',
      capabilityColor: 'error',
      description: '暂时无法读取当前租户的企业微信配置状态，请重试或稍后再查看。',
      actionLabel: '重新加载',
      actionType: 'refetch',
    };
  }

  if (query.data) {
    return {
      capabilityStatus: '租户已配置',
      capabilityColor: 'success',
      description: '当前租户已完成企业微信基础配置，可为后续个人绑定能力保留接入条件。',
      actionLabel: '查看配置',
      actionType: 'navigate',
    };
  }

  return {
    capabilityStatus: '租户未配置',
    capabilityColor: 'warning',
    description: '当前租户尚未配置企业微信，请先在系统管理中完成基础配置。',
    actionLabel: '前往配置',
    actionType: 'navigate',
  };
};

export default ThirdPartyTab;

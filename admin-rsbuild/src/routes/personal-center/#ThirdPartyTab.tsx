import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Avatar,
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { Icon } from '@iconify/react';

import { ApiQywork } from '@/api';
import type { QyworkBindingSessionCreated } from '@/api/modules/qywork';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';

import QyworkBindingPanel from './#QyworkBindingPanel';
import {
  detectQyworkEntryMode,
  formatQyworkBindingStatus,
} from './components/qyworkBinding.helper';

/**
 * 第三方账号页签。
 */
const ThirdPartyTab = () => {
  const navigate = useNavigate();
  const modal = useKModal();
  const qyworkQuery = useQuery({
    queryKey: queryKey.qywork.current(),
    queryFn: ApiQywork.getCurrentConfig,
  });
  const qyworkBindingQuery = useQuery({
    queryKey: queryKey.qywork.currentBinding(),
    queryFn: ApiQywork.getCurrentBinding,
  });
  const createBindingMutation = useMutation({
    mutationFn: ApiQywork.createBindingSession,
    onSuccess: async (session) => {
      if (session.entryMode === 'in_app') {
        window.location.assign(session.authUrl);
        return;
      }

      /**
       * 桌面端授权需要展示二维码并轮询状态，改用弹窗承载可以避免
       * 第三方账号页签被临时面板撑长，也让用户明确当前正在处理绑定流程。
       */
      try {
        await modal.open({
          title: '绑定企业微信',
          width: 680,
          children: (
            <QyworkBindingPanel
              session={session}
              onRefreshBinding={() => {
                qyworkBindingQuery.refetch();
              }}
            />
          ),
        });
      } catch (error) {
        if (error !== 'KModal cancel') {
          throw error;
        }
      }
    },
    onError: (error) => {
      message.error(error.message || '创建绑定会话失败，请稍后重试');
    },
  });

  const qyworkStatus = buildQyworkStatus(qyworkQuery, qyworkBindingQuery);

  return (
    <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
      <Alert
        type={'info'}
        showIcon
        title={
          '第一版已开放企业微信绑定：企微内可直接授权，桌面浏览器会展示二维码，由手机企业微信扫码完成绑定。'
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <PlatformCard
            icon={'mdi:wechat'}
            title={'企业微信'}
            description={qyworkStatus.description}
            capabilityStatus={qyworkStatus.capabilityStatus}
            capabilityColor={qyworkStatus.capabilityColor}
            bindingStatus={qyworkStatus.bindingStatus}
            bindingColor={qyworkStatus.bindingColor}
            note={qyworkStatus.note}
            actionLabel={qyworkStatus.actionLabel}
            actionLoading={
              qyworkQuery.isFetching ||
              qyworkBindingQuery.isFetching ||
              createBindingMutation.isPending
            }
            onAction={() => {
              if (qyworkStatus.actionType === 'refetch') {
                qyworkQuery.refetch();
                qyworkBindingQuery.refetch();
                return;
              }
              if (qyworkStatus.actionType === 'navigate') {
                navigate({ to: '/system/third-party/qywork' });
                return;
              }
              createBindingMutation.mutate({
                entryMode: detectQyworkEntryMode(window.navigator.userAgent),
              });
            }}
          />
        </Col>

        <Col xs={24} lg={8}>
          <PlatformCard
            icon={'mdi:wechat'}
            title={'微信开放平台'}
            description={
              '预留个人微信账号绑定入口，用于后续统一通知、身份映射与开放平台联动。'
            }
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
            description={
              '预留飞书账号绑定能力，后续可用于组织通讯录同步与登录态扩展。'
            }
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
      <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
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

          <Space orientation={'vertical'} size={4}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {props.title}
            </Typography.Title>
            <Typography.Text type={'secondary'}>
              {props.description}
            </Typography.Text>
          </Space>
        </Space>

        <Space size={8} wrap>
          <Tag color={props.capabilityColor} variant="filled">
            能力状态：{props.capabilityStatus}
          </Tag>
          <Tag color={props.bindingColor} variant="filled">
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
  bindingStatus: string;
  bindingColor: string;
  note: string;
  actionLabel: string;
  actionType: 'navigate' | 'refetch' | 'bind';
}

const buildQyworkStatus = (
  query: UseQueryResult<Awaited<ReturnType<typeof ApiQywork.getCurrentConfig>>>,
  bindingQuery: UseQueryResult<
    Awaited<ReturnType<typeof ApiQywork.getCurrentBinding>>
  >,
): QyworkStatus => {
  if (query.isLoading || bindingQuery.isLoading) {
    return {
      capabilityStatus: '检查中',
      capabilityColor: 'processing',
      description: '正在读取当前租户的企业微信配置状态，请稍候。',
      bindingStatus: '检查中',
      bindingColor: 'processing',
      note: '正在同步当前账号的企业微信绑定状态。',
      actionLabel: '刷新状态',
      actionType: 'refetch',
    };
  }

  if (query.isError || bindingQuery.isError) {
    return {
      capabilityStatus: '检查失败',
      capabilityColor: 'error',
      description:
        '暂时无法读取当前租户的企业微信配置状态，请重试或稍后再查看。',
      bindingStatus: '检查失败',
      bindingColor: 'error',
      note: '绑定状态读取失败时不会触发授权流程，请先重试。',
      actionLabel: '重新加载',
      actionType: 'refetch',
    };
  }

  if (bindingQuery.data?.isBound) {
    return {
      capabilityStatus: '租户已配置',
      capabilityColor: 'success',
      description: bindingQuery.data.message,
      bindingStatus: formatQyworkBindingStatus(bindingQuery.data),
      bindingColor: 'success',
      note: '当前账号已经绑定企业微信；第一版暂未开放解绑能力。',
      actionLabel: '查看配置',
      actionType: 'navigate',
    };
  }

  if (bindingQuery.data?.canStartBinding) {
    return {
      capabilityStatus: '租户已配置',
      capabilityColor: 'success',
      description: bindingQuery.data.message,
      bindingStatus: '未绑定',
      bindingColor: 'warning',
      note: '若当前浏览器不在企业微信内，系统会展示二维码，由手机企业微信扫码完成绑定。',
      actionLabel: '绑定企业微信',
      actionType: 'bind',
    };
  }

  if (query.data) {
    return {
      capabilityStatus: '租户已配置',
      capabilityColor: 'warning',
      description:
        bindingQuery.data?.message ||
        '当前租户已配置企业微信，但网页授权配置尚未补齐。',
      bindingStatus: '不可发起',
      bindingColor: 'error',
      note: '请先补齐 Agent ID、启用状态和企业微信后台域名配置，再发起绑定。',
      actionLabel: '查看配置',
      actionType: 'navigate',
    };
  }

  return {
    capabilityStatus: '租户未配置',
    capabilityColor: 'warning',
    description: '当前租户尚未配置企业微信，请先在系统管理中完成基础配置。',
    bindingStatus: '未绑定',
    bindingColor: 'warning',
    note: '完成租户级配置后，个人中心才会开放企业微信绑定。',
    actionLabel: '前往配置',
    actionType: 'navigate',
  };
};

export default ThirdPartyTab;

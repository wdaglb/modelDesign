import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Image,
  Space,
  Typography,
} from 'antd';

import { ApiQywork } from '@/api';
import type {
  QyworkBindingSessionCreated,
  QyworkBindingSessionStatus,
} from '@/api/modules/qywork';
import queryKey from '@/constants/queryKey';

interface QyworkBindingPanelProps {
  session: QyworkBindingSessionCreated;
  onClose: () => void;
  onRefreshBinding: () => void;
}

/**
 * 桌面端二维码绑定面板。
 */
const QyworkBindingPanel = (props: QyworkBindingPanelProps) => {
  const statusQuery = useQuery({
    queryKey: queryKey.qywork.bindingSession(props.session.sessionId),
    queryFn: () => ApiQywork.getBindingSession(props.session.sessionId),
    refetchInterval: (query) => {
      const data = query.state.data as QyworkBindingSessionStatus | undefined;
      if (!data) {
        return props.session.pollIntervalMs;
      }
      if (
        data.status === 'success' ||
        data.status === 'failed' ||
        data.status === 'expired' ||
        data.status === 'cancelled'
      ) {
        return false;
      }
      return props.session.pollIntervalMs;
    },
  });

  useEffect(() => {
    if (statusQuery.data?.status === 'success') {
      props.onRefreshBinding();
    }
  }, [props, statusQuery.data?.status]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    props.session.qrCodeUrl,
  )}`;

  return (
    <Card>
      <Space direction={'vertical'} size={16} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          手机企业微信扫码绑定
        </Typography.Title>

        <Typography.Text type={'secondary'}>
          请使用手机企业微信扫描下方二维码完成授权。桌面端会自动轮询绑定状态。
        </Typography.Text>

        <Space
          size={24}
          align={'start'}
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
        >
          <Image
            width={240}
            height={240}
            src={qrImageUrl}
            alt={'企业微信绑定二维码'}
            preview={false}
          />

          <Space direction={'vertical'} size={12} style={{ flex: 1 }}>
            <Alert
              type={resolveAlertType(statusQuery.data?.status)}
              showIcon
              message={resolveStatusText(statusQuery.data)}
            />

            <Typography.Text type={'secondary'}>
              会话过期时间：{props.session.expireAt}
            </Typography.Text>

            <Space>
              <Button onClick={() => statusQuery.refetch()} loading={statusQuery.isFetching}>
                刷新状态
              </Button>
              <Button onClick={props.onClose}>收起面板</Button>
            </Space>
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

const resolveStatusText = (status?: QyworkBindingSessionStatus) => {
  if (!status) {
    return '二维码已生成，等待手机企业微信扫码。';
  }
  if (status.status === 'success') {
    return `绑定成功，企业微信用户：${status.providerUserId || '-'}`;
  }
  if (status.status === 'failed') {
    return status.failMessage || '绑定失败，请稍后重试。';
  }
  if (status.status === 'expired') {
    return '绑定会话已过期，请重新发起绑定。';
  }
  if (status.status === 'cancelled') {
    return '绑定已取消，请重新发起绑定。';
  }
  if (status.status === 'binding') {
    return '授权已完成，正在写入绑定关系，请稍候。';
  }
  if (status.status === 'authorizing') {
    return '已进入企业微信授权页，请在手机端完成授权。';
  }
  return '二维码已生成，等待手机企业微信扫码。';
};

const resolveAlertType = (status?: QyworkBindingSessionStatus['status']) => {
  if (status === 'success') {
    return 'success';
  }
  if (status === 'failed' || status === 'expired') {
    return 'error';
  }
  return 'info';
};

export default QyworkBindingPanel;

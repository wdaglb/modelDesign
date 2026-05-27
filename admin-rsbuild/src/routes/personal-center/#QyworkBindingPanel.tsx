import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Image, Space, Spin, Typography } from 'antd';

import { ApiQywork } from '@/api';
import { RequestError } from '@/api/types';
import type {
  QyworkBindingSessionCreated,
  QyworkBindingSessionStatus,
} from '@/api/modules/qywork';
import queryKey from '@/constants/queryKey';

interface QyworkBindingPanelProps {
  session: QyworkBindingSessionCreated;
  onRefreshBinding: () => void;
}

type QyworkPollingStatus =
  | QyworkBindingSessionStatus
  | {
      status: 'unauthorized';
    };

/**
 * 桌面端二维码绑定面板。
 */
const QyworkBindingPanel = (props: QyworkBindingPanelProps) => {
  const [qrImageLoading, setQrImageLoading] = useState(true);
  const statusQuery = useQuery({
    queryKey: queryKey.qywork.bindingSession(props.session.sessionId),
    queryFn: () => ApiQywork.getBindingSession(props.session.sessionId),
    refetchInterval: (query) => {
      /**
       * 401 表示当前登录态已经失效，继续轮询只会反复触发鉴权错误；
       * 这里直接关闭轮询，把后续处理交给页面统一登录态逻辑。
       */
      if (isUnauthorizedError(query.state.error)) {
        return false;
      }
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
  const pollingStatus = resolvePollingStatus(
    statusQuery.data,
    statusQuery.error,
  );

  useEffect(() => {
    if (statusQuery.data?.status === 'success') {
      props.onRefreshBinding();
    }
  }, [props, statusQuery.data?.status]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    props.session.qrCodeUrl,
  )}`;

  useEffect(() => {
    /**
     * 绑定会话切换时二维码地址也会变化，必须重置 loading，
     * 否则旧二维码加载完成后的状态会让新二维码缺少加载反馈。
     */
    setQrImageLoading(true);
  }, [qrImageUrl]);

  return (
    <Card>
      <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
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
          <Spin spinning={qrImageLoading} tip={'二维码加载中...'}>
            <Image
              width={240}
              height={240}
              src={qrImageUrl}
              alt={'企业微信绑定二维码'}
              preview={false}
              onLoad={() => {
                setQrImageLoading(false);
              }}
              onError={() => {
                setQrImageLoading(false);
              }}
            />
          </Spin>

          <Space orientation={'vertical'} size={12} style={{ flex: 1 }}>
            <Alert
              type={resolveAlertType(pollingStatus?.status)}
              showIcon
              title={resolveStatusText(pollingStatus)}
            />

            <Typography.Text type={'secondary'}>
              会话过期时间：{props.session.expireAt}
            </Typography.Text>

            {pollingStatus?.status === 'expired' && (
              <Space>
                <Button
                  onClick={() => statusQuery.refetch()}
                  loading={statusQuery.isFetching}
                >
                  刷新状态
                </Button>
              </Space>
            )}
          </Space>
        </Space>
      </Space>
    </Card>
  );
};

/**
 * 根据轮询状态生成用户可理解的提示文案。
 *
 * @param status 当前二维码绑定状态，未返回数据时代表首次轮询尚未完成
 * @returns 展示在提示条中的状态说明
 */
const resolveStatusText = (status?: QyworkPollingStatus) => {
  if (!status) {
    return '二维码已生成，等待手机企业微信扫码。';
  }
  if (status.status === 'unauthorized') {
    return '登录状态已失效，已停止二维码状态轮询。';
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

/**
 * 将绑定轮询状态映射为 Ant Design Alert 类型。
 *
 * @param status 当前二维码绑定状态
 * @returns Alert 的视觉类型
 */
const resolveAlertType = (status?: QyworkPollingStatus['status']) => {
  if (status === 'success') {
    return 'success';
  }
  if (status === 'failed' || status === 'expired' || status === 'unauthorized') {
    return 'error';
  }
  return 'info';
};

/**
 * 合并服务端状态和请求错误，确保 401 能在界面上形成明确终态。
 *
 * @param data 服务端返回的绑定状态
 * @param error 本次轮询请求异常
 * @returns 可直接用于渲染的轮询状态
 */
const resolvePollingStatus = (
  data?: QyworkBindingSessionStatus,
  error?: unknown,
): QyworkPollingStatus | undefined => {
  if (isUnauthorizedError(error)) {
    return {
      status: 'unauthorized',
    };
  }
  return data;
};

/**
 * 判断请求异常是否来自登录态失效。
 *
 * @param error 未知请求异常
 * @returns 是否为 401 RequestError
 */
const isUnauthorizedError = (error: unknown) => {
  return error instanceof RequestError && error.code === 401;
};

export default QyworkBindingPanel;

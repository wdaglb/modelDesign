import { Avatar, Card, Col, Row, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import type { CurrentInfoVo } from '@/api/modules/passport.types.ts';
import useFileUrl from '@/hooks/useFileUrl.ts';

interface AccountSummaryProps {
  currentInfo?: CurrentInfoVo;
}

/**
 * 个人中心顶部账户摘要卡片。
 */
const AccountSummary = (props: AccountSummaryProps) => {
  const avatarUrl = useFileUrl(props.currentInfo?.avatarId);
  const displayName = getDisplayName(props.currentInfo);
  const avatarText = getAvatarText(props.currentInfo);

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={{
        borderRadius: 20,
        border: '1px solid rgba(24, 144, 255, 0.14)',
        background:
          'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(255, 255, 255, 0.96) 45%, rgba(255, 255, 255, 1) 100%)',
      }}
    >
      <Row gutter={[24, 24]} align={'middle'}>
        <Col xs={24} xl={10}>
          <Space size={16} align={'start'}>
            <Avatar
              size={72}
              src={avatarUrl}
              style={{
                background:
                  'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
                boxShadow: '0 12px 24px rgba(22, 119, 255, 0.24)',
              }}
            >
              {avatarText}
            </Avatar>

            <Space direction={'vertical'} size={6}>
              <Space size={8} wrap>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {displayName}
                </Typography.Title>
                <Tag color={'blue'} bordered={false}>
                  个人中心
                </Tag>
              </Space>

              <Typography.Text type={'secondary'}>
                登录账号：{getDisplayText(props.currentInfo?.username)}
              </Typography.Text>

              <Space size={8} wrap>
                <Tag color={'processing'} bordered={false}>
                  用户 ID：{getDisplayText(props.currentInfo?.userId)}
                </Tag>
                <Tag color={'gold'} bordered={false}>
                  租户 ID：{getDisplayText(props.currentInfo?.tenantId)}
                </Tag>
              </Space>
            </Space>
          </Space>
        </Col>

        <Col xs={24} xl={14}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <SummaryMetric
                label={'最近登录'}
                value={formatDateTime(props.currentInfo?.tokenCreateTime)}
              />
            </Col>
            <Col xs={24} md={8}>
              <SummaryMetric
                label={'当前登录 IP'}
                value={getDisplayText(props.currentInfo?.loginIp)}
              />
            </Col>
            <Col xs={24} md={8}>
              <SummaryMetric
                label={'登录流水号'}
                value={getDisplayText(props.currentInfo?.loginId)}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

interface SummaryMetricProps {
  label: string;
  value: string;
}

/**
 * 摘要指标块。
 */
const SummaryMetric = (props: SummaryMetricProps) => {
  return (
    <div
      style={{
        height: '100%',
        padding: 16,
        borderRadius: 16,
        background: '#ffffff',
        border: '1px solid rgba(5, 5, 5, 0.06)',
      }}
    >
      <Typography.Text
        type={'secondary'}
        style={{ display: 'block', marginBottom: 8 }}
      >
        {props.label}
      </Typography.Text>
      <Typography.Text
        style={{
          display: 'block',
          color: '#141414',
          fontWeight: 600,
          lineHeight: '22px',
        }}
      >
        {props.value}
      </Typography.Text>
    </div>
  );
};

const getDisplayName = (currentInfo?: CurrentInfoVo) => {
  if (currentInfo?.nickname) {
    return currentInfo.nickname;
  }
  if (currentInfo?.username) {
    return currentInfo.username;
  }
  return '未登录用户';
};

const getAvatarText = (currentInfo?: CurrentInfoVo) => {
  const displayName = getDisplayName(currentInfo).trim();
  if (!displayName) {
    return 'U';
  }
  return displayName.slice(0, 1).toUpperCase();
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

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const formatted = dayjs(value);
  if (!formatted.isValid()) {
    return value;
  }
  return formatted.format('YYYY-MM-DD HH:mm:ss');
};

export default AccountSummary;

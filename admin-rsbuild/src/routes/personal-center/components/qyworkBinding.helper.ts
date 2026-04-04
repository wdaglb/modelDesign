export type QyworkEntryMode = 'in_app' | 'desktop_qr';

interface QyworkBindingStatusParams {
  isBound: boolean;
  providerUserId?: string;
  boundAt?: string | null;
}

/**
 * 根据浏览器 UA 判断当前绑定入口是企业微信内授权还是桌面二维码扫码。
 */
export const detectQyworkEntryMode = (userAgent: string): QyworkEntryMode => {
  return /wxwork/i.test(userAgent) ? 'in_app' : 'desktop_qr';
};

/**
 * 统一格式化企业微信绑定状态文案，避免页面内散落重复拼接逻辑。
 */
export const formatQyworkBindingStatus = (
  params: QyworkBindingStatusParams,
) => {
  if (!params.isBound) {
    return '未绑定';
  }

  const providerUserId = params.providerUserId || '-';
  const boundAt = params.boundAt || '-';

  return `已绑定 ${providerUserId} · ${boundAt}`;
};

/**
 * 当前租户企业微信配置查询键。
 */
export const current = () => ['qyworkCurrentConfig'];

/**
 * 当前登录用户企业微信绑定状态查询键。
 */
export const currentBinding = () => ['qyworkCurrentBinding'];

/**
 * 企业微信绑定会话状态查询键。
 */
export const bindingSession = (sessionId: string) => [
  'qyworkBindingSession',
  sessionId,
];

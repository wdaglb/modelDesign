import { shouldRequestBrowserNotificationPermission } from '@/service/browserNotificationService.ts';

const BROWSER_NOTIFICATION_PERMISSION_PROMPT_PREFIX =
  'browser-notification-permission-prompt';

/**
 * 生成当前用户的通知授权提示缓存键。
 *
 * @param userId 当前登录用户 ID
 * @returns sessionStorage 键名
 */
function buildBrowserNotificationPermissionPromptKey(userId: number) {
  return `${BROWSER_NOTIFICATION_PERMISSION_PROMPT_PREFIX}:${userId}`;
}

/**
 * 判断当前用户是否应该看到通知授权引导弹窗。
 *
 * 这里同时约束三件事：
 * 1. 必须存在有效登录用户；
 * 2. 浏览器通知权限仍处于 default，可继续申请；
 * 3. 当前登录会话内尚未弹过引导，避免每次切页面都重复打扰。
 *
 * @param userId 当前登录用户 ID
 * @returns 是否应弹出授权确认框
 */
export function shouldPromptBrowserNotificationPermission(userId?: number) {
  if (!userId) {
    return false;
  }

  if (!shouldRequestBrowserNotificationPermission()) {
    return false;
  }

  return (
    sessionStorage.getItem(
      buildBrowserNotificationPermissionPromptKey(userId),
    ) !== '1'
  );
}

/**
 * 标记当前登录会话已经展示过通知授权引导。
 *
 * @param userId 当前登录用户 ID
 */
export function markBrowserNotificationPermissionPrompted(userId?: number) {
  if (!userId) {
    return;
  }

  sessionStorage.setItem(
    buildBrowserNotificationPermissionPromptKey(userId),
    '1',
  );
}

/**
 * 清理当前标签页里的通知授权引导标记。
 *
 * 登出后必须清空该状态，保证用户下次重新登录时还能再次看到引导。
 */
export function clearBrowserNotificationPermissionPromptState() {
  const keysToRemove: string[] = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (!key) {
      continue;
    }

    if (!key.startsWith(BROWSER_NOTIFICATION_PERMISSION_PROMPT_PREFIX)) {
      continue;
    }

    keysToRemove.push(key);
  }

  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

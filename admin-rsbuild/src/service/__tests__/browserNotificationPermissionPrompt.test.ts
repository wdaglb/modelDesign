import { afterEach, describe, expect, it, vi } from 'vitest';

import { shouldRequestBrowserNotificationPermission } from '@/service/browserNotificationService.ts';
import {
  clearBrowserNotificationPermissionPromptState,
  markBrowserNotificationPermissionPrompted,
  shouldPromptBrowserNotificationPermission,
} from '@/service/browserNotificationPermissionPrompt.ts';

vi.mock('@/service/browserNotificationService.ts', () => {
  return {
    shouldRequestBrowserNotificationPermission: vi.fn(),
  };
});

describe('browserNotificationPermissionPrompt', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('仅在权限可申请且当前会话未提示时返回 true', () => {
    vi.mocked(shouldRequestBrowserNotificationPermission).mockReturnValue(true);

    expect(shouldPromptBrowserNotificationPermission(7)).toBe(true);

    markBrowserNotificationPermissionPrompted(7);
    expect(shouldPromptBrowserNotificationPermission(7)).toBe(false);
  });

  it('无用户或浏览器已不可申请时不应提示', () => {
    vi.mocked(shouldRequestBrowserNotificationPermission).mockReturnValue(true);
    expect(shouldPromptBrowserNotificationPermission()).toBe(false);

    vi.mocked(shouldRequestBrowserNotificationPermission).mockReturnValue(
      false,
    );
    expect(shouldPromptBrowserNotificationPermission(7)).toBe(false);
  });

  it('登出后应清空提示状态，保证下次登录还能再次引导', () => {
    vi.mocked(shouldRequestBrowserNotificationPermission).mockReturnValue(true);

    markBrowserNotificationPermissionPrompted(7);
    expect(shouldPromptBrowserNotificationPermission(7)).toBe(false);

    clearBrowserNotificationPermissionPromptState();
    expect(shouldPromptBrowserNotificationPermission(7)).toBe(true);
  });
});

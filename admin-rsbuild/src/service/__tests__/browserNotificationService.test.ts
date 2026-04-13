import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SystemMessageListItem } from '@/api/modules/system-message';
import {
  deliverSystemMessageBrowserNotification,
  isBrowserNotificationSupported,
  isServiceWorkerNotificationSupported,
  normalizeSystemMessageNotificationBody,
  requestBrowserNotificationPermissionIfSupported,
  registerBrowserNotificationWorkerIfSupported,
  resetBrowserNotificationWorkerCacheForTest,
  resolveUnnotifiedSystemMessages,
  shouldRequestBrowserNotificationPermission,
} from '@/service/browserNotificationService';

const originalNotification = globalThis.Notification;
const secureContextDescriptor = Object.getOwnPropertyDescriptor(
  window,
  'isSecureContext',
);
const originalServiceWorker = navigator.serviceWorker;

function mockNotification(permission: NotificationPermission) {
  class MockNotification {
    static permission = permission;

    static requestPermission = vi.fn(async () => {
      return permission;
    });
  }

  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: MockNotification,
  });

  return MockNotification;
}

function buildMessage(
  id: number,
  createdAt: string,
): SystemMessageListItem {
  return {
    id,
    scopeType: 'user',
    category: 'task',
    title: `消息 ${id}`,
    content: `<p>内容 ${id}</p>`,
    isRead: false,
    createdAt,
  };
}

describe('browserNotificationService', () => {
  beforeEach(() => {
    resetBrowserNotificationWorkerCacheForTest();
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    resetBrowserNotificationWorkerCacheForTest();
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: originalNotification,
    });

    if (secureContextDescriptor) {
      Object.defineProperty(window, 'isSecureContext', secureContextDescriptor);
    }

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
  });

  it('仅在安全上下文且存在 Notification 时视为支持浏览器通知', () => {
    mockNotification('default');
    expect(isBrowserNotificationSupported()).toBe(true);

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    expect(isBrowserNotificationSupported()).toBe(false);
  });

  it('支持 serviceWorker 时应优先注册通知 worker', async () => {
    mockNotification('granted');
    const readyRegistration = {
      showNotification: vi.fn(),
    };
    const register = vi.fn(async () => {
      return {
        showNotification: vi.fn(),
      };
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register,
        ready: Promise.resolve(readyRegistration),
      },
    });

    expect(isServiceWorkerNotificationSupported()).toBe(true);
    const registration = await registerBrowserNotificationWorkerIfSupported();
    expect(register).toHaveBeenCalledWith('/notification-sw.js');
    expect(registration).toBe(readyRegistration);
  });

  it('仅在权限为 default 时申请浏览器通知授权', async () => {
    const defaultNotification = mockNotification('default');
    expect(shouldRequestBrowserNotificationPermission()).toBe(true);

    await requestBrowserNotificationPermissionIfSupported();
    expect(defaultNotification.requestPermission).toHaveBeenCalledTimes(1);

    const grantedNotification = mockNotification('granted');
    expect(shouldRequestBrowserNotificationPermission()).toBe(false);

    await requestBrowserNotificationPermissionIfSupported();
    expect(grantedNotification.requestPermission).not.toHaveBeenCalled();
  });

  it('通知正文应移除 html 并在过长时裁剪', () => {
    const normalizedBody = normalizeSystemMessageNotificationBody(
      '<div>   任务 <strong>已更新</strong>，请尽快处理。   </div>',
    );
    expect(normalizedBody).toBe('任务 已更新 ，请尽快处理。');

    const longBody = normalizeSystemMessageNotificationBody(
      'a'.repeat(120),
    );
    expect(longBody.endsWith('...')).toBe(true);
  });

  it('仅返回未通知过的消息，并按创建时间升序输出', () => {
    const messages = [
      buildMessage(2, '2026-04-13 10:00:00'),
      buildMessage(1, '2026-04-13 09:00:00'),
      buildMessage(3, '2026-04-13 11:00:00'),
    ];

    const result = resolveUnnotifiedSystemMessages(
      messages,
      new Set([2]),
    );

    expect(result.map((messageItem) => messageItem.id)).toEqual([1, 3]);
  });

  it('已授权且支持 serviceWorker 时应通过 showNotification 投递', async () => {
    mockNotification('granted');
    const showNotification = vi.fn(async () => {});

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn(async () => {
          return { showNotification };
        }),
        ready: Promise.resolve({
          showNotification,
        }),
      },
    });

    await deliverSystemMessageBrowserNotification(
      buildMessage(9, '2026-04-13 12:00:00'),
    );

    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  it('worker 通知失败时应回退到页面级 Notification', async () => {
    const notificationSpy = vi.fn();

    class MockNotification {
      static permission: NotificationPermission = 'granted';

      static requestPermission = vi.fn(async () => {
        return 'granted';
      });

      constructor() {
        notificationSpy();
      }
    }

    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: MockNotification,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn(async () => {
          throw new Error('register failed');
        }),
        ready: Promise.resolve(undefined),
      },
    });

    await deliverSystemMessageBrowserNotification(
      buildMessage(10, '2026-04-13 12:01:00'),
    );

    expect(notificationSpy).toHaveBeenCalledTimes(1);
  });
});

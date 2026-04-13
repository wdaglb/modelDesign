import type { SystemMessageListItem } from '@/api/modules/system-message';
import { notification } from 'antd';

import { router } from '@/App.tsx';

/**
 * 消息通知轮询间隔。
 *
 * 这里改为 5 秒轮询一次，优先保证消息通知的时效性。
 */
export const SYSTEM_MESSAGE_POLL_INTERVAL = 5 * 1000;

const HTML_TAG_REGEX = /<[^>]+>/g;
const WHITESPACE_REGEX = /\s+/g;
const NOTIFICATION_BODY_MAX_LENGTH = 96;
let notificationWorkerReadyPromise:
  | Promise<ServiceWorkerRegistration | undefined>
  | undefined;

/**
 * 重置通知 worker 缓存。
 *
 * 仅用于测试阶段隔离模块级单例状态，业务代码不应主动调用。
 */
export function resetBrowserNotificationWorkerCacheForTest() {
  notificationWorkerReadyPromise = undefined;
}

/**
 * 判断当前环境是否支持浏览器通知。
 *
 * 浏览器通知依赖安全上下文，非 https 或不受信环境下直接跳过，
 * 避免在不支持场景里触发无意义报错。
 */
export function isBrowserNotificationSupported() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!window.isSecureContext) {
    return false;
  }

  return 'Notification' in window;
}

/**
 * 判断当前环境是否支持 Service Worker 通知。
 *
 * 某些浏览器对页面上下文的 Notification 呈现不稳定，
 * 优先走 Service Worker 的 showNotification 可以提升系统通知的触达率。
 */
export function isServiceWorkerNotificationSupported() {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  return 'serviceWorker' in navigator;
}

/**
 * 判断是否适合在当前时机申请浏览器通知授权。
 */
export function shouldRequestBrowserNotificationPermission() {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  return Notification.permission === 'default';
}

/**
 * 在支持场景下申请浏览器通知授权。
 *
 * 该函数只在权限状态为 default 时触发，避免对已授权或已拒绝用户重复打扰。
 */
export async function requestBrowserNotificationPermissionIfSupported() {
  if (!shouldRequestBrowserNotificationPermission()) {
    return undefined;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return undefined;
  }
}

/**
 * 注册系统消息通知专用 Service Worker。
 *
 * 这里做单例缓存，避免每次轮询或进入布局时重复发起注册请求。
 */
export async function registerBrowserNotificationWorkerIfSupported() {
  if (!isServiceWorkerNotificationSupported()) {
    return undefined;
  }

  if (notificationWorkerReadyPromise) {
    return notificationWorkerReadyPromise;
  }

  notificationWorkerReadyPromise = (async () => {
    try {
      await navigator.serviceWorker.register('/notification-sw.js');
      const readyRegistration = await navigator.serviceWorker.ready;
      return readyRegistration;
    } catch {
      notificationWorkerReadyPromise = undefined;
      return undefined;
    }
  })();

  return notificationWorkerReadyPromise;
}

/**
 * 规范化浏览器通知正文。
 *
 * 系统通知正文空间有限，先移除可能的 HTML 标签，再做长度裁剪，
 * 避免长文案把关键内容完全挤出通知面板。
 */
export function normalizeSystemMessageNotificationBody(content: string) {
  const plainText = content
    .replace(HTML_TAG_REGEX, ' ')
    .replace(WHITESPACE_REGEX, ' ')
    .trim();

  if (!plainText) {
    return '你有一条新的系统消息';
  }

  if (plainText.length <= NOTIFICATION_BODY_MAX_LENGTH) {
    return plainText;
  }

  return `${plainText.slice(0, NOTIFICATION_BODY_MAX_LENGTH)}...`;
}

/**
 * 找出当前批次中尚未投递过的消息。
 *
 * 浏览器通知需要避免重复投递，因此统一基于消息 ID 去重，
 * 并按创建时间升序输出，保证用户接收顺序稳定。
 */
export function resolveUnnotifiedSystemMessages(
  messages: SystemMessageListItem[],
  notifiedIds: Set<number>,
) {
  return [...messages]
    .filter((messageItem) => {
      return !notifiedIds.has(messageItem.id);
    })
    .sort((leftItem, rightItem) => {
      const leftTime = new Date(leftItem.createdAt).getTime();
      const rightTime = new Date(rightItem.createdAt).getTime();
      return leftTime - rightTime;
    });
}

/**
 * 打开系统通知关联的目标地址。
 *
 * 站内地址优先交给路由系统处理，外链保持新窗口打开，
 * 这样既能保留单页应用状态，也不会破坏消息里的外部链接能力。
 */
export function openSystemMessageNotificationTarget(redirectUrl?: string) {
  if (!redirectUrl) {
    return;
  }

  if (
    redirectUrl.startsWith('http://') ||
    redirectUrl.startsWith('https://')
  ) {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  void router.navigate({
    to: redirectUrl as never,
  });
}

/**
 * 显示页面内右下角兜底提示。
 *
 * 当系统通知在某些浏览器或系统环境下虽然调用成功但没有明显展示时，
 * 站内提示可以保证用户至少在当前页面内看到一条可点击的提醒。
 */
export function showSystemMessageInAppToast(
  messageItem: SystemMessageListItem,
) {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.visibilityState !== 'visible') {
    return;
  }

  notification.open({
    key: `system-message-toast-${messageItem.id}`,
    message: messageItem.title,
    description: normalizeSystemMessageNotificationBody(messageItem.content),
    placement: 'bottomRight',
    duration: 6,
    onClick: () => {
      openSystemMessageNotificationTarget(messageItem.redirectUrl);
    },
  });
}

/**
 * 投递单条系统消息到浏览器通知。
 *
 * 点击通知后会尝试聚焦当前窗口，并按消息跳转地址落到具体业务页面。
 */
export function showSystemMessageBrowserNotification(
  messageItem: SystemMessageListItem,
) {
  if (!isBrowserNotificationSupported()) {
    return undefined;
  }

  if (Notification.permission !== 'granted') {
    return undefined;
  }

  try {
    const notification = new Notification(messageItem.title, {
      body: normalizeSystemMessageNotificationBody(messageItem.content),
      tag: `system-message-${messageItem.id}`,
      requireInteraction: true,
      renotify: true,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      openSystemMessageNotificationTarget(messageItem.redirectUrl);
      notification.close();
    };
    return notification;
  } catch (error) {
    return undefined;
  }
}

/**
 * 通过浏览器最合适的通知通道投递系统消息。
 *
 * 优先使用 Service Worker 通知；如果当前环境不支持，则回退到页面级 Notification。
 */
export async function deliverSystemMessageBrowserNotification(
  messageItem: SystemMessageListItem,
) {
  if (!isBrowserNotificationSupported()) {
    return undefined;
  }

  if (Notification.permission !== 'granted') {
    return undefined;
  }

  if (isServiceWorkerNotificationSupported()) {
    try {
      const registration = await registerBrowserNotificationWorkerIfSupported();
      if (registration) {
        await registration.showNotification(messageItem.title, {
          body: normalizeSystemMessageNotificationBody(messageItem.content),
          tag: `system-message-${messageItem.id}`,
          requireInteraction: true,
          renotify: true,
          silent: false,
          data: {
            redirectUrl: messageItem.redirectUrl,
          },
        });
        return registration;
      }
    } catch (error) {
      /**
       * worker 通知失败时降级到页面级通知，避免整个通知链路被单点能力阻断。
       */
    }
  }

  return showSystemMessageBrowserNotification(messageItem);
}

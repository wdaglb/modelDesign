import ClipboardJS from 'clipboard';

const copyUnsupportedMessage = '当前环境不支持复制';
const copyFailedMessage = '复制失败，请手动复制';

/**
 * 复制文本到系统剪贴板。
 *
 * 统一改用 clipboard 包，避免继续维护浏览器原生 API
 * 与 execCommand 双通道逻辑；同时保留 Promise 形态，
 * 让现有调用方的 await / try-catch 行为保持不变。
 * clipboard 包需要一个真实触发元素来绑定点击事件，
 * 因此这里创建临时按钮并在复制完成后立即销毁，避免页面残留 DOM。
 *
 * @param text 待复制文本
 * @returns 复制成功时完成的 Promise
 * @throws 当前浏览器不支持复制，或 clipboard 包回调复制失败
 */
export async function copyTextToClipboard(text: string) {
  if (!ClipboardJS.isSupported('copy')) {
    throw new Error(copyUnsupportedMessage);
  }

  return new Promise<void>((resolve, reject) => {
    const trigger = createClipboardTrigger();
    const clipboard = new ClipboardJS(trigger, {
      container: document.body,
      text: () => text,
    });
    let settled = false;

    /**
     * clipboard 实例会在按钮上注册事件监听，成功或失败后必须统一销毁，
     * 否则频繁复制任务编号、链接时会留下无用监听和隐藏按钮。
     */
    const cleanup = () => {
      clipboard.destroy();
      trigger.remove();
    };

    const resolveOnce = (event: ClipboardJS.Event) => {
      if (settled) {
        return;
      }

      settled = true;
      event.clearSelection();
      cleanup();
      resolve();
    };

    const rejectOnce = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error(copyFailedMessage));
    };

    clipboard.on('success', resolveOnce);
    clipboard.on('error', rejectOnce);

    try {
      document.body.appendChild(trigger);
      trigger.click();
    } catch {
      rejectOnce();
    }
  });
}

/**
 * 创建 clipboard 包所需的临时触发按钮。
 *
 * @returns 已完成视觉隐藏、不可聚焦处理的按钮元素
 */
function createClipboardTrigger() {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.tabIndex = -1;
  trigger.setAttribute('aria-hidden', 'true');
  trigger.style.position = 'fixed';
  trigger.style.left = '-9999px';
  trigger.style.top = '0';
  trigger.style.opacity = '0';

  return trigger;
}

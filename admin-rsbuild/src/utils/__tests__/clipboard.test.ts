import { beforeEach, describe, expect, it, vi } from 'vitest';

const clipboardModuleMock = vi.hoisted(() => {
  return {
    clearSelectionMock: vi.fn(),
    constructorMock: vi.fn(),
    destroyMock: vi.fn(),
    isSupportedMock: vi.fn(),
    nextEvent: 'success',
  };
});

vi.mock('clipboard', () => {
  class ClipboardMock {
    static isSupported = clipboardModuleMock.isSupportedMock;

    private readonly handlers = new Map<string, (event: unknown) => void>();

    /**
     * 模拟 clipboard 包的实例化绑定模式：真实包会监听触发元素点击，
     * 点击后再通过 success/error 事件通知调用方复制结果。
     */
    constructor(
      trigger: HTMLElement,
      options: { container: Element; text: () => string },
    ) {
      clipboardModuleMock.constructorMock(trigger, options);
      trigger.addEventListener('click', () => {
        const handler = this.handlers.get(clipboardModuleMock.nextEvent);

        if (!handler) {
          return;
        }

        handler({
          clearSelection: clipboardModuleMock.clearSelectionMock,
          text: options.text(),
          trigger,
        });
      });
    }

    on(type: string, handler: (event: unknown) => void) {
      this.handlers.set(type, handler);
      return this;
    }

    destroy() {
      clipboardModuleMock.destroyMock();
    }
  }

  return {
    default: ClipboardMock,
  };
});

import { copyTextToClipboard } from '../clipboard';

describe('copyTextToClipboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    clipboardModuleMock.clearSelectionMock.mockReset();
    clipboardModuleMock.constructorMock.mockReset();
    clipboardModuleMock.destroyMock.mockReset();
    clipboardModuleMock.isSupportedMock.mockReset();
    clipboardModuleMock.nextEvent = 'success';
  });

  it('应通过 clipboard 实例触发复制并清理临时按钮', async () => {
    clipboardModuleMock.isSupportedMock.mockReturnValue(true);

    await copyTextToClipboard('TASK-1001');

    expect(clipboardModuleMock.isSupportedMock).toHaveBeenCalledWith('copy');
    expect(clipboardModuleMock.constructorMock).toHaveBeenCalledTimes(1);

    const [trigger, options] = clipboardModuleMock.constructorMock.mock.calls[0];
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    expect(options.container).toBe(document.body);
    expect(options.text()).toBe('TASK-1001');
    expect(document.body.contains(trigger)).toBe(false);
    expect(clipboardModuleMock.clearSelectionMock).toHaveBeenCalledTimes(1);
    expect(clipboardModuleMock.destroyMock).toHaveBeenCalledTimes(1);
  });

  it('clipboard 回调复制失败时应清理临时按钮并抛错', async () => {
    clipboardModuleMock.isSupportedMock.mockReturnValue(true);
    clipboardModuleMock.nextEvent = 'error';

    await expect(copyTextToClipboard('TASK-1002')).rejects.toThrow(
      '复制失败，请手动复制',
    );

    const [trigger] = clipboardModuleMock.constructorMock.mock.calls[0];
    expect(document.body.contains(trigger)).toBe(false);
    expect(clipboardModuleMock.destroyMock).toHaveBeenCalledTimes(1);
  });

  it('当前环境不支持复制时应抛错', async () => {
    clipboardModuleMock.isSupportedMock.mockReturnValue(false);

    await expect(copyTextToClipboard('TASK-1003')).rejects.toThrow(
      '当前环境不支持复制',
    );
    expect(clipboardModuleMock.constructorMock).not.toHaveBeenCalled();
  });
});

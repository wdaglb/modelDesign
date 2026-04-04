import { describe, expect, it } from 'vitest';

import {
  detectQyworkEntryMode,
  formatQyworkBindingStatus,
} from '../components/qyworkBinding.helper';

describe('qyworkBinding.helper', () => {
  it('企业微信 UA 命中时返回 in_app', () => {
    expect(detectQyworkEntryMode('Mozilla wxwork/4.1.0')).toBe('in_app');
  });

  it('普通浏览器返回 desktop_qr', () => {
    expect(detectQyworkEntryMode('Mozilla/5.0 Chrome/130')).toBe(
      'desktop_qr',
    );
  });

  it('已绑定状态展示 userId 与时间', () => {
    expect(
      formatQyworkBindingStatus({
        isBound: true,
        providerUserId: 'zhangsan',
        boundAt: '2026-04-04 10:00:00',
      }),
    ).toContain('zhangsan');
  });
});

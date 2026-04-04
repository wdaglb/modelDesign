import { describe, expect, it } from 'vitest';

import {
  formatBrowserDisplay,
  formatDeviceTypeDisplay,
  formatLoginTypeDisplay,
  formatOsDisplay,
} from '../components/loginHistoryDisplay.helper';

describe('loginHistoryDisplay.helper', () => {
  it('浏览器名称与版本同时存在时按组合文案展示', () => {
    expect(formatBrowserDisplay('Chrome', '136.0.0')).toBe(
      'Chrome 136.0.0',
    );
  });

  it('浏览器信息缺失时回退为短横线', () => {
    expect(formatBrowserDisplay('', '')).toBe('-');
  });

  it('操作系统名称与版本同时存在时按组合文案展示', () => {
    expect(formatOsDisplay('Windows', '11')).toBe('Windows 11');
  });

  it('操作系统信息缺失时回退为短横线', () => {
    expect(formatOsDisplay(undefined, undefined)).toBe('-');
  });

  it('设备类型按约定中文化', () => {
    expect(formatDeviceTypeDisplay('DESKTOP')).toBe('桌面端');
    expect(formatDeviceTypeDisplay('MOBILE')).toBe('手机');
    expect(formatDeviceTypeDisplay('TABLET')).toBe('平板');
    expect(formatDeviceTypeDisplay('TV')).toBe('未知设备');
  });

  it('登录方式保持既有中文化行为', () => {
    expect(formatLoginTypeDisplay('PASSWORD')).toBe('账号密码');
    expect(formatLoginTypeDisplay('SMS')).toBe('SMS');
    expect(formatLoginTypeDisplay(undefined)).toBe('-');
  });
});

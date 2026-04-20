import { beforeEach, describe, expect, it } from 'vitest';
import {
  AGILE_BOARD_VERSION_STORAGE_KEY,
  AGILE_BOARD_V2_TOUR_SEEN_STORAGE_KEY,
  buildAgileBoardVersionSearch,
  getPreferredAgileBoardVersionFromStorage,
  hasSeenAgileBoardV2Tour,
  markAgileBoardV2TourAsSeen,
  savePreferredAgileBoardVersionToStorage,
  shouldAutoRedirectToAgileBoardV2,
} from '../#boardVersionPreference';

describe('boardVersionPreference', () => {
  beforeEach(() => {
    localStorage.removeItem(AGILE_BOARD_VERSION_STORAGE_KEY);
    localStorage.removeItem(AGILE_BOARD_V2_TOUR_SEEN_STORAGE_KEY);
  });

  it('应读取已保存的版本偏好', () => {
    localStorage.setItem(AGILE_BOARD_VERSION_STORAGE_KEY, 'v2');

    expect(getPreferredAgileBoardVersionFromStorage()).toBe('v2');
  });

  it('非法版本偏好应返回 undefined', () => {
    localStorage.setItem(AGILE_BOARD_VERSION_STORAGE_KEY, 'unknown');

    expect(getPreferredAgileBoardVersionFromStorage()).toBeUndefined();
  });

  it('应保存版本偏好', () => {
    savePreferredAgileBoardVersionToStorage('v1');

    expect(localStorage.getItem(AGILE_BOARD_VERSION_STORAGE_KEY)).toBe('v1');
  });

  it('记住 v2 时进入旧版应自动跳转', () => {
    savePreferredAgileBoardVersionToStorage('v2');

    expect(shouldAutoRedirectToAgileBoardV2()).toBe(true);
  });

  it('未记住 v2 时不应自动跳转', () => {
    savePreferredAgileBoardVersionToStorage('v1');

    expect(shouldAutoRedirectToAgileBoardV2()).toBe(false);
  });

  it('构建搜索参数时应保留 taskId', () => {
    expect(buildAgileBoardVersionSearch(12)).toEqual({
      taskId: 12,
    });
    expect(buildAgileBoardVersionSearch()).toEqual({});
  });

  it('应记录已展示过 v2 Tour 引导', () => {
    expect(hasSeenAgileBoardV2Tour()).toBe(false);

    markAgileBoardV2TourAsSeen();

    expect(hasSeenAgileBoardV2Tour()).toBe(true);
  });
});

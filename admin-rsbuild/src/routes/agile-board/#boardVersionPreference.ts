/**
 * 敏捷面板版本偏好存储键。
 */
export const AGILE_BOARD_VERSION_STORAGE_KEY = 'agileBoard.preferredVersion';

/**
 * 敏捷面板 v2 引导已展示存储键。
 */
export const AGILE_BOARD_V2_TOUR_SEEN_STORAGE_KEY = 'agileBoard.v2TourSeen';

/**
 * 敏捷面板版本偏好。
 */
export type AgileBoardPreferredVersion = 'v1' | 'v2';

/**
 * 从本地存储读取敏捷面板版本偏好。
 *
 * @returns 当前记住的版本；若未配置或值非法，则返回 undefined
 */
export function getPreferredAgileBoardVersionFromStorage() {
  const rawValue = localStorage.getItem(AGILE_BOARD_VERSION_STORAGE_KEY);

  if (rawValue === 'v1' || rawValue === 'v2') {
    return rawValue;
  }

  return undefined;
}

/**
 * 保存敏捷面板版本偏好。
 *
 * @param version 需要记住的版本偏好
 */
export function savePreferredAgileBoardVersionToStorage(
  version: AgileBoardPreferredVersion,
) {
  localStorage.setItem(AGILE_BOARD_VERSION_STORAGE_KEY, version);
}

/**
 * 判断进入旧版路由时是否应自动跳转到 v2。
 *
 * @returns 当用户明确记住 v2 时返回 true
 */
export function shouldAutoRedirectToAgileBoardV2() {
  return getPreferredAgileBoardVersionFromStorage() === 'v2';
}

/**
 * 构建版本切换时需要继续透传的搜索参数。
 *
 * @param taskId 当前打开态的任务 ID
 * @returns 供路由跳转复用的搜索参数
 */
export function buildAgileBoardVersionSearch(taskId?: number) {
  if (taskId === undefined) {
    return {};
  }

  return {
    taskId,
  };
}

/**
 * 判断旧版页面是否已经展示过 v2 引导。
 *
 * @returns 展示过返回 true，否则返回 false
 */
export function hasSeenAgileBoardV2Tour() {
  return localStorage.getItem(AGILE_BOARD_V2_TOUR_SEEN_STORAGE_KEY) === '1';
}

/**
 * 记录旧版页面已经展示过 v2 引导。
 */
export function markAgileBoardV2TourAsSeen() {
  localStorage.setItem(AGILE_BOARD_V2_TOUR_SEEN_STORAGE_KEY, '1');
}

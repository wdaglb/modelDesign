/**
 * 登录方式中文映射，保证安全页和测试使用统一口径。
 */
const loginTypeDisplayMap: Record<string, string> = {
  PASSWORD: '账号密码',
};

/**
 * 设备类型中文映射，未识别值统一回退为“未知设备”。
 */
const deviceTypeDisplayMap: Record<string, string> = {
  DESKTOP: '桌面端',
  MOBILE: '手机',
  TABLET: '平板',
};

/**
 * 将名称与版本组合为统一展示文案。
 * 若两者都缺失则返回短横线。
 */
const formatNameWithVersion = (
  name?: string,
  version?: string,
): string => {
  const normalizedName = normalizeText(name);
  const normalizedVersion = normalizeText(version);

  if (normalizedName === '-' && normalizedVersion === '-') {
    return '-';
  }

  if (normalizedName === '-') {
    return normalizedVersion;
  }

  if (normalizedVersion === '-') {
    return normalizedName;
  }

  return `${normalizedName} ${normalizedVersion}`;
};

/**
 * 统一处理字符串展示值，空值时回退短横线。
 */
const normalizeText = (value?: string): string => {
  if (value === undefined) {
    return '-';
  }

  if (value === null) {
    return '-';
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '-';
  }

  return trimmedValue;
};

/**
 * 格式化登录方式展示文案。
 */
export const formatLoginTypeDisplay = (loginType?: string): string => {
  const normalizedLoginType = normalizeText(loginType);
  if (normalizedLoginType === '-') {
    return '-';
  }

  const displayText = loginTypeDisplayMap[normalizedLoginType];
  if (displayText) {
    return displayText;
  }

  return normalizedLoginType;
};

/**
 * 格式化浏览器展示文案。
 */
export const formatBrowserDisplay = (
  browserName?: string,
  browserVersion?: string,
): string => {
  return formatNameWithVersion(browserName, browserVersion);
};

/**
 * 格式化操作系统展示文案。
 */
export const formatOsDisplay = (
  osName?: string,
  osVersion?: string,
): string => {
  return formatNameWithVersion(osName, osVersion);
};

/**
 * 格式化设备类型展示文案。
 */
export const formatDeviceTypeDisplay = (deviceType?: string): string => {
  const normalizedDeviceType = normalizeText(deviceType);
  if (normalizedDeviceType === '-') {
    return '未知设备';
  }

  const displayText = deviceTypeDisplayMap[normalizedDeviceType];
  if (displayText) {
    return displayText;
  }

  return '未知设备';
};

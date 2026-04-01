import type { TenantOption } from '@/api/modules/tenant';
import type { User } from '@/api/modules/user';

export interface TenantSelectOption {
  /**
   * 选项标签。
   */
  label: string;

  /**
   * 选项值。
   */
  value: number;
}

/**
 * 构造租户选项标签。
 */
function buildTenantLabel(name: string, code?: string) {
  if (!code) {
    return name;
  }
  return `${name} (${code})`;
}

/**
 * 构造租户下拉选项。
 */
export function buildTenantSelectOptions(
  options: TenantOption[] | undefined,
  currentTenantId?: number,
  currentTenantName?: string,
) {
  const optionMap = new Map<number, TenantSelectOption>();
  if (options) {
    options.forEach((item) => {
      optionMap.set(item.id, {
        label: buildTenantLabel(item.name, item.code),
        value: item.id,
      });
    });
  }

  if (
    currentTenantId !== undefined &&
    currentTenantId !== null &&
    !optionMap.has(currentTenantId)
  ) {
    let label = `租户 #${currentTenantId}`;
    if (currentTenantName) {
      label = currentTenantName;
    }
    optionMap.set(currentTenantId, {
      label,
      value: currentTenantId,
    });
  }

  return Array.from(optionMap.values());
}

/**
 * 获取用户所属租户展示文案。
 */
export function getUserTenantText(user: User) {
  if (user.tenantName) {
    return user.tenantName;
  }
  if (user.tenantId !== undefined && user.tenantId !== null) {
    return `租户 #${user.tenantId}`;
  }
  return '未绑定租户';
}

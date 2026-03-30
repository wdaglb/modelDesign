export const list = () => ['roleList'];
export const permission = (roleCode: string) => ['rolePermission', roleCode];
export const users = (roleCode: string) => ['roleUsers', roleCode];

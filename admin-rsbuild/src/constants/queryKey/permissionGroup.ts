export const list = () => ['permissionGroupList'];
export const resources = (groupCode: string) => [
  'permissionGroupResources',
  groupCode,
];

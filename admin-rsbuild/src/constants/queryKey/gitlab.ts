/**
 * 当前租户 GitLab 配置查询键。
 */
export const current = () => ['gitlabCurrentConfig'];

/**
 * GitLab 项目列表查询键。
 */
export const projects = (params: object) => ['gitlabProjects', params];

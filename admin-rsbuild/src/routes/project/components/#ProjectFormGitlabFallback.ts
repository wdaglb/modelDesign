import { message } from 'antd';
import { ApiProject } from '@/api';
import { RequestError } from '@/api/types';
import type {
  CreateProjectParams,
  EditProjectParams,
  Project,
} from '@/api/modules/project.types';

/**
 * 项目表单提交值。
 *
 * 创建和编辑共用同一个表单，编辑态也会保留只读字段，
 * 因此这里使用交叉类型承接表单实际提交结构。
 */
export type ProjectFormValues = CreateProjectParams & EditProjectParams;

/**
 * GitLab 外部连接和租户配置类错误关键字。
 *
 * 这里只列出外部连接、配置、鉴权失败。
 * 绑定字段校验错误必须保留原始报错。
 * 这样可以避免把真实业务错误错误地降级为 fallback。
 */
const GITLAB_FALLBACK_ERROR_KEYWORDS = [
  '当前租户未配置 GitLab 信息',
  '当前租户 GitLab 配置未启用',
  '调用 GitLab 接口失败',
  'GitLab 服务器地址配置错误',
  'GitLab 接口响应为空',
  'GitLab Token 无效或权限不足',
];

/**
 * 判断项目提交错误是否允许 GitLab 绑定 fallback。
 *
 * @param error 原始异常
 * @returns 是否属于可降级的 GitLab 外部连接或配置错误
 */
export function isGitlabFallbackError(error: unknown) {
  if (!(error instanceof RequestError)) {
    return false;
  }

  const errorMessage = error.message || '';
  for (const keyword of GITLAB_FALLBACK_ERROR_KEYWORDS) {
    if (errorMessage.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * 判断表单是否携带 GitLab 仓库绑定。
 *
 * @param values 项目表单提交值
 * @returns 是否需要启用 GitLab fallback 提交流程
 */
function hasGitlabRepositories(values: ProjectFormValues) {
  const repositories = values.gitlabRepositories || [];
  return repositories.length > 0;
}

/**
 * 构造 GitLab 绑定失败后的降级提交值。
 *
 * 创建态需要提交空绑定列表，确保新项目不会残留无效仓库快照。
 * 编辑态则移除绑定字段，避免连接失败时误清空已有绑定关系。
 *
 * @param record 编辑态项目记录；为空时执行创建
 * @param values 项目表单提交值
 * @returns 降级提交值
 */
function buildFallbackValues(
  record: Project | undefined,
  values: ProjectFormValues,
) {
  const fallbackValues = {
    ...values,
  };
  if (record) {
    delete fallbackValues.gitlabRepositories;
    return fallbackValues;
  }

  fallbackValues.gitlabRepositories = [];
  return fallbackValues;
}

/**
 * 提交项目基础信息。
 *
 * @param record 编辑态项目记录；为空时执行创建
 * @param values 项目表单提交值
 * @param options 请求控制选项
 * @returns 项目详情
 */
function submitProject(
  record: Project | undefined,
  values: ProjectFormValues,
  options?: { skipErrorHandler?: boolean },
) {
  if (record) {
    return ApiProject.edit(record.id, values, options);
  }

  return ApiProject.create(values, options);
}

/**
 * 展示项目提交失败提示。
 *
 * @param error 原始异常
 */
function showProjectSubmitError(error: unknown) {
  if (error instanceof RequestError) {
    message.error(error.message || '项目保存失败');
    return;
  }

  if (error instanceof Error && error.message) {
    message.error(error.message);
    return;
  }

  message.error('项目保存失败');
}

/**
 * 带 GitLab fallback 的项目提交。
 *
 * 当项目表单携带 GitLab 仓库绑定时，首次提交关闭统一错误提示，
 * 这样可在 GitLab 外部连接或配置异常后，去掉仓库绑定重试。
 * 其他业务错误继续抛出。
 * 避免项目名称、编号、绑定数据校验等问题被吞掉。
 *
 * @param record 编辑态项目记录；为空时执行创建
 * @param values 项目表单提交值
 * @returns 项目详情
 */
export async function submitProjectWithGitlabFallback(
  record: Project | undefined,
  values: ProjectFormValues,
) {
  if (!hasGitlabRepositories(values)) {
    return submitProject(record, values);
  }

  try {
    return await submitProject(record, values, { skipErrorHandler: true });
  } catch (error) {
    if (!isGitlabFallbackError(error)) {
      showProjectSubmitError(error);
      throw error;
    }

    const fallbackValues = buildFallbackValues(record, values);
    const result = await submitProject(record, fallbackValues);
    message.warning(
      'GitLab 仓库绑定失败，已保存项目基础信息，' +
        '请稍后重新绑定。',
    );
    return result;
  }
}

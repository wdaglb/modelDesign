import { AxiosResponse } from 'axios';
import { message, notification } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiGitlab, ApiProject } from '@/api';
import type { GitlabProject } from '@/api/modules/gitlab';
import { DatabaseType } from '@/api/modules/project.types';
import { RequestError } from '@/api/types';

import {
  buildGitlabRepositoryOption,
  mergeGitlabRepositoryOptions,
  ProjectGitlabRepositorySelect,
  resolveSelectedGitlabRepositories,
  toGitlabRepositoryBinding,
} from '../#ProjectForm';
import {
  isGitlabFallbackError,
  submitProjectWithGitlabFallback,
  type ProjectFormValues,
} from '../#ProjectFormGitlabFallback';

vi.mock('@/api', () => {
  return {
    ApiGitlab: {
      getProjects: vi.fn(),
    },
    ApiProject: {
      create: vi.fn(),
      edit: vi.fn(),
    },
  };
});

/**
 * 构造 RequestError，模拟后端业务异常响应。
 *
 * @param code HTTP 状态码
 * @param errorMessage 后端错误消息
 * @returns RequestError 实例
 */
const buildRequestError = (code: number, errorMessage: string) => {
  return new RequestError({
    status: code,
    data: {
      message: errorMessage,
    },
  } as AxiosResponse);
};

/**
 * 构造带 GitLab 仓库绑定的项目表单值。
 *
 * @returns 项目表单值
 */
const buildProjectFormValues = (): ProjectFormValues => {
  return {
    code: 'demo',
    name: '示例项目',
    dbType: DatabaseType.MySQL,
    gitlabRepositories: [
      {
        gitlabProjectId: 11,
        name: '服务端',
        pathWithNamespace: 'group/server',
        webUrl: 'https://gitlab.example.com/group/server',
      },
    ],
  };
};

describe('ProjectForm GitLab 仓库绑定', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应将 GitLab 项目转换为项目绑定快照字段', () => {
    const project: GitlabProject = {
      id: 11,
      name: '服务端',
      pathWithNamespace: 'group/server',
      webUrl: 'https://gitlab.example.com/group/server',
      visibility: 'private',
      defaultBranch: 'main',
      lastActivityAt: '2026-06-04T00:00:00Z',
    };

    const result = toGitlabRepositoryBinding(project);

    expect(result).toEqual({
      gitlabProjectId: 11,
      name: '服务端',
      pathWithNamespace: 'group/server',
      webUrl: 'https://gitlab.example.com/group/server',
    });
  });

  it('编辑回显时应保留已绑定仓库选项并去重搜索结果', () => {
    const selectedRepository = {
      gitlabProjectId: 11,
      name: '服务端',
      pathWithNamespace: 'group/server',
      webUrl: 'https://gitlab.example.com/group/server',
    };
    const searchedOptions = [
      buildGitlabRepositoryOption(selectedRepository),
      buildGitlabRepositoryOption({
        gitlabProjectId: 12,
        name: '前端',
        pathWithNamespace: 'group/admin',
        webUrl: 'https://gitlab.example.com/group/admin',
      }),
    ];

    const result = mergeGitlabRepositoryOptions(
      [selectedRepository],
      searchedOptions,
    );

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(11);
    expect(result[1].value).toBe(12);
  });

  it('删除已选仓库后应只提交剩余仓库快照', () => {
    const serverOption = buildGitlabRepositoryOption({
      gitlabProjectId: 11,
      name: '服务端',
      pathWithNamespace: 'group/server',
      webUrl: 'https://gitlab.example.com/group/server',
    });
    const adminOption = buildGitlabRepositoryOption({
      gitlabProjectId: 12,
      name: '前端',
      pathWithNamespace: 'group/admin',
      webUrl: 'https://gitlab.example.com/group/admin',
    });

    const result = resolveSelectedGitlabRepositories(
      [12],
      [serverOption, adminOption],
    );

    expect(result).toHaveLength(1);
    expect(result[0].gitlabProjectId).toBe(12);
  });

  it('搜索失败时应展示 GitLab 配置或搜索失败提示', async () => {
    vi.mocked(ApiGitlab.getProjects).mockRejectedValue(new Error('not found'));
    const notificationSpy = vi
      .spyOn(notification, 'warning')
      .mockImplementation(() => undefined as never);
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ProjectGitlabRepositorySelect value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(ApiGitlab.getProjects).toHaveBeenCalledWith(
        {
          current: 1,
          pageSize: 20,
          keyword: undefined,
        },
        {
          skipErrorHandler: true,
        },
      );
    });
    expect(notificationSpy).toHaveBeenCalledWith({
      key: 'project-gitlab-search-error',
      message: '当前租户 GitLab 未配置或项目搜索失败。',
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('GitLab 连接失败时创建项目应去掉仓库绑定后重试', async () => {
    const values = buildProjectFormValues();
    const warningSpy = vi
      .spyOn(message, 'warning')
      .mockImplementation(() => undefined as never);
    vi.mocked(ApiProject.create)
      .mockRejectedValueOnce(buildRequestError(502, '调用 GitLab 接口失败'))
      .mockResolvedValueOnce({ id: 1 } as never);

    const result = await submitProjectWithGitlabFallback(undefined, values);

    expect(result).toEqual({ id: 1 });
    expect(ApiProject.create).toHaveBeenCalledTimes(2);
    expect(ApiProject.create).toHaveBeenNthCalledWith(1, values, {
      skipErrorHandler: true,
    });
    expect(ApiProject.create).toHaveBeenNthCalledWith(
      2,
      {
        ...values,
        gitlabRepositories: [],
      },
      undefined,
    );
    expect(warningSpy).toHaveBeenCalledWith(
      'GitLab 仓库绑定失败，已保存项目基础信息，' +
        '请稍后重新绑定。',
    );
  });

  it('GitLab 连接失败时编辑项目应去掉仓库绑定后重试', async () => {
    const values = buildProjectFormValues();
    const fallbackValues = {
      ...values,
    };
    delete fallbackValues.gitlabRepositories;
    vi.mocked(ApiProject.edit)
      .mockRejectedValueOnce(
        buildRequestError(400, '当前租户 GitLab 配置未启用'),
      )
      .mockResolvedValueOnce({ id: 9 } as never);

    await submitProjectWithGitlabFallback({ id: 9 } as never, values);

    expect(ApiProject.edit).toHaveBeenCalledTimes(2);
    expect(ApiProject.edit).toHaveBeenNthCalledWith(1, 9, values, {
      skipErrorHandler: true,
    });
    expect(ApiProject.edit).toHaveBeenNthCalledWith(
      2,
      9,
      fallbackValues,
      undefined,
    );
  });

  it('非 GitLab 连接类错误不应 fallback', async () => {
    const error = buildRequestError(400, '项目编号已存在');
    const errorSpy = vi
      .spyOn(message, 'error')
      .mockImplementation(() => undefined as never);
    vi.mocked(ApiProject.create).mockRejectedValueOnce(error);

    await expect(
      submitProjectWithGitlabFallback(undefined, buildProjectFormValues()),
    ).rejects.toBe(error);

    expect(ApiProject.create).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('项目编号已存在');
  });

  it('未选择 GitLab 仓库时不应启用 fallback 重试', async () => {
    const error = buildRequestError(502, '调用 GitLab 接口失败');
    const values = {
      ...buildProjectFormValues(),
      gitlabRepositories: [],
    };
    vi.mocked(ApiProject.create).mockRejectedValueOnce(error);

    await expect(submitProjectWithGitlabFallback(undefined, values)).rejects.toBe(
      error,
    );

    expect(ApiProject.create).toHaveBeenCalledTimes(1);
    expect(ApiProject.create).toHaveBeenCalledWith(values, undefined);
  });

  it('应只把 GitLab 外部连接和配置错误识别为 fallback 错误', () => {
    expect(
      isGitlabFallbackError(buildRequestError(502, '调用 GitLab 接口失败')),
    ).toBe(true);
    expect(
      isGitlabFallbackError(buildRequestError(400, 'GitLab 项目名称不能为空')),
    ).toBe(false);
    expect(isGitlabFallbackError(new Error('调用 GitLab 接口失败'))).toBe(false);
  });
});

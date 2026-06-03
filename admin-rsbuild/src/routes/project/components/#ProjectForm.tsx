import React, { useEffect, useMemo, useState } from 'react';
import { Col, Form, Input, notification, Row, Select } from 'antd';
import KModal from '@/components/KModal';
import { ApiGitlab } from '@/api';
import type { GitlabProject } from '@/api/modules/gitlab';
import {
  DatabaseTypeOptions,
  ProjectStatus,
  ProjectStatusOptions,
} from '@/api/modules/project.types';
import type {
  Project,
  ProjectGitlabRepositoryBinding,
} from '@/api/modules/project.types';
import { getPinyinInitials } from '@/utils/pinyin';
import { submitProjectWithGitlabFallback } from './#ProjectFormGitlabFallback';

/**
 * 项目表单属性。
 */
interface ProjectFormProps {
  record?: Project;
}

/**
 * GitLab 仓库选择项。
 */
export interface GitlabRepositoryOption {
  label: string;
  value: number;
  repository: ProjectGitlabRepositoryBinding;
}

/**
 * 构造表单初始值。
 *
 * 新建时主动补齐默认状态，保持项目创建入口的最小必填表单。
 *
 * @param record 编辑态项目记录
 * @returns 表单初始值
 */
function buildInitialValues(record?: Project) {
  if (record) {
    return {
      ...record,
      status: record.status,
      gitlabRepositories: record.gitlabRepositories || [],
    };
  }

  return {
    status: ProjectStatus.Planning,
    gitlabRepositories: [],
  };
}

/**
 * 将 GitLab 项目转换为本地绑定快照。
 *
 * @param project GitLab 项目
 * @returns 项目绑定快照
 */
export function toGitlabRepositoryBinding(
  project: GitlabProject,
): ProjectGitlabRepositoryBinding {
  return {
    gitlabProjectId: project.id,
    name: project.name,
    pathWithNamespace: project.pathWithNamespace,
    webUrl: project.webUrl,
  };
}

/**
 * 构造 GitLab 仓库选择项。
 *
 * @param repository GitLab 仓库绑定快照
 * @returns 下拉选择项
 */
export function buildGitlabRepositoryOption(
  repository: ProjectGitlabRepositoryBinding,
): GitlabRepositoryOption {
  return {
    label: `${repository.pathWithNamespace}（${repository.name}）`,
    value: repository.gitlabProjectId,
    repository,
  };
}

/**
 * 合并已选仓库与搜索结果。
 *
 * 已选仓库必须始终保留在 options 中，否则远程搜索结果刷新后，
 * Ant Design Select 无法稳定展示编辑态回显文本。
 *
 * @param selectedRepositories 已选择仓库
 * @param searchedOptions 当前远程搜索结果
 * @returns 去重后的选择项
 */
export function mergeGitlabRepositoryOptions(
  selectedRepositories: ProjectGitlabRepositoryBinding[],
  searchedOptions: GitlabRepositoryOption[],
) {
  const optionMap = new Map<number, GitlabRepositoryOption>();
  for (const repository of selectedRepositories) {
    optionMap.set(
      repository.gitlabProjectId,
      buildGitlabRepositoryOption(repository),
    );
  }
  for (const option of searchedOptions) {
    if (!optionMap.has(option.value)) {
      optionMap.set(option.value, option);
    }
  }
  return Array.from(optionMap.values());
}

/**
 * 根据选中的 GitLab 项目 ID 还原绑定快照。
 *
 * @param selectedIds 当前选择的 GitLab 项目 ID
 * @param options 当前可用选择项
 * @returns 待提交的绑定快照列表
 */
export function resolveSelectedGitlabRepositories(
  selectedIds: number[],
  options: GitlabRepositoryOption[],
) {
  const optionMap = new Map<number, GitlabRepositoryOption>();
  for (const option of options) {
    optionMap.set(option.value, option);
  }

  const repositories: ProjectGitlabRepositoryBinding[] = [];
  for (const selectedId of selectedIds) {
    const option = optionMap.get(selectedId);
    if (option) {
      repositories.push(option.repository);
    }
  }
  return repositories;
}

/**
 * GitLab 仓库远程搜索选择器。
 *
 * @param props 组件属性
 * @returns 仓库选择组件
 */
export function ProjectGitlabRepositorySelect(props: {
  value?: ProjectGitlabRepositoryBinding[];
  onChange?: (value: ProjectGitlabRepositoryBinding[]) => void;
}) {
  const selectedRepositories = props.value || [];
  const [searchedOptions, setSearchedOptions] = useState<
    GitlabRepositoryOption[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const mergedOptions = useMemo(
    () => mergeGitlabRepositoryOptions(selectedRepositories, searchedOptions),
    [searchedOptions, selectedRepositories],
  );
  const selectedIds = selectedRepositories.map((repository) => {
    return repository.gitlabProjectId;
  });

  const searchRepositories = async (keyword?: string) => {
    setLoading(true);
    try {
      const response = await ApiGitlab.getProjects(
        {
          current: 1,
          pageSize: 20,
          keyword,
        },
        {
          skipErrorHandler: true,
        },
      );
      const nextOptions = response.items.map((project) => {
        return buildGitlabRepositoryOption(toGitlabRepositoryBinding(project));
      });
      setSearchedOptions(nextOptions);
      setLoaded(true);
    } catch {
      setSearchedOptions([]);
      notification.warning({
        key: 'project-gitlab-search-error',
        message: '当前租户 GitLab 未配置或项目搜索失败。',
      });
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Select
        mode={'multiple'}
        showSearch
        value={selectedIds}
        options={mergedOptions}
        loading={loading}
        filterOption={false}
        placeholder={'搜索并选择 GitLab 仓库，可绑定多个'}
        onFocus={() => {
          if (!loaded) {
            searchRepositories();
          }
        }}
        onSearch={(keyword) => {
          searchRepositories(keyword);
        }}
        onChange={(nextSelectedIds) => {
          props.onChange?.(
            resolveSelectedGitlabRepositories(nextSelectedIds, mergedOptions),
          );
        }}
      />
    </>
  );
}

/**
 * 项目创建与编辑表单。
 *
 * @param props 组件属性
 * @returns 表单组件
 */
const ProjectForm = (props: ProjectFormProps) => {
  const [form] = Form.useForm();
  const [isAutoCode, setIsAutoCode] = useState(!props.record);
  const isEdit = Boolean(props.record);

  useEffect(() => {
    if (!isEdit && isAutoCode) {
      const name = form.getFieldValue('name');
      if (name) {
        form.setFieldValue('code', getPinyinInitials(name));
      }
    }
  }, [form, isAutoCode, isEdit]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={buildInitialValues(props.record)}
      onFinish={async (values) => {
        await submitProjectWithGitlabFallback(props.record, values);
      }}
    >
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name={'name'}
            label={'项目名称'}
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input
              placeholder={'请输入项目名称'}
              onChange={(event) => {
                if (!isEdit && isAutoCode) {
                  form.setFieldValue(
                    'code',
                    getPinyinInitials(event.target.value),
                  );
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name={'dbType'}
            label={'数据库类型'}
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select
              placeholder={'请选择数据库类型'}
              options={DatabaseTypeOptions}
              disabled={isEdit}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name={'code'}
            label={'项目编号'}
            rules={[{ required: true, message: '请输入项目编号' }]}
          >
            <Input
              placeholder={'自动生成，可手动修改'}
              disabled={isEdit}
              onChange={() => {
                if (!isEdit) {
                  setIsAutoCode(false);
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name={'status'}
            label={'项目状态'}
            rules={[{ required: true, message: '请选择项目状态' }]}
          >
            <Select
              placeholder={'请选择项目状态'}
              options={ProjectStatusOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={24}>
          <Form.Item name={'projectGroup'} label={'项目分组'}>
            <Input placeholder={'例如：支付业务组'} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name={'description'} label={'项目概况'}>
        <Input.TextArea
          placeholder={'请输入项目概况'}
          rows={4}
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item name={'progressSummary'} label={'当前进展'}>
        <Input.TextArea
          placeholder={'请输入当前进展'}
          rows={4}
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item name={'gitlabRepositories'} label={'GitLab 仓库'}>
        <ProjectGitlabRepositorySelect />
      </Form.Item>
    </KModal.Form>
  );
};

export default ProjectForm;

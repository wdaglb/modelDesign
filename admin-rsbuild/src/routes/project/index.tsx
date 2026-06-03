import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Pagination, Select, message } from 'antd';
import { Helmet } from 'react-helmet-async';

import { ApiProject } from '@/api';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import {
  Project,
  ProjectStatus,
  ProjectStatusOptions,
} from '@/api/modules/project.types';
import queryKey from '@/constants/queryKey';
import usePermission from '@/hooks/usePermission.ts';
import Icons from '@/icons';
import ProjectForm from './components/#ProjectForm';
import ProjectListGrid from './components/#ProjectListGrid';
import {
  buildFooterText,
  buildGroupOptions,
  buildProjectQuickStatusTabs,
  getSummaryButtonType,
  isQuickStatusTabActive,
} from './components/#projectListHelper';
import {
  FilterRow,
  FooterBar,
  FooterText,
  HeaderSection,
  HeaderTextBlock,
  NoticeBar,
  PageDescription,
  PageRoot,
  PageTitle,
  SelectionBar,
  SelectionText,
  SummaryRow,
  SummaryTabs,
  ToolbarCard,
} from './components/#ProjectListPage.styled';

export const Route = createFileRoute('/project/')({
  component: ProjectListPage,
});

/**
 * 项目管理列表页。
 *
 * 页面负责组织筛选、状态统计、项目卡片和分页，不承载项目详情逻辑。
 *
 * @returns 页面组件
 */
export function ProjectListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const modal = useKModal();
  const { hasButtonPermission } = usePermission();
  const canCreateProject = hasButtonPermission(
    PERMISSION_RESOURCE.projectCreate,
  );
  const canEditProject = hasButtonPermission(PERMISSION_RESOURCE.projectEdit);
  const canDeleteProject = hasButtonPermission(
    PERMISSION_RESOURCE.projectDelete,
  );

  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 });
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<ProjectStatus | undefined>();
  const [projectGroup, setProjectGroup] = useState<string | undefined>();
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: [
      ...queryKey.project.list(),
      pagination,
      keyword,
      status,
      projectGroup,
    ],
    queryFn: () =>
      ApiProject.getList({
        current: pagination.current,
        pageSize: pagination.pageSize,
        keyword,
        status,
        projectGroup,
      }),
  });

  useEffect(() => {
    setSelectedProjectIds([]);
  }, [keyword, pagination.current, pagination.pageSize, projectGroup, status]);

  const projectItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const groupOptions = buildGroupOptions(data?.groupOptions);
  const quickStatusTabs = buildProjectQuickStatusTabs(data?.statusSummary);
  const hasFilters =
    keyword !== '' || status !== undefined || projectGroup !== undefined;

  /**
   * 统一刷新列表数据，保证新增、编辑、删除后列表和状态统计一起更新。
   */
  function reloadProjectList() {
    queryClient.invalidateQueries({ queryKey: queryKey.project.list() });
  }

  /**
   * 把当前输入框的值应用为真实查询条件。
   *
   * @param nextKeyword 输入框内容
   */
  function applyKeyword(nextKeyword: string) {
    const normalizedKeyword = nextKeyword.trim();
    setKeyword(normalizedKeyword);
    setPagination({
      current: 1,
      pageSize: pagination.pageSize,
    });
  }

  /**
   * 打开新建项目弹窗。
   */
  async function handleCreateProject() {
    await modal.open({
      title: '新建项目',
      children: <ProjectForm />,
    });
    reloadProjectList();
  }

  /**
   * 打开编辑项目弹窗。
   *
   * @param project 项目记录
   */
  async function handleEditProject(project: Project) {
    const projectDetail = await ApiProject.getDetail(project.id);
    await modal.open({
      title: '编辑项目',
      children: <ProjectForm record={projectDetail} />,
    });
    reloadProjectList();
  }

  /**
   * 删除单个项目。
   *
   * @param projectId 项目 ID
   */
  async function handleDeleteProject(projectId: number) {
    await ApiProject.deleted([projectId]);
    setSelectedProjectIds((currentIds) => {
      return currentIds.filter((item) => item !== projectId);
    });
    reloadProjectList();
    message.success('删除成功');
  }

  /**
   * 切换快捷状态标签。
   *
   * @param nextStatus 快捷标签值
   */
  function handleQuickStatusChange(nextStatus: 'all' | ProjectStatus) {
    if (nextStatus === 'all') {
      setStatus(undefined);
    } else {
      setStatus(nextStatus);
    }

    setPagination({
      current: 1,
      pageSize: pagination.pageSize,
    });
  }

  /**
   * 切换项目选择态。
   *
   * @param projectId 项目 ID
   * @param checked 是否选中
   */
  function handleToggleSelect(projectId: number, checked: boolean) {
    if (checked) {
      if (selectedProjectIds.includes(projectId)) {
        return;
      }

      setSelectedProjectIds([...selectedProjectIds, projectId]);
      return;
    }

    setSelectedProjectIds(
      selectedProjectIds.filter((item) => item !== projectId),
    );
  }

  /**
   * 切换分页。
   *
   * @param current 当前页
   * @param pageSize 每页条数
   */
  function handlePaginationChange(current: number, pageSize: number) {
    if (pageSize !== pagination.pageSize) {
      setPagination({
        current: 1,
        pageSize,
      });
      return;
    }

    setPagination({
      current,
      pageSize,
    });
  }

  return (
    <>
      <Helmet>
        <title>{`项目管理 - ${process.env.TITLE}`}</title>
      </Helmet>

      <PageRoot>
        <HeaderSection>
          <HeaderTextBlock>
            <PageTitle>项目管理</PageTitle>
            <PageDescription>
              集中管理项目状态、成员协作与业务进展，保持卡片化管理视图。
            </PageDescription>
          </HeaderTextBlock>

          {canCreateProject ? (
            <Button
              type="primary"
              icon={<Icons.Plus />}
              onClick={handleCreateProject}
            >
              新建项目
            </Button>
          ) : null}
        </HeaderSection>

        <ToolbarCard>
          <FilterRow>
            <Input
              allowClear
              value={keywordInput}
              prefix={<Icons.Magnify />}
              placeholder="搜索项目 / 编码"
              onChange={(event) => {
                const nextValue = event.target.value;
                setKeywordInput(nextValue);

                if (nextValue.trim() === '') {
                  setKeyword('');
                  setPagination({
                    current: 1,
                    pageSize: pagination.pageSize,
                  });
                }
              }}
              onPressEnter={() => {
                applyKeyword(keywordInput);
              }}
            />

            <Select
              allowClear
              value={status}
              options={ProjectStatusOptions}
              placeholder="项目状态：全部"
              onChange={(value) => {
                setStatus(value);
                setPagination({
                  current: 1,
                  pageSize: pagination.pageSize,
                });
              }}
            />

            <Select
              allowClear
              value={projectGroup}
              options={groupOptions}
              placeholder="项目分组：全部"
              onChange={(value) => {
                setProjectGroup(value);
                setPagination({
                  current: 1,
                  pageSize: pagination.pageSize,
                });
              }}
            />
          </FilterRow>

          <NoticeBar>
            管理提示：新建项目默认进入“规划中”，支持通过项目名称或编号快速筛选当前项目。
          </NoticeBar>
        </ToolbarCard>

        <SummaryRow>
          <SummaryTabs>
            {quickStatusTabs.map((tab) => {
              const isActive = isQuickStatusTabActive(status, tab.key);
              return (
                <Button
                  key={tab.key}
                  type={getSummaryButtonType(isActive)}
                  shape="round"
                  onClick={() => {
                    handleQuickStatusChange(tab.key);
                  }}
                >
                  {`${tab.label} ${tab.count}`}
                </Button>
              );
            })}
          </SummaryTabs>

          {selectedProjectIds.length > 0 && (
            <SelectionBar>
              <SelectionText>
                {`已选择 ${selectedProjectIds.length} 个项目`}
              </SelectionText>
              <Button
                type="text"
                onClick={() => {
                  setSelectedProjectIds([]);
                }}
              >
                取消选择
              </Button>
            </SelectionBar>
          )}
        </SummaryRow>

        <ProjectListGrid
          canDelete={canDeleteProject}
          canEdit={canEditProject}
          loading={isLoading}
          items={projectItems}
          hasFilters={hasFilters}
          selectedProjectIds={selectedProjectIds}
          onToggleSelect={handleToggleSelect}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
          onEnter={(projectId) => {
            navigate({
              to: '/project/$projectId',
              params: { projectId: String(projectId) },
            });
          }}
        />

        {total > 0 && (
          <FooterBar>
            <FooterText>{buildFooterText(total, pagination)}</FooterText>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={total}
              showSizeChanger={false}
              onChange={handlePaginationChange}
            />
          </FooterBar>
        )}
      </PageRoot>
    </>
  );
}

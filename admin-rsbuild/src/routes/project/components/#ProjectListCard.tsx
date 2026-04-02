import { Button, Checkbox, Popconfirm, Space, Tag } from 'antd';
import type { Project } from '@/api/modules/project.types';
import {
  ProjectStatusColor,
  ProjectStatusLabel,
} from '@/api/modules/project.types';
import {
  formatProjectUpdatedAt,
  getCompletedModuleText,
  getProjectOverviewText,
  getProjectProgressText,
} from './#projectListHelper';
import {
  ProjectCardActions,
  ProjectCardContent,
  ProjectCardHeader,
  ProjectCardInfoBar,
  ProjectCardInfoText,
  ProjectCardMeta,
  ProjectCardSurface,
  ProjectCardText,
  ProjectCardTitle,
  ProjectCardTitleBlock,
} from './#ProjectListPage.styled';

/**
 * 项目卡片属性。
 */
interface ProjectListCardProps {
  project: Project;
  selected: boolean;
  onToggleSelect: (projectId: number, checked: boolean) => void;
  onEdit: (project: Project) => Promise<void>;
  onDelete: (projectId: number) => Promise<void>;
  onEnter: (projectId: number) => void;
}

/**
 * 项目列表卡片。
 *
 * 卡片负责单个项目的信息呈现，并把进入、编辑、删除、选择这些动作回调给页面容器。
 *
 * @param props 组件属性
 * @returns 项目卡片
 */
const ProjectListCard = (props: ProjectListCardProps) => {
  const completedModuleText = getCompletedModuleText(
    props.project.completedModuleCount,
  );

  return (
    <ProjectCardSurface
      onClick={() => {
        props.onEnter(props.project.id);
      }}
    >
      <ProjectCardHeader>
        <ProjectCardTitleBlock>
          <ProjectCardTitle>{props.project.name}</ProjectCardTitle>
          <ProjectCardMeta>
            {`项目编号：${props.project.code} · ${formatProjectUpdatedAt(props.project.updatedAt)}`}
          </ProjectCardMeta>
        </ProjectCardTitleBlock>

        <Space size={8} align="start">
          <Tag color={ProjectStatusColor[props.project.status]}>
            {ProjectStatusLabel[props.project.status]}
          </Tag>
          <Checkbox
            checked={props.selected}
            onClick={(event) => {
              event.stopPropagation();
              props.onToggleSelect(props.project.id, !props.selected);
            }}
          />
        </Space>
      </ProjectCardHeader>

      <ProjectCardContent>
        <ProjectCardText>
          {getProjectOverviewText(props.project.description)}
        </ProjectCardText>
        <ProjectCardText>
          {getProjectProgressText(props.project.progressSummary)}
        </ProjectCardText>
      </ProjectCardContent>

      <ProjectCardInfoBar>
        <ProjectCardInfoText>{completedModuleText || '已完成模块 0'}</ProjectCardInfoText>
        <ProjectCardMeta>{props.project.creator}</ProjectCardMeta>
      </ProjectCardInfoBar>

      <ProjectCardActions>
        <Button
          size="small"
          type="primary"
          onClick={(event) => {
            event.stopPropagation();
            props.onEnter(props.project.id);
          }}
        >
          进入项目
        </Button>

        <Button
          size="small"
          onClick={async (event) => {
            event.stopPropagation();
            await props.onEdit(props.project);
          }}
        >
          编辑
        </Button>

        <Popconfirm
          title="确认删除项目"
          description="删除后无法恢复，确认删除此项目吗？"
          okText="确认"
          cancelText="取消"
          onPopupClick={(event) => {
            event.stopPropagation();
          }}
          onConfirm={async () => {
            await props.onDelete(props.project.id);
          }}
        >
          <Button
            size="small"
            danger
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            删除
          </Button>
        </Popconfirm>
      </ProjectCardActions>
    </ProjectCardSurface>
  );
};

export default ProjectListCard;

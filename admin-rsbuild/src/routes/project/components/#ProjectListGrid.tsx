import { Empty, Skeleton } from 'antd';
import type { Project } from '@/api/modules/project.types';
import ProjectListCard from './#ProjectListCard';
import { getProjectEmptyDescription } from './#projectListHelper';
import { CardsGrid, EmptyCard } from './#ProjectListPage.styled';

/**
 * 项目列表网格属性。
 */
interface ProjectListGridProps {
  loading: boolean;
  items: Project[];
  hasFilters: boolean;
  selectedProjectIds: number[];
  onToggleSelect: (projectId: number, checked: boolean) => void;
  onEdit: (project: Project) => Promise<void>;
  onDelete: (projectId: number) => Promise<void>;
  onEnter: (projectId: number) => void;
}

/**
 * 项目列表网格。
 *
 * 把加载态、空态和卡片态统一收敛到单独组件，减少路由文件复杂度。
 *
 * @param props 组件属性
 * @returns 列表区域
 */
const ProjectListGrid = (props: ProjectListGridProps) => {
  if (props.loading) {
    return (
      <CardsGrid>
        {Array.from({ length: 3 }).map((_, index) => {
          return (
            <EmptyCard key={index}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </EmptyCard>
          );
        })}
      </CardsGrid>
    );
  }

  if (props.items.length === 0) {
    return (
      <EmptyCard>
        <Empty description={getProjectEmptyDescription(props.hasFilters)} />
      </EmptyCard>
    );
  }

  return (
    <CardsGrid>
      {props.items.map((project) => {
        return (
          <ProjectListCard
            key={project.id}
            project={project}
            selected={props.selectedProjectIds.includes(project.id)}
            onToggleSelect={props.onToggleSelect}
            onEdit={props.onEdit}
            onDelete={props.onDelete}
            onEnter={props.onEnter}
          />
        );
      })}
    </CardsGrid>
  );
};

export default ProjectListGrid;

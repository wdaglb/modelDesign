import { createFileRoute } from '@tanstack/react-router';
import {
  Button,
  Card,
  Descriptions,
  Space,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';

import type { TabsProps } from 'antd';

import {
  MarkdownSurface,
  PreviewSectionCard,
  SummaryChipRow,
  SummaryHeaderCard,
  SummaryMetaRow,
  SummaryTitleBlock,
  TabsShell,
  TaskDrawerBody,
  TaskDrawerFooter,
  TaskDrawerFooterActions,
  TaskDrawerPageRoot,
  TaskDrawerSections,
  TaskDrawerShell,
  TaskDrawerStage,
} from './task-detail-drawer-demo.styled';

/**
 * 提供一个独立演示路由，用于还原任务详情抽屉的前端结构。
 */
export const Route = createFileRoute('/task-detail-drawer/')({
  component: TaskDetailDrawerRoute,
});

/**
 * 任务详情抽屉页面。
 *
 * 这里刻意把抽屉作为页面主体直接渲染，原因是当前需求重点在于结构还原，
 * 不是接入真实接口或把抽屉接进某个列表页面。这样更容易和设计稿逐项对照。
 */
function TaskDetailDrawerRoute() {
  const tabItems = buildTabItems();

  return (
    <TaskDrawerPageRoot>
      <TaskDrawerStage>
        <TaskDrawerShell>
          <TaskDrawerBody>
            <TaskDrawerSections>
              <SummaryHeaderCard>
                <SummaryTitleBlock>
                  <SummaryMetaRow>
                    <Typography.Text type='secondary'>
                      TASK-2025-0318
                    </Typography.Text>
                    <Tag color='blue'>点击复制链接</Tag>
                  </SummaryMetaRow>

                  <Typography.Title level={4} style={{ margin: 0 }}>
                    优化任务详情抽屉结构与编辑体验
                  </Typography.Title>
                </SummaryTitleBlock>

                <SummaryChipRow>
                  <Tag color='processing'>进行中</Tag>
                  <Tag color='error'>高优</Tag>
                  <Tag>林一帆</Tag>
                  <Tag>03-18 ~ 03-22</Tag>
                </SummaryChipRow>
              </SummaryHeaderCard>

              <Card size='small' title='基础信息'>
                <Descriptions column={2} size='small'>
                  <Descriptions.Item label='负责人'>林一帆</Descriptions.Item>
                  <Descriptions.Item label='创建人'>王晨</Descriptions.Item>
                  <Descriptions.Item label='预计工时'>16h</Descriptions.Item>
                  <Descriptions.Item label='更新时间'>
                    2025-03-19 21:48
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <TabsShell>
                <Tabs defaultActiveKey='detail' items={tabItems} />
              </TabsShell>
            </TaskDrawerSections>
          </TaskDrawerBody>

          <TaskDrawerFooter>
            <Typography.Text type='secondary'>
              操作区固定在抽屉底部，滚动正文时始终可见。
            </Typography.Text>
            <TaskDrawerFooterActions>
              <Button>复制链接</Button>
              <Button type='primary'>编辑任务</Button>
            </TaskDrawerFooterActions>
          </TaskDrawerFooter>
        </TaskDrawerShell>
      </TaskDrawerStage>
    </TaskDrawerPageRoot>
  );
}

/**
 * 构建 Tabs 内容。
 *
 * 这里采用静态数据，是为了先把设计结构、信息层级和 Ant Design 容器关系固定下来，
 * 后续接入接口时只需要把 mock 数据替换成查询结果即可。
 */
function buildTabItems(): TabsProps['items'] {
  return [
    {
      key: 'detail',
      label: '详情',
      children: <TaskDetailTab />,
    },
    {
      key: 'subtask',
      label: '子任务 2',
      children: <TaskSubtaskTab />,
    },
    {
      key: 'change-log',
      label: '变更日志 2',
      children: <TaskChangeLogTab />,
    },
  ];
}

/**
 * 详情页签采用 Markdown 文档式阅读布局，贴近设计稿里的正文浏览体验。
 */
function TaskDetailTab() {
  return (
    <PreviewSectionCard>
      <Typography.Title level={5} style={{ margin: 0 }}>
        任务详情说明
      </Typography.Title>
      <MarkdownSurface>
        <Typography.Text type='secondary'>
          支持标题、列表、引用和代码块。
        </Typography.Text>

        <Typography.Title level={4} style={{ margin: 0 }}>
          1. 业务目标
        </Typography.Title>

        <Typography.Paragraph>
          本次改版的目标，是把任务详情抽屉从传统的信息堆叠模式，调整为更符合
          Ant Design 后台风格的宽抽屉布局，并沉淀可复用的摘要头、Tab、子任务区和
          变更日志区。
        </Typography.Paragraph>

        <Typography.Title level={5} style={{ margin: 0 }}>
          2. 设计原则
        </Typography.Title>

        <ul>
          <li>标题、状态和摘要信息优先出现在首屏</li>
          <li>详情、子任务、变更日志通过 Tab 进行分组</li>
          <li>底部操作区固定，避免长内容导致操作不可见</li>
        </ul>

        <blockquote>
          任务详情是高频阅读场景，所以正文宽度、留白和块级层次，比装饰性更重要。
        </blockquote>

        <Typography.Title level={5} style={{ margin: 0 }}>
          3. 示例代码
        </Typography.Title>

        <pre>
          <code>
            {`const tabs = ['详情', '子任务', '变更日志'];
const drawerMode = 'preview';
renderTaskDrawer({ tabs, drawerMode });`}
          </code>
        </pre>
      </MarkdownSurface>
    </PreviewSectionCard>
  );
}

/**
 * 子任务页签使用表格式卡片，和任务管理场景的阅读习惯一致。
 */
function TaskSubtaskTab() {
  return (
    <PreviewSectionCard>
      <Typography.Title level={5} style={{ margin: 0 }}>
        子任务
      </Typography.Title>
      <Descriptions column={1} size='small'>
        <Descriptions.Item label='子任务 1'>
          <Space split={<span>|</span>}>
            <span>整理 Markdown 渲染规范与示例</span>
            <Typography.Text type='secondary'>进行中</Typography.Text>
            <Typography.Text type='secondary'>林一帆</Typography.Text>
            <Typography.Text type='secondary'>03-22</Typography.Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label='子任务 2'>
          <Space split={<span>|</span>}>
            <span>补齐子任务与变更日志 Tab 内容态</span>
            <Typography.Text type='secondary'>待开始</Typography.Text>
            <Typography.Text type='secondary'>王晨</Typography.Text>
            <Typography.Text type='secondary'>03-24</Typography.Text>
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </PreviewSectionCard>
  );
}

/**
 * 变更日志页签使用时间线表达，原因是它天然更适合承载时间顺序信息。
 */
function TaskChangeLogTab() {
  return (
    <PreviewSectionCard>
      <Typography.Title level={5} style={{ margin: 0 }}>
        变更日志
      </Typography.Title>
      <Timeline
        items={[
          {
            children:
              '2025-03-19 21:48 · 林一帆：调整任务详情为单一 Markdown 文本展示。',
          },
          {
            children:
              '2025-03-19 20:30 · 系统：新增详情 / 子任务 / 变更日志 Tab 结构。',
          },
        ]}
      />
    </PreviewSectionCard>
  );
}

export default TaskDetailDrawerRoute;

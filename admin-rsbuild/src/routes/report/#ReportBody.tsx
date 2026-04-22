import React from 'react';
import {
  Alert,
  Card,
  Descriptions,
  Empty,
  Flex,
  Spin,
  Tag,
  Typography,
} from 'antd';

import type {
  ProjectTaskReportDynamicItem,
  ProjectTaskReportResponse,
  ProjectTaskReportType,
} from '@/api/modules/project-task-report';

import DailyReportTextCard from './#DailyReportTextCard';

const priorityColorMap: Record<string, string> = {
  high: 'red',
  medium: 'gold',
  low: 'blue',
};

const statusColorMap: Record<string, string> = {
  todo: 'orange',
  inProgress: 'blue',
  pendingTest: 'cyan',
  pendingRelease: 'geekblue',
  done: 'green',
  canceled: 'default',
};

/**
 * 报表主体组件。
 */
interface ReportBodyProps {
  /**
   * 是否正在生成中。
   */
  isPending: boolean;

  /**
   * 报表结果。
   */
  report?: ProjectTaskReportResponse;
}

/**
 * 报表主体区域。
 *
 * 主路由页只负责表单与提交，
 * 详细展示拆到这里，避免页面入口文件继续膨胀。
 *
 * @param props 组件参数
 * @returns 报表主体
 */
function ReportBody(props: ReportBodyProps) {
  if (props.isPending) {
    return (
      <Flex align={'center'} justify={'center'} style={{ minHeight: 260 }}>
        <Spin tip={'报表生成中...'} />
      </Flex>
    );
  }

  if (!props.report) {
    return <Empty description={'请选择条件并生成报表'} />;
  }

  return (
    <Flex vertical gap={20} style={{ width: '100%' }}>
      {renderDailyTextCard(props.report)}

      <Descriptions bordered size={'small'} column={2}>
        <Descriptions.Item label={'报表标题'}>
          {props.report.reportTitle}
        </Descriptions.Item>
        <Descriptions.Item label={'报表类型'}>
          {getReportTypeLabel(props.report.reportType)}
        </Descriptions.Item>
        <Descriptions.Item label={'区间开始'}>
          {props.report.periodStart || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={'区间结束'}>
          {props.report.periodEnd || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={'任务数量'}>
          {props.report.tasks.length}
        </Descriptions.Item>
        <Descriptions.Item label={'动态数量'}>
          {props.report.dynamics.length}
        </Descriptions.Item>
      </Descriptions>

      <Card
        size={'small'}
        title={`参与任务（${props.report.tasks.length}）`}
        styles={{ body: { paddingTop: 12 } }}
      >
        {renderTaskList(props.report)}
      </Card>

      <Card
        size={'small'}
        title={`任务动态（${props.report.dynamics.length}）`}
        styles={{ body: { paddingTop: 12 } }}
      >
        {renderDynamicList(props.report)}
      </Card>
    </Flex>
  );
}

/**
 * 渲染日报文本卡片。
 *
 * @param report 报表结果
 * @returns 日报文本卡片
 */
function renderDailyTextCard(report: ProjectTaskReportResponse) {
  if (report.reportType !== 'daily') {
    return null;
  }
  return <DailyReportTextCard report={report} />;
}

/**
 * 获取报表类型文案。
 *
 * @param reportType 报表类型
 * @returns 中文文案
 */
function getReportTypeLabel(reportType: ProjectTaskReportType) {
  if (reportType === 'weekly') {
    return '周报';
  }
  if (reportType === 'monthly') {
    return '月报';
  }
  if (reportType === 'yearly') {
    return '年报';
  }
  return '日报';
}

/**
 * 渲染任务列表区域。
 *
 * @param report 报表结果
 * @returns 任务列表内容
 */
function renderTaskList(report: ProjectTaskReportResponse) {
  if (report.tasks.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'暂无任务'} />;
  }

  return (
    <Flex vertical gap={12}>
      {report.tasks.map((item) => {
        return (
          <Card key={item.id} size={'small'} styles={{ body: { padding: 16 } }}>
            <Flex vertical gap={8} style={{ width: '100%' }}>
              <Flex justify={'space-between'} gap={12} wrap>
                <Flex gap={8} wrap>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  {renderOptionalProjectTag(item.projectName)}
                  <Tag color={statusColorMap[item.status] || 'default'}>
                    {item.status}
                  </Tag>
                  <Tag color={priorityColorMap[item.priority] || 'default'}>
                    {item.priority}
                  </Tag>
                </Flex>
                <Typography.Text type={'secondary'}>
                  {item.updatedAt || '-'}
                </Typography.Text>
              </Flex>

              <Typography.Text type={'secondary'}>
                参与身份：{item.participationRole}
              </Typography.Text>

              {renderLatestDynamicSummary(item.latestDynamicSummary)}
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}

/**
 * 渲染动态列表区域。
 *
 * @param report 报表结果
 * @returns 动态列表内容
 */
function renderDynamicList(report: ProjectTaskReportResponse) {
  if (report.dynamics.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'暂无动态'} />;
  }

  return (
    <Flex vertical gap={12}>
      {report.dynamics.map((item) => {
        return (
          <DynamicListItem
            key={`${item.taskId}-${item.createdAt || item.taskTitle}`}
            item={item}
          />
        );
      })}
    </Flex>
  );
}

/**
 * 动态列表项。
 *
 * @param props 组件参数
 * @returns 动态卡片
 */
function DynamicListItem(props: { item: ProjectTaskReportDynamicItem }) {
  const operatorName = getOperatorNameText(props.item.operatorName);

  return (
    <Card size={'small'} styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={8} style={{ width: '100%' }}>
        <Flex justify={'space-between'} gap={12} wrap>
          <Flex gap={8} wrap>
            <Typography.Text strong>{props.item.taskTitle}</Typography.Text>
            {renderOptionalProjectTag(props.item.projectName)}
          </Flex>
          <Typography.Text type={'secondary'}>
            {props.item.createdAt || '-'}
          </Typography.Text>
        </Flex>

        <Typography.Text type={'secondary'}>{operatorName}</Typography.Text>

        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {props.item.content}
        </Typography.Paragraph>
      </Flex>
    </Card>
  );
}

/**
 * 渲染可选项目标签。
 *
 * @param projectName 项目名称
 * @returns 标签节点
 */
function renderOptionalProjectTag(projectName?: string) {
  if (!projectName) {
    return null;
  }
  return <Tag>{projectName}</Tag>;
}

/**
 * 渲染最新动态摘要。
 *
 * @param latestDynamicSummary 最新动态摘要
 * @returns 动态摘要告警
 */
function renderLatestDynamicSummary(latestDynamicSummary?: string) {
  if (!latestDynamicSummary) {
    return null;
  }
  return (
    <Alert
      type={'warning'}
      showIcon={false}
      title={`最新动态：${latestDynamicSummary}`}
    />
  );
}

/**
 * 获取发布人文案。
 *
 * @param operatorName 发布人名称
 * @returns 文案
 */
function getOperatorNameText(operatorName?: string) {
  if (!operatorName) {
    return '发布人：-';
  }
  return `发布人：${operatorName}`;
}

export default ReportBody;

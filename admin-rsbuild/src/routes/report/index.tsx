import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Flex,
  Form,
  Segmented,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';

import { ApiProjectTaskReport } from '@/api';
import type {
  ProjectTaskReportResponse,
  ProjectTaskReportType,
} from '@/api/modules/project-task-report';

import ReportBody from './#ReportBody';

const reportTypeOptions: Array<{
  label: string;
  value: ProjectTaskReportType;
}> = [
  { label: '日报', value: 'daily' },
  { label: '周报', value: 'weekly' },
  { label: '月报', value: 'monthly' },
  { label: '年报', value: 'yearly' },
];

/**
 * 报表生成页面路由。
 */
export const Route = createFileRoute('/report/')({
  component: RouteComponent,
  context: () => {
    return {
      title: '报表生成',
    };
  },
});

export default RouteComponent;

/**
 * 页面表单值。
 */
interface ReportFormValues {
  /**
   * 报表类型。
   */
  reportType: ProjectTaskReportType;

  /**
   * 参考日期。
   */
  referenceDate: dayjs.Dayjs;
}

function RouteComponent() {
  const [form] = Form.useForm<ReportFormValues>();
  const [report, setReport] = useState<ProjectTaskReportResponse>();

  const generateMutation = useMutation({
    mutationFn: (values: ReportFormValues) => {
      return ApiProjectTaskReport.generate({
        reportType: values.reportType,
        referenceDate: values.referenceDate.format('YYYY-MM-DD'),
      });
    },
    onSuccess: (nextReport) => {
      setReport(nextReport);
      message.success('报表生成成功');
    },
  });

  const initialValues = useMemo(() => {
    return {
      reportType: 'daily' as ProjectTaskReportType,
      referenceDate: dayjs(),
    };
  }, []);

  return (
    <Flex vertical gap={16} style={{ width: '100%' }}>
      <Card>
        <Flex vertical gap={20} style={{ width: '100%' }}>
          <Alert
            type={'info'}
            showIcon
            title={
              '报表按参与度生成，统计口径包含负责人和任务成员；周报、月报、年报会为未完成且有动态更新的任务补充动态明细。'
            }
          />

          <Form<ReportFormValues>
            form={form}
            layout={'vertical'}
            initialValues={initialValues}
            onFinish={async (values) => {
              try {
                await generateMutation.mutateAsync(values);
              } catch (error) {
                if (error instanceof Error && error.message) {
                  message.error(error.message);
                  return;
                }
                message.error('报表生成失败，请稍后重试');
              }
            }}
          >
            <Flex gap={16} wrap align={'end'}>
              <Form.Item<ReportFormValues>
                name={'reportType'}
                label={'报表类型'}
                style={{ marginBottom: 0 }}
              >
                <Segmented options={reportTypeOptions} />
              </Form.Item>

              <Form.Item<ReportFormValues>
                name={'referenceDate'}
                label={'参考日期'}
                style={{ marginBottom: 0 }}
                rules={[
                  {
                    required: true,
                    message: '请选择参考日期',
                  },
                ]}
              >
                <DatePicker allowClear={false} />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type={'primary'}
                  htmlType={'submit'}
                  loading={generateMutation.isPending}
                >
                  生成报表
                </Button>
              </Form.Item>
            </Flex>
          </Form>
        </Flex>
      </Card>

      <Card>
        <ReportBody
          isPending={generateMutation.isPending}
          report={report}
        />
      </Card>
    </Flex>
  );
}

import React, { useMemo } from 'react';
import { Button, Card, Empty, Flex, Typography, message } from 'antd';

import type { ProjectTaskReportResponse } from '@/api/modules/project-task-report';

import { buildDailyReportText } from './#dailyReportText';

/**
 * 日报文本卡片。
 */
interface DailyReportTextCardProps {
  /**
   * 日报结果。
   */
  report: ProjectTaskReportResponse;

  /**
   * 复制函数。
   *
   * 默认使用浏览器剪贴板；
   * 测试场景可显式注入，避免依赖运行环境是否完整实现 clipboard API。
   */
  copyText?: (text: string) => Promise<void>;
}

/**
 * 渲染可复制的日报文本区域。
 *
 * 这里单独拆出卡片组件，避免主页面继续膨胀；
 * 同时把复制逻辑收敛在一个位置，后续若要支持“导出 markdown”
 * 可以直接复用这里生成的文本。
 *
 * @param props 组件参数
 * @returns 日报文本卡片
 */
function DailyReportTextCard(props: DailyReportTextCardProps) {
  const dailyReportText = useMemo(() => {
    return buildDailyReportText(props.report);
  }, [props.report]);

  const copyText = props.copyText || defaultCopyText;

  const handleCopy = async () => {
    if (!dailyReportText) {
      message.warning('当前日报没有可复制内容');
      return;
    }

    try {
      await copyText(dailyReportText);
      message.success('日报文本已复制');
    } catch {
      message.error('复制失败，请检查浏览器剪贴板权限');
    }
  };

  return (
    <Card
      size={'small'}
      title={'日报文本'}
      extra={
        <Button type={'primary'} onClick={handleCopy}>
          一键复制
        </Button>
      }
      styles={{ body: { paddingTop: 12 } }}
    >
      {renderDailyReportText(dailyReportText)}
    </Card>
  );
}

/**
 * 渲染日报文本内容。
 *
 * @param dailyReportText 日报文本
 * @returns 文本展示内容
 */
function renderDailyReportText(dailyReportText: string) {
  if (!dailyReportText) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'暂无日报文本'} />;
  }

  return (
    <Flex vertical gap={12}>
      <Typography.Paragraph
        style={{
          marginBottom: 0,
          whiteSpace: 'pre-wrap',
          fontFamily:
            '"SFMono-Regular", "Menlo", "Monaco", "Consolas", monospace',
        }}
      >
        {dailyReportText}
      </Typography.Paragraph>
    </Flex>
  );
}

/**
 * 默认复制实现。
 *
 * @param text 待复制文本
 * @returns 复制结果
 */
async function defaultCopyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default DailyReportTextCard;

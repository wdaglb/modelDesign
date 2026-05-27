import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Space, Tag, Typography, message } from 'antd';

import { ApiMcpConfig, ApiPassport } from '@/api';
import queryKey from '@/constants/queryKey';
import { copyTextToClipboard } from '@/utils';

/**
 * MCP 配置页签。
 */
const McpConfigTab = () => {
  const mcpConfigQuery = useQuery({
    queryKey: queryKey.mcpConfig.current(),
    queryFn: ApiMcpConfig.getCurrentConfig,
  });
  const mcpTokenQuery = useQuery({
    queryKey: queryKey.passport.mcpToken(),
    queryFn: ApiPassport.getMcpToken,
  });

  if (mcpConfigQuery.isLoading) {
    return <Typography.Text type={'secondary'}>MCP 配置加载中...</Typography.Text>;
  }

  if (mcpConfigQuery.isError) {
    return (
      <Alert
        type={'error'}
        showIcon
        message={'MCP 配置加载失败，请稍后重试。'}
        action={<Button onClick={() => mcpConfigQuery.refetch()}>重试</Button>}
      />
    );
  }

  const config = mcpConfigQuery.data;
  const endpoint = getDisplayText(config.endpoint);
  const mcpToken = mcpTokenQuery.data;
  const authorizationHeader = mcpToken?.authorizationHeader || '';
  const configSnippet = buildMcpConfigSnippet(config, authorizationHeader);
  const promptExamples = buildPromptExamples();

  return (
    <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
      <Alert
        type={config.enabled ? 'success' : 'warning'}
        showIcon
        message={
          config.enabled
            ? '当前系统已提供 MCP 接入配置，可供桌面客户端或代理工具使用。'
            : '当前系统未启用 MCP 展示配置，如需接入请联系管理员补充配置。'
        }
      />

      <Card title={'MCP 基础配置'}>
        <Descriptions column={1} size={'small'}>
          <Descriptions.Item label={'启用状态'}>
            <Tag color={config.enabled ? 'success' : 'default'} variant="filled">
              {config.enabled ? '已启用' : '未启用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={'服务名'}>
            {getDisplayText(config.serverName)}
          </Descriptions.Item>
          <Descriptions.Item label={'传输协议'}>
            {getDisplayText(config.transportType)}
          </Descriptions.Item>
          <Descriptions.Item label={'服务地址'}>
            {endpoint}
          </Descriptions.Item>
          <Descriptions.Item label={'配置说明'}>
            {getDisplayText(config.description)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={'接入参考'}>
        <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
          <Alert
            type={'info'}
            showIcon
            message={
              config.enabled && endpoint !== '-'
                ? '请优先使用 HTTP/fetch 方式连接 MCP，不要再配置 command/args 启动本地进程；配置片段已内置个人 token。'
                : '当前缺少可用的 MCP 服务地址，暂时只能查看基础配置。'
            }
          />

          <Space wrap>
            <Button
              disabled={!config.enabled || endpoint === '-'}
              onClick={async () => {
                await handleCopy(endpoint, 'MCP 服务地址已复制', 'MCP 服务地址复制失败，请稍后重试');
              }}
            >
              复制服务地址
            </Button>
            <Button
              disabled={!config.enabled || endpoint === '-'}
              onClick={async () => {
                await handleCopy(
                  configSnippet,
                  'MCP 配置片段已复制',
                  'MCP 配置片段复制失败，请稍后重试',
                );
              }}
            >
              复制配置片段
            </Button>
            <Button
              disabled={!mcpToken}
              onClick={async () => {
                await handleCopy(
                  mcpToken?.token || '',
                  'MCP token 已复制',
                  'MCP token 复制失败，请稍后重试',
                );
              }}
            >
              复制 MCP token
            </Button>
            <Button
              disabled={!mcpToken}
              onClick={async () => {
                await handleCopy(
                  authorizationHeader,
                  'Authorization 头已复制',
                  'Authorization 头复制失败，请稍后重试',
                );
              }}
            >
              复制 Authorization 头
            </Button>
          </Space>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#fafafa',
              border: '1px solid rgba(5, 5, 5, 0.06)',
            }}
          >
            <Typography.Text
              type={'secondary'}
              style={{ display: 'block', marginBottom: 8 }}
            >
              示例 HTTP 配置片段
            </Typography.Text>
            <Typography.Text
              type={'secondary'}
              style={{ display: 'block', marginBottom: 8 }}
            >
              下面片段已包含当前登录用户的 Authorization 头，可直接复制使用。
            </Typography.Text>
            <Typography.Paragraph
              style={{
                marginBottom: 0,
                fontFamily:
                  'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              {configSnippet}
            </Typography.Paragraph>
          </div>

          <Card size={'small'} title={'认证信息'}>
            {renderTokenContent(mcpTokenQuery.data)}
          </Card>
        </Space>
      </Card>

      <Card title={'测试指令示例'}>
        <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
          <Alert
            type={'info'}
            showIcon
            message={'把下面示例直接发给 AI，可验证是否真的调用到了 MCP 任务工具。'}
          />

          {promptExamples.map((item) => {
            return (
              <div
                key={item.title}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: '#fafafa',
                  border: '1px solid rgba(5, 5, 5, 0.06)',
                }}
              >
                <Space
                  align={'start'}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Space orientation={'vertical'} size={4}>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Typography.Text type={'secondary'}>
                      {item.description}
                    </Typography.Text>
                  </Space>
                  <Button
                    onClick={async () => {
                      await handleCopy(
                        item.prompt,
                        `${item.title}已复制`,
                        `${item.title}复制失败，请稍后重试`,
                      );
                    }}
                  >
                    复制示例
                  </Button>
                </Space>

                <Typography.Paragraph
                  style={{
                    marginBottom: 0,
                    fontFamily:
                      'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.prompt}
                </Typography.Paragraph>
              </div>
            );
          })}
        </Space>
      </Card>
    </Space>
  );
};

const handleCopy = async (
  text: string,
  successMessage: string,
  errorMessage: string,
) => {
  try {
    await copyTextToClipboard(text);
    message.success(successMessage);
  } catch {
    message.error(errorMessage);
  }
};

const getDisplayText = (value?: string) => {
  if (value === undefined) {
    return '-';
  }
  if (value === null) {
    return '-';
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '-';
  }
  return trimmedValue;
};

const buildMcpConfigSnippet = (
  config: Awaited<ReturnType<typeof ApiMcpConfig.getCurrentConfig>>,
  authorizationHeader: string,
) => {
  const endpoint = getDisplayText(config.endpoint);

  return JSON.stringify(
    {
      name: config.serverName,
      type: config.transportType,
      url: endpoint === '-' ? '' : endpoint,
      headers: authorizationHeader
        ? {
            Authorization: authorizationHeader,
          }
        : {},
    },
    null,
    2,
  );
};

const renderTokenContent = (token?: Awaited<ReturnType<typeof ApiPassport.getMcpToken>>) => {
  if (!token) {
    return <Typography.Text type={'secondary'}>MCP token 加载中...</Typography.Text>;
  }

  return (
    <Descriptions column={1} size={'small'}>
      <Descriptions.Item label={'Authorization 头'}>
        <Typography.Paragraph
          style={{
            marginBottom: 0,
            fontFamily:
              'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {token.authorizationHeader}
        </Typography.Paragraph>
      </Descriptions.Item>
      <Descriptions.Item label={'过期时间'}>
        {new Date(token.expireTime).toLocaleString('zh-CN', {
          hour12: false,
        })}
      </Descriptions.Item>
    </Descriptions>
  );
};

const buildPromptExamples = () => {
  return [
    {
      title: '查询任务类型',
      description: '先让 AI 通过 MCP 工具拿到 typeId，再用于创建任务。',
      prompt:
        '请优先使用 MCP 工具查询当前可用的任务类型列表，返回名称和 typeId，' +
        '并告诉我如果要创建“缺陷”任务应该使用哪个 typeId。',
    },
    {
      title: '按任务号开工',
      description: '验证 AI 是否能按任务号查详情并调用开始任务工具。',
      prompt:
        '请优先使用 MCP 工具按任务编号 TASK-101 查询详情，' +
        '然后根据任务ID执行开始任务，给我返回推荐分支名和当前任务状态。',
    },
    {
      title: '完成任务闭环',
      description: '验证 AI 是否能推进状态并写入“待发布测试”动态。',
      prompt:
        '请优先使用 MCP 工具完成任务 101，开发总结填写“接口、自测与文档已完成”，' +
        '并告诉我任务现在的状态以及写入了什么动态。',
    },
  ];
};

export default McpConfigTab;

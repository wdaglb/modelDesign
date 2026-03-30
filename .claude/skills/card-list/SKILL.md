---
name: 'card-list'
description: '提供卡片列表页面的实现规范和参考。当用户提到使用卡片布局、改用卡片展示、创建卡片列表等场景时调用此 skill。'
---

# 卡片列表页面实现指南

## 概述

当页面需要使用卡片布局（而非 KTable 表格）时，按照本规范实现。

## 数据获取

```typescript
const [pagination, setPagination] = useState({ current: 1, pageSize: 12 });

const { data, isLoading } = useQuery({
  queryKey: [...queryKey.project.list(), pagination],
  queryFn: () => ApiProject.getList(pagination),
});
```

## 列表刷新方案

使用 `queryClient.invalidateQueries` 刷新列表：

| 操作 | 刷新方式 |
|------|----------|
| 删除 | `queryClient.invalidateQueries({ queryKey: queryKey.xxx.list() })` |
| 添加/编辑 | `await modal.open(...)` 后直接 `invalidateQueries` |

```typescript
// 添加/编辑后刷新
const result = await modal.open({
  title: '添加项目',
  children: <ProjectForm />,
});
queryClient.invalidateQueries({ queryKey: queryKey.project.list() });
```

## 布局结构

```
Card
├── 标题区 + 操作按钮
├── Row gutter={[16, 16]}
│   └── Col xs={24} sm={12} md={8} lg={6}
│       └── Card hoverable extra={Tag}
│           └── Space direction="vertical"
│               ├── Typography.Title (名称)
│               ├── Typography.Text (编号/描述)
│               └── Space (操作按钮 + 元信息)
└── div style={{ textAlign: 'right', marginTop: 16 }}
    └── Pagination
```

## 响应式配置

| 断点 | 每行卡片数 |
|------|-----------|
| lg (≥1200px) | 4 |
| md (≥992px) | 3 |
| sm (≥576px) | 2 |
| xs (<576px) | 1 |

## 骨架屏

使用 `Skeleton` 组件实现加载过渡：

```typescript
import { Skeleton } from 'antd';

// 骨架屏渲染
{isLoading
  ? Array.from({ length: 8 }).map((_, i) => (
      <Col xs={24} sm={12} md={8} lg={6} key={i}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      </Col>
    ))
  : data?.items.map((project) => (
      // 真实卡片
    ))}
```

## 卡片右上角标签

使用 Card 的 `extra` 属性放置标签：

```typescript
const colorMap: Record<string, string> = {
  mysql: 'blue',
  postgresql: 'green',
  mongodb: 'orange',
  sqlite: 'purple',
};

<Card
  hoverable
  extra={
    <Tag color={colorMap[project.type]}>
      {typeLabel}
    </Tag>
  }
>
```

## 完整示例

参考 `src/routes/project/index.tsx`。

## 注意事项

- queryKey 包含 `pagination` 对象，分页变化时自动重新请求
- 无需使用 KTableContext，invalidateQueries 即可刷新
- 分页组件使用 `showSizeChanger` 和 `showQuickJumper`
- 使用 `await modal.open()` 等待表单提交，返回后刷新列表
- 使用 `isLoading` 配合 Skeleton 实现骨架屏过渡效果
- 使用 Card 的 `extra` 属性放置状态/类型标签

---
name: 'ant-design'
description: '提供 Ant Design 组件的使用参考和文档查询。当用户提到使用 Ant Design 组件、编写 UI、创建表单、弹窗、表格等企业级后台组件时调用此 skill。'
---

# Ant Design 组件使用指南

## 概述

本 skill 提供 Ant Design 组件库的文档查询和最佳实践参考，帮助开发者在使用 Ant Design 组件时快速找到正确的用法。

## 文档地址

- **组件总览**: <https://ant.design/components/overview>
- **官方 LLM 文档**: <https://ant.design/llms.txt>
- **完整文档 (EN)**: <https://ant.design/docs/react/introduce>
- **完整文档 (CN)**: <https://ant.design/docs/react/introduce-cn>

## 常用组件速查

### 表单组件

| 组件        | 文档链接                                                         | 说明                         |
| ----------- | ---------------------------------------------------------------- | ---------------------------- |
| Form        | [form-cn](https://ant.design/components/form-cn)                 | 表单核心组件，支持布局、校验 |
| Input       | [input-cn](https://ant.design/components/input-cn)               | 文本输入框                   |
| InputNumber | [input-number-cn](https://ant.design/components/input-number-cn) | 数字输入框                   |
| Select      | [select-cn](https://ant.design/components/select-cn)             | 下拉选择框                   |
| DatePicker  | [date-picker-cn](https://ant.design/components/date-picker-cn)   | 日期选择器                   |
| Cascader    | [cascader-cn](https://ant.design/components/cascader-cn)         | 级联选择器                   |
| Checkbox    | [checkbox-cn](https://ant.design/components/checkbox-cn)         | 多选框                       |
| Radio       | [radio-cn](https://ant.design/components/radio-cn)               | 单选框                       |
| Switch      | [switch-cn](https://ant.design/components/switch-cn)             | 开关                         |

### 反馈组件

| 组件         | 文档链接                                                         | 说明       |
| ------------ | ---------------------------------------------------------------- | ---------- |
| Modal        | [modal-cn](https://ant.design/components/modal-cn)               | 对话框     |
| message      | [message-cn](https://ant.design/components/message-cn)           | 轻提示     |
| Notification | [notification-cn](https://ant.design/components/notification-cn) | 通知提醒   |
| Alert        | [alert-cn](https://ant.design/components/alert-cn)               | 警告提示   |
| Popconfirm   | [popconfirm-cn](https://ant.design/components/popconfirm-cn)     | 气泡确认框 |
| Spin         | [spin-cn](https://ant.design/components/spin-cn)                 | 加载中     |

### 数据展示

| 组件         | 文档链接                                                         | 说明                           |
| ------------ | ---------------------------------------------------------------- | ------------------------------ |
| Table        | [table-cn](https://ant.design/components/table-cn)               | 表格（项目中使用 KTable 封装） |
| Card         | [card-cn](https://ant.design/components/card-cn)                 | 卡片                           |
| Descriptions | [descriptions-cn](https://ant.design/components/descriptions-cn) | 描述列表                       |
| List         | [list-cn](https://ant.design/components/list-cn)                 | 列表                           |
| Avatar       | [avatar-cn](https://ant.design/components/avatar-cn)             | 头像                           |
| Badge        | [badge-cn](https://ant.design/components/badge-cn)               | 徽章                           |
| Tag          | [tag-cn](https://ant.design/components/tag-cn)                   | 标签                           |
| Progress     | [progress-cn](https://ant.design/components/progress-cn)         | 进度条                         |
| Skeleton     | [skeleton-cn](https://ant.design/components/skeleton-cn)         | 骨架屏                         |

### 导航组件

| 组件       | 文档链接                                                     | 说明     |
| ---------- | ------------------------------------------------------------ | -------- |
| Menu       | [menu-cn](https://ant.design/components/menu-cn)             | 导航菜单 |
| Tabs       | [tabs-cn](https://ant.design/components/tabs-cn)             | 标签页   |
| Breadcrumb | [breadcrumb-cn](https://ant.design/components/breadcrumb-cn) | 面包屑   |
| Dropdown   | [dropdown-cn](https://ant.design/components/dropdown-cn)     | 下拉菜单 |
| Pagination | [pagination-cn](https://ant.design/components/pagination-cn) | 分页     |

### 布局组件

| 组件    | 文档链接                                               | 说明      |
| ------- | ------------------------------------------------------ | --------- |
| Layout  | [layout-cn](https://ant.design/components/layout-cn)   | 布局      |
| Flex    | [flex-cn](https://ant.design/components/flex-cn)       | Flex 布局 |
| Grid    | [grid-cn](https://ant.design/components/grid-cn)       | 栅格布局  |
| Space   | [space-cn](https://ant.design/components/space-cn)     | 间距      |
| Divider | [divider-cn](https://ant.design/components/divider-cn) | 分割线    |

### 业务组件

| 组件           | 文档链接                                                               | 说明                           |
| -------------- | ---------------------------------------------------------------------- | ------------------------------ |
| Drawer         | [drawer-cn](https://ant.design/components/drawer-cn)                   | 抽屉（项目中使用 KModal 封装） |
| Steps          | [steps-cn](https://ant.design/components/steps-cn)                     | 步骤条                         |
| Tree           | [tree-cn](https://ant.design/components/tree-cn)                       | 树形控件                       |
| Transfer       | [transfer-cn](https://ant.design/components/transfer-cn)               | 穿梭框                         |
| Upload         | [upload-cn](https://ant.design/components/upload-cn)                   | 上传                           |
| ConfigProvider | [config-provider-cn](https://ant.design/components/config-provider-cn) | 全局配置                       |

## 项目中的封装

本项目对部分 Ant Design 组件进行了封装：

### KTable（表格封装）

项目在 `src/components/KTable/` 中封装了 Table 组件，提供更便捷的表格功能。

### KModal（抽屉/弹窗封装）

项目在 `src/components/KModal/` 中封装了 Drawer 和 Modal 组件，统一管理弹窗逻辑。

## 组件使用示例

### 基本用法

```tsx
import { Button, Form, Input, Select, message } from 'antd';

// 使用 Form
const Demo = () => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    message.success('提交成功');
    console.log(values);
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item name="username" rules={[{ required: true }]}>
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item name="status">
        <Select
          options={[
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        提交
      </Button>
    </Form>
  );
};
```

### 常见 Patterns

#### 受控模式 vs 非受控模式

```tsx
// 非受控（使用默认值）
<Input defaultValue="初始值" />;

// 受控（使用值和回调）
const [value, setValue] = useState('');
<Input value={value} onChange={(e) => setValue(e.target.value)} />;
```

#### 使用 hooks 管理状态

```tsx
import { useState } from 'react';
import { Modal, Button } from 'antd';

const Demo = () => {
  const [open, setOpen] = useState(false);

  const showModal = () => setOpen(true);
  const handleOk = () => setOpen(false);
  const handleCancel = () => setOpen(false);

  return (
    <>
      <Button onClick={showModal}>打开弹窗</Button>
      <Modal open={open} onOk={handleOk} onCancel={handleCancel}>
        内容
      </Modal>
    </>
  );
};
```

## 主题定制

### 使用 ConfigProvider

```tsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
    },
  }}
>
  <App />
</ConfigProvider>;
```

### 组件 Token

参考 [component-token-cn](https://ant.design/components/config-provider-cn) 定制特定组件样式。

## 最佳实践

1. **类型安全**：使用 TypeScript 时，充分利用 `antd` 提供的类型定义
2. **表单验证**：优先使用 Form 组件内置的验证能力
3. **国际化**：使用 ConfigProvider 配置国际化
4. **按需加载**：使用 `antd` 的 ES 模块按需引入
5. **自定义样式**：通过 `className` 或 CSS-in-JS 方式自定义样式

## 注意事项

- 项目使用 Ant Design 6.3.2
- 使用中文文档（`-cn` 后缀）获取中文说明
- 组件的 `open` 属性在 v5 中替代了 `visible`
- 回调函数优先使用 `on` 前缀（如 `onChange`、`onClick`）
- 搜索组件文档时使用 kebab-case（如 `date-picker`）

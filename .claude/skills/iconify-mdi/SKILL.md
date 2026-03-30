---
name: 'iconify-mdi'
description: '强制使用 iconify 的 mdi 图标集，通过 unplugin-icons 按需加载。当用户提到使用图标、添加图标或需要图标组件时立即调用此 skill。'
---

# Iconify MDI 图标使用指南

## 概述

本 skill 确保在项目中使用图标时，始终应用 iconify 的 Material Design Icons (MDI) 图标集，通过 unplugin-icons 实现按需加载。

## 使用规则

### 1. 图标导入方式

使用 unplugin-icons 的 `~icons/mdi/` 路径导入图标：

```tsx
// 在 src/icons.ts 中导入图标
import Plus from '~icons/mdi/plus';
import Delete from '~icons/mdi/delete';
import Home from '~icons/mdi/home';
```

### 2. 图标导出管理

**重要**：所有使用的图标必须在 `/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/icons.ts` 中导出：

```tsx
// src/icons.ts
import Plus from '~icons/mdi/plus';
import Delete from '~icons/mdi/delete';
import DragHorizontal from '~icons/mdi/drag-horizontal';

const Icons = {
  Plus,
  Delete,
  DragHorizontal,
};

export default Icons;
```

### 3. 在组件中使用图标

```tsx
// 导入 Icons 对象
import Icons from '@/icons';

// 使用图标
<Icons.Plus />
<Icons.Delete />
<Icons.DragHorizontal />
```

### 4. 图标命名规范

- **导入名称**：使用 PascalCase（首字母大写），例如 `Plus`、`Delete`、`Home`
- **图标名称**：使用 kebab-case（短横线分隔），例如 `plus`、`delete`、`drag-horizontal`
- **导出对象**：在 Icons 对象中使用相同的 PascalCase 名称

### 5. 图标尺寸和样式

```tsx
<Icons.Plus width={24} height={24} className="custom-icon" />
```

### 6. 常用 MDI 图标列表

#### 导航类

- `home` - 首页
- `menu` - 菜单
- `arrow-left` - 左箭头
- `arrow-right` - 右箭头
- `chevron-down` - 向下箭头
- `chevron-up` - 向上箭头

#### 操作类

- `plus` - 加号
- `minus` - 减号
- `close` - 关闭
- `check` - 确认
- `delete` - 删除
- `edit` - 编辑
- `content-copy` - 复制
- `content-paste` - 粘贴

#### 用户类

- `account` - 账户
- `account-circle` - 圆形账户
- `login` - 登录
- `logout` - 登出
- `account-plus` - 添加账户

#### 文件类

- `file` - 文件
- `folder` - 文件夹
- `download` - 下载
- `upload` - 上传
- `file-document` - 文档

#### 状态类

- `loading` - 加载中
- `error` - 错误
- `warning` - 警告
- `information` - 信息
- `check-circle` - 成功

#### 表格类

- `drag-horizontal` - 水平拖拽
- `drag-vertical` - 垂直拖拽
- `sort-ascending` - 升序
- `sort-descending` - 降序
- `filter` - 筛选

## 实际应用示例

### 在组件中使用

```tsx
import Icons from '@/icons';

export const Button = ({ children, icon }) => {
  const IconComponent = Icons[icon];

  return (
    <button>
      {IconComponent && <IconComponent />}
      {children}
    </button>
  );
};

// 使用
<Button icon="Plus">添加</Button>
<Button icon="Delete">删除</Button>
```

### 在表格中使用

```tsx
import Icons from '@/icons';

export const ActionButtons = () => {
  return (
    <div>
      <Icons.Edit onClick={handleEdit} />
      <Icons.Delete onClick={handleDelete} />
    </div>
  );
};
```

### 添加新图标的步骤

1. 在 `src/icons.ts` 中导入新图标：

```tsx
import NewIcon from '~icons/mdi/new-icon-name';
```

2. 将图标添加到 Icons 对象：

```tsx
const Icons = {
  // ... 其他图标
  NewIcon,
};
```

3. 在组件中使用：

```tsx
import Icons from '@/icons';
<Icons.NewIcon />;
```

## 查找图标

访问 [Iconify MDI 图标库](https://icon-sets.iconify.design/mdi/) 查找所有可用的 mdi 图标。

## 注意事项

1. **统一管理**：所有图标必须在 `src/icons.ts` 中导入和导出
2. **命名规范**：导入时使用 PascalCase，图标名称使用 kebab-case
3. **按需加载**：unplugin-icons 会自动按需加载，只打包实际使用的图标
4. **保持一致性**：在整个项目中统一使用 mdi 图标集
5. **图标尺寸**：根据设计规范设置合适的图标尺寸

## 配置检查

确保项目中已配置 unplugin-icons：

```typescript
// rsbuild.config.ts 或 vite.config.ts
import Icons from 'unplugin-icons/vite';

export default {
  plugins: [
    Icons({
      compiler: 'jsx',
      autoInstall: true,
    }),
  ],
};
```

## 依赖检查

确保项目中已安装必要的依赖：

```bash
npm install -D unplugin-icons @iconify-json/mdi
```

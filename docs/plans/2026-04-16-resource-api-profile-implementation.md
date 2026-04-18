# 前端资源画像与接口权限自动补齐实施方案

## 摘要
- 用“构建期资源画像”替代“进入页面后运行时采集”的方案。
- 通过静态扫描前端路由、按钮权限点和 API 模块，生成“资源 -> 接口列表”的映射。
- 角色管理配置菜单/按钮权限时，直接读取这份映射，自动补齐接口权限，不依赖用户先访问页面。
- 对无法可靠静态推导的少量动态场景，保留轻量显式声明作为补丁口，避免纯自动方案漏采。

## 关键实现

### 1. 新增构建期资源画像产物
- 在前端增加一个扫描脚本，遍历 `admin-rsbuild/src/api/modules` 与 `admin-rsbuild/src/routes`。
- 脚本输出一份生成文件，例如：
  - `admin-rsbuild/src/constants/resourceApiProfile.generated.ts`
- 生成文件至少包含两类映射：
  - 菜单资源：`resourcePath -> apiResources[]`
  - 按钮资源：`permissionCode -> apiResources[]`

### 2. API 模块静态抽取
- 扫描 `src/api/modules/**/*.ts` 中的 `request('/xxx')` 调用。
- 建立“API 导出函数 -> 接口路径”的索引，例如：
  - `ApiRole.getPageList -> /role/list`
  - `ApiRole.updatePermission -> /role/permission/update`
- 支持常见写法：
  - `request('/xxx')`
  - `request('/xxx', { method: 'post' })`

### 3. 路由与按钮资源静态抽取
- 扫描 `src/routes/**` 下的路由入口与其引用的本地组件。
- 识别以下常见调用形态，并归集到对应资源：
  - `queryFn: ApiXxx.method`
  - `mutationFn: ApiXxx.method`
  - `request={ApiXxx.method}`
  - `() => ApiXxx.method(...)`
  - 直接 `request('/xxx')`
- 页面级接口归集到路由资源。
- 按钮级接口按 `permissionCode` 归集，同时把按钮点击后打开的弹窗、抽屉、表单中的实际接口一并纳入。

### 4. 增加动态场景补丁口
- 对无法稳定静态推导的场景，增加少量显式声明能力，例如：
  - 页面级：`definePageApiDeps([...])`
  - 按钮级：`apiDeps={[ApiRole.add, ApiUser.getPageList]}`
  - 字符串兜底：`extraApiResources={['/xxx']}`
- 最终资源画像由“静态扫描结果 + 显式补丁结果”合并去重得到。
- 补丁口只作为兜底能力，不作为主要维护方式。

### 5. 改造角色权限自动补齐逻辑
- 角色权限抽屉不再主要依赖 `permissionGroupShortcut.ts` 中的手工接口映射。
- 自动补齐逻辑改为读取资源画像：
  - 选中菜单资源时，自动补齐该菜单画像中的接口
  - 选中按钮资源时，自动补齐该按钮画像中的接口
- `menuApiUsageCountMap` 也从资源画像计算，确保 UI 上显示的“自动补齐接口数量”与真实代码保持一致。

### 6. 保留兼容兜底
- 在资源画像稳定前，保留 `permissionGroupShortcut.ts` 作为兜底数据源。
- 优先使用资源画像；资源画像缺失时再回退到现有手工映射。
- 待扫描能力稳定后，再逐步收缩或移除手工常量。

### 7. 排除全局公共请求
- 以下请求默认不归入某个菜单或按钮权限：
  - 登录态恢复
  - refresh token
  - Layout 常驻请求
  - 全局消息未读数
  - 其他应用级公共初始化请求
- 这些请求属于全局基础能力，不应因为某个页面引用而自动绑定到页面资源权限。

## 验证
- 单元测试：
  - 能正确从 `src/api/modules` 提取 API 函数与接口路径映射
  - 能正确识别页面与按钮常见调用模式
  - 能正确合并静态结果与显式补丁结果
- 集成验证：
  - 角色页自动补齐 `/role/list`
  - “权限配置”按钮自动补齐：
    - `/role/permission`
    - `/role/permission/update`
    - `/permission-group/list`
    - `/menu/list`
    - `/permission-resource/catalog`
  - 未访问目标页面时，角色权限页仍能正确显示自动补齐结果
- 回归要求：
  - 现有角色权限保存接口与提交结构不变
  - 资源画像缺失时，兼容兜底逻辑仍可工作

## 默认约定
- 菜单资源以路由 path / 菜单 resource name 作为主键。
- 按钮资源以 `permissionCode` 作为主键。
- 只扫描 `admin-rsbuild/src` 内业务代码，不处理测试文件、样式文件和生成文件。
- 对无法可靠静态推导的复杂动态链路，允许通过显式声明补齐，不强求零标注。

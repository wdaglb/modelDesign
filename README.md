# modelDesign 项目目录树

本仓库是一个前后端一体的多租户项目，当前主要包含
`admin-rsbuild/` 前端工程和 `modelDesign/` 后端 Maven 多模块工程。

以下目录树基于当前工作区整理，已省略 `.git/`、`node_modules/`、
`target/`、`dist/`、`coverage/`、临时输出和编辑器缓存等非核心目录。

```text
.
├── AGENTS.md                         # AI 编码助手协作规范
├── CLAUDE.md                         # Claude 相关协作说明
├── README.md                         # 当前项目目录树说明
├── docker-compose.yml                # 本地容器编排配置
├── folder-alias.json                 # 目录别名配置
├── private-folder-alias.json         # 私有目录别名配置
├── admin-rsbuild/                    # 前端工程：React 18 + TypeScript + Rsbuild
│   ├── Dockerfile                    # 前端容器镜像构建文件
│   ├── README.md                     # 前端工程说明
│   ├── build/                        # 前端构建辅助脚本
│   ├── eslint.config.mjs             # ESLint flat config
│   ├── index.html                    # 前端入口 HTML
│   ├── nginx.conf                    # 前端容器 Nginx 配置
│   ├── package.json                  # 前端依赖与脚本
│   ├── public/                       # 前端静态资源
│   ├── rsbuild.config.ts             # Rsbuild 构建配置
│   ├── scripts/                      # 前端工程脚本
│   ├── src/                          # 前端源码
│   │   ├── __tests__/                # 前端全局测试
│   │   ├── api/                      # 接口请求与类型定义
│   │   │   └── modules/              # 按业务域拆分的接口模块
│   │   ├── assets/                   # 图片、SVG 等静态资源
│   │   ├── components/               # 通用 UI 组件与业务组件
│   │   │   └── business/             # 跨页面业务组件
│   │   ├── constants/                # 常量与权限配置
│   │   ├── hooks/                    # 通用 hooks 与业务 hooks
│   │   ├── layout/                   # 页面整体布局
│   │   ├── routes/                   # TanStack Router 路由入口
│   │   │   ├── agile-board/          # 敏捷看板页面
│   │   │   ├── asset/                # 资产相关页面
│   │   │   ├── login/                # 登录页面
│   │   │   ├── my-todo/              # 我的待办页面
│   │   │   ├── personal-center/      # 个人中心页面
│   │   │   ├── project/              # 项目管理页面
│   │   │   ├── report/               # 报表页面
│   │   │   └── system/               # 系统管理页面
│   │   ├── service/                  # 跨页面业务服务
│   │   ├── store/                    # Zustand 全局状态
│   │   ├── test/                     # 测试初始化配置
│   │   └── utils/                    # 请求、权限、树处理等工具函数
│   ├── tsconfig.json                 # TypeScript 配置
│   └── vitest.config.ts              # Vitest 配置
├── data/                             # 本地数据目录
├── docs/                             # 项目文档与方案
│   ├── docker部署说明.md             # Docker 部署说明
│   ├── plans/                        # 已落地的实施方案
│   └── superpowers/                  # 需求设计与实施方案存档
│       ├── plans/                    # 历史实施计划
│       └── specs/                    # 历史需求设计文档
├── modelDesign/                      # 后端工程：Spring Boot + Maven 多模块
│   ├── Dockerfile                    # 后端容器镜像构建文件
│   ├── HELP.md                       # Spring Boot 初始化帮助文档
│   ├── boot/                         # 后端启动模块与应用入口
│   │   ├── pom.xml                   # boot 模块 Maven 配置
│   │   └── src/                      # 启动模块源码、配置、迁移与测试
│   ├── common/                       # 后端公共基础模块
│   │   ├── pom.xml                   # common 模块 Maven 配置
│   │   └── src/                      # 公共工具、基础类型与测试
│   ├── mod-ai/                       # AI 业务模块
│   │   └── mod-ai-biz/               # AI 业务实现
│   ├── mod-asset/                    # 资产模块
│   │   ├── mod-asset-api/            # 资产模块 API 定义
│   │   └── mod-asset-biz/            # 资产模块业务实现
│   ├── mod-auth/                     # 认证与授权模块
│   │   ├── mod-auth-api/             # 认证模块 API 定义
│   │   └── mod-auth-biz/             # 认证模块业务实现
│   ├── mod-dependencies/             # 后端统一依赖管理模块
│   ├── mod-project/                  # 项目业务模块
│   │   ├── mod-project-api/          # 项目模块 API 定义
│   │   └── mod-project-biz/          # 项目模块业务实现
│   ├── mod-system/                   # 系统管理模块
│   │   ├── mod-system-api/           # 系统模块 API 定义
│   │   └── mod-system-biz/           # 系统模块业务实现
│   ├── mod-third-party/              # 第三方集成模块
│   │   ├── mod-third-party-api/      # 第三方模块 API 定义
│   │   ├── mod-third-party-biz/      # 第三方模块业务实现
│   │   └── mod-third-party-provider-gitlab-v4/
│   │       └── GitLab API v4 provider jar 模块
│   ├── mvnw                          # Maven Wrapper
│   ├── mvnw.cmd                      # Windows Maven Wrapper
│   └── pom.xml                       # 后端父级 Maven 配置
├── output/                           # 本地运行或验证输出
│   └── playwright/                   # Playwright 输出目录
└── ui/                               # UI 设计稿与前端 demo 文件
    ├── dashboard.pen                 # Dashboard Pencil 设计稿
    ├── login.pen                     # 登录页 Pencil 设计稿
    ├── task-detail-drawer-demo.route.tsx
    ├── task-detail-drawer-demo.styled.tsx
    ├── task-detail-drawer-demo.test.tsx
    └── untitled.pen
```

## 主要工作目录

- `admin-rsbuild/`：前端业务开发入口，路由、组件、接口、状态和测试都在
  `src/` 下按职责拆分。
- `modelDesign/`：后端业务开发入口，采用 Maven 多模块结构，`boot/`
  负责启动与聚合，业务能力按 `mod-*` 模块拆分。
- `docs/`：需求方案、实施计划和部署说明沉淀目录。
- `ui/`：Pencil 设计稿和局部 UI demo 存放目录。

## 常用验证入口

- 前端单测在 `admin-rsbuild/` 目录按文件运行：

```bash
npm run test:run -- src/__tests__/initialState.test.ts
```

- 后端单测以 `modelDesign/boot` 作为入口模块运行：

```bash
./mvnw -pl boot -am -Dtest=AuthServiceTest \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

## GitLab Provider Jar

GitLab API 实现通过 provider jar 接入，后端主服务只保留 SPI、
租户配置、provider 加载与调用编排逻辑。默认 provider 为：

- providerCode：`gitlab-v4`
- providerVersion：`1.0.0`

默认预置目录：

```text
providers/
└── gitlab/
    └── gitlab-v4/
        └── 1.0.0/
            └── mod-third-party-provider-gitlab-v4-0.0.1-SNAPSHOT.jar
```

可通过后端配置调整目录：

```yaml
model-design:
  gitlab:
    provider-dir: ./providers/gitlab
```

运行时按租户配置的 `providerCode` 和 `providerVersion` 定位 provider jar。
provider 首次调用时加载；jar 文件内容变化后，后续新请求会自动加载新
provider，已经开始执行的旧请求继续使用旧 provider 完成。

## 开源协议

本项目采用 MIT License 开源协议。使用、复制、修改、合并、发布、
分发、再授权和销售本项目代码时，请保留原始版权声明与许可声明。

完整协议文本见根目录 `LICENSE` 文件。

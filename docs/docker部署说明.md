# Docker 部署说明

## 1. 适用范围

当前 Docker 部署方案覆盖以下两个服务：

- `admin-rsbuild/` 前端静态站点
- `modelDesign/` Spring Boot 后端服务

数据库与 Redis 继续复用外部已有实例，不在 `docker compose` 中内置。

## 2. 文件说明

- 根目录 `docker-compose.yml`：编排前后端容器
- 根目录 `.env.docker.example`：容器运行所需环境变量模板
- `admin-rsbuild/Dockerfile`：前端多阶段构建镜像
- `admin-rsbuild/nginx.conf`：前端站点与 `/api` 反向代理配置
- `modelDesign/Dockerfile`：后端多阶段构建镜像

## 3. 启动前准备

1. 安装并启动 Docker Desktop，确保 `docker compose` 可用。
2. 复制环境变量模板：
   - Windows PowerShell：`Copy-Item .env.docker.example .env.docker`
3. 按实际环境修改 `.env.docker`：
   - PostgreSQL 地址、账号、密码
   - Redis 地址、端口
   - OpenAI 相关配置
   - JWT 密钥

## 4. 启动步骤

1. 构建并启动容器：

   ```powershell
   docker compose --env-file .env.docker up --build -d
   ```

2. 查看运行状态：

   ```powershell
   docker compose --env-file .env.docker ps
   ```

3. 查看后端日志：

   ```powershell
   docker compose --env-file .env.docker logs -f backend
   ```

## 5. 访问地址

- 前端首页：`http://localhost:8080`
- 后端接口：`http://localhost:9999`
- OpenAPI 文档：`http://localhost:9999/v3/api-docs`

如果修改了 `.env.docker` 中的端口，请按实际端口访问。

## 6. 关键说明

### 6.1 前端接口转发

前端运行时继续使用 `/api` 作为请求前缀，由 Nginx 统一转发到后端容器 `backend:9999`。

### 6.2 外部数据库与 Redis

默认示例使用 `host.docker.internal` 访问宿主机上的 PostgreSQL 与 Redis。

如果数据库或 Redis 部署在其他服务器，请将 `.env.docker` 中的地址改成实际可访问的内网地址。

### 6.3 文件存储目录

后端容器内的 `/app/storage` 已映射到宿主机根目录 `docker-data/storage`，用于保留上传文件与缩略图等数据。

## 7. 停止与清理

停止服务：

```powershell
docker compose --env-file .env.docker down
```

如果只想重建镜像但保留存储目录，无需删除 `docker-data/storage`。

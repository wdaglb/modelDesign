/**
 * 将项目管理子菜单切换为独立路由。
 *
 * 前一个迁移只负责补齐 `/project/list` 子菜单并兼容旧列表页入口。
 * 现在前端已经新增 `/project/list` 路由，因此通过独立迁移把菜单 path
 * 切换到新路由，避免继续让子菜单直接指向父级 `/project`。
 */

UPDATE public.menu
SET
    path = '/project/list',
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project/list'
  AND "nodeType" = 0;

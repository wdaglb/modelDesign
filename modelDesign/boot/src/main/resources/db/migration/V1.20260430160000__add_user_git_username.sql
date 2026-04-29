/**
 * 为用户表补充 Git 用户名字段，供个人中心保存开发工具相关资料。
 *
 * 说明：
 * - 只新增字段，不修改既有列定义；
 * - 默认空字符串，兼容历史数据与现有非空读取逻辑。
 */
ALTER TABLE public."user"
    ADD COLUMN IF NOT EXISTS "gitUsername" character varying(64)
        DEFAULT ''::character varying;

-- 创建数据库表结构
-- 执行顺序：001_create_tables.sql

-- 1. 管理员表 - 存储系统管理员账户信息
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY, -- 管理员ID，自增主键
    username VARCHAR(50) UNIQUE NOT NULL, -- 管理员用户名，唯一标识
    password VARCHAR(255) NOT NULL, -- 管理员密码，使用bcrypt加密存储
    type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (type IN ('super', 'normal')), -- 管理员类型：super-超级管理员，normal-普通管理员
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 账户状态：active-启用，inactive-禁用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 账户创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 账户最后更新时间
);

-- 2. 会员表 - 存储系统会员账户信息
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY, -- 会员ID，自增主键
    username VARCHAR(50) UNIQUE NOT NULL, -- 会员用户名，唯一标识
    password VARCHAR(255) NOT NULL, -- 会员密码，使用bcrypt加密存储
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 账户状态：active-启用，inactive-禁用
    last_login_at TIMESTAMP, -- 最后登录时间，用于统计会员活跃度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 账户创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 账户最后更新时间
);

-- 3. 会员登录日志表 - 记录会员登录操作历史，用于安全审计
CREATE TABLE IF NOT EXISTS member_login_logs (
    id SERIAL PRIMARY KEY, -- 日志ID，自增主键
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE, -- 关联的会员ID，外键引用members表
    operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 操作时间，记录登录的具体时间
    operation_url VARCHAR(255), -- 操作URL，记录登录时访问的页面地址
    ip_address VARCHAR(45), -- IP地址，记录登录者的IP地址，支持IPv6
    user_agent TEXT -- 用户代理，记录浏览器和设备信息
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username); -- 管理员用户名索引，加速登录查询
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status); -- 管理员状态索引，加速状态筛选查询
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username); -- 会员用户名索引，加速登录查询
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status); -- 会员状态索引，加速状态筛选查询
CREATE INDEX IF NOT EXISTS idx_member_login_logs_member_id ON member_login_logs(member_id); -- 会员登录日志会员ID索引，加速关联查询
CREATE INDEX IF NOT EXISTS idx_member_login_logs_operation_time ON member_login_logs(operation_time); -- 会员登录日志时间索引，加速时间范围查询

-- 创建更新时间触发器函数 - 自动更新记录的更新时间
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql'; -- 自动更新updated_at字段的触发器函数

-- 为表添加更新时间触发器 - 确保数据更新时自动维护更新时间
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- 管理员表更新时间触发器
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- 会员表更新时间触发器

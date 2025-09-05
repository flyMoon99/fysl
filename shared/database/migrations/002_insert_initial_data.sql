-- 插入初始数据
-- 执行顺序：002_insert_initial_data.sql

-- 插入超级管理员账户
-- 密码: admin123 (使用bcrypt加密后的值)
INSERT INTO admins (username, password, type, status) VALUES 
('admin', '$2b$12$4BisExmXrha58utreMuMo.yXvGENoD9TqGVhJGbLINIC1RzHBwxcq', 'super', 'active')
ON CONFLICT (username) DO NOTHING;

-- 插入测试会员账户
-- 密码: test123 (使用bcrypt加密后的值)
INSERT INTO members (username, password, status) VALUES 
('testuser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', 'active')
ON CONFLICT (username) DO NOTHING;

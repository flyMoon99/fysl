-- 更新管理员和会员密码
-- 执行此脚本前请确保已经生成了正确的密码哈希

-- 更新超级管理员密码 (admin123)
UPDATE admins 
SET password = '$2b$12$naOCguBLBvcWzSCLJTgVuutzuKm5aSpedvp2LvARZVhy0KVqvuAI6' 
WHERE username = 'admin';

-- 更新测试会员密码 (test123)
UPDATE members 
SET password = '$2b$12$JkPxh9dn3kGA0wyDSahc4u7E/bFMkxKMW8yhEQ9D3oeJKLWiS7ouK' 
WHERE username = 'testuser';

-- 验证更新结果
SELECT 'Admin updated:' as info, username, type, status FROM admins WHERE username = 'admin';
SELECT 'Member updated:' as info, username, status FROM members WHERE username = 'testuser';

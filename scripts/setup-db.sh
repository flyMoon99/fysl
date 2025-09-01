#!/bin/bash

# 福佑丝路数据库初始化脚本

echo "开始初始化福佑丝路数据库..."

# 读取环境变量
source .env 2>/dev/null || {
    echo "错误: 未找到.env文件，请先复制env.example为.env并配置数据库信息"
    exit 1
}

# 检查PostgreSQL是否安装
if ! command -v psql &> /dev/null; then
    echo "错误: PostgreSQL未安装，请先安装PostgreSQL"
    exit 1
fi

# 检查数据库连接
echo "检查数据库连接..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "错误: 无法连接到PostgreSQL数据库"
    echo "请检查以下配置:"
    echo "  DB_HOST: $DB_HOST"
    echo "  DB_PORT: $DB_PORT"
    echo "  DB_USER: $DB_USER"
    echo "  DB_PASSWORD: $DB_PASSWORD"
    exit 1
fi

# 创建数据库
echo "创建数据库 $DB_NAME..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo "数据库 $DB_NAME 已存在或创建失败"
}

# 执行数据库迁移
echo "执行数据库迁移..."

# 执行表结构创建
echo "创建数据库表..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f shared/database/migrations/001_create_tables.sql

if [ $? -eq 0 ]; then
    echo "数据库表创建成功"
else
    echo "错误: 数据库表创建失败"
    exit 1
fi

# 插入初始数据
echo "插入初始数据..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f shared/database/migrations/002_insert_initial_data.sql

if [ $? -eq 0 ]; then
    echo "初始数据插入成功"
else
    echo "错误: 初始数据插入失败"
    exit 1
fi

echo "数据库初始化完成！"
echo ""
echo "默认账户信息:"
echo "  超级管理员: admin / admin123"
echo "  测试会员: testuser / test123"
echo ""
echo "请及时修改默认密码！"

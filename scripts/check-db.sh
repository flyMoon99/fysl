#!/bin/bash

# 福佑丝路数据库连接检查脚本

echo "检查福佑丝路数据库配置..."

# 读取环境变量
source .env 2>/dev/null || {
    echo "警告: 未找到.env文件，使用默认配置"
    echo "默认配置:"
    echo "  DB_HOST: localhost"
    echo "  DB_PORT: 5432"
    echo "  DB_NAME: fuyou_silu"
    echo "  DB_USER: postgres"
    echo "  DB_PASSWORD: postgres"
    echo ""
}

# 设置默认值
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-fuyou_silu}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo "当前数据库配置:"
echo "  DB_HOST: $DB_HOST"
echo "  DB_PORT: $DB_PORT"
echo "  DB_NAME: $DB_NAME"
echo "  DB_USER: $DB_USER"
echo ""

# 检查PostgreSQL是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ 错误: PostgreSQL未安装"
    echo "请先安装PostgreSQL:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "  CentOS: sudo yum install postgresql postgresql-server"
    exit 1
fi

echo "✅ PostgreSQL已安装"

# 检查PostgreSQL服务是否运行
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ 错误: PostgreSQL服务未运行"
    echo "请启动PostgreSQL服务:"
    echo "  macOS: brew services start postgresql"
    echo "  Ubuntu: sudo systemctl start postgresql"
    echo "  CentOS: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL服务正在运行"

# 检查数据库连接
echo "测试数据库连接..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ 错误: 无法连接到PostgreSQL数据库"
    echo "请检查以下配置:"
    echo "  DB_HOST: $DB_HOST"
    echo "  DB_PORT: $DB_PORT"
    echo "  DB_USER: $DB_USER"
    echo "  DB_PASSWORD: $DB_PASSWORD"
    echo ""
    echo "常见解决方案:"
    echo "1. 检查PostgreSQL是否正在运行"
    echo "2. 检查用户名和密码是否正确"
    echo "3. 检查数据库主机和端口是否正确"
    echo "4. 检查防火墙设置"
    exit 1
fi

echo "✅ 数据库连接成功"

# 检查数据库是否存在
echo "检查数据库 $DB_NAME 是否存在..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  警告: 数据库 $DB_NAME 不存在"
    echo "请运行以下命令创建数据库:"
    echo "  npm run setup:db"
else
    echo "✅ 数据库 $DB_NAME 存在"
    
    # 检查表是否存在
    echo "检查数据库表..."
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('admins', 'members', 'member_login_logs');" | tr -d ' ')
    
    if [ "$TABLE_COUNT" = "3" ]; then
        echo "✅ 所有数据库表已创建"
    else
        echo "⚠️  警告: 数据库表不完整"
        echo "请运行以下命令初始化数据库:"
        echo "  npm run setup:db"
    fi
fi

echo ""
echo "数据库配置检查完成！"

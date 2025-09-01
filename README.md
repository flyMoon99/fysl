# 福佑丝路 - 跨境物流TMS系统

## 项目简介

福佑丝路是一个完整的跨境物流管理系统，包含后端接口服务、前端用户网站和后端管理后台。

## 项目结构

```
fysl/
├── backend/          # 后端API服务
├── frontend/         # 前端用户网站
├── admin/           # 管理后台
├── shared/          # 共享代码
└── scripts/         # 开发脚本
```

## 技术栈

- **后端**: Node.js + Express.js + PostgreSQL
- **前端**: Vue 3 + Vite + Element Plus
- **数据库**: PostgreSQL
- **认证**: JWT

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js (>= 16)
- PostgreSQL (>= 13)
- npm 或 yarn

### 2. 克隆项目

```bash
git clone <repository-url>
cd fysl
```

### 3. 配置环境

```bash
# 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

**数据库配置说明：**

默认配置适用于本地PostgreSQL安装：
- 数据库主机：localhost
- 端口：5432
- 数据库名：fuyou_silu
- 用户名：postgres
- 密码：postgres

如果您使用不同的配置，请修改 `.env` 文件中的相应参数。

### 4. 安装依赖

```bash
npm run install:all
```

### 5. 检查数据库配置

```bash
npm run check:db
```

### 6. 初始化数据库

```bash
npm run setup:db
```

### 6. 启动开发环境

```bash
npm run dev:all
```

## 开发指南

### 启动单个服务

```bash
# 启动后端
npm run dev:backend

# 启动前端
npm run dev:frontend

# 启动管理后台
npm run dev:admin
```

### 数据库相关

```bash
# 检查数据库配置
npm run check:db

# 初始化数据库
npm run setup:db
```

### 常见问题

**1. 数据库连接失败**
- 确保PostgreSQL已安装并正在运行
- 检查 `.env` 文件中的数据库配置
- 运行 `npm run check:db` 进行诊断

**2. 数据库表不存在**
- 运行 `npm run setup:db` 初始化数据库
- 检查数据库用户是否有创建表的权限

**3. 端口冲突**
- 后端默认端口：3000
- 前端默认端口：8080
- 管理后台默认端口：8081
- 如需修改，请更新相应配置文件

### 访问地址

- 前端用户网站: http://localhost:8080
- 管理后台: http://localhost:8081/admin
- 后端API: http://localhost:3000

### 默认账户信息

- 超级管理员：admin / admin123
- 测试会员：testuser / test123

## 数据库表结构

- **管理员表**: 存储管理员账户信息
- **会员表**: 存储会员账户信息
- **会员登录日志表**: 记录会员登录历史

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

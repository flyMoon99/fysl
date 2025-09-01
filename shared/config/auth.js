require('dotenv').config();

// JWT配置
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
  expiresIn: '24h', // Token过期时间
  refreshExpiresIn: '7d' // 刷新Token过期时间
};

// 密码加密配置
const bcryptConfig = {
  saltRounds: 12 // bcrypt加密轮数
};

// 权限配置
const permissions = {
  SUPER_ADMIN: 'super_admin',
  NORMAL_ADMIN: 'normal_admin',
  MEMBER: 'member'
};

// 用户状态
const userStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// 管理员类型
const adminTypes = {
  SUPER: 'super',
  NORMAL: 'normal'
};

module.exports = {
  jwtConfig,
  bcryptConfig,
  permissions,
  userStatus,
  adminTypes
};

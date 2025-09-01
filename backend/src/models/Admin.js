const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');
const { adminTypes, userStatus } = require('../../../shared/config/auth');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '管理员ID，自增主键'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '管理员用户名，唯一标识',
    validate: {
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '管理员密码，使用bcrypt加密存储'
  },
  type: {
    type: DataTypes.ENUM('super', 'normal'),
    allowNull: false,
    defaultValue: 'normal',
    comment: '管理员类型：super-超级管理员，normal-普通管理员'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
    comment: '账户状态：active-启用，inactive-禁用'
  }
}, {
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '管理员表 - 存储系统管理员账户信息',
  indexes: [
    {
      fields: ['username'],
      name: 'idx_admins_username'
    },
    {
      fields: ['status'],
      name: 'idx_admins_status'
    }
  ]
});

// 实例方法：检查是否为超级管理员
Admin.prototype.isSuperAdmin = function() {
  return this.type === adminTypes.SUPER;
};

// 实例方法：检查账户是否激活
Admin.prototype.isActive = function() {
  return this.status === userStatus.ACTIVE;
};

// 类方法：根据用户名查找管理员
Admin.findByUsername = async function(username) {
  return await this.findOne({
    where: { username }
  });
};

// 类方法：查找活跃的管理员
Admin.findActiveAdmins = async function() {
  return await this.findAll({
    where: { status: userStatus.ACTIVE }
  });
};

module.exports = Admin;

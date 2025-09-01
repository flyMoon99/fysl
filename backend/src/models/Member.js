const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');
const { userStatus } = require('../../../shared/config/auth');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '会员ID，自增主键'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '会员用户名，唯一标识',
    validate: {
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '会员密码，使用bcrypt加密存储'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
    comment: '账户状态：active-启用，inactive-禁用'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间，用于统计会员活跃度'
  }
}, {
  tableName: 'members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '会员表 - 存储系统会员账户信息',
  indexes: [
    {
      fields: ['username'],
      name: 'idx_members_username'
    },
    {
      fields: ['status'],
      name: 'idx_members_status'
    }
  ]
});

// 实例方法：检查账户是否激活
Member.prototype.isActive = function() {
  return this.status === userStatus.ACTIVE;
};

// 实例方法：更新最后登录时间
Member.prototype.updateLastLogin = async function() {
  this.last_login_at = new Date();
  return await this.save();
};

// 类方法：根据用户名查找会员
Member.findByUsername = async function(username) {
  return await this.findOne({
    where: { username }
  });
};

// 类方法：查找活跃的会员
Member.findActiveMembers = async function() {
  return await this.findAll({
    where: { status: userStatus.ACTIVE }
  });
};

// 类方法：获取会员登录统计
Member.getLoginStats = async function() {
  return await this.findAll({
    attributes: [
      'id',
      'username',
      'last_login_at',
      [sequelize.fn('COUNT', sequelize.col('loginLogs.id')), 'login_count']
    ],
    include: [{
      model: sequelize.models.MemberLoginLog,
      as: 'loginLogs',
      attributes: []
    }],
    group: ['Member.id'],
    order: [['last_login_at', 'DESC']]
  });
};

module.exports = Member;

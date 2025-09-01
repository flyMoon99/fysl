const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');

const MemberLoginLog = sequelize.define('MemberLoginLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID，自增主键'
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联的会员ID，外键引用members表',
    references: {
      model: 'members',
      key: 'id'
    }
  },
  operation_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '操作时间，记录登录的具体时间'
  },
  operation_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '操作URL，记录登录时访问的页面地址'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址，记录登录者的IP地址，支持IPv6',
    validate: {
      isIP: true
    }
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理，记录浏览器和设备信息'
  }
}, {
  tableName: 'member_login_logs',
  timestamps: false, // 不使用Sequelize的默认时间戳
  comment: '会员登录日志表 - 记录会员登录操作历史，用于安全审计',
  indexes: [
    {
      fields: ['member_id'],
      name: 'idx_member_login_logs_member_id'
    },
    {
      fields: ['operation_time'],
      name: 'idx_member_login_logs_operation_time'
    }
  ]
});

// 类方法：创建登录日志
MemberLoginLog.createLoginLog = async function(memberId, options = {}) {
  const {
    operationUrl,
    ipAddress,
    userAgent
  } = options;

  return await this.create({
    member_id: memberId,
    operation_time: new Date(),
    operation_url: operationUrl,
    ip_address: ipAddress,
    user_agent: userAgent
  });
};

// 类方法：获取会员的登录历史
MemberLoginLog.getMemberLoginHistory = async function(memberId, limit = 10) {
  return await this.findAll({
    where: { member_id: memberId },
    order: [['operation_time', 'DESC']],
    limit: limit
  });
};

// 类方法：获取登录统计
MemberLoginLog.getLoginStats = async function(startDate, endDate) {
  return await this.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('operation_time')), 'login_date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'login_count']
    ],
    where: {
      operation_time: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    group: [sequelize.fn('DATE', sequelize.col('operation_time'))],
    order: [[sequelize.fn('DATE', sequelize.col('operation_time')), 'ASC']]
  });
};

// 类方法：清理旧日志（保留最近30天）
MemberLoginLog.cleanOldLogs = async function(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await this.destroy({
    where: {
      operation_time: {
        [sequelize.Op.lt]: cutoffDate
      }
    }
  });
};

module.exports = MemberLoginLog;

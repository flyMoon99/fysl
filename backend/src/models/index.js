const { Sequelize } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');

// 导入模型
const Admin = require('./Admin');
const Member = require('./Member');
const MemberLoginLog = require('./MemberLoginLog');

// 定义模型关联关系
const defineAssociations = () => {
  // 会员与登录日志的一对多关系
  Member.hasMany(MemberLoginLog, {
    foreignKey: 'member_id',
    as: 'loginLogs',
    onDelete: 'CASCADE'
  });
  
  MemberLoginLog.belongsTo(Member, {
    foreignKey: 'member_id',
    as: 'member'
  });
};

// 初始化所有模型
const initializeModels = async () => {
  try {
    // 定义关联关系
    defineAssociations();
    
    // 同步数据库（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('数据库模型同步完成');
    }
    
    return true;
  } catch (error) {
    console.error('模型初始化失败:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  Admin,
  Member,
  MemberLoginLog,
  initializeModels,
  Op: Sequelize.Op
};

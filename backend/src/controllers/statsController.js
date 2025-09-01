const { Admin, Member, MemberLoginLog, sequelize, Op } = require('../models');

// 获取系统统计信息
const getSystemStats = async (req, res) => {
  try {
    // 获取总会员数
    const totalMembers = await Member.count();
    
    // 获取活跃会员数（有登录记录且状态为活跃）
    const activeMembers = await Member.count({
      where: { status: 'active' }
    });
    
    // 获取今日登录次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayLogins = await MemberLoginLog.count({
      where: {
        operation_time: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    // 获取总登录次数
    const totalLogins = await MemberLoginLog.count();

    res.json({
      success: true,
      message: '获取系统统计信息成功',
      data: {
        totalMembers,
        activeMembers,
        todayLogins,
        totalLogins
      }
    });
  } catch (error) {
    console.error('获取系统统计信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取系统统计信息失败',
      code: 'GET_SYSTEM_STATS_ERROR'
    });
  }
};

// 获取会员统计信息
const getMemberStats = async (req, res) => {
  try {
    const { period = '7' } = req.query; // 默认7天
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    // 获取新注册会员趋势
    const newMembersStats = await Member.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: daysAgo
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    // 按状态统计会员数量
    const membersByStatus = await Member.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      message: '获取会员统计信息成功',
      data: {
        newMembersStats,
        membersByStatus,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('获取会员统计信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取会员统计信息失败',
      code: 'GET_MEMBER_STATS_ERROR'
    });
  }
};

// 获取登录统计信息
const getLoginStats = async (req, res) => {
  try {
    const { 
      limit = 10, 
      period = '7',
      memberId
    } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // 构建查询条件
    const whereCondition = {
      operation_time: {
        [Op.gte]: daysAgo
      }
    };
    
    if (memberId) {
      whereCondition.member_id = memberId;
    }

    // 获取最近登录记录
    const recentLogins = await MemberLoginLog.findAll({
      include: [{
        model: Member,
        as: 'member',
        attributes: ['username']
      }],
      where: whereCondition,
      order: [['operation_time', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'operation_time', 'ip_address', 'user_agent']
    });

    // 格式化数据，添加username到顶层
    const formattedLogins = recentLogins.map(log => ({
      id: log.id,
      username: log.member ? log.member.username : '未知用户',
      operation_time: log.operation_time,
      ip_address: log.ip_address,
      user_agent: log.user_agent
    }));

    // 获取登录趋势统计
    const loginTrends = await MemberLoginLog.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('operation_time')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereCondition,
      group: [sequelize.fn('DATE', sequelize.col('operation_time'))],
      order: [[sequelize.fn('DATE', sequelize.col('operation_time')), 'ASC']]
    });

    res.json({
      success: true,
      message: '获取登录统计信息成功',
      data: {
        logins: formattedLogins,
        trends: loginTrends,
        period: parseInt(period),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取登录统计信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取登录统计信息失败',
      code: 'GET_LOGIN_STATS_ERROR'
    });
  }
};

module.exports = {
  getSystemStats,
  getMemberStats,
  getLoginStats
};
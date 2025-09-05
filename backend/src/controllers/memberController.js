const { Member, MemberLoginLog, Device, Location } = require('../models');
const { Op } = require('sequelize');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const { userStatus } = require('../../../shared/config/auth');

// 会员登录
const memberLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 查找会员
    const member = await Member.findByUsername(username);
    if (!member) {
      return res.status(401).json({
        error: '用户名或密码错误',
        code: 'AUTH_FAILED'
      });
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, member.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '用户名或密码错误',
        code: 'AUTH_FAILED'
      });
    }

    // 检查账户状态
    if (!member.isActive()) {
      return res.status(401).json({
        error: '账户已被禁用',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 更新最后登录时间
    await member.updateLastLogin();

    // 记录登录日志
    await MemberLoginLog.createLoginLog(member.id, {
      operationUrl: req.body.operationUrl || '/member/login',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 生成JWT Token
    const token = generateToken({
      id: member.id,
      username: member.username,
      role: 'member'
    });

    res.json({
      message: '登录成功',
      data: {
        token,
        member: {
          id: member.id,
          username: member.username,
          status: member.status,
          last_login_at: member.last_login_at
        }
      }
    });
  } catch (error) {
    console.error('会员登录错误:', error);
    res.status(500).json({
      error: '登录过程中发生错误',
      code: 'LOGIN_ERROR'
    });
  }
};

// 会员注册
const memberRegister = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 检查用户名是否已存在
    const existingMember = await Member.findByUsername(username);
    if (existingMember) {
      return res.status(400).json({
        error: '用户名已存在',
        code: 'USERNAME_EXISTS'
      });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建会员
    const member = await Member.create({
      username,
      password: hashedPassword,
      status: 'active'
    });

    res.status(201).json({
      message: '注册成功',
      data: {
        member: {
          id: member.id,
          username: member.username,
          status: member.status,
          created_at: member.created_at
        }
      }
    });
  } catch (error) {
    console.error('会员注册错误:', error);
    res.status(500).json({
      error: '注册失败',
      code: 'REGISTER_ERROR'
    });
  }
};

// 获取会员列表（管理员功能）
const getMemberList = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, username, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    if (status) where.status = status;
    if (username) {
      where.username = {
        [require('sequelize').Op.like]: `%${username}%`
      };
    }
    if (startDate && endDate) {
      where.created_at = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Member.findAndCountAll({
      where,
      attributes: ['id', 'username', 'status', 'last_login_at', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: '获取会员列表成功',
      data: {
        members: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取会员列表错误:', error);
    res.status(500).json({
      error: '获取会员列表失败',
      code: 'GET_MEMBER_LIST_ERROR'
    });
  }
};

// 创建会员（管理员功能）
const createMember = async (req, res) => {
  try {
    const { username, password, status = 'active' } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 检查用户名是否已存在
    const existingMember = await Member.findByUsername(username);
    if (existingMember) {
      return res.status(400).json({
        error: '用户名已存在',
        code: 'USERNAME_EXISTS'
      });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建会员
    const member = await Member.create({
      username,
      password: hashedPassword,
      status
    });

    res.status(201).json({
      message: '会员创建成功',
      data: {
        member: {
          id: member.id,
          username: member.username,
          status: member.status,
          created_at: member.created_at
        }
      }
    });
  } catch (error) {
    console.error('创建会员错误:', error);
    res.status(500).json({
      error: '创建会员失败',
      code: 'CREATE_MEMBER_ERROR'
    });
  }
};

// 更新会员（管理员功能）
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, status } = req.body;

    // 查找会员
    const member = await Member.findByPk(id);
    if (!member) {
      return res.status(404).json({
        error: '会员不存在',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    // 检查用户名是否已被其他会员使用
    if (username && username !== member.username) {
      const existingMember = await Member.findByUsername(username);
      if (existingMember) {
        return res.status(400).json({
          error: '用户名已存在',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // 更新字段
    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (status) updateData.status = status;

    await member.update(updateData);

    res.json({
      message: '会员更新成功',
      data: {
        member: {
          id: member.id,
          username: member.username,
          status: member.status,
          updated_at: member.updated_at
        }
      }
    });
  } catch (error) {
    console.error('更新会员错误:', error);
    res.status(500).json({
      error: '更新会员失败',
      code: 'UPDATE_MEMBER_ERROR'
    });
  }
};

// 删除会员（管理员功能）
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找会员
    const member = await Member.findByPk(id);
    if (!member) {
      return res.status(404).json({
        error: '会员不存在',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    await member.destroy();

    res.json({
      message: '会员删除成功'
    });
  } catch (error) {
    console.error('删除会员错误:', error);
    res.status(500).json({
      error: '删除会员失败',
      code: 'DELETE_MEMBER_ERROR'
    });
  }
};

// 获取会员详情
const getMemberDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id, {
      attributes: ['id', 'username', 'status', 'last_login_at', 'created_at', 'updated_at']
    });

    if (!member) {
      return res.status(404).json({
        error: '会员不存在',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    res.json({
      message: '获取会员详情成功',
      data: { member }
    });
  } catch (error) {
    console.error('获取会员详情错误:', error);
    res.status(500).json({
      error: '获取会员详情失败',
      code: 'GET_MEMBER_DETAIL_ERROR'
    });
  }
};

// 获取当前会员信息
const getCurrentMember = async (req, res) => {
  try {
    const member = req.member;
    
    res.json({
      message: '获取当前会员信息成功',
      data: {
        member: {
          id: member.id,
          username: member.username,
          status: member.status,
          last_login_at: member.last_login_at,
          created_at: member.created_at
        }
      }
    });
  } catch (error) {
    console.error('获取当前会员信息错误:', error);
    res.status(500).json({
      error: '获取当前会员信息失败',
      code: 'GET_CURRENT_MEMBER_ERROR'
    });
  }
};

// 更新个人信息
const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const member = req.member;

    // 验证输入
    if (!username) {
      return res.status(400).json({
        error: '用户名不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 检查用户名是否已被其他会员使用
    if (username !== member.username) {
      const existingMember = await Member.findByUsername(username);
      if (existingMember) {
        return res.status(400).json({
          error: '用户名已存在',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // 更新用户信息
    await member.update({ username });

    res.json({
      message: '个人信息更新成功',
      data: {
        member: {
          id: member.id,
          username: member.username,
          status: member.status,
          updated_at: member.updated_at
        }
      }
    });
  } catch (error) {
    console.error('更新个人信息错误:', error);
    res.status(500).json({
      error: '更新个人信息失败',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const member = req.member;

    // 验证输入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: '当前密码和新密码不能为空',
        code: 'INVALID_INPUT'
      });
    }

    // 验证当前密码
    const isValidPassword = await comparePassword(currentPassword, member.password);
    if (!isValidPassword) {
      return res.status(400).json({
        error: '当前密码错误',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await member.update({ password: hashedPassword });

    res.json({
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      error: '修改密码失败',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
};

// 获取登录历史
const getLoginHistory = async (req, res) => {
  try {
    const member = req.member;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await MemberLoginLog.findAndCountAll({
      where: { member_id: member.id },
      order: [['operation_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: '获取登录历史成功',
      data: {
        loginHistory: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取登录历史错误:', error);
    res.status(500).json({
      error: '获取登录历史失败',
      code: 'GET_LOGIN_HISTORY_ERROR'
    });
  }
};

// 获取会员设备详情
const getMemberDeviceDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member.id;


    // 查找设备，确保是当前会员的设备
    const device = await Device.findOne({
      where: {
        id: id,
        customer_id: memberId
      },
      include: [
        {
          model: Location,
          as: 'locations',
          limit: 10,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'longitude', 'latitude', 'coordinate_system', 'address', 'created_at']
        }
      ]
    });

    if (!device) {
      return res.status(404).json({
        error: '设备不存在或无权限访问',
        code: 'DEVICE_NOT_FOUND'
      });
    }


    res.json({
      message: '获取设备详情成功',
      data: { device }
    });
  } catch (error) {
    console.error('获取会员设备详情错误:', error);
    res.status(500).json({
      error: '获取设备详情失败',
      code: 'GET_MEMBER_DEVICE_DETAIL_ERROR'
    });
  }
};

// 获取会员设备列表
const getMemberDevices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      device_number,
      device_model 
    } = req.query;
    
    const memberId = req.member.id; // 从认证中间件获取会员ID
    const offset = (page - 1) * limit;

    // 构建查询条件 - 只查询当前会员的设备
    const where = {
      customer_id: memberId
    };
    
    // 设备状态筛选
    if (status) where.status = status;
    
    // 设备号模糊查询
    if (device_number) {
      where.device_number = {
        [Op.like]: `%${device_number}%`
      };
    }
    
    // 设备型号筛选
    if (device_model) {
      where.device_model = {
        [Op.like]: `%${device_model}%`
      };
    }


    // 执行查询
    const { count, rows } = await Device.findAndCountAll({
      where,
      attributes: [
        'id',
        'device_number',
        'device_alias',
        'device_remarks',
        'status',
        'device_model',
        'battery_level',
        'service_status',
        'setting_status',
        'last_update_time',
        'last_longitude',
        'last_latitude',
        'created_at',
        'updated_at'
      ],
      order: [['last_update_time', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });


    res.json({
      message: '获取设备列表成功',
      data: {
        devices: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取会员设备列表错误:', error);
    res.status(500).json({
      error: '获取设备列表失败',
      code: 'GET_MEMBER_DEVICES_ERROR',
      details: error.message
    });
  }
};

// 获取会员设备地图数据
const getMemberDeviceMapData = async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member.id;


    // 查找设备，确保是当前会员的设备
    const device = await Device.findOne({
      where: {
        id: id,
        customer_id: memberId
      },
      attributes: [
        'id',
        'device_number',
        'device_alias',
        'device_remarks',
        'status',
        'battery_level',
        'last_update_time',
        'last_longitude',
        'last_latitude'
      ]
    });

    if (!device) {
      return res.status(404).json({
        error: '设备不存在或无权限访问',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    // 构建地图数据
    const mapData = {
      device: {
        id: device.id,
        name: device.device_alias || device.device_number,
        number: device.device_number,
        status: device.status,
        battery: device.battery_level
      },
      currentLocation: null,
      bounds: null
    };

    // 如果设备有位置信息
    if (device.last_longitude && device.last_latitude) {
      mapData.currentLocation = {
        lat: parseFloat(device.last_latitude),
        lng: parseFloat(device.last_longitude),
        updateTime: device.last_update_time
      };

      // 计算地图边界（当前位置周围1公里范围）
      const offset = 0.009; // 约1公里
      mapData.bounds = {
        northeast: {
          lat: parseFloat(device.last_latitude) + offset,
          lng: parseFloat(device.last_longitude) + offset
        },
        southwest: {
          lat: parseFloat(device.last_latitude) - offset,
          lng: parseFloat(device.last_longitude) - offset
        }
      };
    }


    res.json({
      message: '获取设备地图数据成功',
      data: mapData
    });
  } catch (error) {
    console.error('获取会员设备地图数据错误:', error);
    res.status(500).json({
      error: '获取设备地图数据失败',
      code: 'GET_MEMBER_DEVICE_MAP_DATA_ERROR',
      details: error.message
    });
  }
};

// 获取会员设备轨迹点数据
const getMemberDeviceTrackPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, limit = 1000 } = req.query;
    const memberId = req.member.id;


    // 验证设备权限
    const device = await Device.findOne({
      where: {
        id: id,
        customer_id: memberId
      }
    });

    if (!device) {
      return res.status(404).json({
        error: '设备不存在或无权限访问',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    // 验证时间参数
    if (!startTime || !endTime) {
      return res.status(400).json({
        error: '开始时间和结束时间不能为空',
        code: 'INVALID_TIME_RANGE'
      });
    }

    // 验证时间跨度不超过7天
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 7) {
      return res.status(400).json({
        error: '查询时间跨度不能超过7天',
        code: 'TIME_RANGE_TOO_LARGE'
      });
    }

    // 查询轨迹点数据
    const trackPoints = await Location.findAll({
      where: {
        device_id: id,
        created_at: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        'longitude',
        'latitude',
        'coordinate_system',
        'address',
        'created_at'
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit)
    });

    // 转换数据格式
    const formattedTrackPoints = trackPoints.map(point => ({
      lng: parseFloat(point.longitude),
      lat: parseFloat(point.latitude),
      timestamp: point.created_at,
      coordinateSystem: point.coordinate_system,
      address: point.address || '地址未解析'
    }));


    res.json({
      message: '获取设备轨迹点数据成功',
      data: {
        deviceId: id,
        deviceNumber: device.device_number,
        timeRange: { startTime, endTime },
        trackPoints: formattedTrackPoints,
        totalPoints: formattedTrackPoints.length
      }
    });
  } catch (error) {
    console.error('获取会员设备轨迹点数据错误:', error);
    res.status(500).json({
      error: '获取设备轨迹点数据失败',
      code: 'GET_MEMBER_DEVICE_TRACK_POINTS_ERROR',
      details: error.message
    });
  }
};

module.exports = {
  memberLogin,
  memberRegister,
  getMemberList,
  getMemberDeviceDetail,
  createMember,
  updateMember,
  deleteMember,
  getMemberDetail,
  getCurrentMember,
  updateProfile,
  changePassword,
  getLoginHistory,
  getMemberDevices,
  getMemberDeviceMapData,
  getMemberDeviceTrackPoints
};

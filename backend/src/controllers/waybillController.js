const { Waybill, TransportDetail, Device, Member, Location } = require('../models');
const { Op } = require('sequelize');

// 获取运单列表
const getWaybills = async (req, res) => {
  try {
    const { page = 1, limit = 10, waybill_number, create_by } = req.query;
    const memberId = req.member.id;
    
    // 构建查询条件
    const where = {};
    if (waybill_number) {
      where.waybill_number = {
        [Op.like]: `%${waybill_number}%`
      };
    }
    if (create_by) {
      where.create_by = {
        [Op.like]: `%${create_by}%`
      };
    }
    
    // 分页查询
    const offset = (page - 1) * limit;
    const { count, rows: waybills } = await Waybill.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device',
              where: { customer_id: memberId }, // 只显示属于当前会员的设备
              required: false
            }
          ]
        }
      ]
    });
    
    // 过滤掉没有关联设备的运单
    const filteredWaybills = waybills.filter(waybill => 
      waybill.transportDetails.some(detail => detail.device)
    );
    
    // 时区转换：将UTC时间转换为中国标准时间
    filteredWaybills.forEach(waybill => {
      if (waybill.created_at) {
        const utcTime = new Date(waybill.created_at);
        const chinaTime = new Date(utcTime.getTime() + (8 * 60 * 60 * 1000));
        waybill.created_at = chinaTime;
      }
    });
    
    res.json({
      message: '获取运单列表成功',
      data: {
        waybills: filteredWaybills,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取运单列表失败:', error);
    res.status(500).json({
      error: '获取运单列表失败',
      code: 'GET_WAYBILLS_ERROR',
      details: error.message
    });
  }
};

// 获取运单详情
const getWaybillDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member.id;
    
    const waybill = await Waybill.findByPk(id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device',
              where: { customer_id: memberId },
              required: false
            }
          ]
        }
      ]
    });
    
    if (!waybill) {
      return res.status(404).json({
        error: '运单不存在',
        code: 'WAYBILL_NOT_FOUND'
      });
    }
    
    // 检查运单是否有关联的设备
    const hasValidDevice = waybill.transportDetails.some(detail => detail.device);
    if (!hasValidDevice) {
      return res.status(403).json({
        error: '无权访问此运单',
        code: 'WAYBILL_ACCESS_DENIED'
      });
    }
    
    // 为每个运输明细更新设备的最新位置信息
    for (const detail of waybill.transportDetails) {
      if (detail.device) {
        // 从gps_devices表获取设备的最新位置信息
        const latestDevice = await Device.findByPk(detail.device.id);
        if (latestDevice) {
          // 更新设备信息为最新数据
          detail.device.last_longitude = latestDevice.last_longitude;
          detail.device.last_latitude = latestDevice.last_latitude;
          detail.device.last_update_time = latestDevice.last_update_time;
          detail.device.status = latestDevice.status;
          detail.device.battery_level = latestDevice.battery_level;
          
          // 获取最新位置的地址信息
          if (latestDevice.last_longitude && latestDevice.last_latitude) {
            const latestLocation = await Location.findOne({
              where: {
                device_id: detail.device.id,
                longitude: latestDevice.last_longitude,
                latitude: latestDevice.last_latitude
              },
              order: [['created_at', 'DESC']]
            });
            
            if (latestLocation && latestLocation.address) {
              detail.address = latestLocation.address;
            } else {
              detail.address = '地址解析中...';
            }
          } else {
            detail.address = '暂无位置信息';
          }
        }
      }
    }
    
    // 时区转换：将UTC时间转换为中国标准时间
    if (waybill.created_at) {
      const utcTime = new Date(waybill.created_at);
      const chinaTime = new Date(utcTime.getTime() + (8 * 60 * 60 * 1000));
      waybill.created_at = chinaTime;
    }
    
    res.json({
      message: '获取运单详情成功',
      data: waybill
    });
  } catch (error) {
    console.error('获取运单详情失败:', error);
    res.status(500).json({
      error: '获取运单详情失败',
      code: 'GET_WAYBILL_DETAIL_ERROR',
      details: error.message
    });
  }
};

// 创建运单
const createWaybill = async (req, res) => {
  try {
    const { waybill_number, waybill_remarks, waybill_password, transport_details } = req.body;
    const memberId = req.member.id;
    
    // 检查运单号是否已存在
    const existingWaybill = await Waybill.findOne({
      where: { waybill_number }
    });
    
    if (existingWaybill) {
      return res.status(400).json({
        error: '运单号已存在',
        code: 'WAYBILL_NUMBER_EXISTS'
      });
    }
    
    // 验证设备是否属于当前会员
    if (transport_details && transport_details.length > 0) {
      const deviceIds = transport_details.map(detail => detail.device_id);
      const devices = await Device.findAll({
        where: {
          id: deviceIds,
          customer_id: memberId
        }
      });
      
      if (devices.length !== deviceIds.length) {
        return res.status(400).json({
          error: '部分设备不属于当前会员',
          code: 'DEVICE_ACCESS_DENIED'
        });
      }
    }
    
    // 创建运单
    const waybill = await Waybill.create({
      waybill_number,
      waybill_remarks,
      create_by: req.member.username,
      waybill_password,
      created_at: new Date() // 手动设置创建时间
    });
    
    // 创建运输明细
    if (transport_details && transport_details.length > 0) {
      const transportDetailsData = transport_details.map(detail => ({
        waybill_id: waybill.id,
        waybill_number: waybill.waybill_number,
        device_id: detail.device_id,
        longitude: detail.longitude,
        latitude: detail.latitude,
        address: detail.address,
        last_update_time: detail.last_update_time,
        transport_remarks: detail.transport_remarks,
        license_plate: detail.license_plate
      }));
      
      await TransportDetail.bulkCreate(transportDetailsData);
    }
    
    // 返回创建的运单
    const createdWaybill = await Waybill.findByPk(waybill.id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device'
            }
          ]
        }
      ]
    });
    
    // 时区转换：将UTC时间转换为中国标准时间
    if (createdWaybill && createdWaybill.created_at) {
      const utcTime = new Date(createdWaybill.created_at);
      const chinaTime = new Date(utcTime.getTime() + (8 * 60 * 60 * 1000));
      createdWaybill.created_at = chinaTime;
    }
    
    res.status(201).json({
      message: '创建运单成功',
      data: createdWaybill
    });
  } catch (error) {
    console.error('创建运单失败:', error);
    res.status(500).json({
      error: '创建运单失败',
      code: 'CREATE_WAYBILL_ERROR',
      details: error.message
    });
  }
};

// 更新运单
const updateWaybill = async (req, res) => {
  try {
    const { id } = req.params;
    const { waybill_remarks, waybill_password, transport_details } = req.body;
    const memberId = req.member.id;
    
    // 查找运单
    const waybill = await Waybill.findByPk(id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device',
              where: { customer_id: memberId },
              required: false
            }
          ]
        }
      ]
    });
    
    if (!waybill) {
      return res.status(404).json({
        error: '运单不存在',
        code: 'WAYBILL_NOT_FOUND'
      });
    }
    
    // 检查运单是否有关联的设备
    const hasValidDevice = waybill.transportDetails.some(detail => detail.device);
    if (!hasValidDevice) {
      return res.status(403).json({
        error: '无权访问此运单',
        code: 'WAYBILL_ACCESS_DENIED'
      });
    }
    
    // 更新运单基本信息
    await waybill.update({
      waybill_remarks,
      waybill_password
    });
    
    // 更新运输明细
    if (transport_details) {
      // 删除现有运输明细
      await TransportDetail.destroy({
        where: { waybill_id: id }
      });
      
      // 创建新的运输明细
      if (transport_details.length > 0) {
        const transportDetailsData = transport_details.map(detail => ({
          waybill_id: id,
          waybill_number: waybill.waybill_number,
          device_id: detail.device_id,
          longitude: detail.longitude,
          latitude: detail.latitude,
          address: detail.address,
          last_update_time: detail.last_update_time,
          transport_remarks: detail.transport_remarks,
          license_plate: detail.license_plate
        }));
        
        await TransportDetail.bulkCreate(transportDetailsData);
      }
    }
    
    // 返回更新后的运单
    const updatedWaybill = await Waybill.findByPk(id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device'
            }
          ]
        }
      ]
    });
    
    res.json({
      message: '更新运单成功',
      data: updatedWaybill
    });
  } catch (error) {
    console.error('更新运单失败:', error);
    res.status(500).json({
      error: '更新运单失败',
      code: 'UPDATE_WAYBILL_ERROR',
      details: error.message
    });
  }
};

// 删除运单
const deleteWaybill = async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member.id;
    
    // 查找运单
    const waybill = await Waybill.findByPk(id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device',
              where: { customer_id: memberId },
              required: false
            }
          ]
        }
      ]
    });
    
    if (!waybill) {
      return res.status(404).json({
        error: '运单不存在',
        code: 'WAYBILL_NOT_FOUND'
      });
    }
    
    // 检查运单是否有关联的设备
    const hasValidDevice = waybill.transportDetails.some(detail => detail.device);
    if (!hasValidDevice) {
      return res.status(403).json({
        error: '无权访问此运单',
        code: 'WAYBILL_ACCESS_DENIED'
      });
    }
    
    // 删除运单（级联删除运输明细）
    await waybill.destroy();
    
    res.json({
      message: '删除运单成功'
    });
  } catch (error) {
    console.error('删除运单失败:', error);
    res.status(500).json({
      error: '删除运单失败',
      code: 'DELETE_WAYBILL_ERROR',
      details: error.message
    });
  }
};

// 公开获取运单详情（无需登录，统一接口）
const getPublicWaybillDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const waybill = await Waybill.findByPk(id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device',
              required: false
            }
          ]
        }
      ]
    });
    
    if (!waybill) {
      return res.status(404).json({
        error: '运单不存在',
        code: 'WAYBILL_NOT_FOUND'
      });
    }
    
    // 检查是否需要密码验证
    if (waybill.waybill_password) {
      return res.status(403).json({
        error: '需要密码验证',
        code: 'PASSWORD_REQUIRED',
        requiresPassword: true
      });
    }
    
    // 为每个运输明细更新设备的最新位置信息
    for (const detail of waybill.transportDetails) {
      if (detail.device) {
        // 从gps_devices表获取设备的最新位置信息
        const latestDevice = await Device.findByPk(detail.device.id);
        if (latestDevice) {
          // 更新设备信息为最新数据
          detail.device.last_longitude = latestDevice.last_longitude;
          detail.device.last_latitude = latestDevice.last_latitude;
          detail.device.last_update_time = latestDevice.last_update_time;
          detail.device.status = latestDevice.status;
          detail.device.battery_level = latestDevice.battery_level;
          
          // 获取最新位置的地址信息
          if (latestDevice.last_longitude && latestDevice.last_latitude) {
            const latestLocation = await Location.findOne({
              where: {
                device_id: detail.device.id,
                longitude: latestDevice.last_longitude,
                latitude: latestDevice.last_latitude
              },
              order: [['created_at', 'DESC']]
            });
            
            if (latestLocation && latestLocation.address) {
              detail.address = latestLocation.address;
            } else {
              detail.address = '地址解析中...';
            }
          } else {
            detail.address = '暂无位置信息';
          }
        }
      }
    }
    
    res.json({
      message: '获取运单详情成功',
      data: waybill
    });
  } catch (error) {
    console.error('获取公开运单详情失败:', error);
    res.status(500).json({
      error: '获取运单详情失败',
      code: 'GET_PUBLIC_WAYBILL_DETAIL_ERROR',
      details: error.message
    });
  }
};

// 验证运单密码
const verifyWaybillPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const waybill = await Waybill.findByPk(id, {
      include: [
        {
          model: TransportDetail,
          as: 'transportDetails',
          include: [
            {
              model: Device,
              as: 'device',
              required: false
            }
          ]
        }
      ]
    });
    
    if (!waybill) {
      return res.status(404).json({
        error: '运单不存在',
        code: 'WAYBILL_NOT_FOUND'
      });
    }
    
    if (waybill.waybill_password !== password) {
      return res.status(401).json({
        error: '密码错误',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // 为每个运输明细更新设备的最新位置信息
    for (const detail of waybill.transportDetails) {
      if (detail.device) {
        // 从gps_devices表获取设备的最新位置信息
        const latestDevice = await Device.findByPk(detail.device.id);
        if (latestDevice) {
          // 更新设备信息为最新数据
          detail.device.last_longitude = latestDevice.last_longitude;
          detail.device.last_latitude = latestDevice.last_latitude;
          detail.device.last_update_time = latestDevice.last_update_time;
          detail.device.status = latestDevice.status;
          detail.device.battery_level = latestDevice.battery_level;
          
          // 获取最新位置的地址信息
          if (latestDevice.last_longitude && latestDevice.last_latitude) {
            const latestLocation = await Location.findOne({
              where: {
                device_id: detail.device.id,
                longitude: latestDevice.last_longitude,
                latitude: latestDevice.last_latitude
              },
              order: [['created_at', 'DESC']]
            });
            
            if (latestLocation && latestLocation.address) {
              detail.address = latestLocation.address;
            } else {
              detail.address = '地址解析中...';
            }
          } else {
            detail.address = '暂无位置信息';
          }
        }
      }
    }
    
    res.json({
      message: '密码验证成功',
      data: waybill
    });
  } catch (error) {
    console.error('验证运单密码失败:', error);
    res.status(500).json({
      error: '验证密码失败',
      code: 'VERIFY_PASSWORD_ERROR',
      details: error.message
    });
  }
};

// 公开获取设备轨迹点数据（无需登录）
const getPublicDeviceTrackPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, limit = 1000 } = req.query;

    // 验证设备存在
    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({
        error: '设备不存在',
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
      longitude: parseFloat(point.longitude),
      latitude: parseFloat(point.latitude),
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
    console.error('获取公开设备轨迹点数据错误:', error);
    res.status(500).json({
      error: '获取设备轨迹点数据失败',
      code: 'GET_PUBLIC_DEVICE_TRACK_POINTS_ERROR',
      details: error.message
    });
  }
};

module.exports = {
  getWaybills,
  getWaybillDetail,
  createWaybill,
  updateWaybill,
  deleteWaybill,
  getPublicWaybillDetail,
  verifyWaybillPassword,
  getPublicDeviceTrackPoints
};

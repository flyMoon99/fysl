const { Device, Location, Member } = require('../models');
const { Op } = require('sequelize');
const { deviceSyncService } = require('../services/deviceSyncService');

// 获取设备列表
const getDeviceList = async (req, res) => {
  console.log('[DEBUG] 获取设备列表请求开始');
  console.log('[DEBUG] 查询参数:', req.query);
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      device_number, 
      device_model,
      service_status,
      setting_status,
      customer_id,
      startDate, 
      endDate 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    
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
    
    // 服务状态筛选
    if (service_status) where.service_status = service_status;
    
    // 设置状态筛选
    if (setting_status) where.setting_status = setting_status;
    
    // 客户ID筛选
    if (customer_id) where.customer_id = customer_id;
    
    // 创建时间范围筛选
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    console.log('[DEBUG] 查询条件:', where);
    console.log('[DEBUG] 分页参数: page:', page, 'limit:', limit, 'offset:', offset);

    // 执行查询
    console.log('[DEBUG] 开始执行数据库查询...');
    const { count, rows } = await Device.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          as: 'customer',
          attributes: ['id', 'username'],
          required: false // 左连接，允许设备没有关联客户
        }
      ],
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
        'customer_id',
        'last_update_time',
        'last_longitude',
        'last_latitude',
        'created_at',
        'updated_at'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('[DEBUG] 查询结果: count=', count, 'rows.length=', rows.length);
    console.log('[DEBUG] 返回数据预览:', rows.slice(0, 2).map(row => ({
      id: row.id,
      device_number: row.device_number,
      status: row.status
    })));

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
    console.error('获取设备列表错误:', error);
    res.status(500).json({
      error: '获取设备列表失败',
      code: 'GET_DEVICE_LIST_ERROR'
    });
  }
};

// 获取设备详情
const getDeviceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id, {
      include: [
        {
          model: Member,
          as: 'customer',
          attributes: ['id', 'username']
        },
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
        error: '设备不存在',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    res.json({
      message: '获取设备详情成功',
      data: { device }
    });
  } catch (error) {
    console.error('获取设备详情错误:', error);
    res.status(500).json({
      error: '获取设备详情失败',
      code: 'GET_DEVICE_DETAIL_ERROR'
    });
  }
};

// 获取设备统计信息
const getDeviceStats = async (req, res) => {
  try {
    const stats = await Device.getDeviceStats();
    
    // 获取低电量设备数量
    const lowBatteryCount = await Device.count({
      where: {
        battery_level: {
          [Op.lte]: 20
        }
      }
    });

    // 获取过期服务设备数量
    const expiredServiceCount = await Device.count({
      where: {
        setting_status: 'expired'
      }
    });

    res.json({
      message: '获取设备统计成功',
      data: {
        ...stats,
        lowBattery: lowBatteryCount,
        expiredService: expiredServiceCount
      }
    });
  } catch (error) {
    console.error('获取设备统计错误:', error);
    res.status(500).json({
      error: '获取设备统计失败',
      code: 'GET_DEVICE_STATS_ERROR'
    });
  }
};

// 获取设备位置历史
const getDeviceLocationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // 验证设备是否存在
    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({
        error: '设备不存在',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    // 构建查询条件
    const where = { device_id: id };
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Location.findAndCountAll({
      where,
      attributes: [
        'id',
        'longitude',
        'latitude', 
        'coordinate_system',
        'address',
        'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: '获取设备位置历史成功',
      data: {
        locations: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取设备位置历史错误:', error);
    res.status(500).json({
      error: '获取设备位置历史失败',
      code: 'GET_DEVICE_LOCATION_HISTORY_ERROR'
    });
  }
};

// 获取设备轨迹统计
const getDeviceTrackStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // 验证设备是否存在
    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({
        error: '设备不存在',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    // 如果没有指定时间范围，默认查询最近24小时
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 24 * 60 * 60 * 1000);

    const trackStats = await Location.getTrackStats(id, start, end);

    res.json({
      message: '获取设备轨迹统计成功',
      data: {
        device: {
          id: device.id,
          device_number: device.device_number,
          device_alias: device.device_alias
        },
        timeRange: {
          start: start,
          end: end
        },
        stats: trackStats
      }
    });
  } catch (error) {
    console.error('获取设备轨迹统计错误:', error);
    res.status(500).json({
      error: '获取设备轨迹统计失败',
      code: 'GET_DEVICE_TRACK_STATS_ERROR'
    });
  }
};

// 同步所有设备信息
const syncAllDevices = async (req, res) => {
  try {
    
    const syncResult = await deviceSyncService.syncAllDevices();
    
    res.json({
      message: '设备同步完成',
      data: syncResult
    });
  } catch (error) {
    console.error('同步设备信息错误:', error);
    res.status(500).json({
      error: '同步设备信息失败',
      code: 'SYNC_DEVICES_ERROR',
      details: error.message
    });
  }
};

// 同步指定设备的历史轨迹
const syncDeviceTrack = async (req, res) => {
  try {
    const { deviceNumber } = req.params;
    const { startTime, endTime } = req.body;

    // 验证必要参数
    if (!deviceNumber) {
      return res.status(400).json({
        error: '设备号不能为空',
        code: 'INVALID_DEVICE_NUMBER'
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: '开始时间和结束时间不能为空',
        code: 'INVALID_TIME_RANGE'
      });
    }

    
    const syncResult = await deviceSyncService.syncDeviceTrack(
      deviceNumber,
      startTime,
      endTime
    );
    
    res.json({
      message: '轨迹同步完成',
      data: syncResult
    });
  } catch (error) {
    console.error('同步设备轨迹错误:', error);
    res.status(500).json({
      error: '同步设备轨迹失败',
      code: 'SYNC_DEVICE_TRACK_ERROR',
      details: error.message
    });
  }
};

// 同步设备当前位置
const syncDeviceCurrentLocation = async (req, res) => {
  try {
    const { deviceNumber } = req.params;

    if (!deviceNumber) {
      return res.status(400).json({
        error: '设备号不能为空',
        code: 'INVALID_DEVICE_NUMBER'
      });
    }

    
    const locationData = await deviceSyncService.syncDeviceCurrentLocation(deviceNumber);
    
    res.json({
      message: '位置同步完成',
      data: locationData
    });
  } catch (error) {
    console.error('同步设备位置错误:', error);
    res.status(500).json({
      error: '同步设备位置失败',
      code: 'SYNC_DEVICE_LOCATION_ERROR',
      details: error.message
    });
  }
};

// 批量分配设备客户
const batchAssignCustomer = async (req, res) => {
  try {
    const { deviceIds, customerId } = req.body;

    // 验证必要参数
    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({
        error: '设备ID列表不能为空',
        code: 'INVALID_DEVICE_IDS'
      });
    }

    if (!customerId) {
      return res.status(400).json({
        error: '客户ID不能为空',
        code: 'INVALID_CUSTOMER_ID'
      });
    }


    // 验证客户是否存在
    const customer = await Member.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        error: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // 验证设备是否存在
    const devices = await Device.findAll({
      where: {
        id: {
          [Op.in]: deviceIds
        }
      }
    });

    if (devices.length !== deviceIds.length) {
      return res.status(400).json({
        error: '部分设备不存在',
        code: 'DEVICES_NOT_FOUND'
      });
    }

    // 批量更新设备的客户ID
    const updateResult = await Device.update(
      { customer_id: customerId },
      {
        where: {
          id: {
            [Op.in]: deviceIds
          }
        }
      }
    );


    res.json({
      message: '批量分配客户成功',
      data: {
        assignedCount: updateResult[0],
        customerId: customerId,
        customerName: customer.username,
        deviceIds: deviceIds
      }
    });
  } catch (error) {
    console.error('批量分配设备客户错误:', error);
    res.status(500).json({
      error: '批量分配设备客户失败',
      code: 'BATCH_ASSIGN_CUSTOMER_ERROR',
      details: error.message
    });
  }
};

// 获取设备地图数据（管理员）
const getDeviceMapData = async (req, res) => {
  try {
    const { id } = req.params;


    // 查找设备
    const device = await Device.findByPk(id, {
      include: [
        {
          model: Member,
          as: 'customer',
          attributes: ['id', 'username'],
          required: false
        }
      ],
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
        'customer_id',
        'last_update_time',
        'last_longitude',
        'last_latitude'
      ]
    });

    if (!device) {
      return res.status(404).json({
        error: '设备不存在',
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
        battery: device.battery_level,
        model: device.device_model,
        customer: device.customer ? {
          id: device.customer.id,
          username: device.customer.username
        } : null
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
    console.error('获取设备地图数据错误:', error);
    res.status(500).json({
      error: '获取设备地图数据失败',
      code: 'GET_DEVICE_MAP_DATA_ERROR',
      details: error.message
    });
  }
};

// 获取设备轨迹点数据（管理员）
const getDeviceTrackPoints = async (req, res) => {
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
    console.error('获取设备轨迹点数据错误:', error);
    res.status(500).json({
      error: '获取设备轨迹点数据失败',
      code: 'GET_DEVICE_TRACK_POINTS_ERROR',
      details: error.message
    });
  }
};

// 获取多个设备的地图数据（管理员批量查看）
const getMultipleDevicesMapData = async (req, res) => {
  try {
    const { deviceIds } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({
        error: '设备ID列表不能为空',
        code: 'INVALID_DEVICE_IDS'
      });
    }


    // 查找所有设备
    const devices = await Device.findAll({
      where: {
        id: {
          [Op.in]: deviceIds
        }
      },
      include: [
        {
          model: Member,
          as: 'customer',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      attributes: [
        'id',
        'device_number',
        'device_alias',
        'status',
        'battery_level',
        'last_update_time',
        'last_longitude',
        'last_latitude'
      ]
    });

    // 构建地图数据
    const devicesMapData = devices.map(device => ({
      id: device.id,
      name: device.device_alias || device.device_number,
      number: device.device_number,
      status: device.status,
      battery: device.battery_level,
      customer: device.customer ? device.customer.username : null,
      location: device.last_longitude && device.last_latitude ? {
        lat: parseFloat(device.last_latitude),
        lng: parseFloat(device.last_longitude),
        updateTime: device.last_update_time
      } : null
    }));

    // 计算整体边界
    const validLocations = devicesMapData.filter(device => device.location);
    let bounds = null;
    
    if (validLocations.length > 0) {
      const lats = validLocations.map(device => device.location.lat);
      const lngs = validLocations.map(device => device.location.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // 添加边距
      const latMargin = (maxLat - minLat) * 0.1;
      const lngMargin = (maxLng - minLng) * 0.1;
      
      bounds = {
        northeast: {
          lat: maxLat + latMargin,
          lng: maxLng + lngMargin
        },
        southwest: {
          lat: minLat - latMargin,
          lng: minLng - lngMargin
        }
      };
    }


    res.json({
      message: '获取多设备地图数据成功',
      data: {
        devices: devicesMapData,
        bounds,
        totalDevices: devicesMapData.length,
        devicesWithLocation: validLocations.length
      }
    });
  } catch (error) {
    console.error('获取多设备地图数据错误:', error);
    res.status(500).json({
      error: '获取多设备地图数据失败',
      code: 'GET_MULTIPLE_DEVICES_MAP_DATA_ERROR',
      details: error.message
    });
  }
};

module.exports = {
  getDeviceList,
  getDeviceDetail,
  getDeviceStats,
  getDeviceLocationHistory,
  getDeviceTrackStats,
  syncAllDevices,
  syncDeviceTrack,
  syncDeviceCurrentLocation,
  batchAssignCustomer,
  getDeviceMapData,
  getDeviceTrackPoints,
  getMultipleDevicesMapData
};

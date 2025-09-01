const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '定位记录ID，自增主键'
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联的设备ID，外键引用gps_devices表',
    references: {
      model: 'gps_devices',
      key: 'id'
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
    comment: '经度，精度到7位小数',
    validate: {
      min: -180,
      max: 180
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
    comment: '纬度，精度到7位小数',
    validate: {
      min: -90,
      max: 90
    }
  },
  coordinate_system: {
    type: DataTypes.ENUM('WGS-84', 'GCJ-02'),
    allowNull: false,
    defaultValue: 'WGS-84',
    comment: '坐标系：WGS-84-国际标准，GCJ-02-国测局标准'
  }
}, {
  tableName: 'gps_locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 定位记录不需要更新时间
  comment: 'GPS定位表 - 存储GPS设备的历史定位数据',
  indexes: [
    {
      fields: ['device_id'],
      name: 'idx_gps_locations_device_id'
    },
    {
      fields: ['created_at'],
      name: 'idx_gps_locations_created_at'
    },
    {
      fields: ['device_id', 'created_at'],
      name: 'idx_gps_locations_device_time'
    }
  ]
});

// 实例方法：获取坐标点字符串表示
Location.prototype.getCoordinateString = function() {
  return `${this.longitude}, ${this.latitude}`;
};

// 实例方法：检查是否为国测局坐标系
Location.prototype.isGCJ02 = function() {
  return this.coordinate_system === 'GCJ-02';
};

// 实例方法：检查是否为WGS84坐标系
Location.prototype.isWGS84 = function() {
  return this.coordinate_system === 'WGS-84';
};

// 实例方法：获取格式化的坐标信息
Location.prototype.getFormattedLocation = function() {
  return {
    longitude: parseFloat(this.longitude),
    latitude: parseFloat(this.latitude),
    coordinate_system: this.coordinate_system,
    timestamp: this.created_at
  };
};

// 类方法：根据设备ID获取最新位置
Location.findLatestByDeviceId = async function(deviceId) {
  return await this.findOne({
    where: { device_id: deviceId },
    order: [['created_at', 'DESC']]
  });
};

// 类方法：根据设备ID获取位置历史
Location.findByDeviceId = async function(deviceId, limit = 100) {
  return await this.findAll({
    where: { device_id: deviceId },
    order: [['created_at', 'DESC']],
    limit: limit
  });
};

// 类方法：根据时间范围获取位置记录
Location.findByTimeRange = async function(deviceId, startTime, endTime) {
  return await this.findAll({
    where: {
      device_id: deviceId,
      created_at: {
        [sequelize.Sequelize.Op.between]: [startTime, endTime]
      }
    },
    order: [['created_at', 'ASC']]
  });
};

// 类方法：创建位置记录
Location.createLocation = async function(deviceId, longitude, latitude, coordinateSystem = 'WGS-84') {
  return await this.create({
    device_id: deviceId,
    longitude: longitude,
    latitude: latitude,
    coordinate_system: coordinateSystem
  });
};

// 类方法：批量创建位置记录
Location.bulkCreateLocations = async function(locationData) {
  return await this.bulkCreate(locationData, {
    validate: true,
    returning: true
  });
};

// 类方法：获取设备轨迹统计
Location.getTrackStats = async function(deviceId, startTime, endTime) {
  const locations = await this.findByTimeRange(deviceId, startTime, endTime);
  
  if (locations.length === 0) {
    return {
      totalPoints: 0,
      distance: 0,
      duration: 0
    };
  }

  let totalDistance = 0;
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    totalDistance += calculateDistance(
      parseFloat(prev.latitude), parseFloat(prev.longitude),
      parseFloat(curr.latitude), parseFloat(curr.longitude)
    );
  }

  const duration = new Date(locations[locations.length - 1].created_at) - new Date(locations[0].created_at);

  return {
    totalPoints: locations.length,
    distance: Math.round(totalDistance * 100) / 100, // 保留2位小数
    duration: Math.round(duration / 1000) // 转换为秒
  };
};

// 类方法：清理过期的位置记录
Location.cleanupOldRecords = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await this.destroy({
    where: {
      created_at: {
        [sequelize.Sequelize.Op.lt]: cutoffDate
      }
    }
  });
};

// 辅助函数：计算两点间距离（单位：公里）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = Location;

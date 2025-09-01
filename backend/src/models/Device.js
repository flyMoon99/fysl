const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '设备ID，自增主键'
  },
  device_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '设备号，唯一标识',
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  device_alias: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '设备别名，用户自定义名称',
    validate: {
      len: [0, 100]
    }
  },
  device_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '设备备注，详细描述信息'
  },
  status: {
    type: DataTypes.ENUM('online', 'offline'),
    allowNull: false,
    defaultValue: 'offline',
    comment: '设备状态：online-在线，offline-离线'
  },
  device_model: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '设备型号',
    validate: {
      len: [0, 50]
    }
  },
  battery_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '剩余电量百分比，0-100',
    validate: {
      min: 0,
      max: 100
    }
  },
  service_status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: true,
    defaultValue: 'active',
    comment: '服务状态：active-服务中，inactive-未激活'
  },
  setting_status: {
    type: DataTypes.ENUM('active', 'expired'),
    allowNull: true,
    defaultValue: 'active',
    comment: '设置状态：active-服务中，expired-已到期'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联的客户ID，外键引用members表',
    references: {
      model: 'members',
      key: 'id'
    }
  },
  last_update_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后更新时间，设备最后一次上报数据的时间'
  },
  last_longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '最后一次上报的经度，精度到7位小数',
    validate: {
      min: -180,
      max: 180
    }
  },
  last_latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '最后一次上报的纬度，精度到7位小数',
    validate: {
      min: -90,
      max: 90
    }
  }
}, {
  tableName: 'gps_devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'GPS设备表 - 存储GPS设备信息',
  indexes: [
    {
      fields: ['device_number'],
      name: 'idx_gps_devices_device_number'
    },
    {
      fields: ['customer_id'],
      name: 'idx_gps_devices_customer_id'
    },
    {
      fields: ['status'],
      name: 'idx_gps_devices_status'
    },
    {
      fields: ['last_update_time'],
      name: 'idx_gps_devices_last_update_time'
    }
  ]
});

// 实例方法：检查设备是否在线
Device.prototype.isOnline = function() {
  return this.status === 'online';
};

// 实例方法：检查服务是否激活
Device.prototype.isServiceActive = function() {
  return this.service_status === 'active';
};

// 实例方法：检查设置是否有效
Device.prototype.isSettingActive = function() {
  return this.setting_status === 'active';
};

// 实例方法：更新最后定位信息
Device.prototype.updateLastLocation = async function(longitude, latitude) {
  this.last_longitude = longitude;
  this.last_latitude = latitude;
  this.last_update_time = new Date();
  return await this.save();
};

// 实例方法：更新电量
Device.prototype.updateBatteryLevel = async function(batteryLevel) {
  this.battery_level = batteryLevel;
  return await this.save();
};

// 实例方法：更新在线状态
Device.prototype.updateStatus = async function(status) {
  this.status = status;
  if (status === 'online') {
    this.last_update_time = new Date();
  }
  return await this.save();
};

// 类方法：根据设备号查找设备
Device.findByDeviceNumber = async function(deviceNumber) {
  return await this.findOne({
    where: { device_number: deviceNumber }
  });
};

// 类方法：根据客户ID查找设备
Device.findByCustomerId = async function(customerId) {
  return await this.findAll({
    where: { customer_id: customerId },
    order: [['created_at', 'DESC']]
  });
};

// 类方法：获取在线设备
Device.findOnlineDevices = async function() {
  return await this.findAll({
    where: { status: 'online' },
    order: [['last_update_time', 'DESC']]
  });
};

// 类方法：获取低电量设备
Device.findLowBatteryDevices = async function(threshold = 20) {
  return await this.findAll({
    where: {
      battery_level: {
        [sequelize.Sequelize.Op.lte]: threshold
      }
    },
    order: [['battery_level', 'ASC']]
  });
};

// 类方法：获取设备统计信息
Device.getDeviceStats = async function() {
  const totalCount = await this.count();
  const onlineCount = await this.count({ where: { status: 'online' } });
  const offlineCount = await this.count({ where: { status: 'offline' } });
  const activeServiceCount = await this.count({ where: { service_status: 'active' } });
  
  return {
    total: totalCount,
    online: onlineCount,
    offline: offlineCount,
    activeService: activeServiceCount
  };
};

module.exports = Device;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');

const TransportDetail = sequelize.define('TransportDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  waybill_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '运单id',
    references: {
      model: 'waybills',
      key: 'id'
    }
  },
  waybill_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '运单号'
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '设备id',
    references: {
      model: 'gps_devices',
      key: 'id'
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '经度'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '纬度'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '地址'
  },
  last_update_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后更新时间'
  },
  transport_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '运输备注'
  },
  license_plate: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车牌号'
  }
}, {
  tableName: 'transport_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 数据库表中没有updated_at字段
  comment: '运输明细表'
});

module.exports = TransportDetail;

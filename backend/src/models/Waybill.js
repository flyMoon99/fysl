const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/config/database');

const Waybill = sequelize.define('Waybill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  waybill_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '运单号'
  },
  waybill_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '运单备注'
  },
  create_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '创建人'
  },
  waybill_password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '运单密码'
  },
  status: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '正常',
    validate: {
      isIn: [['正常', '关闭']]
    },
    comment: '状态'
  }
}, {
  tableName: 'waybills',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 数据库表中没有updated_at字段
  comment: '运单表'
});

module.exports = Waybill;

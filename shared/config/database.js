const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fuyou_silu',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  timezone: '+08:00', // 设置数据库时区为东八区
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: {
    useUTC: false, // 不使用UTC时间
    dateStrings: true,
    typeCast: true,
    timezone: '+08:00',
    // PostgreSQL 特定配置
    application_name: 'fysl_app',
    // 在连接时设置时区
    afterConnect: async (client) => {
      await client.query("SET timezone = 'Asia/Shanghai'");
    }
  }
};

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    timezone: dbConfig.timezone, // 添加时区配置
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: {
      ...dbConfig.define,
      // 自定义时间戳处理
      hooks: {
        beforeCreate: (instance) => {
          // 只有在没有提供 created_at 时才设置为当前时间
          if (!instance.created_at) {
            instance.created_at = new Date();
          }
        }
      }
    },
    dialectOptions: dbConfig.dialectOptions // 添加方言选项，包含时区设置
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  dbConfig
};

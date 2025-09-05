-- 创建数据库表结构
-- 执行顺序：001_create_tables.sql

-- 1. 管理员表 - 存储系统管理员账户信息
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY, -- 管理员ID，自增主键
    username VARCHAR(50) UNIQUE NOT NULL, -- 管理员用户名，唯一标识
    password VARCHAR(255) NOT NULL, -- 管理员密码，使用bcrypt加密存储
    type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (type IN ('super', 'normal')), -- 管理员类型：super-超级管理员，normal-普通管理员
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 账户状态：active-启用，inactive-禁用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 账户创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 账户最后更新时间
);

-- 2. 会员表 - 存储系统会员账户信息
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY, -- 会员ID，自增主键
    username VARCHAR(50) UNIQUE NOT NULL, -- 会员用户名，唯一标识
    password VARCHAR(255) NOT NULL, -- 会员密码，使用bcrypt加密存储
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- 账户状态：active-启用，inactive-禁用
    last_login_at TIMESTAMP, -- 最后登录时间，用于统计会员活跃度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 账户创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 账户最后更新时间
);

-- 3. 会员登录日志表 - 记录会员登录操作历史，用于安全审计
CREATE TABLE IF NOT EXISTS member_login_logs (
    id SERIAL PRIMARY KEY, -- 日志ID，自增主键
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE, -- 关联的会员ID，外键引用members表
    operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 操作时间，记录登录的具体时间
    operation_url VARCHAR(255), -- 操作URL，记录登录时访问的页面地址
    ip_address VARCHAR(45), -- IP地址，记录登录者的IP地址，支持IPv6
    user_agent TEXT -- 用户代理，记录浏览器和设备信息
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username); -- 管理员用户名索引，加速登录查询
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status); -- 管理员状态索引，加速状态筛选查询
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username); -- 会员用户名索引，加速登录查询
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status); -- 会员状态索引，加速状态筛选查询
CREATE INDEX IF NOT EXISTS idx_member_login_logs_member_id ON member_login_logs(member_id); -- 会员登录日志会员ID索引，加速关联查询
CREATE INDEX IF NOT EXISTS idx_member_login_logs_operation_time ON member_login_logs(operation_time); -- 会员登录日志时间索引，加速时间范围查询

-- 创建更新时间触发器函数 - 自动更新记录的更新时间
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql'; -- 自动更新updated_at字段的触发器函数

-- 为表添加更新时间触发器 - 确保数据更新时自动维护更新时间
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- 管理员表更新时间触发器
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- 会员表更新时间触发器

-- 4. GPS设备表 - 存储GPS设备信息
CREATE TABLE IF NOT EXISTS gps_devices (
    id SERIAL PRIMARY KEY, -- 设备ID，自增主键
    device_number VARCHAR(50) UNIQUE NOT NULL, -- 设备号，唯一标识
    device_alias VARCHAR(100), -- 设备别名，用户自定义名称
    device_remarks TEXT, -- 设备备注，详细描述信息
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')), -- 设备状态：online-在线，offline-离线
    device_model VARCHAR(50), -- 设备型号
    battery_level INTEGER DEFAULT 0 CHECK (battery_level >= 0 AND battery_level <= 100), -- 剩余电量百分比，0-100
    service_status VARCHAR(20) DEFAULT 'active' CHECK (service_status IN ('active', 'inactive')), -- 服务状态：active-服务中，inactive-未激活
    setting_status VARCHAR(20) DEFAULT 'active' CHECK (setting_status IN ('active', 'expired')), -- 设置状态：active-服务中，expired-已到期
    customer_id INTEGER REFERENCES members(id) ON DELETE SET NULL, -- 关联的客户ID，外键引用members表
    last_update_time TIMESTAMP, -- 最后更新时间，设备最后一次上报数据的时间
    last_longitude DECIMAL(10, 7), -- 最后一次上报的经度，精度到7位小数
    last_latitude DECIMAL(10, 7), -- 最后一次上报的纬度，精度到7位小数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 设备创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 设备信息最后更新时间
);

-- 5. GPS定位表 - 存储GPS设备的历史定位数据
CREATE TABLE IF NOT EXISTS gps_locations (
    id SERIAL PRIMARY KEY, -- 定位记录ID，自增主键
    device_id INTEGER NOT NULL REFERENCES gps_devices(id) ON DELETE CASCADE, -- 关联的设备ID，外键引用gps_devices表
    longitude DECIMAL(10, 7) NOT NULL, -- 经度，精度到7位小数
    latitude DECIMAL(10, 7) NOT NULL, -- 纬度，精度到7位小数
    coordinate_system VARCHAR(10) NOT NULL DEFAULT 'WGS-84' CHECK (coordinate_system IN ('WGS-84', 'GCJ-02')), -- 坐标系：WGS-84-国际标准，GCJ-02-国测局标准
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 定位数据添加时间
);

-- GPS相关表索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_gps_devices_device_number ON gps_devices(device_number); -- 设备号索引，加速设备查询
CREATE INDEX IF NOT EXISTS idx_gps_devices_customer_id ON gps_devices(customer_id); -- 客户ID索引，加速客户设备查询
CREATE INDEX IF NOT EXISTS idx_gps_devices_status ON gps_devices(status); -- 设备状态索引，加速状态筛选查询
CREATE INDEX IF NOT EXISTS idx_gps_devices_last_update_time ON gps_devices(last_update_time); -- 最后更新时间索引，加速时间范围查询
CREATE INDEX IF NOT EXISTS idx_gps_locations_device_id ON gps_locations(device_id); -- 设备ID索引，加速关联查询
CREATE INDEX IF NOT EXISTS idx_gps_locations_created_at ON gps_locations(created_at); -- 定位时间索引，加速时间范围查询

-- 为GPS设备表添加更新时间触发器
CREATE TRIGGER update_gps_devices_updated_at BEFORE UPDATE ON gps_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- GPS设备表更新时间触发器


--6 运单表
CREATE TABLE waybills (
    id SERIAL PRIMARY KEY,
    waybill_number VARCHAR(100) NOT NULL UNIQUE COMMENT '运单号',
    waybill_remarks TEXT COMMENT '运单备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    created_by VARCHAR(100) NOT NULL COMMENT '创建人',
    view_password VARCHAR(255) COMMENT '查看密码'
);

--7 运输明细表
CREATE TABLE transport_details (
    id SERIAL PRIMARY KEY,
    waybill_id INTEGER NOT NULL COMMENT '运单id',
    waybill_number VARCHAR(100) NOT NULL COMMENT '运单号',
    device_id INTEGER NOT NULL COMMENT '设备id',
    longitude DECIMAL(10, 7) COMMENT '经度',
    latitude DECIMAL(10, 7) COMMENT '纬度',
    location VARCHAR(255) COMMENT '位置',
    last_update_time TIMESTAMP COMMENT '最后更新时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    transport_remarks TEXT COMMENT '运输备注',
    license_plate VARCHAR(20) COMMENT '车牌号',
    
    -- 外键约束
    FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES gps_devices(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_waybill_id (waybill_id),
    INDEX idx_device_id (device_id),
    INDEX idx_waybill_number (waybill_number),
    INDEX idx_created_at (created_at)
);
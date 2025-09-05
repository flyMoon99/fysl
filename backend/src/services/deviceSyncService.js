const { Device, Location } = require('../models');
const { gpsApiClient } = require('../utils/gpsApiClient');
const { baiduGeocodingService } = require('../utils/baiduGeocodingService');
const { Op } = require('sequelize');

/**
 * 设备同步服务类
 */
class DeviceSyncService {
  /**
   * 同步所有设备信息
   * @param {object} options 同步选项
   * @returns {Promise<object>} 同步结果统计
   */
  async syncAllDevices(options = {}) {
    const syncResult = {
      total: 0,
      created: 0,
      updated: 0,
      errors: []
    };

    try {
      console.log('[设备同步] 开始从第三方API获取设备信息...');
      
      // 从第三方API获取所有设备信息
      const apiDevices = await gpsApiClient.getAllDeviceInfos(options);
      syncResult.total = apiDevices.length;

      console.log(`[设备同步] 获取到 ${apiDevices.length} 个设备，开始同步到数据库...`);

      // 批量同步设备
      for (const apiDevice of apiDevices) {
        try {
          await this.syncSingleDevice(apiDevice, syncResult);
        } catch (error) {
          console.error(`[设备同步] 同步设备 ${apiDevice.deviceId} 失败:`, error);
          syncResult.errors.push({
            deviceId: apiDevice.deviceId,
            error: error.message
          });
        }
      }

      console.log(`[设备同步] 同步完成: 总数${syncResult.total}, 新增${syncResult.created}, 更新${syncResult.updated}, 错误${syncResult.errors.length}`);
      return syncResult;
    } catch (error) {
      console.error('[设备同步] 同步过程发生错误:', error);
      throw error;
    }
  }

  /**
   * 同步单个设备信息
   * @param {object} apiDevice API返回的设备数据
   * @param {object} syncResult 同步结果统计对象
   */
  async syncSingleDevice(apiDevice, syncResult) {
    // 转换API数据为本地格式
    const deviceData = gpsApiClient.transformDeviceData(apiDevice);

    // 查找现有设备
    const existingDevice = await Device.findOne({
      where: { device_number: deviceData.device_number }
    });

    if (existingDevice) {
      // 更新现有设备
      await existingDevice.update({
        status: deviceData.status,
        battery_level: deviceData.battery_level,
        last_update_time: deviceData.last_update_time,
        last_longitude: deviceData.last_longitude,
        last_latitude: deviceData.last_latitude
      });
      syncResult.updated++;
      console.log(`[设备同步] 更新设备: ${deviceData.device_number}`);
    } else {
      // 创建新设备
      await Device.create(deviceData);
      syncResult.created++;
      console.log(`[设备同步] 创建设备: ${deviceData.device_number}`);
    }
  }

  /**
   * 同步指定设备的历史轨迹
   * @param {string} deviceNumber 设备号
   * @param {string} startTime 开始时间
   * @param {string} endTime 结束时间
   * @returns {Promise<object>} 同步结果
   */
  async syncDeviceTrack(deviceNumber, startTime, endTime) {
    const syncResult = {
      deviceNumber: deviceNumber,
      totalPoints: 0,
      savedPoints: 0,
      duplicatePoints: 0,
      errors: []
    };

    try {
      console.log(`[轨迹同步] 开始同步设备 ${deviceNumber} 的轨迹数据...`);
      console.log(`[轨迹同步] 时间范围: ${startTime} 至 ${endTime}`);

      // 查找设备
      const device = await Device.findOne({
        where: { device_number: deviceNumber }
      });

      if (!device) {
        throw new Error(`设备 ${deviceNumber} 不存在`);
      }

      // 验证时间范围
      const start = new Date(startTime);
      const end = new Date(endTime);
      const now = new Date();
      
      if (start > now || end > now) {
        throw new Error('不能查询未来时间的轨迹数据');
      }

      if (start >= end) {
        throw new Error('开始时间必须早于结束时间');
      }

      // 检查时间跨度不超过7天
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        throw new Error('时间跨度不能超过7天');
      }

      // 从第三方API获取轨迹数据
      const trackResult = await gpsApiClient.getPlayBackByGpsno(
        deviceNumber,
        startTime,
        endTime
      );

      if (!trackResult.data || !trackResult.data.detail) {
        console.log(`[轨迹同步] 设备 ${deviceNumber} 在指定时间段内没有轨迹数据`);
        return syncResult;
      }

      const trackPoints = trackResult.data.detail;
      syncResult.totalPoints = trackPoints.length;

      console.log(`[轨迹同步] 获取到 ${trackPoints.length} 个轨迹点，开始保存...`);

      // 转换轨迹数据
      const locationData = gpsApiClient.transformTrackData(device.id, trackPoints);

      // 批量处理轨迹点
      for (const locationPoint of locationData) {
        try {
          // 检查是否已存在相同时间的定位记录
          const existingLocation = await Location.findOne({
            where: {
              device_id: device.id,
              created_at: locationPoint.created_at
            }
          });

          if (existingLocation) {
            syncResult.duplicatePoints++;
            continue;
          }

          // 获取地址信息（如果百度地图服务可用）
          let address = null;
          if (baiduGeocodingService.isAvailable()) {
            try {
              console.log(`[轨迹同步] 开始地址解析，坐标: ${locationPoint.longitude}, ${locationPoint.latitude}`);
              const geocodeResult = await baiduGeocodingService.reverseGeocode(
                locationPoint.longitude, 
                locationPoint.latitude, 
                locationPoint.coordinate_system === 'WGS-84' ? 'wgs84ll' : 'gcj02ll'
              );
              address = geocodeResult.address;
              console.log(`[轨迹同步] 地址解析成功: ${address}`);
            } catch (geocodeError) {
                          console.error(`[轨迹同步] 地址解析失败:`, geocodeError.message);
            // 根据坐标范围提供大致的地理位置信息
            address = this.getLocationByCoordinate(locationPoint.longitude, locationPoint.latitude);
            }
          } else {
            console.warn(`[轨迹同步] 百度地图服务不可用，使用坐标范围判断地理位置`);
            address = this.getLocationByCoordinate(locationPoint.longitude, locationPoint.latitude);
          }

          // 创建新的定位记录
          await Location.create({
            ...locationPoint,
            address: address
          });
          syncResult.savedPoints++;
        } catch (error) {
          console.error(`[轨迹同步] 保存轨迹点失败:`, error);
          syncResult.errors.push({
            point: locationPoint,
            error: error.message
          });
        }
      }

      console.log(`[轨迹同步] 设备 ${deviceNumber} 轨迹同步完成: 总点数${syncResult.totalPoints}, 保存${syncResult.savedPoints}, 重复${syncResult.duplicatePoints}, 错误${syncResult.errors.length}`);
      return syncResult;
    } catch (error) {
      console.error(`[轨迹同步] 同步设备 ${deviceNumber} 轨迹失败:`, error);
      throw error;
    }
  }

  /**
   * 获取设备当前位置并更新数据库
   * @param {string} deviceNumber 设备号
   * @returns {Promise<object>} 位置信息
   */
  async syncDeviceCurrentLocation(deviceNumber) {
    try {
      console.log(`[位置同步] 开始同步设备 ${deviceNumber} 的当前位置...`);

      // 查找设备
      const device = await Device.findOne({
        where: { device_number: deviceNumber }
      });

      if (!device) {
        throw new Error(`设备 ${deviceNumber} 不存在`);
      }

      // 从第三方API获取当前位置
      const locationResult = await gpsApiClient.getCurrentByGpsno(deviceNumber);

      if (!locationResult.data) {
        throw new Error('获取当前位置失败');
      }

      const locationData = locationResult.data;

      // 更新设备的最后位置信息
      await device.update({
        status: locationData.status === '1' ? 'online' : 'offline',
        battery_level: Math.round(parseFloat(locationData.soc || 0)),
        last_update_time: locationData.lastUploadTime ? new Date(locationData.lastUploadTime) : new Date(),
        last_longitude: parseFloat(locationData.longitude || 0),
        last_latitude: parseFloat(locationData.latitude || 0)
      });

      // 创建新的位置记录
      if (locationData.longitude && locationData.latitude) {
        // 获取地址信息（如果百度地图服务可用）
        let address = null;
        console.log(`[位置同步] 检查百度地图服务可用性: ${baiduGeocodingService.isAvailable()}`);
        
        if (baiduGeocodingService.isAvailable()) {
          try {
            console.log(`[位置同步] 开始地址解析，坐标: ${locationData.longitude}, ${locationData.latitude}`);
            const geocodeResult = await baiduGeocodingService.reverseGeocode(
              parseFloat(locationData.longitude), 
              parseFloat(locationData.latitude), 
              'wgs84ll'
            );
            address = geocodeResult.address;
            console.log(`[位置同步] 地址解析成功: ${address}`);
          } catch (geocodeError) {
            console.error(`[位置同步] 地址解析失败:`, geocodeError.message);
            // 根据坐标范围提供大致的地理位置信息
            address = this.getLocationByCoordinate(parseFloat(locationData.longitude), parseFloat(locationData.latitude));
          }
        } else {
          console.warn(`[位置同步] 百度地图服务不可用，使用坐标范围判断地理位置`);
          address = this.getLocationByCoordinate(parseFloat(locationData.longitude), parseFloat(locationData.latitude));
        }

        await Location.create({
          device_id: device.id,
          longitude: parseFloat(locationData.longitude),
          latitude: parseFloat(locationData.latitude),
          coordinate_system: 'WGS-84',
          address: address
        });
      }

      console.log(`[位置同步] 设备 ${deviceNumber} 位置同步完成`);
      
      return {
        deviceNumber: deviceNumber,
        status: device.status,
        battery_level: device.battery_level,
        longitude: device.last_longitude,
        latitude: device.last_latitude,
        updateTime: device.last_update_time
      };
    } catch (error) {
      console.error(`[位置同步] 同步设备 ${deviceNumber} 位置失败:`, error);
      throw error;
    }
  }

  /**
   * 根据坐标获取大致地理位置信息（当百度地图API不可用时的备用方案）
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {string} 大致地理位置
   */
  getLocationByCoordinate(lng, lat) {
    // 中国大陆的大致坐标范围
    if (lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54) {
      // 根据坐标范围判断大致区域
      if (lng >= 116 && lng <= 117 && lat >= 39 && lat <= 41) {
        return '北京市';
      } else if (lng >= 121 && lng <= 122 && lat >= 31 && lat <= 32) {
        return '上海市';
      } else if (lng >= 113 && lng <= 114.5 && lat >= 22 && lat <= 24) {
        return '广东省广州市';
      } else if (lng >= 114 && lng <= 114.5 && lat >= 22 && lat <= 23) {
        return '广东省深圳市';
      } else if (lng >= 106 && lng <= 107 && lat >= 29 && lat <= 30) {
        return '重庆市';
      } else if (lng >= 104 && lng <= 105 && lat >= 30 && lat <= 31) {
        return '四川省成都市';
      } else if (lng >= 108 && lng <= 109 && lat >= 34 && lat <= 35) {
        return '陕西省西安市';
      } else if (lng >= 126 && lng <= 127 && lat >= 45 && lat <= 46) {
        return '黑龙江省哈尔滨市';
      } else if (lng >= 87 && lng <= 88 && lat >= 43 && lat <= 44) {
        return '新疆维吾尔自治区乌鲁木齐市';
      } else if (lng >= 78 && lng <= 82 && lat >= 43 && lat <= 45) {
        return '新疆维吾尔自治区';
      } else {
        // 根据大致区域划分
        if (lng < 100) {
          return '中国西部地区';
        } else if (lng > 120) {
          return '中国东部地区';
        } else {
          return '中国中部地区';
        }
      }
    } else {
      // 非中国大陆地区
      return `坐标: ${lng.toFixed(6)}, ${lat.toFixed(6)}`;
    }
  }

  /**
   * 清理重复的位置记录
   * @param {number} deviceId 设备ID
   * @returns {Promise<number>} 清理的记录数
   */
  async cleanupDuplicateLocations(deviceId) {
    try {
      console.log(`[数据清理] 开始清理设备 ${deviceId} 的重复位置记录...`);

      // 查找重复的位置记录
      const duplicateLocations = await Location.findAll({
        where: { device_id: deviceId },
        order: [['created_at', 'ASC']],
        group: ['longitude', 'latitude', 'created_at'],
        having: Location.sequelize.literal('COUNT(*) > 1')
      });

      let cleanedCount = 0;
      for (const location of duplicateLocations) {
        // 保留最早的记录，删除其他重复记录
        const duplicates = await Location.findAll({
          where: {
            device_id: deviceId,
            longitude: location.longitude,
            latitude: location.latitude,
            created_at: location.created_at
          },
          order: [['id', 'ASC']]
        });

        if (duplicates.length > 1) {
          // 删除除第一条外的所有重复记录
          for (let i = 1; i < duplicates.length; i++) {
            await duplicates[i].destroy();
            cleanedCount++;
          }
        }
      }

      console.log(`[数据清理] 清理完成，删除了 ${cleanedCount} 条重复记录`);
      return cleanedCount;
    } catch (error) {
      console.error(`[数据清理] 清理重复位置记录失败:`, error);
      throw error;
    }
  }
}

// 创建服务实例
const deviceSyncService = new DeviceSyncService();

module.exports = {
  DeviceSyncService,
  deviceSyncService
};

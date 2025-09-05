const axios = require('axios');
const crypto = require('crypto');
const { appConfig } = require('../../../shared/config/app');

/**
 * GPS API客户端类
 */
class GPSApiClient {
  constructor() {
    // 从共享配置获取GPS API配置
    this.baseURL = appConfig.gps.baseURL;
    this.appKey = appConfig.gps.appKey;
    this.appSecret = appConfig.gps.appSecret;
    
    console.log(`[GPS API] 初始化GPS客户端 - baseURL: ${this.baseURL}, appKey: ${this.appKey}`);
    
    // 创建axios实例
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: appConfig.gps.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  /**
   * 生成API签名
   * @param {string} method 接口方法名
   * @param {string} data 请求数据JSON字符串
   * @param {string} timestamp 时间戳
   * @returns {string} MD5签名
   */
  generateSignature(method, data, timestamp) {
    // 按照API文档要求的签名规则
    const signString = `${this.appSecret}app_key${this.appKey}data${data}method${method}timestamp${timestamp}${this.appSecret}`;
    return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
  }

  /**
   * 格式化时间戳
   * @param {Date} date 日期对象
   * @returns {string} 格式化的时间字符串
   */
  formatTimestamp(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 发送API请求
   * @param {string} method 接口方法名
   * @param {object} requestData 请求数据对象
   * @returns {Promise<object>} API响应数据
   */
  async makeRequest(method, requestData) {
    try {
      const timestamp = this.formatTimestamp();
      const data = JSON.stringify(requestData);
      const signature = this.generateSignature(method, data, timestamp);

      const postData = new URLSearchParams({
        method: method,
        timestamp: timestamp,
        app_key: this.appKey,
        sign: signature,
        data: data
      });

      console.log(`[GPS API] 请求方法: ${method}`);
      console.log(`[GPS API] 请求数据: ${data}`);
      console.log(`[GPS API] 签名字符串: ${signature}`);

      const response = await this.httpClient.post('', postData);
      
      if (response.status !== 200) {
        throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
      }

      const result = response.data;
      console.log(`[GPS API] 响应数据:`, result);

      // 检查API返回的业务状态码
      if (result.code !== 0) {
        throw new Error(`API业务错误: ${result.code} - ${result.message || '未知错误'}`);
      }

      return result;
    } catch (error) {
      console.error(`[GPS API] 请求失败:`, error);
      throw error;
    }
  }

  /**
   * 同步设备信息
   * @param {object} options 查询选项
   * @param {string} options.orgId 机构ID
   * @param {string} options.gpsnos 设备号列表，逗号分隔
   * @param {string} options.updateTimeFrom 更新时间起始
   * @param {string} options.updateTimeTo 更新时间结束
   * @param {number} options.pageNo 页码，默认1
   * @param {number} options.pageSize 每页条数，默认100
   * @returns {Promise<object>} 设备信息列表
   */
  async syncDeviceInfos(options = {}) {
    const method = 'device.syncDeviceInfos';
    const requestData = {
      orgId: options.orgId || '',
      gpsnos: options.gpsnos || '',
      updateTimeFrom: options.updateTimeFrom || '',
      updateTimeTo: options.updateTimeTo || '',
      pageNo: options.pageNo || 1,
      pageSize: options.pageSize || 100,
      serviceStartDateFrom: options.serviceStartDateFrom || '',
      serviceStartDateTo: options.serviceStartDateTo || ''
    };

    return await this.makeRequest(method, requestData);
  }

  /**
   * 获取所有设备信息（自动分页获取）
   * @param {object} options 查询选项
   * @returns {Promise<Array>} 所有设备信息
   */
  async getAllDeviceInfos(options = {}) {
    const allDevices = [];
    let pageNo = 1;
    const pageSize = options.pageSize || 100;

    try {
      // 获取第一页数据
      const firstPageResult = await this.syncDeviceInfos({
        ...options,
        pageNo: pageNo,
        pageSize: pageSize
      });

      if (!firstPageResult.data || !firstPageResult.data.result) {
        return allDevices;
      }

      // 添加第一页数据
      allDevices.push(...firstPageResult.data.result);

      // 计算总页数
      const totalCount = parseInt(firstPageResult.data.totalCount || 0);
      const totalPages = Math.ceil(totalCount / pageSize);

      console.log(`[GPS API] 总共 ${totalCount} 个设备，需要获取 ${totalPages} 页`);

      // 获取剩余页数据
      for (pageNo = 2; pageNo <= totalPages; pageNo++) {
        const pageResult = await this.syncDeviceInfos({
          ...options,
          pageNo: pageNo,
          pageSize: pageSize
        });

        if (pageResult.data && pageResult.data.result) {
          allDevices.push(...pageResult.data.result);
        }

        // 添加延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[GPS API] 成功获取 ${allDevices.length} 个设备信息`);
      return allDevices;
    } catch (error) {
      console.error(`[GPS API] 获取所有设备信息失败:`, error);
      throw error;
    }
  }

  /**
   * 格式化时间为API要求的格式
   * @param {string} dateTimeString 时间字符串
   * @returns {string} API要求的时间格式
   */
  formatApiDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 不补零
    const day = date.getDate(); // 不补零
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 根据设备号获取历史轨迹
   * @param {string} gpsno 设备号
   * @param {string} starttime 开始时间，格式: YYYY-MM-DD HH:mm:ss
   * @param {string} endtime 结束时间，格式: YYYY-MM-DD HH:mm:ss
   * @param {number} includeEmptyLoc 是否包含空定位，0-不包含，1-包含
   * @returns {Promise<object>} 轨迹数据
   */
  async getPlayBackByGpsno(gpsno, starttime, endtime, includeEmptyLoc = 0) {
    const method = 'device.interfaces.getPlayBackByGpsno';
    
    // 转换时间格式为API要求的格式
    const formattedStartTime = this.formatApiDateTime(starttime);
    const formattedEndTime = this.formatApiDateTime(endtime);
    
    const requestData = {
      gpsno: gpsno,
      starttime: formattedStartTime,
      endtime: formattedEndTime,
      includeEmptyLoc: includeEmptyLoc.toString()
    };

    console.log(`[GPS API] 格式化时间: ${starttime} -> ${formattedStartTime}, ${endtime} -> ${formattedEndTime}`);

    return await this.makeRequest(method, requestData);
  }

  /**
   * 获取当前位置信息（根据设备号）
   * @param {string} gpsno 设备号
   * @returns {Promise<object>} 当前位置信息
   */
  async getCurrentByGpsno(gpsno) {
    const method = 'device.interfaces.getCurrentByGpsno';
    const requestData = {
      gpsno: gpsno
    };

    return await this.makeRequest(method, requestData);
  }

  /**
   * 转换API设备数据为本地数据库格式
   * @param {object} apiDevice API返回的设备数据
   * @returns {object} 本地数据库格式的设备数据
   */
  transformDeviceData(apiDevice) {
    return {
      device_number: apiDevice.deviceId,
      device_alias: '', // API未提供，默认为空
      device_remarks: '', // API未提供，默认为空
      status: apiDevice.status === '1' ? 'online' : 'offline',
      device_model: '', // API未提供，默认为空
      battery_level: Math.round(parseFloat(apiDevice.soc || 0)),
      service_status: 'active', // 根据业务需求设置
      setting_status: 'active', // 根据业务需求设置
      customer_id: null, // 需要业务逻辑映射
      last_update_time: apiDevice.lastUploadTime ? new Date(apiDevice.lastUploadTime) : null,
      last_longitude: parseFloat(apiDevice.longitude || 0),
      last_latitude: parseFloat(apiDevice.latitude || 0)
    };
  }

  /**
   * 转换API轨迹数据为本地数据库格式
   * @param {string} deviceId 设备ID
   * @param {Array} trackPoints 轨迹点数组 [[timestamp, lat, lng], ...]
   * @returns {Array} 本地数据库格式的位置数据数组
   */
  transformTrackData(deviceId, trackPoints) {
    if (!trackPoints || !Array.isArray(trackPoints)) {
      return [];
    }

    return trackPoints.map(point => {
      const [timestamp, lat, lng] = point;
      
      // 修复时间戳转换问题
      let dateObj;
      if (typeof timestamp === 'number') {
        // 如果是数字时间戳，需要判断是秒还是毫秒
        if (timestamp > 9999999999) {
          // 13位数字，毫秒时间戳
          dateObj = new Date(timestamp);
        } else {
          // 10位数字，秒时间戳
          dateObj = new Date(timestamp * 1000);
        }
      } else if (typeof timestamp === 'string') {
        // 如果是字符串，直接解析
        dateObj = new Date(timestamp);
      } else {
        // 其他情况使用当前时间
        dateObj = new Date();
      }
      
      // 验证日期是否有效
      if (isNaN(dateObj.getTime())) {
        console.warn(`[GPS API] 无效的时间戳: ${timestamp}, 使用当前时间`);
        dateObj = new Date();
      }
      
      return {
        device_id: deviceId,
        longitude: parseFloat(lng),
        latitude: parseFloat(lat),
        coordinate_system: 'WGS-84', // API返回的是WGS84坐标系
        created_at: dateObj
      };
    });
  }
}

// 创建单例实例
const gpsApiClient = new GPSApiClient();

module.exports = {
  GPSApiClient,
  gpsApiClient
};

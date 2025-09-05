const axios = require('axios');
const { appConfig } = require('../../../shared/config/app');

/**
 * 百度地图逆向地理编码服务
 */
class BaiduGeocodingService {
  constructor() {
    // 百度地图API配置
    this.baseURL = 'https://api.map.baidu.com/reverse_geocoding/v3/';
    this.ak = appConfig.baidu?.ak || process.env.BAIDU_MAP_AK || process.env.BAIDU_MAP_API_KEY;
    
    if (!this.ak) {
      console.warn('[百度地图] 未配置百度地图AK，地址解析功能将不可用');
    } else {
      console.log(`[百度地图] 初始化成功，AK: ${this.ak.substring(0, 8)}...`);
    }
    
    // 创建axios实例
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 坐标系转换 - WGS84转BD09
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {object} 转换后的坐标
   */
  wgs84ToBd09(lng, lat) {
    // 先转换为GCJ02
    const gcj = this.wgs84ToGcj02(lng, lat);
    // 再转换为BD09
    return this.gcj02ToBd09(gcj.lng, gcj.lat);
  }

  /**
   * WGS84转GCJ02
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {object} 转换后的坐标
   */
  wgs84ToGcj02(lng, lat) {
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    
    let dLat = this.transformLat(lng - 105.0, lat - 35.0);
    let dLng = this.transformLng(lng - 105.0, lat - 35.0);
    
    const radLat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    
    return {
      lng: lng + dLng,
      lat: lat + dLat
    };
  }

  /**
   * GCJ02转BD09
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {object} 转换后的坐标
   */
  gcj02ToBd09(lng, lat) {
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * Math.PI * 3000.0 / 180.0);
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * Math.PI * 3000.0 / 180.0);
    
    return {
      lng: z * Math.cos(theta) + 0.0065,
      lat: z * Math.sin(theta) + 0.006
    };
  }

  /**
   * 纬度转换辅助函数
   */
  transformLat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  /**
   * 经度转换辅助函数
   */
  transformLng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  }

  /**
   * 逆向地理编码 - 根据坐标获取地址
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @param {string} coordtype 坐标系类型，默认为'wgs84ll'
   * @returns {Promise<object>} 地址信息
   */
  async reverseGeocode(lng, lat, coordtype = 'wgs84ll') {
    // 重新获取最新的AK配置
    const currentAk = appConfig.baidu?.ak || process.env.BAIDU_MAP_AK || process.env.BAIDU_MAP_API_KEY;
    if (!currentAk) {
      throw new Error('百度地图AK未配置');
    }

    try {
      // 如果是WGS84坐标系，需要转换为BD09
      let targetLng = lng;
      let targetLat = lat;
      let targetCoordtype = 'bd09ll';

      if (coordtype === 'wgs84ll') {
        const bd09Coord = this.wgs84ToBd09(lng, lat);
        targetLng = bd09Coord.lng;
        targetLat = bd09Coord.lat;
      }

      const params = {
        ak: currentAk,
        output: 'json',
        coordtype: targetCoordtype,
        location: `${targetLat},${targetLng}`,
        extensions_poi: 0, // 不返回POI信息，减少响应大小
        extensions_road: false,
        extensions_town: false
      };

      console.log(`[百度地图] 逆向解析坐标: ${lng}, ${lat} -> ${targetLng}, ${targetLat}`);

      const response = await this.httpClient.get('', { params });

      if (response.data.status !== 0) {
        const errorMsg = `百度地图API错误: ${response.data.status} - ${response.data.message || '未知错误'}`;
        console.error(`[百度地图] ${errorMsg}`);
        
        // 根据错误码提供更友好的提示
        if (response.data.status === 240) {
          console.error('[百度地图] 提示: APP服务被禁用，请检查百度地图控制台中是否开通了逆向地理编码服务');
        } else if (response.data.status === 101) {
          console.error('[百度地图] 提示: AK参数不存在，请检查BAIDU_MAP_AK配置');
        } else if (response.data.status === 102) {
          console.error('[百度地图] 提示: mcode不匹配，请检查AK配置');
        }
        
        throw new Error(errorMsg);
      }

      const result = response.data.result;
      if (!result) {
        throw new Error('百度地图API返回结果为空');
      }

      // 构建详细地址
      const addressComponents = result.addressComponent;
      let formattedAddress = result.formatted_address || '';

      // 如果格式化地址为空，尝试拼接地址组件
      if (!formattedAddress && addressComponents) {
        const parts = [
          addressComponents.country || '',
          addressComponents.province || '',
          addressComponents.city || '',
          addressComponents.district || '',
          addressComponents.street || '',
          addressComponents.street_number || ''
        ].filter(part => part.length > 0);
        
        formattedAddress = parts.join('');
      }

      console.log(`[百度地图] 地址解析成功: ${formattedAddress}`);

      return {
        address: formattedAddress,
        province: addressComponents?.province || '',
        city: addressComponents?.city || '',
        district: addressComponents?.district || '',
        street: addressComponents?.street || '',
        street_number: addressComponents?.street_number || '',
        country: addressComponents?.country || '中国',
        adcode: addressComponents?.adcode || '',
        town: addressComponents?.town || '',
        confidence: result.confidence || 0,
        comprehension: result.comprehension || 0,
        level: result.level || ''
      };
    } catch (error) {
      console.error('[百度地图] 逆向地理编码失败:', error.message);
      
      // 返回默认地址信息，避免阻塞位置数据保存
      return {
        address: '地址解析失败',
        province: '',
        city: '',
        district: '',
        street: '',
        street_number: '',
        country: '中国',
        adcode: '',
        town: '',
        confidence: 0,
        comprehension: 0,
        level: '',
        error: error.message
      };
    }
  }

  /**
   * 批量逆向地理编码
   * @param {Array} coordinates 坐标数组 [{lng, lat}, ...]
   * @param {string} coordtype 坐标系类型
   * @returns {Promise<Array>} 地址信息数组
   */
  async batchReverseGeocode(coordinates, coordtype = 'wgs84ll') {
    const results = [];
    
    for (const coord of coordinates) {
      try {
        const address = await this.reverseGeocode(coord.lng, coord.lat, coordtype);
        results.push({
          ...coord,
          ...address
        });
        
        // 添加延迟避免请求过于频繁（百度API限制）
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[百度地图] 批量解析坐标 ${coord.lng}, ${coord.lat} 失败:`, error);
        results.push({
          ...coord,
          address: '地址解析失败',
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 检查服务是否可用
   * @returns {boolean} 是否可用
   */
  isAvailable() {
    // 重新检查环境变量，确保获取最新的配置
    const currentAk = appConfig.baidu?.ak || process.env.BAIDU_MAP_AK || process.env.BAIDU_MAP_API_KEY;
    return !!currentAk;
  }
}

// 创建单例实例
const baiduGeocodingService = new BaiduGeocodingService();

module.exports = {
  BaiduGeocodingService,
  baiduGeocodingService
};

/**
 * 百度地图工具函数 - 管理后台版本
 * 提供地图初始化、坐标转换、标记管理等功能
 */

// 百度地图配置
const MAP_CONFIG = {
  apiKey: 'tKs3uko2O8IgvpfjwFlUI5MVDjbgEjOB',
  version: '3.0',
  // 默认地图中心点（北京）
  defaultCenter: { lng: 116.404, lat: 39.915 },
  defaultZoom: 11,
  // 地图样式配置
  mapStyle: {
    style: 'normal' // normal, light, dark, midnight, etc.
  }
}

// 百度地图性能优化配置
const MAP_PERFORMANCE_CONFIG = {
  // 启用地图性能优化
  enablePerformanceOptimization: true,
  // 地图渲染优化
  enableHighResolution: true,
  enableAutoResize: true,
  // 事件优化
  enablePassiveEvents: true
}

/**
 * 坐标转换工具
 */
export const CoordinateConverter = {
  /**
   * WGS84转换为BD09坐标
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {Object} {lng, lat}
   */
  wgs84ToBd09(lng, lat) {
    // 先转换为GCJ02
    const gcj02 = this.wgs84ToGcj02(lng, lat)
    // 再转换为BD09
    return this.gcj02ToBd09(gcj02.lng, gcj02.lat)
  },

  /**
   * WGS84转换为GCJ02坐标
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {Object} {lng, lat}
   */
  wgs84ToGcj02(lng, lat) {
    const PI = 3.1415926535897932384626
    const a = 6378245.0
    const ee = 0.00669342162296594323
    
    let dLat = this.transformLat(lng - 105.0, lat - 35.0)
    let dLng = this.transformLng(lng - 105.0, lat - 35.0)
    const radLat = lat / 180.0 * PI
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI)
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI)
    
    return {
      lng: lng + dLng,
      lat: lat + dLat
    }
  },

  /**
   * GCJ02转换为BD09坐标
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {Object} {lng, lat}
   */
  gcj02ToBd09(lng, lat) {
    const PI = 3.1415926535897932384626
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * PI)
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * PI)
    
    return {
      lng: z * Math.cos(theta) + 0.0065,
      lat: z * Math.sin(theta) + 0.006
    }
  },

  transformLat(lng, lat) {
    const PI = 3.1415926535897932384626
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 
              0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
    return ret
  },

  transformLng(lng, lat) {
    const PI = 3.1415926535897932384626
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 
              0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
    return ret
  }
}

/**
 * 百度地图工具类
 */
export class BaiduMapUtils {
  constructor() {
    this.map = null
    this.BMap = null
    this.markers = new Map() // 存储标记点
    this.polylines = new Map() // 存储轨迹线
  }

  /**
   * 动态加载百度地图API
   * @returns {Promise} 
   */
  loadBaiduMapAPI() {
    return new Promise((resolve, reject) => {
      if (window.BMap) {
        this.BMap = window.BMap
        resolve(window.BMap)
        return
      }

      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://api.map.baidu.com/api?v=${MAP_CONFIG.version}&ak=${MAP_CONFIG.apiKey}&callback=initBaiduMap`
      script.onerror = reject
      
      window.initBaiduMap = () => {
        this.BMap = window.BMap
        
        // 优化百度地图API性能配置
        if (this.BMap && this.BMap.Map) {
          // 设置地图默认配置以优化性能
          this.BMap.Map.prototype._enableScrollWheelZoom = this.BMap.Map.prototype.enableScrollWheelZoom
          this.BMap.Map.prototype.enableScrollWheelZoom = function(enable) {
            this._enableScrollWheelZoom(enable)
            // 添加被动事件监听器优化
            if (enable && this._container) {
              this._container.style.touchAction = 'pan-x pan-y'
            }
          }
        }
        
        resolve(window.BMap)
      }
      
      document.head.appendChild(script)
    })
  }

  /**
   * 初始化地图
   * @param {string} containerId 地图容器ID
   * @param {Object} options 配置选项
   * @returns {Object} 百度地图实例
   */
  async initMap(containerId, options = {}) {
    try {
      await this.loadBaiduMapAPI()
      
      const mapOptions = {
        center: options.center || MAP_CONFIG.defaultCenter,
        zoom: options.zoom || MAP_CONFIG.defaultZoom,
        enableHighResolution: MAP_PERFORMANCE_CONFIG.enableHighResolution,
        enableAutoResize: MAP_PERFORMANCE_CONFIG.enableAutoResize,
        enableMapClick: true,
        ...options
      }

      this.map = new this.BMap.Map(containerId)
      
      // 设置地图中心点和缩放级别
      const point = new this.BMap.Point(mapOptions.center.lng, mapOptions.center.lat)
      this.map.centerAndZoom(point, mapOptions.zoom)

      // 启用地图功能
      this.map.enableScrollWheelZoom(true) // 启用滚轮放大缩小
      this.map.enableKeyboard(true) // 启用键盘操作
      this.map.enableDragging(true) // 启用拖拽
      this.map.enableDoubleClickZoom(true) // 启用双击放大
      
      // 优化地图性能配置
      this.map.enableContinuousZoom(true) // 启用连续缩放
      this.map.enablePinchToZoom(true) // 启用双指缩放（移动端）

      // 添加地图控件
      this.addMapControls()

      console.log('[百度地图] 地图初始化成功')
      return this.map
    } catch (error) {
      console.error('[百度地图] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 添加地图控件
   */
  addMapControls() {
    if (!this.map || !this.BMap) return

    // 添加缩放控件
    this.map.addControl(new this.BMap.NavigationControl({
      anchor: this.BMap.BMAP_ANCHOR_TOP_LEFT,
      type: this.BMap.BMAP_NAVIGATION_CONTROL_LARGE
    }))

    // 添加比例尺控件
    this.map.addControl(new this.BMap.ScaleControl({
      anchor: this.BMap.BMAP_ANCHOR_BOTTOM_LEFT
    }))

    // 添加地图类型控件
    this.map.addControl(new this.BMap.MapTypeControl({
      anchor: this.BMap.BMAP_ANCHOR_TOP_RIGHT
    }))
  }

  /**
   * 添加设备标记
   * @param {Object} device 设备信息
   * @param {Object} position 位置信息 {lng, lat}
   * @param {Object} options 标记选项
   * @returns {Object} 标记对象
   */
  addDeviceMarker(device, position, options = {}) {
    console.log('[地图工具] 开始添加设备标记:', { device: device.device_number, position })
    
    if (!this.map || !this.BMap) {
      console.error('[地图工具] 地图或BMap未初始化')
      return null
    }

    try {
      // 转换坐标系
      const bdCoords = CoordinateConverter.wgs84ToBd09(position.lng, position.lat)
      const point = new this.BMap.Point(bdCoords.lng, bdCoords.lat)
      console.log('[地图工具] 坐标转换完成:', { original: position, converted: bdCoords })

      // 创建标记图标
      const icon = this.createDeviceIcon(device, options)
      console.log('[地图工具] 图标创建完成:', icon)
      
      const marker = new this.BMap.Marker(point, { icon })
      console.log('[地图工具] 标记创建完成:', marker)

      // 添加信息窗口
      const infoWindow = this.createInfoWindow(device)
      marker.addEventListener('click', () => {
        this.map.openInfoWindow(infoWindow, point)
      })

      // 添加到地图
      this.map.addOverlay(marker)
      this.markers.set(device.id, marker)
      console.log('[地图工具] 标记已添加到地图')

      return marker
    } catch (error) {
      console.error('[地图工具] 添加标记失败:', error)
      return null
    }
  }

  /**
   * 创建设备图标
   * @param {Object} device 设备信息
   * @param {Object} options 图标选项
   * @returns {Object} 百度地图图标
   */
  createDeviceIcon(device, options = {}) {
    if (!this.BMap) {
      console.error('[地图工具] BMap未初始化，无法创建图标')
      return null
    }

    try {
      const color = device.status === 'online' ? '#67c23a' : '#f56c6c'
      const iconUrl = this.createDeviceIconSVG(color)
      console.log('[地图工具] 创建图标，设备状态:', device.status, '颜色:', color)
      
      // 使用百度地图默认图标，根据设备状态设置不同颜色
      const icon = new this.BMap.Icon(
        iconUrl,
        new this.BMap.Size(32, 32),
        {
          anchor: new this.BMap.Size(16, 32), // 锚点设置在底部中心
          imageSize: new this.BMap.Size(32, 32)
        }
      )

      console.log('[地图工具] 图标创建成功:', icon)
      return icon
    } catch (error) {
      console.error('[地图工具] 图标创建失败:', error)
      return null
    }
  }

  /**
   * 创建设备图标的SVG数据URL（卡车图标）
   * @param {string} color 图标颜色
   * @returns {string} SVG数据URL
   */
  createDeviceIconSVG(color = '#67c23a') {
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- 卡车主体 -->
        <rect x="4" y="12" width="16" height="8" fill="${color}" stroke="#fff" stroke-width="1" rx="1"/>
        <!-- 驾驶室 -->
        <rect x="20" y="10" width="8" height="10" fill="${color}" stroke="#fff" stroke-width="1" rx="1"/>
        <!-- 前轮 -->
        <circle cx="8" cy="22" r="3" fill="#333" stroke="#fff" stroke-width="1"/>
        <!-- 后轮 -->
        <circle cx="24" cy="22" r="3" fill="#333" stroke="#fff" stroke-width="1"/>
        <!-- 车窗 -->
        <rect x="21" y="11" width="6" height="4" fill="#87CEEB" stroke="#fff" stroke-width="0.5" rx="0.5"/>
        <!-- 车灯 -->
        <circle cx="29" cy="13" r="1" fill="#FFD700"/>
        <!-- 状态指示点 -->
        <circle cx="16" cy="16" r="2" fill="#fff"/>
      </svg>
    `
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  }

  /**
   * 创建信息窗口
   * @param {Object} device 设备信息
   * @returns {Object} 信息窗口
   */
  createInfoWindow(device) {
    if (!this.BMap) return null

    const content = `
      <div style="padding: 10px; min-width: 250px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">${device.device_alias || device.device_number}</h4>
        <p style="margin: 5px 0;"><strong>设备号:</strong> ${device.device_number}</p>
        <p style="margin: 5px 0;"><strong>状态:</strong> 
          <span style="color: ${device.status === 'online' ? '#67c23a' : '#f56c6c'};">
            ${device.status === 'online' ? '在线' : '离线'}
          </span>
        </p>
        <p style="margin: 5px 0;"><strong>电量:</strong> ${device.battery_level || 0}%</p>
        <p style="margin: 5px 0;"><strong>最后更新:</strong> ${device.last_update_time ? new Date(device.last_update_time).toLocaleString('zh-CN') : '暂无'}</p>
        ${device.customer ? `<p style="margin: 5px 0;"><strong>客户:</strong> ${device.customer.username}</p>` : ''}
        <p style="margin: 5px 0;"><strong>地址:</strong> ${device.address || '地址解析中...'}</p>
      </div>
    `

    return new this.BMap.InfoWindow(content, {
      width: 280,
      height: 220,
      enableMessage: false
    })
  }

  /**
   * 绘制设备轨迹
   * @param {Array} trackPoints 轨迹点数组 [{lng, lat, timestamp}, ...]
   * @param {Object} options 轨迹样式选项
   * @returns {Object} 轨迹线对象
   */
  drawDeviceTrack(trackPoints, options = {}) {
    if (!this.map || !this.BMap || !trackPoints.length) return null

    // 转换坐标并创建轨迹点
    const points = trackPoints.map(point => {
      const bdCoords = CoordinateConverter.wgs84ToBd09(point.lng, point.lat)
      return new this.BMap.Point(bdCoords.lng, bdCoords.lat)
    })

    // 创建轨迹线
    const polyline = new this.BMap.Polyline(points, {
      strokeColor: options.color || '#3388ff',
      strokeWeight: options.weight || 4,
      strokeOpacity: options.opacity || 0.8,
      strokeStyle: options.style || 'solid'
    })

    // 添加到地图
    this.map.addOverlay(polyline)

    // 调整地图视野以显示整个轨迹
    if (points.length > 1) {
      this.map.setViewport(points)
    }

    return polyline
  }

  /**
   * 批量添加设备标记（管理后台专用）
   * @param {Array} devices 设备数组
   * @param {Object} options 标记选项
   */
  addMultipleDeviceMarkers(devices, options = {}) {
    if (!devices || !devices.length) return

    devices.forEach(device => {
      if (device.last_longitude && device.last_latitude) {
        this.addDeviceMarker(device, {
          lng: device.last_longitude,
          lat: device.last_latitude
        }, options)
      }
    })

    // 如果有多个设备，调整地图视野以显示所有设备
    if (devices.length > 1) {
      const validDevices = devices.filter(d => d.last_longitude && d.last_latitude)
      if (validDevices.length > 0) {
        const points = validDevices.map(device => {
          const bdCoords = CoordinateConverter.wgs84ToBd09(device.last_longitude, device.last_latitude)
          return new this.BMap.Point(bdCoords.lng, bdCoords.lat)
        })
        this.map.setViewport(points)
      }
    }
  }

  /**
   * 清除所有标记
   */
  clearMarkers() {
    this.markers.forEach(marker => {
      this.map.removeOverlay(marker)
    })
    this.markers.clear()
  }

  /**
   * 清除所有轨迹
   */
  clearTracks() {
    this.polylines.forEach(polyline => {
      this.map.removeOverlay(polyline)
    })
    this.polylines.clear()
  }

  /**
   * 清除所有覆盖物
   */
  clearAll() {
    if (this.map) {
      this.map.clearOverlays()
      this.markers.clear()
      this.polylines.clear()
    }
  }

  /**
   * 设置地图中心点
   * @param {Object} position 位置 {lng, lat}
   * @param {number} zoom 缩放级别
   */
  setCenter(position, zoom) {
    if (!this.map || !this.BMap) return

    const bdCoords = CoordinateConverter.wgs84ToBd09(position.lng, position.lat)
    const point = new this.BMap.Point(bdCoords.lng, bdCoords.lat)
    
    if (zoom !== undefined) {
      this.map.centerAndZoom(point, zoom)
    } else {
      this.map.setCenter(point)
    }
  }

  /**
   * 销毁地图
   */
  destroy() {
    if (this.map) {
      this.clearAll()
      this.map = null
    }
    this.BMap = null
  }
}

// 创建地图工具单例
export const mapUtils = new BaiduMapUtils()

// 导出配置
export { MAP_CONFIG }

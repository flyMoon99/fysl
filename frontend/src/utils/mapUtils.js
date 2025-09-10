/**
 * 百度地图工具函数
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

// 地图性能优化配置
const MAP_PERFORMANCE_CONFIG = {
  enableHighResolution: true,
  enableAutoResize: true,
  enablePassiveEvents: true,
  enableContinuousZoom: true,
  enablePinchToZoom: true
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
      console.log('[百度地图] 检查API是否已加载')
      if (window.BMap) {
        console.log('[百度地图] API已存在，直接使用')
        this.BMap = window.BMap
        resolve(window.BMap)
        return
      }

      console.log('[百度地图] 开始加载API')
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://api.map.baidu.com/api?v=${MAP_CONFIG.version}&ak=${MAP_CONFIG.apiKey}&callback=initBaiduMap`
      script.onerror = (error) => {
        console.error('[百度地图] API加载失败:', error)
        reject(error)
      }
      
      window.initBaiduMap = () => {
        console.log('[百度地图] API加载成功')
        console.log('[百度地图] BMap对象:', window.BMap)
        this.BMap = window.BMap
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
      console.log('[百度地图] 开始初始化地图，容器ID:', containerId)
      await this.loadBaiduMapAPI()
      console.log('[百度地图] API加载完成')
      
      const mapOptions = {
        center: options.center || MAP_CONFIG.defaultCenter,
        zoom: options.zoom || MAP_CONFIG.defaultZoom,
        ...MAP_PERFORMANCE_CONFIG,
        ...options
      }

      console.log('[百度地图] 地图配置:', mapOptions)
      this.map = new this.BMap.Map(containerId)
      console.log('[百度地图] 地图实例创建成功:', this.map)
      
      // 设置地图中心点和缩放级别
      const point = new this.BMap.Point(mapOptions.center.lng, mapOptions.center.lat)
      this.map.centerAndZoom(point, mapOptions.zoom)

      // 启用地图功能
      this.map.enableScrollWheelZoom(true) // 启用滚轮放大缩小
      this.map.enableKeyboard(true) // 启用键盘操作
      this.map.enableDragging(true) // 启用拖拽
      this.map.enableDoubleClickZoom(true) // 启用双击放大
      
      // 启用连续缩放和手势缩放（减少非被动事件警告）
      if (mapOptions.enableContinuousZoom) {
        this.map.enableContinuousZoom(true)
      }
      if (mapOptions.enablePinchToZoom) {
        this.map.enablePinchToZoom(true)
      }

      // 添加地图控件
      this.addMapControls()

      console.log('[百度地图] 地图初始化完成，返回地图实例:', this.map)
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
    if (!this.map || !this.BMap) return null

    // 转换坐标系
    const bdCoords = CoordinateConverter.wgs84ToBd09(position.lng, position.lat)
    const point = new this.BMap.Point(bdCoords.lng, bdCoords.lat)

    // 创建标记图标
    const icon = this.createDeviceIcon(device, options)
    const marker = new this.BMap.Marker(point, { icon })

    // 添加信息窗口
    const infoWindow = this.createInfoWindow(device)
    marker.addEventListener('click', () => {
      this.map.openInfoWindow(infoWindow, point)
    })

    // 添加到地图
    this.map.addOverlay(marker)
    this.markers.set(device.id, marker)

    return marker
  }

  /**
   * 创建设备图标（卡车图标）
   * @param {Object} device 设备信息
   * @param {Object} options 图标选项
   * @returns {Object} 百度地图图标
   */
  createDeviceIcon(device, options = {}) {
    if (!this.BMap) return null

    try {
      const color = device.status === 'online' ? '#67c23a' : '#f56c6c'
      const iconUrl = this.createDeviceIconSVG(color)
      
      return new this.BMap.Icon(iconUrl, new this.BMap.Size(32, 32), {
        anchor: new this.BMap.Size(16, 32), // 锚点设置在底部中心
        imageSize: new this.BMap.Size(32, 32)
      })
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
        <!-- 阴影效果 -->
        <ellipse cx="16" cy="30" rx="14" ry="2" fill="rgba(0,0,0,0.2)"/>
        
        <!-- 卡车货厢主体 -->
        <rect x="2" y="12" width="18" height="10" fill="${color}" stroke="#2c3e50" stroke-width="1.5" rx="2"/>
        
        <!-- 驾驶室 -->
        <rect x="20" y="8" width="10" height="14" fill="${color}" stroke="#2c3e50" stroke-width="1.5" rx="2"/>
        
        <!-- 前保险杠 -->
        <rect x="29" y="12" width="2" height="6" fill="#34495e" rx="1"/>
        
        <!-- 车窗 -->
        <rect x="21.5" y="9.5" width="7" height="5" fill="#87CEEB" stroke="#2c3e50" stroke-width="1" rx="1"/>
        
        <!-- 前车灯 -->
        <circle cx="29.5" cy="13" r="1.5" fill="#FFD700" stroke="#f39c12" stroke-width="0.5"/>
        <circle cx="29.5" cy="17" r="1.5" fill="#FFD700" stroke="#f39c12" stroke-width="0.5"/>
        
        <!-- 前轮 -->
        <circle cx="8" cy="24" r="4" fill="#2c3e50" stroke="#34495e" stroke-width="1.5"/>
        <circle cx="8" cy="24" r="2.5" fill="#7f8c8d"/>
        <circle cx="8" cy="24" r="1" fill="#95a5a6"/>
        
        <!-- 后轮 -->
        <circle cx="24" cy="24" r="4" fill="#2c3e50" stroke="#34495e" stroke-width="1.5"/>
        <circle cx="24" cy="24" r="2.5" fill="#7f8c8d"/>
        <circle cx="24" cy="24" r="1" fill="#95a5a6"/>
        
        <!-- 车门线条 -->
        <line x1="21" y1="10" x2="21" y2="20" stroke="#2c3e50" stroke-width="1"/>
        
        <!-- 货厢门把手 -->
        <rect x="19" y="16" width="1" height="2" fill="#2c3e50" rx="0.5"/>
        
        <!-- 状态指示灯 -->
        <circle cx="11" cy="15" r="2.5" fill="#fff" stroke="#2c3e50" stroke-width="1"/>
        <circle cx="11" cy="15" r="1.5" fill="${color === '#67c23a' ? '#27ae60' : '#e74c3c'}"/>
        
        <!-- 车牌区域 -->
        <rect x="4" y="18" width="14" height="3" fill="#fff" stroke="#2c3e50" stroke-width="1" rx="0.5"/>
        <text x="11" y="20.5" text-anchor="middle" font-family="Arial" font-size="6" fill="#2c3e50">GPS</text>
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

    // 格式化时间显示
    const formatTime = (timeString) => {
      if (!timeString) return '暂无'
      try {
        return new Date(timeString).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      } catch (error) {
        console.error('时间格式化失败:', error)
        return '时间格式错误'
      }
    }

    const content = `
      <div style="padding: 15px; min-width: 280px; font-family: 'Microsoft YaHei', Arial, sans-serif;">
        <div style="border-bottom: 1px solid #e4e7ed; padding-bottom: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0; color: #303133; font-size: 16px; font-weight: 600;">轨迹点详情</h4>
        </div>
        <div style="line-height: 1.8;">
          <div style="margin-bottom: 12px;">
            <span style="color: #606266; font-weight: 500;">设备号:</span>
            <span style="color: #303133; margin-left: 8px;">${device.device_number || '未知设备'}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="color: #606266; font-weight: 500;">地址:</span>
            <span style="color: #303133; margin-left: 8px; word-break: break-all;">${device.address || '地址解析中...'}</span>
          </div>
          <div style="margin-bottom: 0;">
            <span style="color: #606266; font-weight: 500;">最后更新时间:</span>
            <span style="color: #303133; margin-left: 8px;">${formatTime(device.timestamp || device.last_update_time)}</span>
          </div>
        </div>
      </div>
    `

    return new this.BMap.InfoWindow(content, {
      width: 320,
      height: 180,
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
    console.log('绘制轨迹，轨迹点数量:', trackPoints.length)
    
    if (!this.map || !this.BMap || !trackPoints.length) {
      console.log('无法绘制轨迹，条件不满足:', { map: !!this.map, BMap: !!this.BMap, trackPointsLength: trackPoints.length })
      return null
    }

    // 转换坐标并创建轨迹点
    const points = trackPoints.map((point, index) => {
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
   * 根据轨迹点自动调整地图视野
   * @param {Array} trackPoints 轨迹点数组 [{lng, lat}, ...]
   * @param {Object} options 选项 {padding: 50, minZoom: 8, maxZoom: 18}
   */
  fitTrackBounds(trackPoints, options = {}) {
    if (!this.map || !this.BMap || !trackPoints || trackPoints.length === 0) {
      console.log('无法调整地图视野:', { map: !!this.map, BMap: !!this.BMap, trackPointsLength: trackPoints?.length })
      return
    }

    const { padding = 50, minZoom = 8, maxZoom = 18 } = options

    try {
      // 转换所有轨迹点坐标
      const bdPoints = trackPoints.map(point => {
        const bdCoords = CoordinateConverter.wgs84ToBd09(point.lng, point.lat)
        return new this.BMap.Point(bdCoords.lng, bdCoords.lat)
      })

      console.log('转换后的轨迹点数量:', bdPoints.length)

      // 计算边界
      let minLng = bdPoints[0].lng
      let maxLng = bdPoints[0].lng
      let minLat = bdPoints[0].lat
      let maxLat = bdPoints[0].lat

      bdPoints.forEach(point => {
        minLng = Math.min(minLng, point.lng)
        maxLng = Math.max(maxLng, point.lng)
        minLat = Math.min(minLat, point.lat)
        maxLat = Math.max(maxLat, point.lat)
      })

      console.log('轨迹点边界:', { minLng, maxLng, minLat, maxLat })

      // 创建边界对象
      const sw = new this.BMap.Point(minLng, minLat) // 西南角
      const ne = new this.BMap.Point(maxLng, maxLat) // 东北角
      const bounds = new this.BMap.Bounds(sw, ne)

      console.log('创建的地图边界:', bounds)

      // 如果只有一个点，设置合适的缩放级别
      if (trackPoints.length === 1) {
        const centerPoint = bdPoints[0]
        this.map.centerAndZoom(centerPoint, 15)
        console.log('单点轨迹，设置中心点和缩放级别15')
        return
      }

      // 计算中心点
      const centerLng = (minLng + maxLng) / 2
      const centerLat = (minLat + maxLat) / 2
      const centerPoint = new this.BMap.Point(centerLng, centerLat)

      // 计算合适的缩放级别
      const lngDiff = maxLng - minLng
      const latDiff = maxLat - minLat
      const maxDiff = Math.max(lngDiff, latDiff)

      console.log('坐标差值计算:', { lngDiff, latDiff, maxDiff })

      let zoom = 18
      if (maxDiff > 50) zoom = 4
      else if (maxDiff > 20) zoom = 5
      else if (maxDiff > 10) zoom = 6
      else if (maxDiff > 5) zoom = 7
      else if (maxDiff > 2) zoom = 8
      else if (maxDiff > 1) zoom = 9
      else if (maxDiff > 0.5) zoom = 10
      else if (maxDiff > 0.2) zoom = 11
      else if (maxDiff > 0.1) zoom = 12
      else if (maxDiff > 0.05) zoom = 13
      else if (maxDiff > 0.02) zoom = 14
      else if (maxDiff > 0.01) zoom = 15
      else if (maxDiff > 0.005) zoom = 16
      else if (maxDiff > 0.002) zoom = 17

      // 限制缩放级别范围
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom))

      console.log('计算的地图中心点和缩放级别:', { centerLng, centerLat, zoom, maxDiff })

      // 直接使用setViewport方法，让百度地图自动计算最佳视野
      console.log('使用setViewport方法调整地图视野')
      this.map.setViewport(bdPoints, { 
        margins: [padding, padding, padding, padding],
        zoomFactor: 0.8  // 稍微缩小一点，确保所有点都在视野内
      })
      
      // 如果setViewport没有生效，使用备用方案
      setTimeout(() => {
        const currentZoom = this.map.getZoom()
        console.log('当前地图缩放级别:', currentZoom)
        
        // 如果缩放级别还是太大，手动调整
        if (currentZoom > 10) {
          console.log('缩放级别过大，手动调整到合适级别')
          this.map.centerAndZoom(centerPoint, Math.max(minZoom, 6))
        }
        
        console.log('地图视野调整完成')
      }, 200)

    } catch (error) {
      console.error('调整地图视野失败:', error)
      // 降级处理：使用第一个点作为中心
      if (trackPoints.length > 0) {
        const firstPoint = trackPoints[0]
        this.setCenter({ lng: firstPoint.lng, lat: firstPoint.lat }, 12)
        console.log('降级处理：使用第一个轨迹点作为中心')
      }
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
export { MAP_CONFIG, MAP_PERFORMANCE_CONFIG }

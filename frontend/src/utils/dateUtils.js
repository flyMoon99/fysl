/**
 * 时间工具类
 * 统一处理系统中的时间格式化和时区转换
 */

/**
 * 格式化日期时间为本地时间字符串
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @param {string} format - 格式化选项：'datetime' | 'date' | 'time'
 * @returns {string} 格式化后的时间字符串
 */
export const formatDateTime = (dateString, format = 'datetime') => {
  if (!dateString) return '暂无数据'
  
  try {
    const date = new Date(dateString)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期格式:', dateString)
      return '无效日期'
    }
    
    const options = {
      timeZone: 'Asia/Shanghai', // 明确指定时区为中国标准时间
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 使用24小时制
    }
    
    // 根据格式类型调整选项
    switch (format) {
      case 'date':
        delete options.hour
        delete options.minute
        delete options.second
        delete options.hour12
        break
      case 'time':
        delete options.year
        delete options.month
        delete options.day
        break
      case 'datetime':
      default:
        // 保持所有选项
        break
    }
    
    return date.toLocaleString('zh-CN', options)
  } catch (error) {
    console.error('时间格式化错误:', error)
    return '格式化失败'
  }
}

/**
 * 格式化日期（仅日期部分）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (dateString) => {
  return formatDateTime(dateString, 'date')
}

/**
 * 格式化时间（仅时间部分）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (dateString) => {
  return formatDateTime(dateString, 'time')
}

/**
 * 获取相对时间描述（如：2小时前、3天前）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 相对时间描述
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '暂无数据'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    if (isNaN(date.getTime())) {
      return '无效日期'
    }
    
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSeconds < 60) {
      return '刚刚'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return formatDateTime(dateString, 'date')
    }
  } catch (error) {
    console.error('相对时间计算错误:', error)
    return '计算失败'
  }
}

/**
 * 获取当前时间戳（毫秒）
 * @returns {number} 当前时间戳
 */
export const getCurrentTimestamp = () => {
  return Date.now()
}

/**
 * 获取当前时间字符串
 * @param {string} format - 格式化选项
 * @returns {string} 当前时间字符串
 */
export const getCurrentTime = (format = 'datetime') => {
  return formatDateTime(new Date(), format)
}

/**
 * 验证日期字符串是否有效
 * @param {string} dateString - 日期字符串
 * @returns {boolean} 是否有效
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * 将时间戳转换为日期对象
 * @param {number} timestamp - 时间戳（毫秒或秒）
 * @returns {Date} 日期对象
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return new Date()
  
  // 判断是秒还是毫秒时间戳
  if (timestamp < 9999999999) {
    // 10位数字，秒时间戳
    return new Date(timestamp * 1000)
  } else {
    // 13位数字，毫秒时间戳
    return new Date(timestamp)
  }
}


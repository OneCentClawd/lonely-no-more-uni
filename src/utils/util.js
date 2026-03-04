/**
 * 工具函数
 */

const app = getApp()

/**
 * 发起请求
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${app.globalData.baseUrl}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': app.globalData.userId || ''
      },
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data.error || '请求失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 格式化时间
 */
function formatTime(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatTime(date)
}

/**
 * 计算两点间距离（km）
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180
  const R = 6371 // 地球半径（km）
  
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * 格式化距离
 */
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

export default {
  request,
  formatTime,
  formatRelativeTime,
  getDistance,
  formatDistance
}

export { request, formatTime, formatRelativeTime, getDistance, formatDistance }

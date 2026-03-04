<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/index/index.wxml-->
<view class="container">
  <!-- 位置选择栏 -->
  <view class="location-bar">
    <view class="location-select" @click="onChooseLocation">
      <text class="location-icon">📍</text>
      <text class="location-text">{{locationName || '选择位置'}}</text>
      <text class="location-arrow">›</text>
    </view>
    <view class="nearby-btn" @click="onNearbyPeople">
      <text class="nearby-text">附近的人</text>
    </view>
    <picker class="distance-picker" mode="selector" :range="distanceOptions" range-key="label" :value="distanceIndex" @change="onDistanceChange">
      <view class="distance-select">
        <text class="distance-text">{{distanceOptions[distanceIndex].label}}</text>
        <text class="distance-arrow">▼</text>
      </view>
    </picker>
  </view>

  <!-- 搜索框 -->
  <view class="search-box">
    <view class="search-input-wrap">
      <text class="search-icon">🔍</text>
      <input 
        class="search-input" 
        placeholder="搜索活动" 
        :value="searchKeyword"
        @input="onSearchInput"
        @confirm="onSearch"
        @focus="onSearchFocus"
        confirm-type="search"
      />
      <text class="search-clear" v-if="searchKeyword" @click="onClearSearch">×</text>
    </view>
  </view>

  <!-- 搜索建议面板 -->
  <view class="search-panel" v-if="showSearchPanel">
    <!-- 最近搜索 -->
    <view class="search-section" v-if="recentSearches.length > 0">
      <view class="search-section-header">
        <text class="search-section-title">最近搜索</text>
        <text class="search-section-clear" @click="onClearHistory">清空</text>
      </view>
      <view class="search-tags">
        <view class="search-tag" v-for="(item, index) in recentSearches" :key="item" :data-keyword="item" @click="onSuggestionTap">{{item}}</view>
      </view>
    </view>
    <!-- 热门搜索 -->
    <view class="search-section" v-if="hotSearches.length > 0">
      <view class="search-section-header">
        <text class="search-section-title">🔥 热门搜索</text>
      </view>
      <view class="search-tags">
        <view class="search-tag hot" v-for="(item, index) in hotSearches" :key="item" :data-keyword="item" @click="onSuggestionTap">{{item}}</view>
      </view>
    </view>
  </view>

  <!-- 分类导航 -->
  <scroll-view class="category-scroll" scroll-x>
    <view class="category-list">
      <view 
        :class="['category-item', item.active ? 'active' : '']" 
        v-for="(item, index) in categories" :key="item.name"
        :data-index="index"
        @click="onCategoryTap"
      >
        <text class="category-icon">{{item.icon}}</text>
        <text class="category-name">{{item.name}}</text>
      </view>
    </view>
  </scroll-view>

  <!-- 骨架屏加载 -->
  <view class="skeleton-list" v-if="loading">
    <view class="skeleton-card" v-for="(item, index) in [1,2,3]" :key="item">
      <view class="skeleton-header">
        <view class="skeleton-category"></view>
        <view class="skeleton-distance"></view>
      </view>
      <view class="skeleton-title"></view>
      <view class="skeleton-info">
        <view class="skeleton-line long"></view>
        <view class="skeleton-line medium"></view>
      </view>
      <view class="skeleton-footer">
        <view class="skeleton-members"></view>
        <view class="skeleton-avatar"></view>
      </view>
    </view>
  </view>

  <!-- 活动列表 -->
  <view class="activity-list" v-if="!loading">
    <view 
      :class="['activity-card card', item.coverImage ? 'has-cover' : '']" 
      v-for="(item, index) in activities" :key="item.id"
      :data-id="item.id"
      @click="onActivityTap"
    >
      <!-- 封面图 -->
      <image class="activity-cover" v-if="item.coverImage" :src="item.coverImage" mode="aspectFill"/>
      
      <!-- 头部：类型 + 状态标签 + 距离 -->
      <view class="activity-header flex-between">
        <view class="activity-category">
          <text class="category-emoji">{{item.categoryIcon}}</text>
          <text class="category-text">{{item.category}}</text>
          <text class="status-tag recruiting" v-if="!item.isFull && !item.isExpired">招募中</text>
          <text class="status-tag full" v-if="item.isFull && !item.isExpired">已满</text>
          <text class="status-tag expired" v-if="item.isExpired">已结束</text>
        </view>
        <text class="activity-distance text-gray text-small">{{item.distance}}</text>
      </view>

      <!-- 标题 -->
      <view class="activity-title">{{item.title}}</view>

      <!-- 信息 -->
      <view class="activity-info">
        <view class="info-item">
          <text class="info-icon">📍</text>
          <text class="info-text">{{item.address}}</text>
        </view>
        <view class="info-item">
          <text class="info-icon">🕐</text>
          <text class="info-text">{{item.startTime || '现在'}}</text>
        </view>
      </view>

      <!-- 底部：人数 + 费用 + 发起人 -->
      <view class="activity-footer flex-between">
        <view class="footer-left">
          <text class="member-count">{{item.currentMembers}}/{{item.maxMembers}}人</text>
          <text class="fee-tag tag">
            {{item.feeType === 'free' ? '免费' : (item.feeType === 'aa' ? 'AA制' : '¥' + item.feeAmount)}}
          </text>
        </view>
        <view class="footer-right flex" @click.stop="onCreatorTap" :data-userid="item.creatorId">
          <image class="avatar" :src="item.creatorAvatar" mode="aspectFill"></image>
          <text class="creator-name text-small text-gray">{{item.creatorName}}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 空状态 -->
  <view class="empty-state" v-if="!loading && activities.length === 0">
    <text class="empty-icon">🔍</text>
    <text class="empty-text">附近暂无活动</text>
    <text class="empty-hint">去发起一个吧～</text>
    <button class="btn-primary create-btn" @click="goCreate">发起活动</button>
  </view>
</view>

</template>

<script>
const app = getApp()
const util = require('../../utils/util')

const categories = [
  { name: '推荐', icon: '⭐', active: true },
  { name: '全部', icon: '🔥' },
  { name: '运动健身', icon: '🏀' },
  { name: '游戏电竞', icon: '🎮' },
  { name: '看电影', icon: '🎬' },
  { name: '约饭', icon: '🍜' },
  { name: '咖啡闲聊', icon: '☕' },
  { name: '桌游', icon: '🎲' },
  { name: '剧本杀', icon: '🎭' },
  { name: '其他', icon: '💡' }
]

// 类别图标映射
const categoryIcons = {
  '运动健身': '🏀',
  '游戏电竞': '🎮',
  '看电影': '🎬',
  '约饭': '🍜',
  '咖啡闲聊': '☕',
  '桌游': '🎲',
  '读书会': '📚',
  'KTV': '🎤',
  '遛弯散步': '🚶',
  '剧本杀': '🎭',
  '音乐': '🎵',
  '摄影': '📷',
  '遛狗': '🐶',
  '户外探险': '🧗',
  '其他': '💡'
}

// 距离选项
const distanceOptions = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '20km', value: 20 },
  { label: '50km', value: 50 }
]


export default {
  data() {
    return {
    categories,
    distanceOptions,
    distanceIndex: 1, // 默认10km
    activities: [],
    loading: true,
    latitude: null,
    longitude: null,
    locationName: '',
    selectedCategory: '推荐',
    searchKeyword: '',
    isSearching: false,
    showSearchPanel: false,
    recentSearches: [],
    hotSearches: []
    }
  },
  
  // 生命周期映射: onLoad → onLoad (uni-app 保留), onShow → onShow
  onLoad() {
    // 优先使用全局位置
    if (app.globalData.latitude && app.globalData.longitude) {
      this.latitude = app.globalData.latitude
        this.longitude = app.globalData.longitude
        this.locationName = app.globalData.locationName || '已保存位置'
      this.loadActivities()
    } else {
      this.getLocation()
    }
  },

  onShow() {
    // 每次显示时检查全局位置是否变化
    const globalLat = app.globalData.latitude
    const globalLng = app.globalData.longitude
    if (globalLat && globalLng && (globalLat !== this.latitude || globalLng !== this.longitude)) {
      this.latitude = globalLat
        this.longitude = globalLng
        this.locationName = app.globalData.locationName || '已选位置'
    }
    if (this.latitude) {
      this.loadActivities()
    }
  },

  onPullDownRefresh() {
    this.loadActivities().then(() => {
      uni.stopPullDownRefresh()
    })
  },

  getLocation() {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        app.updateLocation(res.latitude, res.longitude, '当前位置')
        this.latitude = res.latitude
        this.longitude = res.longitude
        this.locationName = '当前位置'
        this.loadActivities()
      },
      fail: () => {
        // 定位失败，使用默认位置（北京）
        app.updateLocation(39.9042, 116.4074, '北京')
        this.latitude = 39.9042
        this.longitude = 116.4074
        this.locationName = '北京'
        this.loadActivities()
        uni.showToast({ title: '定位失败，显示北京', icon: 'none' })
      }
    })
  },

  loadActivities() {
    this.loading = true
    
    const { latitude, longitude, selectedCategory, distanceOptions, distanceIndex } = this.data
    const radius = distanceOptions[distanceIndex].value
    
    let url
    if (selectedCategory === '推荐') {
      // 使用推荐接口
      url = `${app.globalData.baseUrl}/activity/recommended?lat=${latitude}&lng=${longitude}&radius=${radius}&limit=50`
    } else {
      url = `${app.globalData.baseUrl}/activity/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}&limit=50`
      // 如果选了分类，加上参数让后端过滤
      if (selectedCategory && selectedCategory !== '全部') {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
    }
    
    // 添加用户ID用于黑名单过滤
    const headers = {}
    if (app.globalData.userId) {
      headers['X-User-Id'] = app.globalData.userId
    }
    
    return new Promise((resolve) => {
      uni.request({
        url,
        header: headers,
        success: (res) => {
          let activities = res.data || []
          
          // 确保是数组
          if (!Array.isArray(activities)) {
            activities = activities.content || activities.data || []
          }
          
          // 处理数据格式
          activities = activities.map(item => ({
            ...item,
            categoryIcon: categoryIcons[item.category] || '💡',
            distance: this.calculateDistance(item.latitude, item.longitude),
            startTime: this.formatTime(item.startTime),
            creatorAvatar: (item.creatorAvatar && item.creatorAvatar.trim()) ? item.creatorAvatar : '/images/default-avatar.jpg',
            creatorName: item.creatorNickname || '用户' + item.creatorId,
            isFull: item.currentMembers >= item.maxMembers,
            // status: 0招募中 1已满员 2进行中 3已结束 4已取消
            isExpired: item.status >= 3
          }))
          
          this.loading = false
          resolve()
        },
        fail: () => {
          this.activities = []
          this.loading = false
          uni.showToast({ title: '加载失败', icon: 'none' })
          resolve()
        }
      })
    })
  },

  calculateDistance(lat, lng) {
    const { latitude, longitude } = this.data
    if (!latitude || !longitude) return ''
    
    const km = util.getDistance(latitude, longitude, lat, lng)
    return util.formatDistance(km)
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 明天
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    if (date.toDateString() === tomorrow.toDateString()) {
      return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 一周内显示星期几
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (date < oneWeekLater) {
      return `${weekDays[date.getDay()]} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 其他显示日期
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index
    const categories = this.categories.map((item, i) => ({
      ...item,
      active: i === index
    }))
    this.selectedCategory = categories[index].name
        this.searchKeyword = ''
        this.isSearching = false
    this.loadActivities()
  },

  onSearchInput(e) {
    this.searchKeyword = e.detail.value
  },

  onSearchFocus() {
    // 获取搜索建议
    this.loadSearchSuggestions()
    this.showSearchPanel = true
  },

  onSearchBlur() {
    // 延迟隐藏，让点击事件先触发
    setTimeout(() => {
      this.showSearchPanel = false
    }, 200)
  },

  loadSearchSuggestions() {
    const headers = {}
    if (app.globalData.userId) {
      headers['X-User-Id'] = app.globalData.userId
    }
    
    uni.request({
      url: `${app.globalData.baseUrl}/activity/search/suggestions`,
      header: headers,
      success: (res) => {
        if (res.statusCode === 200) {
          this.recentSearches = res.data.recent || []
        this.hotSearches = res.data.hot || []
        }
      }
    })
  },

  onSuggestionTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.searchKeyword = keyword
      this.showSearchPanel = false
    this.onSearch()
  },

  onClearHistory() {
    const userId = app.globalData.userId
    if (!userId) return
    
    uni.request({
      url: `${app.globalData.baseUrl}/activity/search/history`,
      method: 'DELETE',
      header: { 'X-User-Id': userId },
      success: () => {
        this.recentSearches = []
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    })
  },

  onSearch() {
    const { searchKeyword } = this.data
    if (!searchKeyword.trim()) {
      this.isSearching = false
      this.loadActivities()
      return
    }
    
    this.loading = true
      this.isSearching = true
      this.showSearchPanel = false
    
    const headers = {}
    if (app.globalData.userId) {
      headers['X-User-Id'] = app.globalData.userId
    }
    
    uni.request({
      url: `${app.globalData.baseUrl}/activity/search?keyword=${encodeURIComponent(searchKeyword.trim())}&limit=50`,
      header: headers,
      success: (res) => {
        let activities = res.data || []
        
        // 确保是数组
        if (!Array.isArray(activities)) {
          activities = activities.content || activities.data || []
        }
        
        activities = activities.map(item => ({
          ...item,
          categoryIcon: categoryIcons[item.category] || '💡',
          distance: this.latitude ? this.calculateDistance(item.latitude, item.longitude) : '',
          startTime: this.formatTime(item.startTime),
          creatorAvatar: (item.creatorAvatar && item.creatorAvatar.trim()) ? item.creatorAvatar : '/images/default-avatar.jpg',
          creatorName: item.creatorNickname || '用户' + item.creatorId,
          isFull: item.currentMembers >= item.maxMembers,
          // status: 0招募中 1已满员 2进行中 3已结束 4已取消
          isExpired: item.status >= 3
        }))
        
        this.loading = false
      },
      fail: () => {
        this.activities = []
        this.loading = false
        uni.showToast({ title: '搜索失败', icon: 'none' })
      }
    })
  },

  onClearSearch() {
    this.searchKeyword = ''
    this.isSearching = false
    this.loadActivities()
  },

  onNearbyPeople() {
    uni.navigateTo({
      url: '/pages/nearby/nearby'
    })
  },

  onChooseLocation() {
    uni.chooseLocation({
      success: (res) => {
        const name = res.name || res.address || '已选位置'
        app.updateLocation(res.latitude, res.longitude, name)
        this.latitude = res.latitude
        this.longitude = res.longitude
        this.locationName = name
        this.loadActivities()
      },
      fail: (err) => {
        console.log('chooseLocation fail:', err)
        if (err.errMsg.includes('deny') || err.errMsg.includes('auth')) {
          uni.showToast({ title: '请授权位置权限', icon: 'none' })
        }
      }
    })
  },

  onDistanceChange(e) {
    this.distanceIndex = e.detail.value
    this.loadActivities()
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id
    uni.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  onCreatorTap(e) {
    const userId = e.currentTarget.dataset.userid
    if (userId) {
      uni.navigateTo({
        url: `/pages/user/user?id=${userId}`
      })
    }
  },

  goCreate() {
    uni.switchTab({
      url: '/pages/create/create'
    })
  },

  onShareAppMessage() {
    return {
      title: '一起来找搭子吧！',
      path: '/pages/index/index'
    }
  }
}

</script>

<style scoped>
/* pages/index/index.wxss */

.container {
  padding: 0;
}

/* 位置选择栏 */
.location-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.location-select {
  display: flex;
  align-items: center;
  flex: 1;
}

.location-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.location-text {
  font-size: 28rpx;
  color: #333;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-arrow {
  font-size: 28rpx;
  color: #999;
  margin-left: 8rpx;
}

.distance-picker {
  margin-left: 20rpx;
}

.distance-select {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 12rpx 20rpx;
  border-radius: 24rpx;
}

.distance-text {
  font-size: 26rpx;
  color: #666;
}

.distance-arrow {
  font-size: 20rpx;
  color: #999;
  margin-left: 8rpx;
}

/* 搜索框 */
.search-box {
  background-color: #fff;
  padding: 20rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background-color: #F5F5F5;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.search-clear {
  font-size: 36rpx;
  color: #999;
  padding: 0 8rpx;
}

/* 分类导航 */
.category-scroll {
  background-color: #fff;
  white-space: nowrap;
  padding: 20rpx 0;
}

.category-list {
  display: inline-flex;
  padding: 0 20rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 24rpx;
  margin-right: 16rpx;
  border-radius: 16rpx;
  background-color: #F5F5F5;
  min-width: 100rpx;
}

.category-item.active {
  background-color: #FFF0F0;
}

.category-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 24rpx;
  color: #666;
}

.category-item.active .category-name {
  color: #FF6B6B;
}

/* 活动列表 */
.activity-list {
  padding: 20rpx;
}

.activity-card {
  margin-bottom: 24rpx;
  overflow: hidden;
}

.activity-card.has-cover {
  padding-top: 0;
}

.activity-cover {
  width: 100%;
  height: 240rpx;
  margin: -24rpx -24rpx 16rpx -24rpx;
  width: calc(100% + 48rpx);
}

.activity-header {
  margin-bottom: 16rpx;
}

.activity-category {
  display: flex;
  align-items: center;
}

.category-emoji {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.category-text {
  font-size: 24rpx;
  color: #666;
}

.status-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  margin-left: 12rpx;
}

.status-tag.recruiting {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.status-tag.full {
  background-color: #FFF3E0;
  color: #FF9800;
}

.status-tag.expired {
  background-color: #F5F5F5;
  color: #999;
}

.activity-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.activity-info {
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.info-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.info-text {
  font-size: 26rpx;
  color: #666;
}

.activity-footer {
  padding-top: 16rpx;
  border-top: 1rpx solid #F0F0F0;
}

.footer-left {
  display: flex;
  align-items: center;
}

.member-count {
  font-size: 26rpx;
  color: #FF6B6B;
  margin-right: 16rpx;
}

.fee-tag {
  margin-right: 0;
}

.footer-right {
  display: flex;
  align-items: center;
}

.footer-right .avatar {
  width: 48rpx;
  height: 48rpx;
  margin-right: 8rpx;
}

.creator-name {
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #F0F0F0;
  border-top-color: #FF6B6B;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 骨架屏 */
.skeleton-list {
  padding: 20rpx;
}

.skeleton-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.skeleton-category {
  width: 120rpx;
  height: 32rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
}

.skeleton-distance {
  width: 80rpx;
  height: 28rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
}

.skeleton-title {
  width: 70%;
  height: 40rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.skeleton-info {
  margin-bottom: 20rpx;
}

.skeleton-line {
  height: 28rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.skeleton-line.long {
  width: 90%;
}

.skeleton-line.medium {
  width: 60%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.skeleton-members {
  width: 100rpx;
  height: 28rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
}

.skeleton-avatar {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 50%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
}

.create-btn {
  margin-top: 30rpx;
  width: 240rpx;
}

/* 搜索建议面板 */
.search-panel {
  position: absolute;
  top: 180rpx;
  left: 24rpx;
  right: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  padding: 24rpx;
  z-index: 100;
  max-height: 60vh;
  overflow-y: auto;
}

.search-section {
  margin-bottom: 24rpx;
}

.search-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.search-section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.search-section-clear {
  font-size: 24rpx;
  color: #999;
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.search-tag {
  background: #f5f5f5;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #666;
}

.search-tag.hot {
  background: #FFF5F5;
  color: #FF6B6B;
}

/* 排行榜入口 */
/* 附近的人按钮 - 简约风格 */
.nearby-btn {
  padding: 10rpx 24rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  margin-left: auto;
  margin-right: 16rpx;
}

.nearby-text {
  font-size: 26rpx;
  color: #666;
}

</style>

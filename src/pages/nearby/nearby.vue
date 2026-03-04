<!-- 自动迁移，需人工审查 -->
<template>
<view class="container">
  <!-- 筛选栏 -->
  <view class="filter-bar">
    <picker class="radius-picker" mode="selector" :range="radiusOptions" range-key="label" :value="radiusIndex" @change="onRadiusChange">
      <view class="radius-select">
        <text class="radius-text">{{radiusOptions[radiusIndex].label}}</text>
        <text class="radius-arrow">▼</text>
      </view>
    </picker>
  </view>

  <!-- 用户列表 -->
  <view class="user-list">
    <view class="user-card card" v-for="(item, index) in users" :key="item.userId" @click="onUserTap(item.userId)">
      <image class="avatar" :src="item.avatar || '/static/images/default-avatar.jpg'" mode="aspectFill"></image>
      <view class="user-info">
        <view class="user-header">
          <text class="nickname">{{item.nickname}}</text>
          <text class="credit-badge">⭐{{item.creditScore}}</text>
        </view>
        <view class="distance">
          <text class="distance-icon">📍</text>
          <text class="distance-text">{{item.distance}}km</text>
        </view>
        <view class="common-interests" v-if="item.commonInterests.length > 0">
          <text class="interest-tag" v-for="(interest, index) in item.commonInterests" :key="interest">{{interest}}</text>
        </view>
        <view class="interests" v-else-if="item.interests.length > 0">
          <text class="interest-tag light" v-for="(interest, index) in item.interests" :key="interest" v-if="index < 3">{{interest}}</text>
        </view>
      </view>
      <text class="arrow">›</text>
    </view>
  </view>

  <!-- 加载中 -->
  <view class="loading" v-if="loading">
    <text>搜索附近的人...</text>
  </view>

  <!-- 空状态 -->
  <view class="empty-state" v-if="!loading && users.length === 0">
    <text class="empty-icon">👥</text>
    <text class="empty-text">附近暂无用户</text>
    <text class="empty-hint">试试扩大搜索范围</text>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      users: [],
      loading: true,
      latitude: null,
      longitude: null,
      radiusOptions: [
      { label: '1公里', value: 1 },
      { label: '5公里', value: 5 },
      { label: '10公里', value: 10 },
      { label: '20公里', value: 20 },
      { label: '50公里', value: 50 }
      ],
      radiusIndex: 2  // 默认10公里
    }
  },

  onLoad() {
    // 优先使用全局位置
    if (app.globalData.latitude && app.globalData.longitude) {
      this.latitude = app.globalData.latitude
      this.longitude = app.globalData.longitude
      this.loadNearbyUsers()
    } else {
      this.getLocation()
    }
    },

  methods: {
    getLocation() {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.latitude = res.latitude
        this.longitude = res.longitude
        this.loadNearbyUsers()
      },
      fail: () => {
        // 定位失败，使用默认位置（北京）
        this.latitude = 39.9042
        this.longitude = 116.4074
        this.loadNearbyUsers()
        uni.showToast({ title: '定位失败，显示北京附近', icon: 'none' })
      }
    })
      },

    onRadiusChange(e) {
    this.radiusIndex = e.detail.value
    this.loading = true
    this.loadNearbyUsers()
      },

    loadNearbyUsers() {
    const { latitude, longitude, radiusOptions, radiusIndex } = this
    if (!latitude || !longitude) return

    const radius = radiusOptions[radiusIndex].value
    const userId = app.globalData.userId

    uni.request({
      url: `${app.globalData.baseUrl}/user/nearby`,
      data: { lat: latitude, lng: longitude, radiusKm: radius, limit: 50 },
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          this.users = res.data || []
        }
      },
      complete: () => {
        this.loading = false
      }
    })
      },

    onUserTap(userId) {
    uni.navigateTo({
      url: `/pages/user/user?id=${userId}`
    })
      }
  }
}

</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.filter-bar {
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.radius-select {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
}

.radius-text {
  font-size: 28rpx;
  color: #333;
}

.radius-arrow {
  font-size: 20rpx;
  color: #999;
}

.user-list {
  padding: 24rpx;
}

.user-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.nickname {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.credit-badge {
  font-size: 24rpx;
  color: #FFB300;
  background: #FFF8E1;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.distance {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-bottom: 8rpx;
}

.distance-icon {
  font-size: 24rpx;
}

.distance-text {
  font-size: 26rpx;
  color: #666;
}

.common-interests,
.interests {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.interest-tag {
  font-size: 22rpx;
  color: #fff;
  background: #FF6B6B;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.interest-tag.light {
  color: #666;
  background: #f0f0f0;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
}

.loading {
  text-align: center;
  padding: 48rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
}

</style>

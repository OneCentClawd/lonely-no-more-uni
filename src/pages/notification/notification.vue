<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/notification/notification.wxml-->
<view class="container">
  <!-- 操作栏 -->
  <view class="action-bar" v-if="notifications.length > 0">
    <text class="mark-all" @click="onMarkAllRead">全部已读</text>
  </view>

  <!-- 通知列表 -->
  <view class="notification-list">
    <view 
      :class="['notification-item', item.isRead ? 'read' : 'unread']"
      v-for="(item, index) in notifications" :key="item.id"
      @click="onNotificationTap(item.id, item.activityId)"
    >
      <view class="notification-icon">
        <text v-if="item.type === 1">👋</text>
        <text v-else-if="item.type === 2">👋</text>
        <text v-else-if="item.type === 3">❌</text>
        <text v-else-if="item.type === 4">⏰</text>
        <text v-else-if="item.type === 5">💬</text>
        <text v-else>🔔</text>
      </view>
      <view class="notification-content">
        <view class="notification-title">{{item.title}}</view>
        <view class="notification-desc">{{item.content}}</view>
        <view class="notification-time">{{item.timeAgo}}</view>
      </view>
      <view class="unread-dot" v-if="!item.isRead"></view>
    </view>
  </view>

  <!-- 空状态 -->
  <view class="empty-state" v-if="!loading && notifications.length === 0">
    <text class="empty-icon">🔔</text>
    <text class="empty-text">暂无通知</text>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      notifications: [],
      loading: true
    }
  },

  onLoad() {
    this.loadNotifications()
    },

  onShow() {
    this.loadNotifications()
    },

  methods: {
    loadNotifications() {
    if (!app.globalData.userId) {
      this.loading = false
      return
    }

    uni.request({
      url: `${app.globalData.baseUrl}/notification/list`,
      header: {
        'X-User-Id': app.globalData.userId
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const notifications = res.data.map(item => ({
            ...item,
            timeAgo: this.formatTimeAgo(item.createdAt)
          }))
          this.notifications = notifications
          this.loading = false
        }
      },
      fail: () => {
        this.loading = false
      }
    })
      },

    formatTimeAgo(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return `${date.getMonth() + 1}/${date.getDate()}`
      },

    onNotificationTap(id, activityId) {
    // 标记已读
    uni.request({
      url: `${app.globalData.baseUrl}/notification/${id}/read`,
      method: 'POST',
      header: {
        'X-User-Id': app.globalData.userId
      }
    })

    // 跳转到活动详情
    if (activityId) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${activityId}`
      })
    }
      },

    onMarkAllRead() {
    uni.request({
      url: `${app.globalData.baseUrl}/notification/read-all`,
      method: 'POST',
      header: {
        'X-User-Id': app.globalData.userId
      },
      success: () => {
        const notifications = this.notifications.map(item => ({
          ...item,
          isRead: true
        }))
        this.notifications = notifications
        uni.showToast({ title: '已全部已读', icon: 'success' })
      }
    })
      }
  }
}

</script>

<style scoped>
/* pages/notification/notification.wxss */

.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #F5F5F5;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  padding: 16rpx 0;
}

.mark-all {
  font-size: 26rpx;
  color: #FF6B6B;
}

.notification-list {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
  position: relative;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.read {
  opacity: 0.6;
}

.notification-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.notification-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.notification-time {
  font-size: 24rpx;
  color: #999;
}

.unread-dot {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: #FF6B6B;
  border-radius: 50%;
}

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
  color: #999;
}

</style>

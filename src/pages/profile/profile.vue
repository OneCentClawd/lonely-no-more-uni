<!-- 迁移自小程序, 需人工审查 -->
<template>
<!--pages/profile/profile.wxml-->
<view class="container">
  <!-- 加载中 -->
  <view class="loading-state" v-if="loading">
    <text class="loading-text">加载中...</text>
  </view>

  <!-- 未登录状态 -->
  <view class="login-card card" v-if="!isLoggedIn && !loading">
    <text class="login-hint">登录后查看你的活动</text>
    <button class="btn-primary" @click="onLogin">一键登录</button>
  </view>

  <!-- 用户信息卡片 -->
  <view class="profile-card card" v-if="isLoggedIn && user">
    <view class="profile-header">
      <image class="profile-avatar" src="user.avatar" mode="aspectFill"></image>
      <view class="profile-info">
        <view class="profile-name">{{user.nickname}}</view>
        <view class="profile-credit">
          <text class="credit-icon">⭐</text>
          <text>信用分：{{user.creditScore}}</text>
        </view>
      </view>
      <view class="edit-btn" @click="onEditProfile">编辑</view>
    </view>
    <view class="profile-bio" v-if="user.bio">{{user.bio}}</view>
    <view class="profile-interests" v-if="user.interests.length > 0">
      <text class="interest-tag tag" v-for="item in user.interests" :key="*this">{{item}}</text>
    </view>
  </view>

  <!-- 我的活动 -->
  <view class="activities-section">
    <view class="section-header">
      <text class="section-title">我的活动</text>
    </view>
    
    <!-- Tab 切换 -->
    <view class="tabs">
      <view class="tab {{activeTab === 0 ? 'active' : ''" data-index="0" @click="onTabChange">
        全部
      </view>
      <view class="tab {{activeTab === 1 ? 'active' : ''" data-index="1" @click="onTabChange">
        我发起的
      </view>
      <view class="tab {{activeTab === 2 ? 'active' : ''" data-index="2" @click="onTabChange">
        我参与的
      </view>
    </view>

    <!-- 活动列表 -->
    <view class="activity-list">
      <view 
        class="activity-item card" 
        v-for="item in myActivities" 
        :key="id"
        data-id="{{item.id"
        @click="onActivityTap"
      >
        <view class="activity-left">
          <text class="activity-icon">{{item.categoryIcon}}</text>
          <view class="activity-info">
            <text class="activity-title">{{item.title}}</text>
            <text class="activity-time text-gray text-small">{{item.startTime}}</text>
          </view>
        </view>
        <view class="activity-right">
          <view class="unread-dot" v-if="item.unreadCount > 0">
            <text>{{item.unreadCount > 99 ? '99+' : item.unreadCount}}</text>
          </view>
          <text class="status-badge {{item.status === 0 ? 'recruiting' : ''">
            {{item.status === 0 ? '招募中' : (item.status === 1 ? '已满员' : (item.status === 3 ? '已结束' : '已取消'))}}
          </text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="myActivities.length === 0">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无活动</text>
    </view>
  </view>

  <!-- 我的模板 -->
  <view class="settings-card card" @click="onTemplates" v-if="isLoggedIn">
    <text class="settings-icon">📋</text>
    <text class="settings-text">我的模板</text>
    <text class="arrow">›</text>
  </view>

  <!-- 身份认证 -->
  <view class="settings-card card" @click="onVerify" v-if="isLoggedIn">
    <text class="settings-icon">🪪</text>
    <text class="settings-text">身份认证</text>
    <view class="verify-badge" v-if="isVerified">已认证</view>
    <text class="arrow">›</text>
  </view>

  <!-- 通知入口 -->
  <view class="settings-card card" @click="onNotification" v-if="isLoggedIn">
    <text class="settings-icon">🔔</text>
    <text class="settings-text">消息通知</text>
    <view class="unread-badge" v-if="unreadCount > 0">{{unreadCount > 99 ? '99+' : unreadCount}}</view>
    <text class="arrow">›</text>
  </view>

  <!-- 设置入口 -->
  <view class="settings-card card" @click="onSettings">
    <text class="settings-icon">⚙️</text>
    <text class="settings-text">设置</text>
    <text class="arrow">›</text>
  </view>
</view>
</template>

<script>
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    user: null,
    myActivities: [],
    activeTab: 0,
    loading: true,
    unreadCount: 0,
    isVerified: false
  },

  onLoad() {
    // 检查登录状态
    const userId = app.globalData.userId
    if (userId) {
      this.setData({ isLoggedIn: true })
      this.loadUser()
      this.loadVerifyStatus()
    } else {
      this.setData({ loading: false })
    }
  },

  loadVerifyStatus() {
    const userId = app.globalData.userId
    if (!userId) return
    
    uni.request({
      url: `${app.globalData.baseUrl}/verification/status`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const { realNameStatus, studentStatus } = res.data
          // 任一认证通过即为已认证
          this.setData({ isVerified: realNameStatus === 2 || studentStatus === 2 })
        }
      }
    })
  },

  onShow() {
    // 每次显示页面时检查登录状态（可能从 setup 页面返回）
    const userId = app.globalData.userId
    if (userId && !this.data.isLoggedIn) {
      this.setData({ isLoggedIn: true })
      this.loadUser()
    }
    if (userId) {
      this.loadMyActivities()
      this.loadUnreadCount()
      this.checkPendingReview()
    }
  },

  onPullDownRefresh() {
    Promise.all([
      new Promise(resolve => {
        this.loadUser()
        resolve()
      }),
      new Promise(resolve => {
        this.loadMyActivities()
        resolve()
      })
    ]).then(() => {
      uni.stopPullDownRefresh()
    })
  },

  loadUser() {
    const userId = app.globalData.userId
    if (!userId) {
      this.setData({ loading: false })
      return
    }

    uni.request({
      url: `${app.globalData.baseUrl}/user/profile`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const user = res.data
          this.setData({
            isLoggedIn: true,
            user: {
              ...user,
              avatar: user.avatar || '/images/default-avatar.jpg',
              nickname: user.nickname || '用户' + user.id,
              interests: user.interests ? JSON.parse(user.interests) : []
            }
          })
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  loadMyActivities() {
    const userId = app.globalData.userId
    if (!userId) return

    const { activeTab } = this.data
    const roleMap = ['all', 'creator', 'member']
    const role = roleMap[activeTab] || 'all'

    uni.request({
      url: `${app.globalData.baseUrl}/activity/mine?role=${role}`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const categoryIcons = {
            '运动健身': '🏀', '游戏电竞': '🎮', '看电影': '🎬',
            '约饭': '🍜', '咖啡闲聊': '☕', '桌游': '🎲',
            '读书会': '📚', 'KTV': '🎤', '遛弯散步': '🚶',
            '剧本杀': '🎭', '音乐': '🎵', '摄影': '📷',
            '遛狗': '🐶', '户外探险': '🧗', '其他': '💡'
          }

          const activities = res.data.map(item => ({
            ...item,
            categoryIcon: categoryIcons[item.category] || '💡',
            startTime: this.formatTime(item.startTime),
            unreadCount: 0
          }))

          this.setData({ myActivities: activities })
          
          // 加载每个活动的未读消息数
          this.loadUnreadCounts(activities)
        }
      }
    })
  },

  loadUnreadCounts(activities) {
    const userId = app.globalData.userId
    if (!userId || !activities.length) return
    
    activities.forEach((activity, index) => {
      uni.request({
        url: `${app.globalData.baseUrl}/chat/${activity.id}/unread-count`,
        header: { 'X-User-Id': userId },
        success: (res) => {
          if (res.statusCode === 200 && res.data.count > 0) {
            const key = `myActivities[${index}].unreadCount`
            this.setData({ [key]: res.data.count })
          }
        }
      })
    })
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    if (date.toDateString() === tomorrow.toDateString()) {
      return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },

  onTabChange(e) {
    this.setData({ activeTab: parseInt(e.currentTarget.dataset.index) }, () => {
      this.loadMyActivities()
    })
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id
    uni.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  onEditProfile() {
    uni.navigateTo({
      url: '/pages/setup/setup?mode=edit'
    })
  },

  updateNickname(nickname) {
    const userId = app.globalData.userId
    uni.showLoading({ title: '保存中...' })

    uni.request({
      url: `${app.globalData.baseUrl}/user/profile`,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      data: { nickname },
      success: (res) => {
        uni.hideLoading()
        if (res.statusCode === 200) {
          uni.showToast({ title: '保存成功', icon: 'success' })
          this.setData({
            'user.nickname': nickname
          })
          // 更新全局用户信息
          if (app.globalData.userInfo) {
            app.globalData.userInfo.nickname = nickname
          }
        } else {
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.hideLoading()
        uni.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onSettings() {
    uni.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  onTemplates() {
    uni.navigateTo({
      url: '/pages/templates/templates'
    })
  },

  onVerify() {
    uni.navigateTo({
      url: '/pages/verify/verify'
    })
  },

  onNotification() {
    uni.navigateTo({
      url: '/pages/notification/notification'
    })
  },

  loadUnreadCount() {
    const userId = app.globalData.userId
    if (!userId) return

    uni.request({
      url: `${app.globalData.baseUrl}/notification/unread-count`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ unreadCount: res.data.count || 0 })
        }
      }
    })
  },

  onLogin() {
    uni.showLoading({ title: '登录中...' })
    // 微信登录
    uni.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          uni.hideLoading()
          uni.showToast({ title: '登录失败', icon: 'none' })
          return
        }
        
        uni.request({
          url: `${app.globalData.baseUrl}/auth/login`,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: loginRes.code },
          success: (res) => {
            uni.hideLoading()
            if (res.statusCode === 200 && res.data.success) {
              const user = res.data.user
              // 保存到全局和本地存储
              app.globalData.userId = user.id
              app.globalData.userInfo = user
              uni.setStorageSync('userId', user.id)
              uni.setStorageSync('userInfo', user)
              
              // 更新页面状态
              this.setData({ isLoggedIn: true })
              
              if (res.data.isNewUser) {
                // 新用户跳转资料完善页
                uni.navigateTo({ url: '/pages/setup/setup' })
              } else {
                uni.showToast({ title: '登录成功', icon: 'success' })
                this.loadUser()
                this.loadMyActivities()
              }
            } else {
              uni.showToast({ title: res.data.error || '登录失败', icon: 'none' })
            }
          },
          fail: () => {
            uni.hideLoading()
            uni.showToast({ title: '网络错误', icon: 'none' })
          }
        })
      }
    })
  },

  checkPendingReview() {
    const userId = app.globalData.userId
    if (!userId) return
    
    // 避免重复弹窗：每次进入只弹一次
    if (this.hasShownReviewReminder) return
    
    uni.request({
      url: `${app.globalData.baseUrl}/activity/pending-review`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.length > 0) {
          const activity = res.data[0]
          this.hasShownReviewReminder = true
          
          uni.showModal({
            title: '评价提醒',
            content: `活动「${activity.title}」已结束，快去评价其他成员吧！`,
            confirmText: '去评价',
            cancelText: '稍后',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.navigateTo({
                  url: `/pages/review/review?activityId=${activity.id}`
                })
              }
            }
          })
        }
      }
    })
  }
})
</script>

<style scoped>
/* pages/profile/profile.wxss */

.container {
  padding: 20rpx;
}

/* 登录卡片 */
.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
}

.login-hint {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 30rpx;
}

/* 个人信息卡片 */
.profile-card {
  margin-bottom: 20rpx;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.profile-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #eee;
  margin-right: 24rpx;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.profile-credit {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.credit-icon {
  margin-right: 6rpx;
}

.edit-btn {
  padding: 12rpx 24rpx;
  background-color: #F5F5F5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.profile-bio {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.profile-interests {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.interest-tag {
  margin-right: 0;
}

/* 活动部分 */
.activities-section {
  margin-bottom: 20rpx;
}

.section-header {
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

/* Tab 切换 */
.tabs {
  display: flex;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 8rpx;
  margin-bottom: 20rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #666;
  border-radius: 8rpx;
}

.tab.active {
  background-color: #FF6B6B;
  color: #fff;
}

/* 活动列表 */
.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.activity-left {
  display: flex;
  align-items: center;
}

.activity-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.activity-info {
  display: flex;
  flex-direction: column;
}

.activity-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
}

.activity-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.status-badge {
  font-size: 22rpx;
  padding: 6rpx 12rpx;
  border-radius: 6rpx;
  background-color: #F5F5F5;
  color: #999;
}

.status-badge.recruiting {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.role-text {
  color: #FF6B6B;
  margin-top: 6rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 设置 */
.settings-card {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.settings-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.settings-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 36rpx;
}

/* 未读数角标 */
.unread-badge {
  background-color: #FF6B6B;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-right: 12rpx;
}

/* 未读角标 */
.unread-dot {
  background-color: #FF6B6B;
  color: #fff;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 18rpx;
  padding: 0 8rpx;
  margin-right: 16rpx;
}

.unread-badge {
  background-color: #FF6B6B;
  color: #fff;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 18rpx;
  padding: 0 8rpx;
  margin-right: auto;
  margin-left: 16rpx;
}

/* 认证徽章 */
.verify-badge {
  font-size: 22rpx;
  color: #4CAF50;
  background: #E8F5E9;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  margin-right: 8rpx;
}
</style>

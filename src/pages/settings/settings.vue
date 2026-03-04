<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/settings/settings.wxml-->
<view class="container">
  <!-- 隐私设置 -->
  <view class="section">
    <view class="section-header">
      <text class="section-title">隐私设置</text>
    </view>
    <view class="setting-item">
      <view class="item-left">
        <text class="item-icon">📍</text>
        <text class="item-label">公开我的位置</text>
      </view>
      <switch class="item-switch" :checked="settings.showLocation" @change="onShowLocationChange" color="#FF6B6B"/>
    </view>
    <view class="setting-item">
      <view class="item-left">
        <text class="item-icon">💬</text>
        <text class="item-label">允许陌生人私信</text>
      </view>
      <switch class="item-switch" :checked="settings.allowStrangerMessage" @change="onAllowStrangerMessageChange" color="#FF6B6B"/>
    </view>
    <view class="setting-item clickable" @click="onBlacklist">
      <view class="item-left">
        <text class="item-icon">🚫</text>
        <text class="item-label">黑名单管理</text>
      </view>
      <view class="item-right">
        <text class="arrow">›</text>
      </view>
    </view>
  </view>

  <!-- 通知设置 -->
  <view class="section">
    <view class="section-header">
      <text class="section-title">通知设置</text>
    </view>
    <view class="setting-item">
      <view class="item-left">
        <text class="item-icon">🔔</text>
        <text class="item-label">活动提醒</text>
      </view>
      <switch class="item-switch" :checked="settings.activityNotify" @change="onActivityNotifyChange" color="#FF6B6B"/>
    </view>
    <view class="setting-item">
      <view class="item-left">
        <text class="item-icon">💌</text>
        <text class="item-label">聊天消息提醒</text>
      </view>
      <switch class="item-switch" :checked="settings.chatNotify" @change="onChatNotifyChange" color="#FF6B6B"/>
    </view>
  </view>

  <!-- 其他 -->
  <view class="section">
    <view class="section-header">
      <text class="section-title">其他</text>
    </view>
    <view class="setting-item clickable" @click="onClearCache">
      <view class="item-left">
        <text class="item-icon">🗑️</text>
        <text class="item-label">清除缓存</text>
      </view>
      <view class="item-right">
        <text class="cache-size">{{cacheSize}}</text>
        <text class="arrow">›</text>
      </view>
    </view>
    <view class="setting-item clickable" @click="onAbout">
      <view class="item-left">
        <text class="item-icon">ℹ️</text>
        <text class="item-label">关于我们</text>
      </view>
      <view class="item-right">
        <text class="version">v{{version}}</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>

  <!-- 退出登录 -->
  <view class="logout-section">
    <button class="logout-btn" @click="onLogout">退出登录</button>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      settings: {
      showLocation: true,
      allowStrangerMessage: true,
      activityNotify: true,
      chatNotify: true
      },
      cacheSize: '0KB',
      version: '1.0.0'
    }
  },

  onLoad() {
    this.loadSettings()
    this.calculateCacheSize()
    },

  methods: {
    loadSettings() {
    // 从本地存储加载设置
    const settings = uni.getStorageSync('userSettings') || this.settings
    this.settings = settings
      },

    saveSettings() {
    uni.setStorageSync('userSettings', this.settings)
      },

    calculateCacheSize() {
    try {
      const res = uni.getStorageInfoSync()
      const sizeKB = res.currentSize
      let cacheSize = ''
      if (sizeKB < 1024) {
        cacheSize = sizeKB + 'KB'
      } else {
        cacheSize = (sizeKB / 1024).toFixed(2) + 'MB'
      }
      this.cacheSize = cacheSize
    } catch (e) {
      console.log('获取缓存大小失败', e)
    }
      },

    onShowLocationChange(e) {
    const settings = this.settings
    settings.showLocation = e.detail.value
    this.settings = settings
    this.saveSettings()
      },

    onAllowStrangerMessageChange(e) {
    const settings = this.settings
    settings.allowStrangerMessage = e.detail.value
    this.settings = settings
    this.saveSettings()
      },

    onActivityNotifyChange(e) {
    const settings = this.settings
    settings.activityNotify = e.detail.value
    this.settings = settings
    this.saveSettings()
      },

    onChatNotifyChange(e) {
    const settings = this.settings
    settings.chatNotify = e.detail.value
    this.settings = settings
    this.saveSettings()
      },

    onBlacklist() {
    uni.navigateTo({
      url: '/pages/blacklist/blacklist'
    })
      },

    onClearCache() {
    uni.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？（不会清除登录状态）',
      success: (res) => {
        if (res.confirm) {
          // 保留登录信息
          const userId = app.globalData.userId
          const token = uni.getStorageSync('token')
          const userInfo = uni.getStorageSync('userInfo')
          
          // 清除所有缓存
          uni.clearStorageSync()
          
          // 恢复登录信息
          if (userId) app.globalData.userId = userId
          if (token) uni.setStorageSync('token', token)
          if (userInfo) uni.setStorageSync('userInfo', userInfo)
          
          // 重新加载设置
          this.loadSettings()
          this.calculateCacheSize()
          
          uni.showToast({ title: '缓存已清除', icon: 'success' })
        }
      }
    })
      },

    onAbout() {
    uni.showModal({
      title: '关于孤独患者',
      content: '版本：v1.0.0\n\n一个帮你找搭子、告别孤独的小程序。\n\n如有问题请联系我们。',
      showCancel: false,
      confirmText: '知道了'
    })
      },

    onLogout() {
    uni.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录态
          uni.clearStorageSync()
          app.globalData.userId = null
          app.globalData.userInfo = null
          
          uni.showToast({ title: '已退出登录', icon: 'success' })
          
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/index/index' })
          }, 1500)
        }
      }
    })
      }
  }
}

</script>

<style scoped>
/* pages/settings/settings.wxss */

.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.section-header {
  padding: 24rpx 30rpx 12rpx;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.clickable:active {
  background-color: #f8f8f8;
}

.item-left {
  display: flex;
  align-items: center;
}

.item-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.item-label {
  font-size: 30rpx;
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
}

.cache-size,
.version {
  font-size: 26rpx;
  color: #999;
  margin-right: 10rpx;
}

.arrow {
  font-size: 32rpx;
  color: #ccc;
}

.item-switch {
  transform: scale(0.85);
}

.logout-section {
  margin-top: 60rpx;
  padding: 0 30rpx;
}

.logout-btn {
  background-color: #fff;
  color: #FF6B6B;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: 2rpx solid #FF6B6B;
}

.logout-btn::after {
  border: none;
}

</style>

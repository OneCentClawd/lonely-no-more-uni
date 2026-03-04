<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/blacklist/blacklist.wxml-->
<view class="container">
  <!-- 黑名单列表 -->
  <view class="list" v-if="list.length > 0">
    <view class="item" v-for="(item, index) in list" :key="item.id">
      <image class="avatar" :src="item.avatar || '/images/default-avatar.jpg'" mode="aspectFill"/>
      <view class="info">
        <text class="nickname">{{item.nickname || '用户' + item.blockedUserId}}</text>
        <text class="time">{{item.createdAtText}}</text>
      </view>
      <button class="btn-unblock" size="mini" @click="onUnblock" :data-id="item.blockedUserId">解除</button>
    </view>
  </view>

  <!-- 空状态 -->
  <view class="empty" v-if="!loading && list.length === 0">
    <text class="empty-icon">🕊️</text>
    <text class="empty-text">暂无黑名单</text>
  </view>

  <!-- 加载中 -->
  <view class="loading" v-if="loading">
    <text>加载中...</text>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      list: [],
      loading: true
    }
  },

  onLoad() {
    this.loadBlackList()
    },

  onShow() {
    this.loadBlackList()
    },

  methods: {
    loadBlackList() {
    this.loading = true
    uni.request({
      url: `${app.globalData.baseUrl}/blacklist`,
      header: { 'X-User-Id': app.globalData.userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const list = (res.data || []).map(item => ({
            ...item,
            createdAtText: this.formatTime(item.createdAt)
          }))
          this.list = list
          this.loading = false
        } else {
          this.loading = false
        }
      },
      fail: () => {
        this.loading = false
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    })
      },

    formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      },

    onUnblock(e) {
    const blockedUserId = e.currentTarget.dataset.id
    uni.showModal({
      title: '解除拉黑',
      content: '确定要解除拉黑该用户吗？',
      success: (res) => {
        if (res.confirm) {
          uni.request({
            url: `${app.globalData.baseUrl}/blacklist/${blockedUserId}`,
            method: 'DELETE',
            header: { 'X-User-Id': app.globalData.userId },
            success: (res) => {
              if (res.statusCode === 200) {
                uni.showToast({ title: '已解除', icon: 'success' })
                this.loadBlackList()
              } else {
                uni.showToast({ title: '操作失败', icon: 'none' })
              }
            },
            fail: () => {
              uni.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
      }
  }
}

</script>

<style scoped>
/* pages/blacklist/blacklist.wxss */

.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.list {
  background-color: #fff;
  border-radius: 16rpx;
}

.item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.item:last-child {
  border-bottom: none;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.btn-unblock {
  background-color: #f5f5f5;
  color: #666;
  font-size: 24rpx;
  padding: 0 24rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading {
  text-align: center;
  padding: 100rpx;
  color: #999;
}

</style>

<!-- 自动迁移，需人工审查 -->
<template>
<view class="container">
  <!-- Tab 切换 -->
  <view class="tabs">
    <view :class="['tab', activeTab === 'credit' ? 'active' : '']" data-type="credit" @click="onTabChange">
      ⭐ 信用榜
    </view>
    <view :class="['tab', activeTab === 'active' ? 'active' : '']" data-type="active" @click="onTabChange">
      🔥 活跃榜
    </view>
  </view>

  <!-- 排行榜列表 -->
  <view class="leaderboard-list">
    <view class="leaderboard-item" v-for="(item, index) in list" :key="item.userId" @click="onUserTap" :data-userid="item.userId">
      <!-- 排名 -->
      <view :class="['rank rank-', item.rank]">
        <text v-if="item.rank <= 3" class="rank-medal">{{item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : '🥉')}}</text>
        <text v-else class="rank-number">{{item.rank}}</text>
      </view>
      
      <!-- 用户信息 -->
      <image class="avatar" :src="item.avatar || '/images/default-avatar.jpg'" mode="aspectFill"></image>
      <view class="user-info">
        <text class="nickname">{{item.nickname}}</text>
      </view>
      
      <!-- 数值 -->
      <view class="value">
        <text class="value-number">{{item.value}}</text>
        <text class="value-label">{{activeTab === 'credit' ? '分' : '次'}}</text>
      </view>
    </view>
  </view>

  <!-- 加载中 -->
  <view class="loading" v-if="loading">
    <text>加载中...</text>
  </view>

  <!-- 空状态 -->
  <view class="empty-state" v-if="!loading && list.length === 0">
    <text class="empty-icon">🏆</text>
    <text class="empty-text">暂无排行数据</text>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      activeTab: 'credit',
      list: [],
      loading: true
    }
  },

  onLoad() {
    this.loadLeaderboard()
    },

  methods: {
    onTabChange(e) {
    const type = e.currentTarget.dataset.type
    if (type !== this.activeTab) {
      this.activeTab = type
      this.list = []
      this.loading = true
      this.loadLeaderboard()
    }
      },

    loadLeaderboard() {
    const { activeTab } = this.data
    
    uni.request({
      url: `${app.globalData.baseUrl}/user/leaderboard?type=${activeTab}`,
      success: (res) => {
        if (res.statusCode === 200) {
          this.list = res.data || []
        }
      },
      complete: () => {
        this.loading = false
      }
    })
      },

    onUserTap(e) {
    const userId = e.currentTarget.dataset.userid
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
  background: linear-gradient(180deg, #FFE5E5 0%, #F5F5F5 30%);
}

.tabs {
  display: flex;
  padding: 24rpx;
  gap: 24rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  background: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
  color: #666;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.tab.active {
  background: #FF6B6B;
  color: #fff;
  font-weight: 600;
}

.leaderboard-list {
  padding: 0 24rpx;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.rank {
  width: 60rpx;
  text-align: center;
}

.rank-medal {
  font-size: 40rpx;
}

.rank-number {
  font-size: 32rpx;
  font-weight: 600;
  color: #999;
}

.rank-1 .rank-number { color: #FFD700; }
.rank-2 .rank-number { color: #C0C0C0; }
.rank-3 .rank-number { color: #CD7F32; }

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin: 0 20rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.value {
  text-align: right;
}

.value-number {
  font-size: 36rpx;
  font-weight: 600;
  color: #FF6B6B;
}

.value-label {
  font-size: 24rpx;
  color: #999;
  margin-left: 4rpx;
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
  font-size: 28rpx;
  color: #999;
}

</style>

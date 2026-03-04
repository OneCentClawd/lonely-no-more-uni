<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/user/user.wxml-->
<view class="user-container">
  <view class="loading" v-if="loading">
    <text>加载中...</text>
  </view>
  
  <template v-else-if="user">
    <!-- 头像和基本信息 -->
    <view class="user-header">
      <image class="user-avatar" :src="user.avatar || '/images/default-avatar.jpg'" mode="aspectFill" @click="onPreviewAvatar"></image>
      <view class="user-info">
        <view class="user-name-row">
          <text class="user-name">{{user.nickname || '用户' + user.id}}</text>
          <text class="gender-badge male" v-if="user.gender === 1">♂</text>
          <text class="gender-badge female" v-if="user.gender === 2">♀</text>
          <text class="verify-tag" v-if="user.realNameStatus === 2">🪪</text>
          <text class="verify-tag" v-if="user.studentStatus === 2">🎓</text>
        </view>
        <text class="user-id">ID: {{user.id}}</text>
      </view>
    </view>

    <!-- 个性签名 -->
    <view class="section">
      <view class="section-title">个性签名</view>
      <view class="section-content" v-if="user.bio">{{user.bio}}</view>
      <view class="section-content empty" v-else>这个人很懒，什么都没写～</view>
    </view>

    <!-- 生日星座 -->
    <view class="section" v-if="user.birthday || user.zodiac">
      <view class="section-title">生日 / 星座</view>
      <view class="birthday-row">
        <text class="birthday" v-if="user.birthday">🎂 {{user.birthday}}</text>
        <text class="zodiac" v-if="user.zodiac">⭐ {{user.zodiac}}</text>
      </view>
    </view>

    <!-- 个人照片 -->
    <view class="section" v-if="user.photos && user.photos.length > 0">
      <view class="section-title">个人照片</view>
      <view class="photos-grid">
        <image 
          class="photo-item" 
          v-for="(item, index) in user.photos" :key="item" 
          :src="item" 
          mode="aspectFill"
          @click="onPreviewPhoto(index)"
        ></image>
      </view>
    </view>

    <!-- 兴趣标签 -->
    <view class="section" v-if="user.interests && user.interests.length > 0">
      <view class="section-title">兴趣爱好</view>
      <view class="tags-wrap">
        <text class="tag" v-for="(item, index) in user.interests" :key="item">{{item}}</text>
      </view>
    </view>

    <!-- 参与的活动 -->
    <view class="section" v-if="activities && activities.length > 0">
      <view class="section-title">参与的活动 ({{activities.length}})</view>
      <view class="activity-list">
        <view class="activity-item" v-for="(item, index) in activities" :key="item.id" @click="onActivityTap(item.id)">
          <image class="activity-cover" :src="item.coverImage || '/images/default-cover.jpg'" mode="aspectFill"></image>
          <view class="activity-info">
            <text class="activity-title">{{item.title}}</text>
            <text class="activity-time">{{item.activityTime}}</text>
            <view :class="['activity-status', item.statusType]">
              {{item.statusText}}
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 收到的评价 -->
    <view class="section">
      <view class="section-title">收到的评价</view>
      <view class="review-stats">
        <view class="stat-item positive">
          <text class="stat-icon">👍</text>
          <text class="stat-count">{{reviewStats.positive || 0}}</text>
        </view>
        <view class="stat-item negative">
          <text class="stat-icon">👎</text>
          <text class="stat-count">{{reviewStats.negative || 0}}</text>
        </view>
      </view>
      <view class="review-list" v-if="reviews.length > 0">
        <view class="review-item" v-for="(item, index) in reviews" :key="item.id">
          <view class="review-header">
            <image class="reviewer-avatar" :src="item.raterAvatar || '/images/default-avatar.jpg'" mode="aspectFill"/>
            <text class="reviewer-name">{{item.raterNickname}}</text>
            <text class="review-rating positive" v-if="item.rating === 2">👍</text>
            <text class="review-rating negative" v-else>👎</text>
          </view>
          <text class="review-comment" v-if="item.comment">{{item.comment}}</text>
        </view>
      </view>
      <view class="no-review" v-else>
        <text>暂无评价</text>
      </view>
    </view>

    <!-- 信用分 -->
    <view class="section">
      <view class="section-title">信用分</view>
      <view class="credit-row">
        <text class="credit-score">{{user.creditScore || 100}}</text>
        <text class="credit-label">分</text>
        <text class="credit-level good" v-if="user.creditScore >= 80">信用良好</text>
        <text class="credit-level normal" v-else-if="user.creditScore >= 60">信用一般</text>
        <text class="credit-level bad" v-else>信用较差</text>
      </view>
    </view>

    <!-- 加入时间 -->
    <view class="section">
      <view class="section-title">加入时间</view>
      <view class="section-content">{{user.createdAt}}</view>
    </view>

    <!-- 操作按钮（非本人） -->
    <view class="action-buttons" v-if="!isSelf">
      <button class="btn-report" @click="onReport">举报用户</button>
      <button class="btn-block" @click="onBlock">{{isBlocked ? '已拉黑' : '拉黑'}}</button>
    </view>
  </template>

  <view class="empty" v-else>
    <text>用户不存在</text>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      userId: null,
      user: null,
      activities: [],
      reviews: [],
      reviewStats: { positive: 0, negative: 0 },
      loading: true,
      isSelf: false,
      isBlocked: false
    }
  },

  onLoad(options) {
    if (options.id) {
      const isSelf = options.id == app.globalData.userId
      this.userId = options.id
      this.isSelf = isSelf
      this.loadUser(options.id)
      this.loadActivities(options.id)
      this.loadReviews(options.id)
      if (!isSelf) {
        this.checkBlocked(options.id)
      }
    }
    },

  methods: {
    loadUser(userId) {
    uni.request({
      url: `${app.globalData.baseUrl}/user/${userId}`,
      success: (res) => {
        if (res.statusCode === 200) {
          const user = res.data
          // 解析 interests JSON 字符串
          if (user.interests && typeof user.interests === 'string') {
            try {
              user.interests = JSON.parse(user.interests)
            } catch (e) {
              user.interests = []
            }
          }
          // 解析 photos JSON 字符串
          if (user.photos && typeof user.photos === 'string') {
            try {
              user.photos = JSON.parse(user.photos)
            } catch (e) {
              user.photos = []
            }
          }
          // 格式化加入时间
          if (user.createdAt) {
            const date = new Date(user.createdAt)
            user.createdAt = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
          }
          // 格式化生日
          if (user.birthday) {
            const parts = user.birthday.split('-')
            user.birthday = `${parts[1]}月${parts[2]}日`
          }
          
          this.user = user
          this.loading = false
          uni.setNavigationBarTitle({
            title: user.nickname || '用户详情'
          })
        } else {
          this.loading = false
          uni.showToast({ title: '用户不存在', icon: 'none' })
        }
      },
      fail: () => {
        this.loading = false
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    })
      },

    loadActivities(userId) {
    uni.request({
      url: `${app.globalData.baseUrl}/user/${userId}/activities`,
      success: (res) => {
        if (res.statusCode === 200) {
          const activities = res.data.map(item => {
            // 格式化时间
            if (item.startTime) {
              const date = new Date(item.startTime)
              item.activityTime = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
            }
            // 状态：0招募中 1已满员 2进行中 3已结束 4已取消
            const statusMap = {
              0: { text: '招募中', type: 'recruiting' },
              1: { text: '已满员', type: 'full' },
              2: { text: '进行中', type: 'ongoing' },
              3: { text: '已结束', type: 'ended' },
              4: { text: '已取消', type: 'cancelled' }
            }
            const s = statusMap[item.status] || { text: '未知', type: 'unknown' }
            item.statusText = s.text
            item.statusType = s.type
            return item
          })
          this.activities = activities
        }
      }
    })
      },

    loadReviews(userId) {
    // 加载评价列表
    uni.request({
      url: `${app.globalData.baseUrl}/review/user/${userId}`,
      success: (res) => {
        if (res.statusCode === 200) {
          this.reviews = res.data || []
        }
      }
    })
    // 加载评价统计
    uni.request({
      url: `${app.globalData.baseUrl}/review/user/${userId}/stats`,
      success: (res) => {
        if (res.statusCode === 200) {
          this.reviewStats = res.data || { positive: 0, negative: 0 }
        }
      }
    })
      },

    onPreviewAvatar() {
    if (this.user && this.user.avatar) {
      uni.previewImage({
        urls: [this.user.avatar],
        current: this.user.avatar
      })
    }
      },

    onPreviewPhoto(index) {
    const photos = this.user.photos
    if (photos && photos.length > 0) {
      uni.previewImage({
        urls: photos,
        current: photos[index]
      })
    }
      },

    onActivityTap(id) {
    uni.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
      },

    checkBlocked(userId) {
    uni.request({
      url: `${app.globalData.baseUrl}/blacklist/check/${userId}`,
      header: { 'X-User-Id': app.globalData.userId },
      success: (res) => {
        if (res.statusCode === 200) {
          this.isBlocked = res.data.blocked
        }
      }
    })
      },

    onReport() {
    const reasons = ['骚扰', '虚假信息', '色情低俗', '人身攻击', '其他']
    const reasonKeys = ['harassment', 'fake_info', 'inappropriate', 'attack', 'other']
    
    uni.showActionSheet({
      itemList: reasons,
      success: (res) => {
        const reason = reasonKeys[res.tapIndex]
        uni.request({
          url: `${app.globalData.baseUrl}/report`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-User-Id': app.globalData.userId
          },
          data: {
            targetType: 'user',
            targetId: this.userId,
            reason: reason
          },
          success: (res) => {
            if (res.statusCode === 200) {
              uni.showToast({ title: '举报成功', icon: 'success' })
            } else {
              uni.showToast({ title: res.data.error || '举报失败', icon: 'none' })
            }
          },
          fail: () => {
            uni.showToast({ title: '网络错误', icon: 'none' })
          }
        })
      }
    })
      },

    onBlock() {
    if (this.isBlocked) {
      uni.showToast({ title: '已拉黑', icon: 'none' })
      return
    }
    
    uni.showModal({
      title: '确认拉黑',
      content: '拉黑后将互相不可见，确定要拉黑该用户吗？',
      success: (res) => {
        if (res.confirm) {
          uni.request({
            url: `${app.globalData.baseUrl}/blacklist`,
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
              'X-User-Id': app.globalData.userId
            },
            data: {
              blockedUserId: Number(this.userId)
            },
            success: (res) => {
              if (res.statusCode === 200) {
                this.isBlocked = true
                uni.showToast({ title: '已拉黑', icon: 'success' })
              } else {
                uni.showToast({ title: res.data.error || '操作失败', icon: 'none' })
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
/* pages/user/user.wxss */

.user-container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx;
  color: #999;
}

/* 头部 */
.user-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 40rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #eee;
  margin-right: 30rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.user-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-right: 16rpx;
}

.gender-badge {
  font-size: 28rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gender-badge.male {
  background-color: #E3F2FD;
  color: #2196F3;
}

.gender-badge.female {
  background-color: #FCE4EC;
  color: #E91E63;
}

.user-id {
  font-size: 26rpx;
  color: #999;
}

/* 区块 */
.section {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.section-content.empty {
  color: #ccc;
  font-style: italic;
}

/* 标签 */
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  background-color: #FFF0F0;
  color: #FF6B6B;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

/* 信用分 */
.credit-row {
  display: flex;
  align-items: baseline;
}

.credit-score {
  font-size: 48rpx;
  font-weight: 600;
  color: #FF6B6B;
}

.credit-label {
  font-size: 26rpx;
  color: #999;
  margin-left: 8rpx;
  margin-right: 20rpx;
}

.credit-level {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.credit-level.good {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.credit-level.normal {
  background-color: #FFF3E0;
  color: #FF9800;
}

.credit-level.bad {
  background-color: #FFEBEE;
  color: #F44336;
}

/* 生日星座 */
.birthday-row {
  display: flex;
  gap: 30rpx;
}

.birthday, .zodiac {
  font-size: 28rpx;
  color: #666;
}

/* 头像可点击 */
.user-avatar {
  cursor: pointer;
}

/* 照片网格 */
.photos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.photo-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background-color: #eee;
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-item {
  display: flex;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  overflow: hidden;
}

.activity-cover {
  width: 160rpx;
  height: 120rpx;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
  padding: 16rpx 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.activity-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-time {
  font-size: 24rpx;
  color: #999;
}

.activity-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
  align-self: flex-start;
}

.activity-status.ongoing {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.activity-status.recruiting {
  background-color: #E3F2FD;
  color: #2196F3;
}

.activity-status.full {
  background-color: #FFF3E0;
  color: #FF9800;
}

.activity-status.ended {
  background-color: #f5f5f5;
  color: #999;
}

.activity-status.cancelled {
  background-color: #FFEBEE;
  color: #F44336;
}

/* 评价统计 */
.review-stats {
  display: flex;
  gap: 40rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-icon {
  font-size: 32rpx;
}

.stat-count {
  font-size: 28rpx;
  font-weight: bold;
}

.stat-item.positive .stat-count {
  color: #4CAF50;
}

.stat-item.negative .stat-count {
  color: #F44336;
}

/* 评价列表 */
.review-list {
  margin-top: 16rpx;
}

.review-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.reviewer-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.reviewer-name {
  flex: 1;
  font-size: 26rpx;
  color: #666;
}

.review-rating {
  font-size: 28rpx;
}

.review-comment {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
}

.no-review {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 40rpx 30rpx;
  margin-top: 20rpx;
}

.btn-report {
  flex: 1;
  background-color: #f5f5f5;
  color: #666;
  font-size: 28rpx;
  border-radius: 44rpx;
}

.btn-block {
  flex: 1;
  background-color: #FF6B6B;
  color: #fff;
  font-size: 28rpx;
  border-radius: 44rpx;
}

.btn-block[disabled] {
  background-color: #ccc;
}

/* 认证标签 */
.verify-tag {
  font-size: 28rpx;
  margin-left: 8rpx;
}

</style>

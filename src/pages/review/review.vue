<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/review/review.wxml-->
<view class="container">
  <view class="header">
    <text class="title">为活动成员打分</text>
    <text class="subtitle">你的评价会影响对方的信用分</text>
  </view>

  <!-- 可评价成员列表 -->
  <view class="member-list" v-if="members.length > 0">
    <view class="member-card" v-for="(item, index) in members" :key="item.userId">
      <view class="member-info">
        <image class="member-avatar" :src="item.avatar || '/images/default-avatar.jpg'" mode="aspectFill"/>
        <view class="member-detail">
          <text class="member-name">{{item.nickname || '用户' + item.userId}}</text>
          <text class="member-role">{{item.role === 1 ? '发起人' : '参与者'}}</text>
        </view>
      </view>
      <view class="rating-buttons">
        <view class="rating-btn positive {{item.selected === 2 ? 'selected' : ''}}" :data-index="index" data-rating="2" @click="onRatingTap">
          <text class="rating-icon">👍</text>
          <text class="rating-text">好评</text>
        </view>
        <view class="rating-btn negative {{item.selected === 1 ? 'selected' : ''}}" :data-index="index" data-rating="1" @click="onRatingTap">
          <text class="rating-icon">👎</text>
          <text class="rating-text">差评</text>
        </view>
      </view>
      <!-- 评语输入（选中后显示） -->
      <view class="comment-box" v-if="item.selected">
        <textarea 
          class="comment-input" 
          placeholder="写一句评价（可选）" 
          maxlength="100"
          :data-index="index"
          @input="onCommentInput"
        />
      </view>
    </view>
  </view>

  <!-- 无可评价成员 -->
  <view class="empty-state" v-if="!loading && members.length === 0">
    <text class="empty-icon">✅</text>
    <text class="empty-text">你已评价所有成员</text>
  </view>

  <!-- 提交按钮 -->
  <view class="submit-section" v-if="members.length > 0">
    <button class="btn-primary submit-btn" @click="onSubmit" :disabled="submitting">提交评价</button>
    <text class="skip-btn" @click="onSkip">跳过</text>
  </view>
</view>

</template>

<script>
const app = getApp()


export default {
  data() {
    return {
    activityId: null,
    members: [],
    loading: true,
    submitting: false
    }
  },
  
  // 生命周期映射: onLoad → onLoad (uni-app 保留), onShow → onShow
  onLoad(options) {
    if (options.activityId) {
      this.activityId = options.activityId
      this.loadReviewableMembers()
    }
  },

  loadReviewableMembers() {
    const { activityId } = this.data
    uni.request({
      url: `${app.globalData.baseUrl}/review/activity/${activityId}/reviewable`,
      header: { 'X-User-Id': app.globalData.userId },
      success: (res) => {
        const members = (res.data || []).map(m => ({
          ...m,
          selected: null,
          comment: ''
        }))
        this.loading = false
      },
      fail: () => {
        this.loading = false
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  onRatingTap(e) {
    const { index, rating } = e.currentTarget.dataset
    const members = this.members
    // 如果点击已选中的，取消选择
    if (members[index].selected === rating) {
      members[index].selected = null
    } else {
      members[index].selected = rating
    }
    Object.assign(this, { members })
  },

  onCommentInput(e) {
    const { index } = e.currentTarget.dataset
    const members = this.members
    members[index].comment = e.detail.value
    Object.assign(this, { members })
  },

  onSubmit() {
    const { activityId, members } = this.data
    const toSubmit = members.filter(m => m.selected)
    
    if (toSubmit.length === 0) {
      uni.showToast({ title: '请至少评价一位成员', icon: 'none' })
      return
    }

    this.submitting = true

    // 批量提交评价
    const promises = toSubmit.map(m => {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `${app.globalData.baseUrl}/review`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-User-Id': app.globalData.userId
          },
          data: {
            activityId: activityId,
            ratedId: m.userId,
            rating: m.selected,
            comment: m.comment || null
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data)
            } else {
              reject(res.data.error || '提交失败')
            }
          },
          fail: () => reject('网络错误')
        })
      })
    })

    Promise.all(promises)
      .then(() => {
        uni.showToast({ title: '评价成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      })
      .catch((err) => {
        uni.showToast({ title: err || '提交失败', icon: 'none' })
      })
      .finally(() => {
        this.submitting = false
      })
  },

  onSkip() {
    uni.navigateBack()
  }
}

</script>

<style scoped>
/* pages/review/review.wxss */

.container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  padding: 40rpx 0;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #999;
}

.member-list {
  margin-top: 20rpx;
}

.member-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.member-info {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.member-avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.member-detail {
  flex: 1;
}

.member-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.member-role {
  font-size: 24rpx;
  color: #999;
}

.rating-buttons {
  display: flex;
  gap: 20rpx;
}

.rating-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  border: 2rpx solid transparent;
}

.rating-btn.positive.selected {
  background-color: #E8F5E9;
  border-color: #4CAF50;
}

.rating-btn.negative.selected {
  background-color: #FFEBEE;
  border-color: #F44336;
}

.rating-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.rating-text {
  font-size: 26rpx;
  color: #666;
}

.rating-btn.positive.selected .rating-text {
  color: #4CAF50;
}

.rating-btn.negative.selected .rating-text {
  color: #F44336;
}

.comment-box {
  margin-top: 20rpx;
}

.comment-input {
  width: 100%;
  height: 120rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}

.submit-section {
  margin-top: 60rpx;
  text-align: center;
}

.submit-btn {
  background-color: #FF6B6B;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
}

.skip-btn {
  display: block;
  margin-top: 30rpx;
  font-size: 28rpx;
  color: #999;
}

</style>

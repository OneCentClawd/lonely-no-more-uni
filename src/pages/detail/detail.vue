<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/detail/detail.wxml-->
<view class="container" v-if="activity">
  <!-- 封面图 -->
  <view class="cover-section" v-if="activity.coverImage" @click="onPreviewCover">
    <image class="cover-image" :src="activity.coverImage" mode="aspectFill"></image>
  </view>

  <!-- 头部信息 -->
  <view class="header card">
    <view class="category-row">
      <text class="category-icon">{{activity.categoryIcon}}</text>
      <text class="category-name">{{activity.category}}</text>
      <view class="status-tag" v-if="activity.status === 0">招募中</view>
      <view class="status-tag full" v-if="activity.status === 1">已满员</view>
    </view>
    <view class="title">{{activity.title}}</view>
    <view class="description" v-if="activity.description">{{activity.description}}</view>
  </view>

  <!-- 活动信息 -->
  <view class="info-card card">
    <view class="info-item" @click="onOpenLocation">
      <view class="info-left">
        <text class="info-icon">📍</text>
        <text class="info-label">地点</text>
      </view>
      <view class="info-right">
        <text class="info-value">{{activity.address}}</text>
        <text class="arrow">›</text>
      </view>
    </view>
    <view class="info-item">
      <view class="info-left">
        <text class="info-icon">🕐</text>
        <text class="info-label">时间</text>
      </view>
      <text class="info-value">{{activity.startTime || '现在'}}</text>
    </view>
    <view class="info-item">
      <view class="info-left">
        <text class="info-icon">👥</text>
        <text class="info-label">人数</text>
      </view>
      <text class="info-value">{{activity.currentMembers}}/{{activity.maxMembers}}人</text>
    </view>
    <view class="info-item">
      <view class="info-left">
        <text class="info-icon">💰</text>
        <text class="info-label">费用</text>
      </view>
      <text class="info-value">{{activity.feeType === 'free' ? '免费' : (activity.feeType === 'aa' ? 'AA制' : '¥' + activity.feeAmount)}}</text>
    </view>
  </view>

  <!-- 参与者 -->
  <view class="members-card card">
    <view class="section-title">参与者 ({{activity.currentMembers}})</view>
    <view class="members-list">
      <view class="member-item" v-for="(item, index) in activity.members" :key="item.id" @click="onMemberTap" :data-userid="item.userId">
        <image class="member-avatar" :src="item.avatar" mode="aspectFill"></image>
        <text class="member-name">{{item.nickname}}</text>
        <text class="creator-badge" v-if="item.role === 1">发起人</text>
      </view>
      <!-- 空位 -->
      <view class="member-item empty" v-for="(item, index) in activity.maxMembers - activity.currentMembers" :key="item.index">
        <view class="empty-avatar">+</view>
        <text class="member-name text-gray">空位</text>
      </view>
    </view>
    <!-- 评价入口（活动结束后且是参与者时显示） -->
    <view class="review-entry" v-if="isExpired && isJoined" @click="onReview">
      <text class="review-icon">⭐</text>
      <text class="review-text">评价成员</text>
      <text class="arrow">›</text>
    </view>
  </view>

  <!-- 活动相册 -->
  <view class="photos-card card">
    <view class="section-header">
      <text class="section-title">活动相册 ({{photos.length}})</text>
      <view class="upload-btn" v-if="isJoined" @click="onUploadPhoto">
        <text class="upload-icon">📷</text>
        <text>上传</text>
      </view>
    </view>
    <view class="photos-grid" v-if="photos.length > 0">
      <view class="photo-item" v-for="(item, index) in photos" :key="item.id" @click="onPreviewPhoto" :data-index="index">
        <image class="photo-image" :src="item.imageUrl" mode="aspectFill"></image>
        <view class="photo-delete" v-if="item.userId === userId" @click.stop="onDeletePhoto" :data-id="item.id">×</view>
      </view>
    </view>
    <view class="photos-empty" v-if="photos.length === 0">
      <text class="empty-text">暂无照片{{isJoined ? '，快来上传第一张吧~' : ''}}</text>
    </view>
  </view>

  <!-- 发起人信息 -->
  <view class="creator-card card">
    <view class="section-title">发起人</view>
    <view class="creator-info">
      <image class="creator-avatar" :src="activity.creator.avatar" mode="aspectFill"></image>
      <view class="creator-detail">
        <text class="creator-name">{{activity.creator.nickname}}</text>
        <text class="creator-credit">信用分：{{activity.creator.creditScore}}</text>
      </view>
      <view class="report-btn" @click="onReport" v-if="!isCreator">
        <text class="report-icon">⚠️</text>
        <text>举报</text>
      </view>
    </view>
  </view>

  <!-- 底部操作栏 -->
  <view class="action-bar">
    <view class="action-left" @click="onChat" v-if="isJoined">
      <text class="action-icon">💬</text>
      <text>群聊</text>
    </view>
    <view class="action-left" @click="onSaveTemplate" v-if="isCreator">
      <text class="action-icon">📋</text>
      <text>存模板</text>
    </view>
    <view class="action-left" @click="onSharePoster">
      <text class="action-icon">🎨</text>
      <text>海报</text>
    </view>
    <!-- 已过期提示 -->
    <view class="expired-hint" v-if="isExpired && !isJoined && !isCreator">
      <text>活动已结束</text>
    </view>
    <!-- 已满员提示 -->
    <view class="full-hint" v-if="isFull && !isJoined && !isCreator && !isExpired">
      <text>活动已满员</text>
    </view>
    <!-- 加入按钮（未满员且未过期） -->
    <button class="btn-primary action-btn" @click="onJoin" v-if="!isJoined && !isCreator && !isFull && !isExpired">
      加入活动
    </button>
    <button class="btn-secondary action-btn" @click="onLeave" v-if="isJoined && !isCreator">
      退出活动
    </button>
    <button class="btn-secondary action-btn danger" @click="onCancel" v-if="isCreator && !isExpired">
      取消活动
    </button>
  </view>
</view>

<!-- 加载中 -->
<view class="loading" v-if="loading">
  <text>加载中...</text>
</view>

<!-- 海报弹窗 -->
<view class="poster-modal" v-if="showPoster" @click="onClosePoster">
  <view class="poster-content" catchtap="">
    <image class="poster-image" :src="posterImage" mode="widthFix" show-menu-by-longpress="true"></image>
    <view class="poster-actions">
      <button class="poster-btn" @click="onSavePoster">保存到相册</button>
      <button class="poster-btn cancel" @click="onClosePoster">关闭</button>
    </view>
    <text class="poster-hint">长按图片可分享给好友</text>
  </view>
</view>

</template>

<script>
const app = getApp()

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

Page({
  data: {
    activityId: null,
    activity: null,
    loading: true,
    isJoined: false,
    isCreator: false,
    isFull: false,
    isExpired: false,
    joining: false,
    photos: [],
    userId: null,
    showPoster: false,
    posterImage: ''
  },

  onLoad(options) {
    this.setData({ 
      activityId: options.id,
      userId: app.globalData.userId
    })
    this.loadActivity()
  },

  onShow() {
    if (this.data.activityId) {
      this.loadActivity()
      this.loadPhotos()
    }
  },

  onPullDownRefresh() {
    this.loadActivity().then(() => {
      uni.stopPullDownRefresh()
    })
  },

  loadActivity() {
    const { activityId } = this.data
    this.setData({ loading: true })

    return new Promise((resolve) => {
      uni.request({
        url: `${app.globalData.baseUrl}/activity/${activityId}`,
        success: (res) => {
          if (res.statusCode === 200) {
            const { activity, members } = res.data
            const userId = app.globalData.userId

            // 处理活动数据
            const activityData = {
              ...activity,
              categoryIcon: categoryIcons[activity.category] || '💡',
              startTime: this.formatTime(activity.startTime),
              members: members.map(m => ({
                ...m,
                nickname: m.nickname || '用户' + m.userId,
                avatar: m.avatar || '/images/default-avatar.jpg'
              })),
              creator: {
                id: activity.creatorId,
                nickname: activity.creatorNickname || '用户' + activity.creatorId,
                avatar: activity.creatorAvatar || '/images/default-avatar.jpg',
                creditScore: 100
              }
            }

          // 检查当前用户状态
          const isCreator = userId && activity.creatorId === parseInt(userId)
          const isJoined = userId && members.some(m => m.userId === parseInt(userId))
          const isFull = activity.currentMembers >= activity.maxMembers
          // status: 0招募中 1已满员 2进行中 3已结束 4已取消
          const isExpired = activity.status >= 3

          this.setData({
            activity: activityData,
            isCreator,
            isJoined,
            isFull,
            isExpired,
            loading: false
          })
          resolve()
        } else {
          uni.showToast({ title: '活动不存在', icon: 'none' })
          this.setData({ loading: false })
          resolve()
        }
      },
      fail: () => {
        uni.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
        resolve()
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

  onMemberTap(e) {
    const userId = e.currentTarget.dataset.userid
    if (userId) {
      uni.navigateTo({
        url: `/pages/user/user?id=${userId}`
      })
    }
  },

  onJoin() {
    if (!app.globalData.userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    if (this.data.joining) return
    this.setData({ joining: true })

    // 先请求订阅消息授权
    uni.requestSubscribeMessage({
      tmplIds: [
        '7jNoIpIxLkqpXDZZ4NDL1OcdZ6b_UQ4qOy5JrTjjyyA',  // 新消息提醒
        'eBe3cUlKoY4qCuF5fzAerYC4x66qr9F57DZIGUHKISA',  // 活动即将开始
        '5aw6Bz-LMegEu4Ns5B6xurtMFkw8ojm5qBi94wRe898'   // 活动状态变更
      ],
      complete: () => {
        // 不管授权结果如何都继续加入
        this.doJoin()
      }
    })
  },

  doJoin() {
    uni.request({
      url: `${app.globalData.baseUrl}/activity/${this.data.activityId}/join`,
      method: 'POST',
      header: { 'X-User-Id': app.globalData.userId },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          uni.showToast({ title: '加入成功', icon: 'success' })
          this.loadActivity()
        } else {
          uni.showToast({ title: res.data.error || '加入失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ joining: false })
      }
    })
  },

  onLeave() {
    uni.showModal({
      title: '确认退出',
      content: '确定要退出这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          uni.request({
            url: `${app.globalData.baseUrl}/activity/${this.data.activityId}/leave`,
            method: 'POST',
            header: { 'X-User-Id': app.globalData.userId },
            success: (res) => {
              if (res.statusCode === 200 && res.data.success) {
                uni.showToast({ title: '已退出', icon: 'success' })
                this.loadActivity()
              } else {
                uni.showToast({ title: res.data.error || '退出失败', icon: 'none' })
              }
            },
            fail: () => {
              uni.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },

  onCancel() {
    uni.showModal({
      title: '确认取消',
      content: '确定要取消这个活动吗？取消后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          uni.request({
            url: `${app.globalData.baseUrl}/activity/${this.data.activityId}/cancel`,
            method: 'POST',
            header: { 'X-User-Id': app.globalData.userId },
            success: (res) => {
              if (res.statusCode === 200 && res.data.success) {
                uni.showToast({ title: '已取消', icon: 'success' })
                setTimeout(() => {
                  uni.navigateBack()
                }, 1500)
              } else {
                uni.showToast({ title: res.data.error || '取消失败', icon: 'none' })
              }
            },
            fail: () => {
              uni.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },

  onSaveTemplate() {
    uni.showModal({
      title: '保存为模板',
      editable: true,
      placeholderText: '输入模板名称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          uni.request({
            url: `${app.globalData.baseUrl}/template/from-activity/${this.data.activityId}`,
            method: 'POST',
            header: { 
              'X-User-Id': app.globalData.userId,
              'Content-Type': 'application/json'
            },
            data: { name: res.content.trim() },
            success: (apiRes) => {
              if (apiRes.statusCode === 200) {
                uni.showToast({ title: '已保存', icon: 'success' })
              } else {
                uni.showToast({ title: apiRes.data.error || '保存失败', icon: 'none' })
              }
            },
            fail: () => {
              uni.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },

  onChat() {
    uni.navigateTo({
      url: `/pages/chat/chat?id=${this.data.activityId}`
    })
  },

  onReview() {
    uni.navigateTo({
      url: `/pages/review/review?activityId=${this.data.activityId}`
    })
  },

  onPreviewCover() {
    const { activity } = this.data
    if (activity && activity.coverImage) {
      uni.previewImage({
        current: activity.coverImage,
        urls: [activity.coverImage]
      })
    }
  },

  // 活动相册相关
  loadPhotos() {
    const { activityId } = this.data
    uni.request({
      url: `${app.globalData.baseUrl}/activity/${activityId}/photos`,
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ photos: res.data || [] })
        }
      }
    })
  },

  onUploadPhoto() {
    uni.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        uni.showLoading({ title: '上传中...' })
        const files = res.tempFiles
        let uploaded = 0
        
        files.forEach(file => {
          uni.uploadFile({
            url: `${app.globalData.baseUrl}/upload/image`,
            filePath: file.tempFilePath,
            name: 'file',
            header: { 'X-User-Id': app.globalData.userId },
            success: (uploadRes) => {
              if (uploadRes.statusCode === 200) {
                const data = JSON.parse(uploadRes.data)
                // 保存到活动相册
                uni.request({
                  url: `${app.globalData.baseUrl}/activity/${this.data.activityId}/photos`,
                  method: 'POST',
                  header: { 
                    'X-User-Id': app.globalData.userId,
                    'Content-Type': 'application/json'
                  },
                  data: { imageUrl: data.url },
                  success: () => {
                    uploaded++
                    if (uploaded === files.length) {
                      uni.hideLoading()
                      uni.showToast({ title: '上传成功', icon: 'success' })
                      this.loadPhotos()
                    }
                  }
                })
              }
            },
            fail: () => {
              uploaded++
              if (uploaded === files.length) {
                uni.hideLoading()
              }
            }
          })
        })
      }
    })
  },

  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.photos.map(p => p.imageUrl)
    uni.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  onDeletePhoto(e) {
    const photoId = e.currentTarget.dataset.id
    uni.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          uni.request({
            url: `${app.globalData.baseUrl}/activity/${this.data.activityId}/photos/${photoId}`,
            method: 'DELETE',
            header: { 'X-User-Id': app.globalData.userId },
            success: () => {
              uni.showToast({ title: '已删除', icon: 'success' })
              this.loadPhotos()
            }
          })
        }
      }
    })
  },

  onOpenLocation() {
    const { activity } = this.data
    if (activity && activity.latitude && activity.longitude) {
      uni.openLocation({
        latitude: activity.latitude,
        longitude: activity.longitude,
        name: activity.address,
        scale: 15
      })
    }
  },

  onShareAppMessage() {
    const { activity, activityId } = this.data
    return {
      title: activity ? `${activity.title} - ${activity.currentMembers}/${activity.maxMembers}人` : '一起来参加活动吧',
      path: `/pages/detail/detail?id=${activityId}`,
      imageUrl: activity && activity.coverImage ? activity.coverImage : ''
    }
  },

  onShareTimeline() {
    const { activity, activityId } = this.data
    return {
      title: activity ? `${activity.title} - 快来一起参加！` : '一起来参加活动吧',
      query: `id=${activityId}`,
      imageUrl: activity && activity.coverImage ? activity.coverImage : ''
    }
  },

  onSharePoster() {
    uni.showLoading({ title: '生成海报中...' })
    
    uni.request({
      url: `${app.globalData.baseUrl}/activity/${this.data.activityId}/poster`,
      success: (res) => {
        uni.hideLoading()
        if (res.statusCode === 200 && res.data.poster) {
          this.setData({
            showPoster: true,
            posterImage: res.data.poster
          })
        } else {
          uni.showToast({ title: '生成失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.hideLoading()
        uni.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onClosePoster() {
    this.setData({ showPoster: false, posterImage: '' })
  },

  onSavePoster() {
    const { posterImage } = this.data
    if (!posterImage) return

    // Base64 转临时文件
    const base64Data = posterImage.replace(/^data:image\/\w+;base64,/, '')
    const filePath = `${uni.env.USER_DATA_PATH}/poster_${Date.now()}.png`
    
    const fs = uni.getFileSystemManager()
    fs.writeFile({
      filePath,
      data: base64Data,
      encoding: 'base64',
      success: () => {
        uni.saveImageToPhotosAlbum({
          filePath,
          success: () => {
            uni.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            if (err.errMsg.includes('auth')) {
              uni.showToast({ title: '请授权相册权限', icon: 'none' })
            } else {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          }
        })
      },
      fail: () => {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  },

  onReport() {
    if (!app.globalData.userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const { activity } = this.data
    
    uni.showActionSheet({
      itemList: ['虚假活动', '骚扰行为', '违规内容', '其他'],
      success: (res) => {
        const reasons = ['虚假活动', '骚扰行为', '违规内容', '其他']
        const reason = reasons[res.tapIndex]
        
        uni.showModal({
          title: '确认举报',
          content: `举报原因：${reason}\n确定要举报该用户吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.submitReport(activity.creatorId, reason)
            }
          }
        })
      }
    })
  },

  submitReport(reportedUserId, reason) {
    uni.request({
      url: `${app.globalData.baseUrl}/report`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': app.globalData.userId
      },
      data: {
        reportedUserId,
        activityId: this.data.activityId,
        reason
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          uni.showToast({ title: '举报已提交', icon: 'success' })
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

</script>

<style scoped>
/* pages/detail/detail.wxss */

.container {
  padding: 20rpx;
  padding-bottom: 200rpx;
}

/* 封面图 */
.cover-section {
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 400rpx;
}

/* 头部 */
.header {
  margin-bottom: 20rpx;
}

.category-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.category-icon {
  font-size: 36rpx;
  margin-right: 8rpx;
}

.category-name {
  font-size: 26rpx;
  color: #666;
}

.status-tag {
  margin-left: auto;
  background-color: #E8F5E9;
  color: #4CAF50;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.status-tag.full {
  background-color: #FFF3E0;
  color: #FF9800;
}

.title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 信息卡片 */
.info-card .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.info-card .info-item:last-child {
  border-bottom: none;
}

.info-left {
  display: flex;
  align-items: center;
}

.info-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-right {
  display: flex;
  align-items: center;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 32rpx;
  margin-left: 8rpx;
}

/* 参与者 */
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120rpx;
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
  background-color: #eee;
}

.empty-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 2rpx dashed #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40rpx;
  color: #ccc;
  margin-bottom: 8rpx;
}

.member-name {
  font-size: 24rpx;
  color: #333;
  text-align: center;
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator-badge {
  font-size: 20rpx;
  color: #FF6B6B;
  background-color: #FFF0F0;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  margin-top: 6rpx;
}

/* 发起人 */
.creator-info {
  display: flex;
  align-items: center;
}

.creator-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #eee;
}

.creator-detail {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.creator-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.creator-credit {
  font-size: 24rpx;
  color: #999;
}

.report-btn {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
  padding: 12rpx 20rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
}

.report-icon {
  margin-right: 6rpx;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}

.action-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30rpx;
  font-size: 24rpx;
  color: #666;
}

.action-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.action-btn {
  flex: 1;
  margin: 0;
}

.action-btn.danger {
  color: #FF6B6B;
  border-color: #FF6B6B;
}

.expired-hint, .full-hint {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #999;
  padding: 24rpx;
}

.full-hint {
  color: #FF9800;
}

/* 评价入口 */
.review-entry {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  margin-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.review-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.review-text {
  flex: 1;
  font-size: 28rpx;
  color: #FF6B6B;
}

.review-entry .arrow {
  font-size: 28rpx;
  color: #ccc;
}

/* 加载中 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  color: #999;
}

/* 活动相册 */
.photos-card {
  margin: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #4A90D9;
  font-size: 28rpx;
}

.upload-icon {
  font-size: 32rpx;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12rpx;
  overflow: hidden;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.photos-empty {
  text-align: center;
  padding: 40rpx 0;
}

.photos-empty .empty-text {
  color: #999;
  font-size: 28rpx;
}

/* 海报弹窗 */
.poster-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.poster-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90%;
}

.poster-image {
  width: 600rpx;
  border-radius: 16rpx;
}

.poster-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
}

.poster-btn {
  padding: 20rpx 48rpx;
  background: #FF6B6B;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.poster-btn.cancel {
  background: rgba(255, 255, 255, 0.2);
}

.poster-hint {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

</style>

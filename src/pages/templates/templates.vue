<!-- 自动迁移，需人工审查 -->
<template>
<view class="container">
  <view class="template-list" v-if="templates.length > 0">
    <view class="template-card card" v-for="(item, index) in templates" :key="item.id">
      <view class="template-info" @click="onUseTemplate" :data-id="item.id">
        <view class="template-header">
          <text class="template-name">{{item.name}}</text>
          <text class="use-count">使用{{item.useCount}}次</text>
        </view>
        <view class="template-detail">
          <text class="detail-item">{{item.category || '未分类'}}</text>
          <text class="detail-item">{{item.maxMembers || 4}}人</text>
          <text class="detail-item">{{item.feeType === 'free' ? '免费' : (item.feeType === 'aa' ? 'AA制' : '¥' + item.feeAmount)}}</text>
        </view>
        <view class="template-title" v-if="item.title">{{item.title}}</view>
      </view>
      <view class="template-actions">
        <view class="action-btn use" @click="onUseTemplate" :data-id="item.id">使用</view>
        <view class="action-btn delete" @click="onDeleteTemplate" :data-id="item.id">删除</view>
      </view>
    </view>
  </view>

  <view class="empty-state" v-if="templates.length === 0 && !loading">
    <text class="empty-icon">📋</text>
    <text class="empty-text">暂无模板</text>
    <text class="empty-hint">发起活动后可以保存为模板，方便下次快速创建</text>
  </view>

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
    templates: [],
    loading: true
    }
  },
  
  // 生命周期映射: onLoad → onLoad (uni-app 保留), onShow → onShow
  onLoad() {
    this.loadTemplates()
  },

  onShow() {
    this.loadTemplates()
  },

  loadTemplates() {
    const userId = app.globalData.userId
    if (!userId) {
      this.loading = false
      return
    }

    uni.request({
      url: `${app.globalData.baseUrl}/template`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          this.templates = res.data || []
        }
      },
      complete: () => {
        this.loading = false
      }
    })
  },

  onUseTemplate(e) {
    const templateId = e.currentTarget.dataset.id
    // tabBar 页面不能用 navigateTo，用 storage 传模板ID
    uni.setStorageSync('useTemplateId', templateId)
    uni.switchTab({
      url: '/pages/create/create'
    })
  },

  onDeleteTemplate(e) {
    const templateId = e.currentTarget.dataset.id
    
    uni.showModal({
      title: '删除模板',
      content: '确定要删除这个模板吗？',
      success: (res) => {
        if (res.confirm) {
          uni.request({
            url: `${app.globalData.baseUrl}/template/${templateId}`,
            method: 'DELETE',
            header: { 'X-User-Id': app.globalData.userId },
            success: (apiRes) => {
              if (apiRes.statusCode === 200) {
                uni.showToast({ title: '已删除', icon: 'success' })
                this.loadTemplates()
              } else {
                uni.showToast({ title: '删除失败', icon: 'none' })
              }
            }
          })
        }
      }
    })
  }
}

</script>

<style scoped>
.container {
  padding: 24rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.template-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.template-info {
  flex: 1;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.template-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.use-count {
  font-size: 24rpx;
  color: #999;
}

.template-detail {
  display: flex;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.detail-item {
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}

.template-title {
  font-size: 26rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.action-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.action-btn.use {
  background: #4A90D9;
  color: #fff;
}

.action-btn.delete {
  background: #f5f5f5;
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
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 48rpx;
  color: #999;
}

</style>

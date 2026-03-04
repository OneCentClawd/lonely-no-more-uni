<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/create/create.wxml-->
<view class="container">
  <!-- 模板快捷入口 -->
  <view class="template-bar" v-if="templates.length > 0">
    <text class="template-label">从模板创建：</text>
    <scroll-view class="template-scroll" scroll-x>
      <view class="template-list">
        <view 
          class="template-item" 
          v-for="(item, index) in templates" :key="item.id" 
          :data-id="item.id"
          @click="onTemplateTap"
        >
          <text class="template-icon">📋</text>
          <text class="template-name">{{item.name}}</text>
        </view>
      </view>
    </scroll-view>
  </view>

  <!-- 活动类型 -->
  <view class="section">
    <view class="section-title">活动类型</view>
    <view class="category-grid">
      <view 
        :class="['category-item', selectedCategory === index ? 'selected' : '']"
        v-for="(item, index) in categories" :key="item.name"
        :data-index="index"
        @click="onCategoryTap"
      >
        <text class="category-icon">{{item.icon}}</text>
        <text class="category-name">{{item.name}}</text>
      </view>
    </view>
  </view>

  <!-- 活动标题 -->
  <view class="section">
    <view class="section-title">活动标题</view>
    <input 
      class="input-field" 
      placeholder="例如：周末打羽毛球找人" 
      maxlength="30"
      :value="title"
      @input="onTitleInput"
    />
  </view>

  <!-- 活动描述 -->
  <view class="section">
    <view class="section-title">活动描述 <text class="optional">(选填)</text></view>
    <textarea 
      class="textarea-field" 
      placeholder="补充说明活动详情、要求等..."
      maxlength="200"
      :value="description"
      @input="onDescInput"
    />
  </view>

  <!-- 活动封面图 -->
  <view class="section">
    <view class="section-title">活动封面 <text class="optional">(选填)</text></view>
    <view class="cover-upload" @click="onChooseCover">
      <block v-if="coverImage">
        <image class="cover-preview" :src="coverImage" mode="aspectFill"/>
        <view class="cover-delete" @click.stop="onDeleteCover">×</view>
      </block>
      <block v-else>
        <view class="cover-placeholder">
          <text class="cover-icon">📷</text>
          <text class="cover-text">添加封面图</text>
        </view>
      </block>
    </view>
  </view>

  <!-- 活动地点 -->
  <view class="section">
    <view class="section-title">活动地点</view>
    <view class="location-picker" @click="onChooseLocation">
      <text class="location-icon">📍</text>
      <text :class="['location-text', address ? '' : 'placeholder']">
        {{address || '点击选择地点'}}
      </text>
      <text class="arrow">›</text>
    </view>
  </view>

  <!-- 活动时间 -->
  <view class="section">
    <view class="section-title">活动时间</view>
    <view class="time-picker-row">
      <picker mode="selector" :range="dates" range-key="label" :value="dateIndex" @change="onDateChange">
        <view class="picker-item">
          <text>{{dates[dateIndex].label}}</text>
          <text class="arrow">›</text>
        </view>
      </picker>
      <picker v-if="dates[dateIndex].value !== 'NOW'" mode="selector" :range="times" range-key="label" :value="timeIndex" @change="onTimeChange">
        <view class="picker-item">
          <text>{{times[timeIndex].label}}</text>
          <text class="arrow">›</text>
        </view>
      </picker>
    </view>
  </view>

  <!-- 人数上限 -->
  <view class="section">
    <view class="section-title">人数上限（包括你）</view>
    <slider 
      class="member-slider"
      min="2" 
      max="20" 
      :value="maxMembers" 
      show-value
      activeColor="#FF6B6B"
      @change="onMemberChange"
    />
  </view>

  <!-- 费用 -->
  <view class="section">
    <view class="section-title">费用</view>
    <radio-group class="fee-group" @change="onFeeTypeChange">
      <label class="fee-option">
        <radio value="free" :checked="feeType === 'free'" color="#FF6B6B"/>
        <text>免费</text>
      </label>
      <label class="fee-option">
        <radio value="aa" :checked="feeType === 'aa'" color="#FF6B6B"/>
        <text>AA制</text>
      </label>
      <label class="fee-option">
        <radio value="fixed" :checked="feeType === 'fixed'" color="#FF6B6B"/>
        <text>固定费用</text>
      </label>
    </radio-group>
    <view class="fee-amount-row" v-if="feeType === 'fixed'">
      <text>¥</text>
      <input 
        type="digit" 
        placeholder="输入金额" 
        :value="feeAmount"
        @input="onFeeAmountInput"
      />
    </view>
  </view>

  <!-- 提交按钮 -->
  <button class="btn-primary submit-btn" @click="onSubmit">发起活动</button>
</view>

</template>

<script>
const app = getApp()

const categories = [
  { name: '运动健身', icon: '🏀' },
  { name: '游戏电竞', icon: '🎮' },
  { name: '看电影', icon: '🎬' },
  { name: '约饭', icon: '🍜' },
  { name: '咖啡闲聊', icon: '☕' },
  { name: '桌游', icon: '🎲' },
  { name: '读书会', icon: '📚' },
  { name: 'KTV', icon: '🎤' },
  { name: '遛弯散步', icon: '🚶' },
  { name: '剧本杀', icon: '🎭' },
  { name: '音乐', icon: '🎵' },
  { name: '摄影', icon: '📷' },
  { name: '遛狗', icon: '🐶' },
  { name: '户外探险', icon: '🧗' },
  { name: '其他', icon: '💡' }
]


export default {
  data() {
    return {
    categories,
    selectedCategory: null,
    title: '',
    description: '',
    coverImage: '',
    address: '',
    latitude: null,
    longitude: null,
    maxMembers: 4,
    dateIndex: 0,
    timeIndex: 0,
    feeType: 'free',
    feeAmount: '',
    dates: [],
    times: [],
    submitting: false,
    templates: []
    }
  },
  
  // 生命周期映射: onLoad → onLoad (uni-app 保留), onShow → onShow
  onLoad(options) {
    this.initDateTime()
    this.loadTemplates()
    
    // 如果带了模板ID，自动加载该模板
    if (options.templateId) {
      this.loadAndApplyTemplate(options.templateId)
    }
  },

  onShow() {
    // 从模板页跳转过来时，从 storage 读取模板ID
    const templateId = uni.getStorageSync('useTemplateId')
    if (templateId) {
      uni.removeStorageSync('useTemplateId')
      this.loadAndApplyTemplate(templateId)
    }
  },

  loadAndApplyTemplate(templateId) {
    const userId = app.globalData.userId
    if (!userId) return
    
    uni.request({
      url: `${app.globalData.baseUrl}/template/${templateId}/use`,
      method: 'POST',
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const t = res.data
          const categoryIndex = categories.findIndex(c => c.name === t.category)
          
          this.selectedCategory = categoryIndex >= 0 ? categoryIndex : null
        this.title = t.title || ''
        this.description = t.description || ''
        this.coverImage = t.coverImage || ''
        this.address = t.address || ''
        this.latitude = t.latitude
        this.longitude = t.longitude
        this.maxMembers = t.maxMembers || 4
        this.feeType = t.feeType || 'free'
        this.feeAmount = t.feeAmount ? String(t.feeAmount) : ''
          
          uni.showToast({ title: '已应用模板', icon: 'success' })
        }
      }
    })
  },

  loadTemplates() {
    const userId = app.globalData.userId
    if (!userId) return
    
    uni.request({
      url: `${app.globalData.baseUrl}/template`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          this.templates = res.data || []
        }
      }
    })
  },

  onTemplateTap(e) {
    const templateId = e.currentTarget.dataset.id
    const userId = app.globalData.userId
    
    uni.request({
      url: `${app.globalData.baseUrl}/template/${templateId}/use`,
      method: 'POST',
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const t = res.data
          // 找到分类索引
          const categoryIndex = categories.findIndex(c => c.name === t.category)
          
          this.selectedCategory = categoryIndex >= 0 ? categoryIndex : null
        this.title = t.title || ''
        this.description = t.description || ''
        this.coverImage = t.coverImage || ''
        this.address = t.address || ''
        this.latitude = t.latitude
        this.longitude = t.longitude
        this.maxMembers = t.maxMembers || 4
        this.feeType = t.feeType || 'free'
        this.feeAmount = t.feeAmount ? String(t.feeAmount) : ''
          
          uni.showToast({ title: '已应用模板', icon: 'success' })
        }
      }
    })
  },

  initDateTime() {
    const dates = []
    const now = new Date()
    
    // 添加「现在」选项（即时活动）
    dates.push({ label: '现在', value: 'NOW' })
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const month = d.getMonth() + 1
      const date = d.getDate()
      const weekdays = ['日', '一', '二', '三', '四', '五', '六']
      const label = i === 0 ? '今天' : (i === 1 ? '明天' : `周${weekdays[d.getDay()]}`)
      dates.push({
        label: `${month}月${date}日 ${label}`,
        value: d.toISOString().split('T')[0]
      })
    }

    const times = []
    for (let h = 8; h <= 22; h++) {
      times.push({ label: `${h}:00`, value: `${h.toString().padStart(2, '0')}:00:00` })
      times.push({ label: `${h}:30`, value: `${h.toString().padStart(2, '0')}:30:00` })
    }

    Object.assign(this, { dates, times })
  },

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index
    this.selectedCategory = index
  },

  onTitleInput(e) {
    this.title = e.detail.value
  },

  onDescInput(e) {
    this.description = e.detail.value
  },

  onChooseCover() {
    const userId = app.globalData.userId
    if (!userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        // 上传到服务器
        uni.uploadFile({
          url: `${app.globalData.baseUrl}/file/upload`,
          filePath: tempFilePath,
          name: 'file',
          header: {
            'X-User-Id': String(userId)
          },
          success: (uploadRes) => {
            const data = JSON.parse(uploadRes.data)
            if (data.url) {
              // 拼接完整URL
              const fullUrl = data.url.startsWith('http') 
                ? data.url 
                : app.globalData.baseUrl.replace('/api', '') + data.url
              this.coverImage = fullUrl
            } else {
              uni.showToast({ title: '上传失败', icon: 'none' })
            }
          },
          fail: () => {
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    })
  },

  onDeleteCover() {
    this.coverImage = ''
  },

  onChooseLocation() {
    uni.chooseLocation({
      success: (res) => {
        this.address = res.name || res.address
        this.latitude = res.latitude
        this.longitude = res.longitude
      },
      fail: (err) => {
        console.log('chooseLocation fail:', err)
        // 开发环境可能没有定位权限，提供手动输入
        uni.showModal({
          title: '选择地点',
          editable: true,
          placeholderText: '请输入活动地点',
          success: (res) => {
            if (res.confirm && res.content) {
              this.address = res.content
              this.latitude = 39.9  // 默认北京坐标
              this.longitude = 116.4
            }
          }
        })
      }
    })
  },

  onDateChange(e) {
    this.dateIndex = e.detail.value
  },

  onTimeChange(e) {
    this.timeIndex = e.detail.value
  },

  onMembersMinus() {
    if (this.maxMembers > 2) {
      this.maxMembers = this.maxMembers - 1
    }
  },

  onMembersPlus() {
    if (this.maxMembers < 20) {
      this.maxMembers = this.maxMembers + 1
    }
  },

  onMemberChange(e) {
    this.maxMembers = e.detail.value
  },

  onFeeTypeChange(e) {
    this.feeType = e.detail.value
  },

  onFeeAmountInput(e) {
    this.feeAmount = e.detail.value
  },

  onSubmit() {
    const { selectedCategory, title, address, latitude, longitude, maxMembers, dates, times, dateIndex, timeIndex, feeType, feeAmount, description, coverImage, submitting } = this.data

    if (submitting) return

    // 校验
    if (selectedCategory === null) {
      uni.showToast({ title: '请选择活动类型', icon: 'none' })
      return
    }
    if (!title.trim()) {
      uni.showToast({ title: '请输入活动标题', icon: 'none' })
      return
    }
    if (!address) {
      uni.showToast({ title: '请选择活动地点', icon: 'none' })
      return
    }
    if (feeType === 'fixed' && !feeAmount) {
      uni.showToast({ title: '请输入费用金额', icon: 'none' })
      return
    }

    // 检查登录
    if (!app.globalData.userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // 判断是否即时活动
    const isInstant = dates[dateIndex].value === 'NOW'
    let startTime = null

    if (!isInstant) {
      // 非即时活动：校验时间 > 当前时间 + 1小时
      startTime = `${dates[dateIndex].value}T${times[timeIndex].value}`
      const selectedTime = new Date(startTime)
      const minTime = new Date(Date.now() + 60 * 60 * 1000) // 当前时间 + 1小时
      
      if (selectedTime < minTime) {
        uni.showToast({ title: '活动时间需要在1小时后', icon: 'none' })
        return
      }
    }

    this.submitting = true

    uni.request({
      url: `${app.globalData.baseUrl}/activity`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': app.globalData.userId
      },
      data: {
        title: title.trim(),
        description: description.trim(),
        category: categories[selectedCategory].name,
        address,
        latitude,
        longitude,
        maxMembers,
        startTime,
        feeType,
        feeAmount: feeType === 'fixed' ? parseFloat(feeAmount) : null,
        coverImage: coverImage || null
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.id) {
          uni.showToast({ title: '发起成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/detail/detail?id=${res.data.id}`
            })
          }, 1500)
        } else {
          uni.showToast({ title: res.data.error || '发起失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.submitting = false
      }
    })
  }
}

</script>

<style scoped>
/* pages/create/create.wxss */

.container {
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.optional {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}

/* 分类选择 */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 20rpx;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  min-width: 140rpx;
  border: 2rpx solid transparent;
}

.category-item.selected {
  background-color: #FFF0F0;
  border-color: #FF6B6B;
}

.category-item .category-icon {
  font-size: 36rpx;
  margin-bottom: 6rpx;
}

.category-item .category-name {
  font-size: 24rpx;
  color: #666;
}

.category-item.selected .category-name {
  color: #FF6B6B;
}

/* 输入框 */
.input-field {
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

.textarea-field {
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  width: 100%;
  height: 160rpx;
  box-sizing: border-box;
}

/* 地点选择 */
.location-picker {
  display: flex;
  align-items: center;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
}

.location-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.location-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.location-text.placeholder {
  color: #999;
}

.arrow {
  color: #999;
  font-size: 32rpx;
}

/* 时间选择 */
.time-picker-row {
  display: flex;
  gap: 20rpx;
}

.picker-item {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

/* 人数滑块 */
.member-slider {
  margin: 0 10rpx;
}

/* 费用选择 */
.fee-group {
  display: flex;
  gap: 40rpx;
}

.fee-option {
  display: flex;
  align-items: center;
  font-size: 28rpx;
}

.fee-option radio {
  transform: scale(0.8);
}

.fee-amount-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.fee-amount-row text {
  font-size: 32rpx;
  color: #FF6B6B;
  margin-right: 12rpx;
}

.fee-amount-row input {
  flex: 1;
  font-size: 28rpx;
}

/* 提交按钮 */
.submit-btn {
  position: fixed;
  bottom: 40rpx;
  left: 40rpx;
  right: 40rpx;
  width: auto;
}

/* 封面图上传 */
.cover-upload {
  position: relative;
  width: 100%;
  height: 300rpx;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  overflow: hidden;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.cover-icon {
  font-size: 60rpx;
  margin-bottom: 12rpx;
}

.cover-text {
  font-size: 26rpx;
  color: #999;
}

.cover-preview {
  width: 100%;
  height: 100%;
}

.cover-delete {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  color: #fff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 模板快捷入口 */
.template-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.template-label {
  font-size: 26rpx;
  color: #666;
  white-space: nowrap;
  margin-right: 16rpx;
}

.template-scroll {
  flex: 1;
  white-space: nowrap;
}

.template-list {
  display: inline-flex;
  gap: 16rpx;
}

.template-item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.template-icon {
  font-size: 28rpx;
}

.template-name {
  font-size: 26rpx;
  color: #333;
  max-width: 150rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>

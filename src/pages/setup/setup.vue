<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/setup/setup.wxml-->
<view class="container">
  <view class="header">
    <text class="title">{{isEdit ? '编辑资料' : '完善资料'}}</text>
    <text class="subtitle">让大家更好地认识你</text>
  </view>

  <!-- 头像 -->
  <view class="section avatar-section" @click="onChooseAvatar">
    <image class="avatar" :src="avatar" mode="aspectFill"></image>
    <text class="avatar-hint">点击更换头像</text>
  </view>

  <!-- 昵称 -->
  <view class="section">
    <view class="section-title">昵称</view>
    <input 
      class="input-field" 
      placeholder="输入你的昵称" 
      maxlength="20"
      :value="nickname"
      @input="onNicknameInput"
    />
  </view>

  <!-- 性别 -->
  <view class="section">
    <view class="section-title">性别</view>
    <radio-group class="gender-group" @change="onGenderChange">
      <label class="gender-option">
        <radio value="1" :checked="gender === 1" color="#FF6B6B"/>
        <text>男</text>
      </label>
      <label class="gender-option">
        <radio value="2" :checked="gender === 2" color="#FF6B6B"/>
        <text>女</text>
      </label>
      <label class="gender-option">
        <radio value="0" :checked="gender === 0" color="#FF6B6B"/>
        <text>保密</text>
      </label>
    </radio-group>
  </view>

  <!-- 生日 -->
  <view class="section">
    <view class="section-title">生日</view>
    <picker mode="date" :value="birthday" start="1950-01-01" end="2015-12-31" @change="onBirthdayChange">
      <view :class="['picker-field', birthday ? '' : 'placeholder']">
        {{birthday || '选择你的生日'}}
      </view>
    </picker>
    <view class="zodiac-display" v-if="zodiac">
      <text class="zodiac-icon">⭐</text>
      <text class="zodiac-text">{{zodiac}}</text>
    </view>
  </view>

  <!-- 个性签名 -->
  <view class="section">
    <view class="section-title">个性签名</view>
    <textarea 
      class="textarea-field" 
      placeholder="写一句话介绍自己吧～" 
      maxlength="100"
      :value="bio"
      @input="onBioInput"
    />
  </view>

  <!-- 兴趣标签 -->
  <view class="section">
    <view class="section-title">兴趣标签 <text class="hint">(最多选5个)</text></view>
    <view class="interest-grid">
      <view 
        :class="['interest-item', selectedMap[item] ? 'selected' : '']"
        v-for="(item, index) in interestOptions" :key="item"
        @click="onInterestTap(item)"
      >
        {{item}}
      </view>
    </view>
  </view>

  <!-- 个人照片 -->
  <view class="section">
    <view class="section-title">个人照片 <text class="hint">(最多9张)</text></view>
    <view class="photos-grid">
      <image 
        class="photo-item" 
        v-for="(item, index) in photos" :key="item" 
        :src="item" 
        mode="aspectFill"
        @click="onPreviewPhoto(index)"
        @longpress="onDeletePhoto(index)"
      ></image>
      <view class="photo-add" v-if="photos.length < 9" @click="onAddPhoto">
        <text class="add-icon">+</text>
        <text class="add-text">添加照片</text>
      </view>
    </view>
  </view>

  <!-- 按钮 -->
  <view class="btn-group">
    <button class="btn-primary" @click="onSubmit">{{isEdit ? '保存' : '保存并继续'}}</button>
    <view class="skip-btn" @click="onSkip" v-if="!isEdit">稍后完善</view>
  </view>
</view>

</template>

<script>
const app = getApp()

const interestOptions = [
  '运动健身', '游戏电竞', '看电影', '约饭', '咖啡闲聊',
  '桌游', '读书会', 'KTV', '遛弯散步', '剧本杀',
  '音乐', '摄影', '遛狗', '户外探险'
]

const zodiacSigns = [
  { name: '水瓶座', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', start: [2, 19], end: [3, 20] },
  { name: '白羊座', start: [3, 21], end: [4, 19] },
  { name: '金牛座', start: [4, 20], end: [5, 20] },
  { name: '双子座', start: [5, 21], end: [6, 21] },
  { name: '巨蟹座', start: [6, 22], end: [7, 22] },
  { name: '狮子座', start: [7, 23], end: [8, 22] },
  { name: '处女座', start: [8, 23], end: [9, 22] },
  { name: '天秤座', start: [9, 23], end: [10, 23] },
  { name: '天蝎座', start: [10, 24], end: [11, 22] },
  { name: '射手座', start: [11, 23], end: [12, 21] },
  { name: '摩羯座', start: [12, 22], end: [1, 19] }
]

export default {
  data() {
    return {
      avatar: '/static/images/default-avatar.jpg',
      nickname: '',
      gender: 0, // 0未知 1男 2女
      birthday: '',
      zodiac: '',
      bio: '',
      photos: [],
      selectedInterests: [],
      selectedMap: {}, // { '运动健身': true, '看电影': true }
      interestOptions,
      submitting: false,
      isEdit: false
    }
  },

  onLoad(options) {
    const isEdit = options.mode === 'edit'
    this.isEdit = isEdit
    
    // 预填已有信息
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      const interests = userInfo.interests ? JSON.parse(userInfo.interests) : []
      const selectedMap = {}
      interests.forEach(item => selectedMap[item] = true)
      
      this.avatar = userInfo.avatar || '/static/images/default-avatar.jpg'
      this.nickname = userInfo.nickname || ''
      this.gender = userInfo.gender || 0
      this.selectedInterests = interests
      this.selectedMap = selectedMap
      this.birthday = userInfo.birthday || ''
      this.zodiac = userInfo.zodiac || ''
      this.bio = userInfo.bio || ''
      this.photos = userInfo.photos ? JSON.parse(userInfo.photos) : []
    }
    },

  methods: {
    onChooseAvatar() {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.avatar = tempFilePath
        
        // 上传到服务器
        this.uploadAvatar(tempFilePath)
      }
    })
      },

    uploadAvatar(filePath) {
    uni.showLoading({ title: '上传中...' })
    
    uni.uploadFile({
      url: `${app.globalData.baseUrl}/file/upload`,
      filePath: filePath,
      name: 'file',
      formData: { type: 'avatar' },
      header: { 'X-User-Id': app.globalData.userId },
      success: (res) => {
        uni.hideLoading()
        const data = JSON.parse(res.data)
        if (data.success && data.url) {
          // 拼接完整 URL
          const fullUrl = data.url.startsWith('http') 
            ? data.url 
            : app.globalData.baseUrl.replace('/api', '') + data.url
          this.avatar = fullUrl
          uni.showToast({ title: '头像上传成功', icon: 'success' })
        } else {
          uni.showToast({ title: data.error || '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    })
      },

    onNicknameInput(e) {
    this.nickname = e.detail.value
      },

    onGenderChange(e) {
    this.gender = parseInt(e.detail.value)
      },

    onBirthdayChange(e) {
    const birthday = e.detail.value
    const zodiac = this.getZodiac(birthday)
    this.birthday = birthday
    this.zodiac = zodiac
      },

    getZodiac(dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])
    
    for (const sign of zodiacSigns) {
      const [startMonth, startDay] = sign.start
      const [endMonth, endDay] = sign.end
      
      if (startMonth <= endMonth) {
        // 正常情况
        if ((month === startMonth && day >= startDay) || 
            (month === endMonth && day <= endDay) ||
            (month > startMonth && month < endMonth)) {
          return sign.name
        }
      } else {
        // 跨年（摩羯座）
        if ((month === startMonth && day >= startDay) || 
            (month === endMonth && day <= endDay) ||
            month > startMonth || month < endMonth) {
          return sign.name
        }
      }
    }
    return ''
      },

    onBioInput(e) {
    this.bio = e.detail.value
      },

    onInterestTap(interest) {
    let selectedInterests = this.selectedInterests
    let selectedMap = this.selectedMap
    
    if (selectedMap[interest]) {
      // 取消选中
      selectedInterests = selectedInterests.filter(i => i !== interest)
      selectedMap = { ...selectedMap }
      delete selectedMap[interest]
    } else {
      // 选中
      if (selectedInterests.length >= 5) {
        uni.showToast({ title: '最多选择5个', icon: 'none' })
        return
      }
      selectedInterests = [...selectedInterests, interest]
      selectedMap = { ...selectedMap, [interest]: true }
    }
    
    this.selectedInterests = selectedInterests
    this.selectedMap = selectedMap
      },

    onAddPhoto() {
    const { photos } = this
    if (photos.length >= 9) {
      uni.showToast({ title: '最多上传9张照片', icon: 'none' })
      return
    }

    uni.chooseMedia({
      count: 9 - photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFiles
        files.forEach(file => {
          this.uploadPhoto(file.tempFilePath)
        })
      }
    })
      },

    uploadPhoto(filePath) {
    uni.showLoading({ title: '上传中...' })
    uni.uploadFile({
      url: `${app.globalData.baseUrl}/file/upload?type=photo`,
      filePath: filePath,
      name: 'file',
      header: {
        'X-User-Id': app.globalData.userId
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.url) {
          const photos = [...this.photos, data.url]
          this.photos = photos
        }
      },
      fail: () => {
        uni.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => {
        uni.hideLoading()
      }
    })
      },

    onPreviewPhoto(index) {
    uni.previewImage({
      urls: this.photos,
      current: this.photos[index]
    })
      },

    onDeletePhoto(index) {
    uni.showActionSheet({
      itemList: ['删除这张照片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const photos = [...this.photos]
          photos.splice(index, 1)
          this.photos = photos
        }
      }
    })
      },

    onSubmit() {
    const { nickname, avatar, gender, birthday, zodiac, bio, photos, selectedInterests, submitting, isEdit } = this
    
    if (submitting) return
    
    if (!nickname.trim()) {
      uni.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    
    this.submitting = true
    
    uni.request({
      url: `${app.globalData.baseUrl}/user/profile`,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': app.globalData.userId
      },
      data: {
        nickname: nickname.trim(),
        avatar: avatar.startsWith('/images') ? null : avatar,
        gender,
        birthday: birthday || null,
        zodiac: zodiac || null,
        bio: bio.trim() || null,
        photos: JSON.stringify(photos),
        interests: JSON.stringify(selectedInterests)
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 更新全局用户信息
          app.globalData.userInfo = res.data
          uni.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => {
            if (isEdit) {
              uni.navigateBack()
            } else {
              uni.switchTab({ url: '/pages/index/index' })
            }
          }, 1500)
        } else {
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.submitting = false
      }
    })
      },

    onSkip() {
    uni.switchTab({ url: '/pages/index/index' })
      }
  }
}

</script>

<style scoped>
/* pages/setup/setup.wxss */

.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 40rpx;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.hint {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}

/* 头像 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #eee;
  margin-bottom: 16rpx;
}

.avatar-hint {
  font-size: 24rpx;
  color: #999;
}

/* 输入框 */
.input-field {
  background-color: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

/* 性别 */
.gender-group {
  display: flex;
  gap: 40rpx;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #333;
}

/* 兴趣标签 */
.interest-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.interest-item {
  padding: 12rpx 24rpx;
  background-color: #F5F5F5;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.interest-item:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.interest-item.selected {
  background-color: #FFF0F0;
  color: #FF6B6B;
  border-color: #FF6B6B;
}

/* 按钮 */
.btn-group {
  margin-top: 60rpx;
}

.btn-primary {
  background-color: #FF6B6B;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  padding: 24rpx;
}

.skip-btn {
  text-align: center;
  font-size: 28rpx;
  color: #999;
  margin-top: 24rpx;
  padding: 20rpx;
}

/* 生日选择器 */
.picker-field {
  background-color: #f5f5f5;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.picker-field.placeholder {
  color: #999;
}

.zodiac-display {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.zodiac-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.zodiac-text {
  font-size: 28rpx;
  color: #FF6B6B;
  font-weight: 500;
}

/* 个性签名 */
.textarea-field {
  background-color: #f5f5f5;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
  height: 160rpx;
}

/* 照片网格 */
.photos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.photo-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background-color: #eee;
}

.photo-add {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  border: 2rpx dashed #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 60rpx;
  color: #999;
  line-height: 1;
}

.add-text {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

</style>

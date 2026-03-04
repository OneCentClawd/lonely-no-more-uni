<!-- 自动迁移，需人工审查 -->
<template>
<view class="container">
  <!-- 实名认证卡片 -->
  <view class="verify-card card">
    <view class="card-header">
      <text class="card-icon">🪪</text>
      <text class="card-title">实名认证</text>
      <view :class="['status-badge status-', realNameStatus]">
        {{realNameStatusText}}
      </view>
    </view>
    
    <view class="card-body" v-if="realNameStatus === 0 || realNameStatus === 3">
      <view class="form-item">
        <text class="label">真实姓名</text>
        <input class="input" placeholder="请输入真实姓名" :value="realName" @input="onRealNameInput" />
      </view>
      <view class="form-item">
        <text class="label">身份证号</text>
        <input class="input" placeholder="请输入18位身份证号" :value="idCard" @input="onIdCardInput" maxlength="18" />
      </view>
      <view class="reject-reason" v-if="realNameStatus === 3 && rejectReason">
        <text>拒绝原因：{{rejectReason}}</text>
      </view>
      <button class="submit-btn" @click="submitRealName" :disabled="submitting">提交认证</button>
    </view>
    
    <view class="card-body verified" v-if="realNameStatus === 1">
      <text class="hint">审核中，请耐心等待...</text>
    </view>
    
    <view class="card-body verified" v-if="realNameStatus === 2">
      <text class="verified-text">✅ 已认证</text>
      <text class="verified-info" v-if="realNameLast4">身份证尾号：****{{realNameLast4}}</text>
    </view>
  </view>

  <!-- 学生认证卡片 -->
  <view class="verify-card card">
    <view class="card-header">
      <text class="card-icon">🎓</text>
      <text class="card-title">学生认证</text>
      <view :class="['status-badge status-', studentStatus]">
        {{studentStatusText}}
      </view>
    </view>
    
    <view class="card-body" v-if="studentStatus === 0 || studentStatus === 3">
      <view class="form-item">
        <text class="label">学校名称</text>
        <input class="input" placeholder="请输入学校全称" :value="school" @input="onSchoolInput" />
      </view>
      <view class="form-item">
        <text class="label">学生证照片</text>
        <view class="upload-area" @click="uploadStudentCard">
          <image v-if="studentCardImage" class="preview-image" :src="studentCardImage" mode="aspectFit"></image>
          <view v-else class="upload-placeholder">
            <text class="upload-icon">📷</text>
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>
      <view class="reject-reason" v-if="studentStatus === 3 && rejectReason">
        <text>拒绝原因：{{rejectReason}}</text>
      </view>
      <button class="submit-btn" @click="submitStudent" :disabled="submitting">提交认证</button>
    </view>
    
    <view class="card-body verified" v-if="studentStatus === 1">
      <text class="hint">审核中，请耐心等待...</text>
    </view>
    
    <view class="card-body verified" v-if="studentStatus === 2">
      <text class="verified-text">✅ 已认证</text>
      <text class="verified-info" v-if="verifiedSchool">{{verifiedSchool}}</text>
    </view>
  </view>

  <!-- 说明 -->
  <view class="tips">
    <text class="tips-title">认证说明</text>
    <text class="tips-item">• 实名认证后可获得 +10 信用分</text>
    <text class="tips-item">• 学生认证后可获得 +10 信用分</text>
    <text class="tips-item">• 认证信息仅用于身份核验，不会公开展示</text>
    <text class="tips-item">• 审核时间约 1-3 个工作日</text>
  </view>
</view>

</template>

<script>
const app = getApp()


export default {
  data() {
    return {
    realNameStatus: 0,  // 0未认证 1审核中 2已认证 3已拒绝
    studentStatus: 0,
    realNameStatusText: '未认证',
    studentStatusText: '未认证',
    realName: '',
    idCard: '',
    school: '',
    studentCardImage: '',
    realNameLast4: '',
    verifiedSchool: '',
    rejectReason: '',
    submitting: false
    }
  },
  
  // 生命周期映射: onLoad → onLoad (uni-app 保留), onShow → onShow
  onLoad() {
    this.loadStatus()
  },

  onShow() {
    this.loadStatus()
  },

  loadStatus() {
    const userId = app.globalData.userId
    if (!userId) return

    uni.request({
      url: `${app.globalData.baseUrl}/verification/status`,
      header: { 'X-User-Id': userId },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data
          this.realNameStatus = data.realNameStatus || 0
        this.studentStatus = data.studentStatus || 0
        this.realNameStatusText = this.getStatusText(data.realNameStatus || 0)
        this.studentStatusText = this.getStatusText(data.studentStatus || 0),
            realNameLast4: data.realNameLast4 || '',
            verifiedSchool: data.school || '',
            rejectReason: data.rejectReason || ''
        }
      }
    })
  },

  getStatusText(status) {
    const texts = ['未认证', '审核中', '已认证', '已拒绝']
    return texts[status] || '未认证'
  },

  onRealNameInput(e) {
    this.realName = e.detail.value
  },

  onIdCardInput(e) {
    this.idCard = e.detail.value.toUpperCase()
  },

  onSchoolInput(e) {
    this.school = e.detail.value
  },

  uploadStudentCard() {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        uni.showLoading({ title: '上传中...' })
        
        uni.uploadFile({
          url: `${app.globalData.baseUrl}/upload`,
          filePath: tempFilePath,
          name: 'file',
          header: { 'X-User-Id': app.globalData.userId },
          success: (uploadRes) => {
            const data = JSON.parse(uploadRes.data)
            if (data.url) {
              this.studentCardImage = data.url
            }
          },
          complete: () => {
            uni.hideLoading()
          }
        })
      }
    })
  },

  submitRealName() {
    const { realName, idCard } = this.data
    
    if (!realName.trim()) {
      uni.showToast({ title: '请输入真实姓名', icon: 'none' })
      return
    }
    
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      uni.showToast({ title: '身份证号格式不正确', icon: 'none' })
      return
    }
    
    this.submitting = true
    
    uni.request({
      url: `${app.globalData.baseUrl}/verification/real-name`,
      method: 'POST',
      header: { 
        'X-User-Id': app.globalData.userId,
        'Content-Type': 'application/json'
      },
      data: { realName, idCardNumber: idCard },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          uni.showToast({ title: '提交成功', icon: 'success' })
          this.loadStatus()
        } else {
          uni.showToast({ title: res.data.error || '提交失败', icon: 'none' })
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

  submitStudent() {
    const { school, studentCardImage } = this.data
    
    if (!school.trim()) {
      uni.showToast({ title: '请输入学校名称', icon: 'none' })
      return
    }
    
    if (!studentCardImage) {
      uni.showToast({ title: '请上传学生证照片', icon: 'none' })
      return
    }
    
    this.submitting = true
    
    uni.request({
      url: `${app.globalData.baseUrl}/verification/student`,
      method: 'POST',
      header: { 
        'X-User-Id': app.globalData.userId,
        'Content-Type': 'application/json'
      },
      data: { school, studentCardImage },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          uni.showToast({ title: '提交成功', icon: 'success' })
          this.loadStatus()
        } else {
          uni.showToast({ title: res.data.error || '提交失败', icon: 'none' })
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
.container {
  padding: 24rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

.verify-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 0;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.status-badge {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.status-0 {
  background: #f0f0f0;
  color: #999;
}

.status-1 {
  background: #FFF3E0;
  color: #FF9800;
}

.status-2 {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-3 {
  background: #FFEBEE;
  color: #F44336;
}

.card-body {
  padding: 24rpx;
}

.card-body.verified {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  line-height: 88rpx;
}

.upload-area {
  width: 100%;
  height: 300rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #ddd;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 26rpx;
  color: #999;
}

.reject-reason {
  padding: 16rpx;
  background: #FFEBEE;
  border-radius: 8rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #F44336;
}

.submit-btn {
  width: 100%;
  background: #FF6B6B;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
}

.submit-btn[disabled] {
  background: #ccc;
}

.hint {
  font-size: 28rpx;
  color: #FF9800;
}

.verified-text {
  font-size: 36rpx;
  color: #4CAF50;
  margin-bottom: 16rpx;
}

.verified-info {
  font-size: 28rpx;
  color: #666;
}

.tips {
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.tips-item {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

</style>

<template>
  <view class="login-page">
    <view class="logo-section">
      <text class="logo-text">🤝 孤独患者</text>
      <text class="sub-text">找到身边的伙伴</text>
    </view>

    <view class="form-section">
      <view class="input-group">
        <input class="input" type="text" v-model="email" placeholder="请输入邮箱" />
      </view>
      <view class="input-group code-group">
        <input class="input code-input" type="number" v-model="code" placeholder="验证码" maxlength="6" />
        <button class="code-btn" :disabled="countdown > 0" @click="sendCode">
          {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
        </button>
      </view>
      <button class="btn-primary login-btn" @click="login" :disabled="!email || !code">登录 / 注册</button>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="divider">
      <text class="divider-text">或</text>
    </view>
    <button class="btn-secondary wx-btn" @click="wxLogin">微信一键登录</button>
    <!-- #endif -->
  </view>
</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      email: '',
      code: '',
      countdown: 0
    }
  },
  methods: {
    async sendCode() {
      if (!this.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' })
        return
      }
      uni.request({
        url: `${app.globalData.baseUrl}/auth/send-code`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { email: this.email },
        success: (res) => {
          if (res.statusCode === 200) {
            uni.showToast({ title: '验证码已发送', icon: 'success' })
            this.countdown = 60
            const timer = setInterval(() => {
              this.countdown--
              if (this.countdown <= 0) clearInterval(timer)
            }, 1000)
          } else {
            uni.showToast({ title: res.data.message || '发送失败', icon: 'none' })
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      })
    },

    login() {
      if (!this.email || !this.code) return
      app.loginByEmail(this.email, this.code, (err, user) => {
        if (err) {
          uni.showToast({ title: err.message || '登录失败', icon: 'none' })
        } else {
          uni.switchTab({ url: '/pages/index/index' })
        }
      })
    },

    // #ifdef MP-WEIXIN
    wxLogin() {
      app.loginByWechat((err, user) => {
        if (err) {
          uni.showToast({ title: '微信登录失败', icon: 'none' })
        } else {
          uni.switchTab({ url: '/pages/index/index' })
        }
      })
    }
    // #endif
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 120rpx 60rpx;
  background: linear-gradient(180deg, #FF6B6B 0%, #FF8E8E 30%, #F5F5F5 60%);
}

.logo-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo-text {
  display: block;
  font-size: 60rpx;
  font-weight: bold;
  color: #fff;
}

.sub-text {
  display: block;
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 12rpx;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.input-group {
  margin-bottom: 24rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.code-group {
  display: flex;
  gap: 16rpx;
}

.code-input {
  flex: 1;
}

.code-btn {
  width: 220rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 26rpx;
  background: #FF6B6B;
  color: #fff;
  border-radius: 12rpx;
  border: none;
  padding: 0;
}

.code-btn[disabled] {
  background: #ccc;
}

.login-btn {
  width: 100%;
  margin-top: 20rpx;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0;
}

.divider {
  text-align: center;
  margin: 40rpx 0;
  position: relative;
}

.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1rpx;
  background: #ddd;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.divider-text {
  color: #999;
  font-size: 26rpx;
  padding: 0 20rpx;
  background: #F5F5F5;
}

.wx-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0;
}
</style>

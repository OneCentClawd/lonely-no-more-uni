<script>
export default {
  globalData: {
    userInfo: null,
    userId: null,
    baseUrl: 'https://lonely.centralus.cloudapp.azure.com/api',
    wsUrl: 'wss://lonely.centralus.cloudapp.azure.com/ws/chat',
    latitude: null,
    longitude: null,
    locationName: null
  },

  onLaunch() {
    const userId = uni.getStorageSync('userId')
    const userInfo = uni.getStorageSync('userInfo')
    if (userId) {
      this.globalData.userId = userId
      this.globalData.userInfo = userInfo
    }
    const latitude = uni.getStorageSync('latitude')
    const longitude = uni.getStorageSync('longitude')
    const locationName = uni.getStorageSync('locationName')
    if (latitude && longitude) {
      this.globalData.latitude = latitude
      this.globalData.longitude = longitude
      this.globalData.locationName = locationName || '已保存位置'
    }
  },

  methods: {
    updateLocation(lat, lng, name) {
      this.globalData.latitude = lat
      this.globalData.longitude = lng
      this.globalData.locationName = name
      uni.setStorageSync('latitude', lat)
      uni.setStorageSync('longitude', lng)
      uni.setStorageSync('locationName', name)
    },

    // H5/APP: 邮箱验证码登录
    loginByEmail(email, code, callback) {
      uni.request({
        url: `${this.globalData.baseUrl}/auth/login-by-email`,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { email, code },
        success: (result) => {
          if (result.statusCode === 200 && result.data.success) {
            const user = result.data.user
            this.globalData.userId = user.id
            this.globalData.userInfo = user
            uni.setStorageSync('userId', user.id)
            uni.setStorageSync('userInfo', user)
            callback && callback(null, user)
          } else {
            callback && callback(new Error(result.data.message || '登录失败'))
          }
        },
        fail: (err) => callback && callback(err)
      })
    },

    // 微信小程序登录（条件编译）
    // #ifdef MP-WEIXIN
    loginByWechat(callback) {
      wx.login({
        success: (res) => {
          if (res.code) {
            uni.request({
              url: `${this.globalData.baseUrl}/auth/login`,
              method: 'POST',
              header: { 'Content-Type': 'application/json' },
              data: { code: res.code },
              success: (result) => {
                if (result.statusCode === 200 && result.data.success) {
                  const user = result.data.user
                  this.globalData.userId = user.id
                  this.globalData.userInfo = user
                  uni.setStorageSync('userId', user.id)
                  uni.setStorageSync('userInfo', user)
                  callback && callback(null, user)
                } else {
                  callback && callback(new Error('登录失败'))
                }
              },
              fail: (err) => callback && callback(err)
            })
          } else {
            callback && callback(new Error('获取code失败'))
          }
        },
        fail: (err) => callback && callback(err)
      })
    },
    // #endif

    checkLogin(callback) {
      if (this.globalData.userId) {
        callback && callback(null, this.globalData.userInfo)
      } else {
        // #ifdef MP-WEIXIN
        this.loginByWechat(callback)
        // #endif
        // #ifdef H5 || APP-PLUS
        uni.navigateTo({ url: '/pages/login/login' })
        // #endif
      }
    }
  }
}
</script>

<style>
page {
  background-color: #F5F5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #333;
}

.container {
  padding: 20rpx;
}

.btn-primary {
  background-color: #FF6B6B;
  color: #fff;
  border-radius: 12rpx;
  padding: 24rpx 40rpx;
  text-align: center;
  font-size: 32rpx;
  border: none;
}

.btn-primary:active {
  background-color: #E55A5A;
}

.btn-secondary {
  background-color: #fff;
  color: #FF6B6B;
  border: 2rpx solid #FF6B6B;
  border-radius: 12rpx;
  padding: 22rpx 40rpx;
  text-align: center;
  font-size: 32rpx;
}

.card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.tag {
  display: inline-block;
  background-color: #FFF0F0;
  color: #FF6B6B;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-right: 12rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #eee;
}

.avatar-large {
  width: 120rpx;
  height: 120rpx;
}

.text-primary {
  color: #FF6B6B;
}

.text-gray {
  color: #999;
}

.text-small {
  font-size: 24rpx;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-1 {
  flex: 1;
}

.mt-20 {
  margin-top: 20rpx;
}

.mb-20 {
  margin-bottom: 20rpx;
}
</style>

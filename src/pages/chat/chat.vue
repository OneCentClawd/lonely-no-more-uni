<!-- 自动迁移，需人工审查 -->
<template>
<!--pages/chat/chat.wxml-->
<view class="chat-container">
  <!-- 顶部导航 -->
  <view class="chat-header">
    <view class="header-title">群聊</view>
    <view class="header-members" @click="onShowMembers">
      <text class="member-count">{{memberCount || 0}}人</text>
      <text class="arrow">›</text>
    </view>
  </view>

  <!-- 成员列表弹窗 -->
  <view class="members-modal" v-if="showMembersModal" @click="onHideMembers">
    <view class="members-content" @click.stop="">
      <view class="members-header">
        <text class="members-title">群成员 ({{memberCount}})</text>
        <text class="close-btn" @click="onHideMembers">×</text>
      </view>
      <scroll-view class="members-scroll" scroll-y>
        <view class="member-item" v-for="(item, index) in members" :key="item.userId" @click="onMemberTap(item.userId)">
          <image class="member-avatar" :src="item.avatar || '/static/images/default-avatar.jpg'" mode="aspectFill"></image>
          <text class="member-name">{{item.nickname || '用户' + item.userId}}</text>
          <text class="creator-badge" v-if="item.role === 1">发起人</text>
        </view>
      </scroll-view>
    </view>
  </view>

  <!-- 连接状态提示 -->
  <view class="connection-status" v-if="connecting">
    <text>连接中...</text>
  </view>
  <view class="connection-status error" v-if="!socketOpen && !connecting">
    <text>连接断开，点击重连</text>
  </view>

  <!-- 消息列表 -->
  <scroll-view 
    class="message-list" 
    scroll-y 
    :scroll-into-view="scrollToMessage"
    scroll-with-animation
    :enhanced="true"
    :bounces="false"
  >
    <!-- 空状态 -->
    <view class="empty-state" v-if="messages.length === 0 && !loading">
      <text class="empty-icon">💬</text>
      <text class="empty-text">开始聊天吧～</text>
    </view>

    <template v-for="(item, index) in messages" :key="item.id">
      <!-- 时间分隔线 -->
      <view class="time-divider" v-if="item.showTimeDivider">
        <text>{{item.timeDividerText}}</text>
      </view>
      
      <!-- 系统消息 -->
      <view class="system-message-wrapper" v-if="item.isSystem" id="msg-{{item.id}}">
        <view class="system-message">{{item.content}}</view>
      </view>
      
      <!-- 普通消息 -->
      <view :class="['message-item', item.isMine ? 'mine' : '']" 
            v-if="!item.isSystem"
            id="msg-{{item.id}}">
        <!-- 他人消息：头像在左 -->
        <template v-if="!item.isMine">
          <image class="avatar" :src="item.senderAvatar || '/static/images/default-avatar.jpg'" mode="aspectFill" @click="onAvatarTap(item.senderId)"></image>
          <view class="message-content">
            <view class="sender-name">{{item.senderName}}</view>
            <!-- 图片消息 -->
            <image class="bubble-image" v-if="item.type === 2" :src="item.imageUrl" mode="widthFix" @click="onPreviewImage(item.imageUrl)"></image>
            <!-- 文字消息 -->
            <view class="bubble" v-else>{{item.content}}</view>
            <view class="message-time">{{item.createdAt}}</view>
          </view>
        </template>
        <!-- 我的消息：头像在右 -->
        <template v-else>
          <image class="avatar" :src="item.senderAvatar || '/static/images/default-avatar.jpg'" mode="aspectFill" @click="onAvatarTap(item.senderId)"></image>
          <view class="message-content">
            <!-- 图片消息 -->
            <image class="bubble-image" v-if="item.type === 2" :src="item.imageUrl" mode="widthFix" @click="onPreviewImage(item.imageUrl)"></image>
            <!-- 文字消息 -->
            <view class="bubble mine" v-else>{{item.content}}</view>
            <view class="message-time">{{item.createdAt}}</view>
          </view>
        </template>
      </view>
    </template>
  </scroll-view>

  <!-- 输入栏 -->
  <view class="input-bar" :style="`bottom: ${keyboardHeight}px;`">
    <view class="input-extra" @click="onChooseImage">
      <text class="extra-icon">📷</text>
    </view>
    <input 
      class="input-field" 
      placeholder="输入消息..." 
      :value="inputValue"
      @input="onInput"
      @confirm="onSend"
      confirm-type="send"
      :adjust-position="false"
      @focus="onInputFocus"
      @blur="onInputBlur"
      :disabled="!socketOpen"
    />
    <button :class="['send-btn', inputValue ? '' : 'disabled']" @click="onSend" :disabled="!socketOpen || !inputValue">发送</button>
  </view>
</view>

</template>

<script>
const app = getApp()

export default {
  data() {
    return {
      activityId: null,
      activityTitle: '',
      memberCount: 0,
      members: [],
      showMembersModal: false,
      messages: [],
      inputValue: '',
      scrollToMessage: '',
      socketOpen: false,
      connecting: false,
      loading: false,
      keyboardHeight: 0
    }
  },

  onLoad(options) {
    this.activityId = options.id
    this.loadActivityInfo()
    this.loadHistory()
    this.connectWebSocket()
    this.requestSubscribe()
    },

  onUnload() {
    this.closeWebSocket()
    },

  onShow() {
    // 如果断开了，重新连接
    if (!this.socketOpen && !this.connecting) {
      this.connectWebSocket()
    }
    },

  onHide() {
    // 页面隐藏时不断开，保持连接
    },

  methods: {
    requestSubscribe() {
    uni.requestSubscribeMessage({
      tmplIds: [
        '7jNoIpIxLkqpXDZZ4NDL1OcdZ6b_UQ4qOy5JrTjjyyA',  // 新消息提醒
        'eBe3cUlKoY4qCuF5fzAerYC4x66qr9F57DZIGUHKISA',  // 活动即将开始
        '5aw6Bz-LMegEu4Ns5B6xurtMFkw8ojm5qBi94wRe898'   // 活动状态变更
      ],
      success: (res) => {
        console.log('订阅消息授权结果:', res)
      },
      fail: (err) => {
        console.log('订阅消息授权失败:', err)
      }
    })
      },

    loadActivityInfo() {
    const { activityId } = this
    uni.request({
      url: `${app.globalData.baseUrl}/activity/${activityId}`,
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data
          const activity = data.activity || data
          const members = data.members || []
          const title = activity.title || '群聊'
          this.activityTitle = title
          this.memberCount = members.length || activity.currentMembers || 0
          this.members = members
          // 设置导航栏标题为活动名称
          uni.setNavigationBarTitle({ title })
        }
      }
    })
      },

    loadHistory() {
    const { activityId } = this
    uni.request({
      url: `${app.globalData.baseUrl}/chat/${activityId}/history`,
      header: { 'X-User-Id': app.globalData.userId },
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const myUserId = parseInt(app.globalData.userId)
          const messages = this.processMessages(res.data, myUserId)
          this.messages = messages
          this.scrollToMessage = messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''
          // 标记所有消息已读
          this.markAllAsRead()
        }
      }
    })
      },

    processMessages(rawMessages, myUserId) {
    let lastTime = null
    return rawMessages.map((msg, index) => {
      const senderId = parseInt(msg.senderId)
      const createdAt = msg.createdAt
      
      // 判断是否显示时间分隔线（超过5分钟）
      let showTimeDivider = false
      let timeDividerText = ''
      if (createdAt) {
        const msgTime = new Date(createdAt.endsWith('Z') || createdAt.includes('+') ? createdAt : createdAt + 'Z')
        if (!lastTime || (msgTime - lastTime) > 5 * 60 * 1000) {
          showTimeDivider = true
          timeDividerText = this.formatTimeDivider(msgTime)
        }
        lastTime = msgTime
      }
      
      return {
        id: msg.id,
        senderId: senderId,
        senderName: msg.senderNickname || '用户' + msg.senderId,
        senderAvatar: msg.senderAvatar || '/static/images/default-avatar.jpg',
        content: msg.content,
        type: msg.type || 0,
        imageUrl: msg.imageUrl,
        createdAt: this.formatTime(createdAt),
        isMine: senderId === myUserId,
        isSystem: msg.type === 1,
        readCount: msg.readCount || 0,
        showTimeDivider,
        timeDividerText
      }
    })
      },

    formatTimeDivider(date) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.floor((today - msgDay) / (24 * 60 * 60 * 1000))
    
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    
    if (diffDays === 0) {
      return `今天 ${h}:${m}`
    } else if (diffDays === 1) {
      return `昨天 ${h}:${m}`
    } else {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}-${day} ${h}:${m}`
    }
      },

    markAllAsRead() {
    const { activityId } = this
    uni.request({
      url: `${app.globalData.baseUrl}/chat/${activityId}/read-all`,
      method: 'PUT',
      header: { 'X-User-Id': app.globalData.userId }
    })
      },

    connectWebSocket() {
    if (!app.globalData.userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.connecting = true

    // 单连接模式：不带 activityId，消息里路由
    const wsUrl = app.globalData.wsUrl
    
    uni.connectSocket({ url: wsUrl })

    uni.onSocketOpen(() => {
      this.socketOpen = true
      this.connecting = false
      // 加入房间
      uni.sendSocketMessage({
        data: JSON.stringify({
          type: 'join',
          userId: app.globalData.userId,
          activityId: parseInt(this.activityId)
        })
      })
    })

    uni.onSocketMessage(res => {
      const data = JSON.parse(res.data)
      if (data.type === 'message' || data.type === 'image') {
        const msg = data.message
        const myUserId = parseInt(app.globalData.userId)
        const senderId = parseInt(msg.senderId)
        
        // 判断是否显示时间分隔线
        let showTimeDivider = false
        let timeDividerText = ''
        const lastMsg = this.messages[this.messages.length - 1]
        if (!lastMsg || !lastMsg.createdAt) {
          showTimeDivider = true
          timeDividerText = this.formatTimeDivider(new Date())
        }
        
        const newMessage = {
          id: msg.id,
          senderId: senderId,
          senderName: msg.senderNickname || '用户' + msg.senderId,
          senderAvatar: msg.senderAvatar || '/static/images/default-avatar.jpg',
          content: msg.content,
          type: msg.type || 0,
          imageUrl: msg.imageUrl,
          createdAt: this.formatTime(msg.createdAt),
          isMine: senderId === myUserId,
          readCount: 0,
          showTimeDivider,
          timeDividerText
        }
        console.log('WebSocket消息 - senderId:', senderId, 'myUserId:', myUserId, 'isMine:', senderId === myUserId)
        this.messages = [...this.messages, newMessage]
        this.scrollToMessage = `msg-${msg.id}`
        
        // 非自己的消息自动标记已读
        if (senderId !== myUserId && msg.id) {
          uni.request({
            url: `${app.globalData.baseUrl}/chat/message/${msg.id}/read`,
            method: 'PUT',
            header: { 'X-User-Id': app.globalData.userId }
          })
        }
      } else if (data.type === 'system') {
        // 系统消息
        const sysMessage = {
          id: Date.now(),
          isSystem: true,
          content: data.content,
          createdAt: this.formatTime(new Date().toISOString())
        }
        this.messages = [...this.messages, sysMessage]
      }
    })

    uni.onSocketClose(() => {
      this.socketOpen = false
      this.connecting = false
    })

    uni.onSocketError(() => {
      this.socketOpen = false
      this.connecting = false
      uni.showToast({ title: '连接失败', icon: 'none' })
    })
      },

    closeWebSocket() {
    if (this.socketOpen) {
      uni.sendSocketMessage({
        data: JSON.stringify({
          type: 'leave',
          userId: app.globalData.userId,
          activityId: parseInt(this.activityId)
        })
      })
      uni.closeSocket()
      this.socketOpen = false
    }
      },

    onShowMembers() {
    this.showMembersModal = true
      },

    onHideMembers() {
    this.showMembersModal = false
      },

    onMemberTap(userId) {
    this.showMembersModal = false
    uni.navigateTo({
      url: `/pages/user/user?id=${userId}`
    })
      },

    onAvatarTap(userId) {
    if (userId) {
      uni.navigateTo({
        url: `/pages/user/user?id=${userId}`
      })
    }
      },

    onInputFocus(e) {
    this.keyboardHeight = e.detail.height || 0
    // 滚动到底部
    setTimeout(() => {
      if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1]
        this.scrollToMessage = 'msg-' + lastMsg.id
      }
    }, 100)
      },

    onInputBlur() {
    this.keyboardHeight = 0
      },

    onInput(e) {
    this.inputValue = e.detail.value
      },

    onSend() {
    const content = this.inputValue.trim()
    if (!content) return

    if (!app.globalData.userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    if (this.socketOpen) {
      uni.sendSocketMessage({
        data: JSON.stringify({
          type: 'message',
          activityId: parseInt(this.activityId),
          senderId: app.globalData.userId,
          content
        })
      })
      this.inputValue = ''
    } else {
      uni.showToast({ title: '连接已断开', icon: 'none' })
      this.connectWebSocket()
    }
      },

    formatTime(timeStr) {
    if (!timeStr) return ''
    // 后端返回的是 UTC 时间，JS Date 会自动转换为本地时区
    let date
    if (timeStr.endsWith('Z') || timeStr.includes('+')) {
      date = new Date(timeStr)
    } else {
      // 没有时区信息，当作 UTC 处理
      date = new Date(timeStr + 'Z')
    }
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
      },

    onChooseImage() {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        uni.showLoading({ title: '发送中...' })
        
        // 上传图片
        uni.uploadFile({
          url: `${app.globalData.baseUrl}/upload/image`,
          filePath: tempFilePath,
          name: 'file',
          header: { 'X-User-Id': app.globalData.userId },
          success: (uploadRes) => {
            uni.hideLoading()
            if (uploadRes.statusCode === 200) {
              const data = JSON.parse(uploadRes.data)
              const imageUrl = data.url
              
              // 通过 WebSocket 发送图片消息
              if (this.socketOpen) {
                uni.sendSocketMessage({
                  data: JSON.stringify({
                    type: 'image',
                    activityId: parseInt(this.activityId),
                    senderId: app.globalData.userId,
                    imageUrl: imageUrl
                  })
                })
              }
            } else {
              uni.showToast({ title: '上传失败', icon: 'none' })
            }
          },
          fail: () => {
            uni.hideLoading()
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    })
      },

    onPreviewImage(url) {
    if (url) {
      uni.previewImage({
        urls: [url],
        current: url
      })
    }
      }
  }
}

</script>

<style scoped>
/* pages/chat/chat.wxss */

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F5F5;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 顶部导航 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-members {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 28rpx;
}

.member-count {
  margin-right: 8rpx;
}

.arrow {
  font-size: 32rpx;
  color: #999;
}

/* 连接状态 */
.connection-status {
  text-align: center;
  padding: 16rpx;
  background-color: #FFF3E0;
  color: #FF9800;
  font-size: 26rpx;
}

.connection-status.error {
  background-color: #FFEBEE;
  color: #F44336;
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: 20rpx;
  padding-bottom: 120rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
}

.message-item.mine {
  flex-direction: row-reverse;
  justify-content: flex-start;
  padding-right: 20rpx;
  margin-right: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #ddd;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  margin: 0 16rpx;
}

.sender-name {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.bubble {
  background-color: #fff;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
}

.bubble.mine {
  background-color: #FF6B6B;
  color: #fff;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.message-item.mine .message-time {
  text-align: right;
}

/* 系统消息 */
.system-message-wrapper {
  display: flex;
  justify-content: center;
  margin: 20rpx 0;
}

.system-message {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 12rpx 24rpx;
  background-color: rgba(0,0,0,0.05);
  border-radius: 20rpx;
}

/* 输入栏 */
.input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  border-top: 1rpx solid #eee;
}

.input-field {
  flex: 1;
  background-color: #F5F5F5;
  border-radius: 36rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  margin-right: 15rpx;
}

.send-btn {
  margin-left: 40rpx;
  margin-right: 0;
  background-color: #FF6B6B;
  color: #fff;
  font-size: 28rpx;
  padding: 22rpx 40rpx;
  border-radius: 36rpx;
  line-height: 1;
  text-align: center;
  min-width: auto;
  width: auto !important;
  box-sizing: border-box;
}

.send-btn.disabled {
  background-color: #ccc;
}

/* 成员列表弹窗 */
.members-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.members-content {
  width: 80%;
  max-height: 70%;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.members-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  font-size: 40rpx;
  color: #999;
  padding: 0 10rpx;
}

.members-scroll {
  flex: 1;
  max-height: 500rpx;
  padding: 20rpx;
  overflow-y: auto;
  overflow-x: hidden;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 16rpx 10rpx;
  width: 100%;
  box-sizing: border-box;
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #eee;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.member-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator-badge {
  font-size: 22rpx;
  color: #FF6B6B;
  background-color: #FFF0F0;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  margin-left: auto;
  margin-right: 30rpx;
  flex-shrink: 0;
}

/* 时间分隔线 */
.time-divider {
  text-align: center;
  padding: 20rpx 0;
}

.time-divider text {
  font-size: 22rpx;
  color: #999;
  background-color: #f5f5f5;
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
}

/* 图片消息 */
.bubble-image {
  max-width: 400rpx;
  border-radius: 16rpx;
}

/* 已读状态 */
.message-meta {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 8rpx;
}

.read-status {
  font-size: 20rpx;
  color: #4CAF50;
}

.read-status.unread {
  color: #999;
}

/* 图片发送按钮 */
.input-extra {
  padding: 0 16rpx;
}

.extra-icon {
  font-size: 44rpx;
}

</style>

<template>
  <view class="map-picker-page">
    <!-- 搜索框 -->
    <view class="search-box">
      <input 
        class="search-input" 
        placeholder="搜索地点" 
        v-model="keyword"
        @confirm="onSearch"
      />
      <button class="search-btn" @click="onSearch">搜索</button>
    </view>

    <!-- 地图容器 -->
    <view id="map-container" class="map-container">
      <!-- 定位按钮 -->
      <view class="locate-btn" @click="onLocate">📍</view>
    </view>

    <!-- 搜索结果列表 -->
    <view class="result-list" v-if="searchResults.length > 0">
      <view 
        class="result-item" 
        v-for="(item, index) in searchResults" 
        :key="index"
        @click="onSelectPoi(item)"
      >
        <text class="result-name">{{item.name}}</text>
        <text class="result-address">{{item.address}}</text>
      </view>
    </view>

    <!-- 选中的地点 -->
    <view class="selected-location" v-if="selectedName">
      <view class="selected-info">
        <text class="selected-name">{{selectedName}}</text>
        <text class="selected-address">{{selectedAddress}}</text>
      </view>
      <button class="confirm-btn" @click="onConfirm">确定</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      searchResults: [],
      selectedName: '',
      selectedAddress: '',
      selectedLat: null,
      selectedLng: null,
      map: null,
      marker: null
    }
  },

  onReady() {
    this.initMap()
  },

  methods: {
    initMap() {
      // 高德地图已在 index.html 加载
      this.createMap()
    },

    createMap() {
      // 获取当前位置
      const map = new AMap.Map('map-container', {
        zoom: 15,
        center: [116.397428, 39.90923] // 默认北京
      })
      this.map = map

      // 点击地图选点
      map.on('click', (e) => {
        const lnglat = e.lnglat
        this.setMarker(lnglat.lng, lnglat.lat)
        this.reverseGeocode(lnglat.lng, lnglat.lat)
      })

      // 尝试获取当前位置（用浏览器原生定位）
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lng = pos.coords.longitude
            const lat = pos.coords.latitude
            map.setCenter([lng, lat])
            this.setMarker(lng, lat)
            this.reverseGeocode(lng, lat)
          },
          (err) => {
            console.log('定位失败:', err)
            // 失败时用默认位置
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      }

      // 加载搜索插件
      AMap.plugin('AMap.PlaceSearch', () => {
        this.placeSearch = new AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1
        })
      })

      // 加载逆地理编码插件
      AMap.plugin('AMap.Geocoder', () => {
        this.geocoder = new AMap.Geocoder()
      })
    },

    setMarker(lng, lat) {
      if (this.marker) {
        this.marker.setPosition([lng, lat])
      } else {
        this.marker = new AMap.Marker({
          position: [lng, lat],
          map: this.map
        })
      }
      this.selectedLat = lat
      this.selectedLng = lng
    },

    reverseGeocode(lng, lat) {
      if (!this.geocoder) return
      this.geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          const address = result.regeocode.formattedAddress
          this.selectedName = result.regeocode.addressComponent.building || '选中的位置'
          this.selectedAddress = address
        }
      })
    },

    onSearch() {
      if (!this.keyword.trim() || !this.placeSearch) return
      this.placeSearch.search(this.keyword, (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          this.searchResults = result.poiList.pois.map(poi => ({
            name: poi.name,
            address: poi.address,
            lng: poi.location.lng,
            lat: poi.location.lat
          }))
        } else {
          this.searchResults = []
          uni.showToast({ title: '未找到结果', icon: 'none' })
        }
      })
    },

    onLocate() {
      uni.showLoading({ title: '定位中...' })
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            uni.hideLoading()
            const lng = pos.coords.longitude
            const lat = pos.coords.latitude
            this.map.setCenter([lng, lat])
            this.map.setZoom(15)
            this.setMarker(lng, lat)
            this.reverseGeocode(lng, lat)
            uni.showToast({ title: '定位成功', icon: 'success' })
          },
          (err) => {
            uni.hideLoading()
            console.log('定位失败:', err)
            let msg = '定位失败'
            if (err.code === 1) msg = '请允许位置权限'
            else if (err.code === 2) msg = '无法获取位置'
            else if (err.code === 3) msg = '定位超时'
            uni.showToast({ title: msg, icon: 'none' })
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      } else {
        uni.hideLoading()
        uni.showToast({ title: '浏览器不支持定位', icon: 'none' })
      }
    },

    onSelectPoi(poi) {
      this.searchResults = []
      this.keyword = poi.name
      this.selectedName = poi.name
      this.selectedAddress = poi.address
      this.selectedLat = poi.lat
      this.selectedLng = poi.lng
      this.map.setCenter([poi.lng, poi.lat])
      this.setMarker(poi.lng, poi.lat)
    },

    onConfirm() {
      if (!this.selectedLat || !this.selectedLng) {
        uni.showToast({ title: '请选择地点', icon: 'none' })
        return
      }
      // 返回上一页并传递数据
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage && prevPage.$vm) {
        const vm = prevPage.$vm
        const name = this.selectedName || this.selectedAddress
        // 判断来源页面
        if (vm.locationName !== undefined) {
          // 来自 index 页面
          vm.locationName = name
          vm.latitude = this.selectedLat
          vm.longitude = this.selectedLng
          if (vm.loadActivities) {
            vm.loadActivities()
          }
        } else {
          // 来自 create 页面
          vm.address = name
          vm.latitude = this.selectedLat
          vm.longitude = this.selectedLng
        }
      }
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.map-picker-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.search-box {
  display: flex;
  padding: 20rpx;
  background: #fff;
}

.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  font-size: 28rpx;
}

.search-btn {
  margin-left: 16rpx;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 32rpx;
  background: #FF6B6B;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
}

.map-container {
  flex: 1;
  width: 100%;
  min-height: 500rpx;
  position: relative;
}

.locate-btn {
  position: absolute;
  right: 20rpx;
  bottom: 40rpx;
  width: 80rpx;
  height: 80rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
  z-index: 10;
  cursor: pointer;
}

.locate-btn:active {
  background: #f5f5f5;
}

.result-list {
  position: absolute;
  top: 112rpx;
  left: 0;
  right: 0;
  max-height: 600rpx;
  background: #fff;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.result-item {
  padding: 24rpx;
  border-bottom: 1rpx solid #eee;
}

.result-name {
  display: block;
  font-size: 30rpx;
  color: #333;
}

.result-address {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.selected-location {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
}

.selected-info {
  flex: 1;
}

.selected-name {
  display: block;
  font-size: 30rpx;
  color: #333;
}

.selected-address {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.confirm-btn {
  padding: 16rpx 48rpx;
  background: #FF6B6B;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
}
</style>

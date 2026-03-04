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
    <view id="map-container" class="map-container"></view>

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

      // 尝试获取当前位置
      AMap.plugin('AMap.Geolocation', () => {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000
        })
        geolocation.getCurrentPosition((status, result) => {
          if (status === 'complete') {
            const { lng, lat } = result.position
            map.setCenter([lng, lat])
            this.setMarker(lng, lat)
            this.reverseGeocode(lng, lat)
          }
        })
      })

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
      if (prevPage) {
        prevPage.$vm.address = this.selectedName || this.selectedAddress
        prevPage.$vm.latitude = this.selectedLat
        prevPage.$vm.longitude = this.selectedLng
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

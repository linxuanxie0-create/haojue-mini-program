Page({
  data: {
    headerTop: 48,
    modelTop: 116,
    vehicleAnimation: {}
  },

  onLoad() {
    const menuRect = wx.getMenuButtonBoundingClientRect()
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const headerTop = menuRect.top || (windowInfo.statusBarHeight || 20) + 10
    const modelTop = (menuRect.bottom || headerTop + 32) + 22
    this.setData({ headerTop, modelTop })
  },

  onReady() {
    this._pageReady = true
    if (this._vehicleImageLoaded) this.playVehicleEntrance()
  },

  onShow() {
    if (this._pageReady && this._vehicleImageLoaded) this.playVehicleEntrance()
  },

  onHide() {
    clearTimeout(this._vehicleEntranceTimer)
  },

  onUnload() {
    clearTimeout(this._vehicleEntranceTimer)
  },

  onVehicleImageLoad() {
    this._vehicleImageLoaded = true
    if (this._pageReady) this.playVehicleEntrance()
  },

  playVehicleEntrance() {
    clearTimeout(this._vehicleEntranceTimer)

    const reset = wx.createAnimation({ duration: 0, timingFunction: 'linear' })
    reset.opacity(0).translate(360, 16).scale(.84).step()
    this.setData({ vehicleAnimation: reset.export() })

    this._vehicleEntranceTimer = setTimeout(() => {
      const entrance = wx.createAnimation({ duration: 820, timingFunction: 'ease-out' })
      entrance.opacity(1).translate(0, 0).scale(1).step()
      this.setData({ vehicleAnimation: entrance.export() })
    }, 80)
  },

  goChoose() {
    wx.navigateTo({ url: '/pages/index/index' })
  },

  goCompare() {
    wx.navigateTo({ url: '/pages/compare/compare' })
  },

  goDetail() {
    wx.navigateTo({ url: '/pages/detail/detail' })
  }
})

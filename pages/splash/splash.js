Page({
  data: {
    headerTop: 48,
    modelTop: 116
  },

  onLoad() {
    const menuRect = wx.getMenuButtonBoundingClientRect()
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const headerTop = menuRect.top || (windowInfo.statusBarHeight || 20) + 10
    const modelTop = (menuRect.bottom || headerTop + 32) + 22
    this.setData({ headerTop, modelTop })
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

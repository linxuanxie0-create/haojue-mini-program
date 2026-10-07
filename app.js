App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前微信基础库不支持云开发')
      return
    }

    wx.cloud.init({
      env: 'cloud1-d5gg9b5pud3552c21'
    })
  }
})

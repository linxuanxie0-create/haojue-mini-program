const { models } = require('../../data/models.js')

Page({
  data: { activeTab: '车型亮点', model: null },

  onLoad(options) {
    const id = options.model ? decodeURIComponent(options.model) : 'uhr150-new'
    const model = models.find(item => item.id === id) || models.find(item => item.id === 'uhr150-new') || models[0]
    this.setData({ model })
  },

  selectTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  backToList() {
    wx.navigateBack({ delta: 1, fail() { wx.reLaunch({ url: '/pages/index/index' }) } })
  },

  more() {
    wx.showToast({ title: '更多操作待接入（演示）', icon: 'none' })
  },

  askStore() {
    wx.showToast({ title: '门店咨询待接入（演示）', icon: 'none' })
  },

  addToCompare() {
    const modelId = this.data.model ? this.data.model.id : ''
    wx.navigateTo({ url: '/pages/compare/compare?a=' + encodeURIComponent(modelId) })
  }
})

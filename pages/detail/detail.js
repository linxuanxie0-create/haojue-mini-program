const { models, parameterFields } = require('../../data/models.js')

Page({
  data: { activeTab: '车型亮点', model: null },

  onLoad(options) {
    const id = options.model || 'uhr150-new'
    const model = models.find(item => item.id === id) || null
    this.setData({ model, parameterRows: Object.keys(parameterFields).map(key => ({ key, name: parameterFields[key], value: model ? model.parameters[key] : '官方数据待核验' })) })
    if (!model) wx.showToast({ title: '车型不存在，请返回重新选择', icon: 'none' })
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
    if (!this.data.model) return
    const modelId = this.data.model.id
    wx.navigateTo({ url: '/pages/compare/compare?a=' + encodeURIComponent(modelId) })
  }
})

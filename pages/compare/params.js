const { models } = require('../../data/models.js')

const parameters = [
  { key: 'displacement', name: '排量', translation: '动力储备大致处于什么水平' },
  { key: 'power', name: '最大功率', translation: '高速/持续加速能力的参考' },
  { key: 'torque', name: '最大扭矩', translation: '起步、加速、爬坡时的动力感受' },
  { key: 'weight', name: '整备质量', translation: '推车、挪车、低速掉头是否轻松' },
  { key: 'seat', name: '座高', translation: '双脚着地难度、身高适配' },
  { key: 'wheelbase', name: '轴距', translation: '灵活性与稳定性的参考' },
  { key: 'clearance', name: '最小离地间隙', translation: '减速带、烂路通过能力参考' },
  { key: 'tank', name: '油箱容量', translation: '长途出行的便利程度' },
  { key: 'tires', name: '轮胎规格', translation: '抓地、稳定、操控方面的参考' },
  { key: 'brakes', name: '制动/ABS/TCS', translation: '制动与湿滑路面的安全辅助能力' }
]

Page({
  data: {
    parameters,
    modelA: null,
    modelB: null
  },

  onLoad(options) {
    this.setData({
      modelA: options.a ? models.find(item => item.id === decodeURIComponent(options.a)) || null : null,
      modelB: options.b ? models.find(item => item.id === decodeURIComponent(options.b)) || null : null
    })
  },

  backToScenes() {
    wx.navigateBack({
      delta: 1,
      fail() { wx.redirectTo({ url: '/pages/compare/compare' }) }
    })
  }
})

const { models } = require('../../data/models.js')

const scenes = [
  {
    key: 'commute',
    index: '01',
    label: '城市通勤',
    title: '频繁起停与掉头',
    description: '城市路况常要起步、挪车和低速转向。',
    focus: '最大扭矩、整备质量、座高与轴距'
  },
  {
    key: 'touring',
    index: '02',
    label: '长途骑行',
    title: '持续骑行与途中补给',
    description: '长距离骑行需要留意持续加速能力和补油便利度。',
    focus: '最大功率、油箱容量、轴距与轮胎规格'
  },
  {
    key: 'twoUp',
    index: '03',
    label: '双人出行',
    title: '载人起步与行驶稳定',
    description: '双人出行时，动力感受和车辆稳定性都值得比较。',
    focus: '最大扭矩、轴距、整备质量与官方车型定位'
  }
]

const defaultModel = models.find(item => item.id === 'uhr150-2026') || models[0]

Page({
  data: {
    scenes,
    activeScene: scenes[0],
    models,
    modelA: defaultModel,
    modelB: null,
    pickerVisible: false,
    pickerSlot: 'A'
  },

  onLoad(options) {
    const patch = {}
    if (options.a) {
      const modelA = models.find(item => item.id === decodeURIComponent(options.a))
      if (modelA) patch.modelA = modelA
    }
    if (options.b) {
      const modelB = models.find(item => item.id === decodeURIComponent(options.b))
      if (modelB) patch.modelB = modelB
    }
    if (Object.keys(patch).length) this.setData(patch)
  },

  selectScene(event) {
    const scene = scenes.find(item => item.key === event.currentTarget.dataset.key)
    if (scene) this.setData({ activeScene: scene })
  },

  openPicker(event) {
    this.setData({ pickerVisible: true, pickerSlot: event.currentTarget.dataset.slot })
  },

  closePicker() {
    this.setData({ pickerVisible: false })
  },

  noop() {},

  chooseModel(event) {
    const model = this.data.models[event.currentTarget.dataset.index]
    const other = this.data.pickerSlot === 'A' ? this.data.modelB : this.data.modelA
    if (other && other.id === model.id) {
      wx.showToast({ title: '请选择不同车型', icon: 'none' })
      return
    }
    const patch = this.data.pickerSlot === 'A' ? { modelA: model } : { modelB: model }
    patch.pickerVisible = false
    this.setData(patch)
  },

  viewDetail(event) {
    const model = this.data.models[event.currentTarget.dataset.index]
    wx.navigateTo({ url: '/pages/detail/detail?model=' + encodeURIComponent(model.id) })
  },

  goParameters() {
    if (!this.data.modelB) {
      wx.showToast({ title: '请先选择车型 B', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/compare/params?a=' + encodeURIComponent(this.data.modelA.id) + '&b=' + encodeURIComponent(this.data.modelB.id)
    })
  }

})

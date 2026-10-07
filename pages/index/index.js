const { models } = require('../../data/models.js')
const { recommend, heights, seatReferences } = require('../../utils/recommend.js')

const steps = [
  {
    key: 'budget',
    shortTitle: '预算',
    title: '你的购车预算大约是多少？',
    hint: '先选一个大致范围，之后可以再调整。',
    options: ['1 万元以内', '1–1.5 万元', '1.5–2 万元', '2 万元以上', '还没确定']
  },
  {
    key: 'scenario',
    shortTitle: '用途',
    title: '你主要会在什么场景骑？',
    hint: '选择最常见的使用场景。',
    options: ['日常通勤', '城市短途', '周末休闲', '多种场景']
  },
  {
    key: 'experience',
    shortTitle: '经验',
    title: '你平时的骑行经验如何？',
    hint: '这能帮助我们理解你对上手难度的在意程度。',
    options: ['第一次骑摩托', '偶尔骑一骑', '经常骑行', '还不确定']
  },
  {
    key: 'height',
    shortTitle: '身高',
    title: '你的身高大约是多少？',
    hint: '用于判断停车时的双脚着地难度和适配座高。',
    options: ['≤155cm', '156–160cm', '161–165cm', '166–170cm', '171–175cm', '176–180cm', '181cm以上']
  },
  {
    key: 'footing',
    shortTitle: '着地',
    title: '停车时你希望怎样着地？',
    hint: '根据身高和支撑习惯，给你更合适的座高建议。',
    options: ['优先双脚着地', '单脚着地也可以']
  },
  {
    key: 'priorities',
    shortTitle: '关注点',
    title: '选车时你最关注哪些方面？',
    hint: '最多选 3 项，优先告诉我们你在意的事。',
    multiple: true,
    options: ['预算合适', '轻松好骑', '安全配置', '乘坐舒适', '储物空间', '省心耐用']
  }
]

function getChoiceItems(step, selectedValues) {
  return step.options.map(label => ({ label, selected: selectedValues.includes(label) }))
}

function getProgressItems(activeIndex) {
  return steps.map((step, index) => ({ key: step.key, filled: index <= activeIndex }))
}

function getSeatHeightRecommendation(answers) {
  const index = heights.indexOf((answers.height || [])[0])
  const footing = (answers.footing || [])[0]
  if (index < 0 || !footing) return '完成身高和着地方式后生成建议'
  return '参考≤' + seatReferences[index][footing === '优先双脚着地' ? 0 : 1] + 'mm；建议到店试坐'
}

Page({
  data: {
    steps,
    progressItems: getProgressItems(0),
    stepIndex: 0,
    currentStep: steps[0],
    choiceItems: getChoiceItems(steps[0], []),
    answers: {},
    selectedCount: 0,
    canContinue: false,
    showSummary: false,
    showResult: false,
    summaryItems: [],
    recommendations: [],
    pricePending: [],
    resultMessage: ''
  },

  chooseOption(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.choiceItems[index]
    const step = this.data.currentStep
    let selectedValues = this.data.choiceItems.filter(option => option.selected).map(option => option.label)

    if (step.multiple) {
      if (selectedValues.includes(item.label)) {
        selectedValues = selectedValues.filter(value => value !== item.label)
      } else if (selectedValues.length < 3) {
        selectedValues = selectedValues.concat(item.label)
      } else {
        wx.showToast({ title: '最多选择 3 项', icon: 'none' })
        return
      }
    } else {
      selectedValues = [item.label]
    }

    const answers = { ...this.data.answers, [step.key]: selectedValues }
    this.setData({
      answers,
      choiceItems: getChoiceItems(step, selectedValues),
      selectedCount: selectedValues.length,
      canContinue: selectedValues.length > 0
    })
  },

  nextStep() {
    if (this.data.showSummary) {
      const result = recommend(models, this.data.answers)
      if (result.status !== 'ok') { wx.showToast({ title: result.message, icon: 'none' }); return }
      this.setData({ showResult: true, showSummary: false, recommendations: result.top, pricePending: result.pricePending, resultMessage: result.message })
      return
    }
    if (!this.data.canContinue) return

    const nextIndex = this.data.stepIndex + 1
    if (nextIndex >= steps.length) {
      const summaryItems = steps.map(step => ({
        key: step.key,
        shortTitle: step.shortTitle,
        answer: (this.data.answers[step.key] || []).join('、') || '未选择'
      }))
      summaryItems.push({
        key: 'seat-height-recommendation',
        shortTitle: '建议座高',
        answer: getSeatHeightRecommendation(this.data.answers)
      })
      this.setData({ showSummary: true, summaryItems })
      return
    }

    const nextStep = steps[nextIndex]
    const selectedValues = this.data.answers[nextStep.key] || []
    this.setData({
      stepIndex: nextIndex,
      progressItems: getProgressItems(nextIndex),
      currentStep: nextStep,
      choiceItems: getChoiceItems(nextStep, selectedValues),
      selectedCount: selectedValues.length,
      canContinue: selectedValues.length > 0
    })
  },

  previousStep() {
    if (this.data.stepIndex === 0) return
    const previousIndex = this.data.stepIndex - 1
    const previousStep = steps[previousIndex]
    const selectedValues = this.data.answers[previousStep.key] || []
    this.setData({
      stepIndex: previousIndex,
      progressItems: getProgressItems(previousIndex),
      currentStep: previousStep,
      choiceItems: getChoiceItems(previousStep, selectedValues),
      selectedCount: selectedValues.length,
      canContinue: selectedValues.length > 0
    })
  },

  editAnswers() {
    const selectedValues = this.data.answers[steps[steps.length - 1].key] || []
    this.setData({
      showSummary: false,
      stepIndex: steps.length - 1,
      progressItems: getProgressItems(steps.length - 1),
      currentStep: steps[steps.length - 1],
      choiceItems: getChoiceItems(steps[steps.length - 1], selectedValues),
      selectedCount: selectedValues.length,
      canContinue: selectedValues.length > 0
    })
  },

  restart() {
    wx.showModal({
      title: '重新开始',
      content: '将清空当前已填内容，确定重新开始吗？',
      success: (res) => {
        if (res.confirm) this.resetAll()
      }
    })
  },

  resetAll() {
    this.setData({
      stepIndex: 0,
      progressItems: getProgressItems(0),
      currentStep: steps[0],
      choiceItems: getChoiceItems(steps[0], []),
      answers: {},
      selectedCount: 0,
      canContinue: false,
      showSummary: false,
      showResult: false,
      summaryItems: [],
    recommendations: [],
    pricePending: [],
    resultMessage: ''
    })
  },

  viewModel(event) {
    const id = event.currentTarget.dataset.id
    if (models.some(m => m.id === id)) wx.navigateTo({ url: '/pages/detail/detail?model=' + encodeURIComponent(id) })
  },

  goCompare() {
    wx.navigateTo({ url: '/pages/compare/compare' })
  }
})

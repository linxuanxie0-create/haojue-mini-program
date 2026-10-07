const fs=require('node:fs'),assert=require('node:assert/strict')
const {models}=require('../data/models'),{recommend}=require('../utils/recommend')
const a={budget:['还没确定'],scenario:['日常通勤'],experience:['第一次骑摩托'],height:['171–175cm'],footing:['优先双脚着地'],priorities:['省心耐用']}
const current=recommend(models,a)
const affected=models.filter(m=>m.scoring['省心耐用']!==3).map(m=>({id:m.id,name:m.modelName,original:m.scoring['省心耐用'],proposal:3,reason:'交付资料缺整车寿命/磨损的直接证据，5分需复核；建议中性基准，仅供审批'}))
const hypothetical=recommend(models.map(m=>({...m,scoring:{...m.scoring,省心耐用:3}})),a)
assert.equal(current.top[0].id,'uhr150-2026');assert.equal(current.top[0].total-hypothetical.ranked.find(m=>m.id==='uhr150-2026').total,10)
const report={status:'NOT_READY_FOR_PRODUCTION',applied:false,affected,profile:a,current:current.top.map(m=>({name:m.modelName,total:m.total})),hypothetical: hypothetical.top.map(m=>({name:m.modelName,total:m.total})),finding:'仅关注耐用时，原表5分相对中性3分产生10分优势；不能宣传更耐用，修改源评分需用户批准'}
fs.writeFileSync('reports/business-findings.json',JSON.stringify(report,null,2))
console.log('PASS business sensitivity: 4 disputed durability scores; +10 points versus neutral; proposal not applied')

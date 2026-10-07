const fs=require('node:fs')
const assert=require('node:assert/strict')
const {models}=require('../data/models')
const {recommend,heights,budgets}=require('../utils/recommend')
const scenarios=['日常通勤','城市短途','周末休闲','多种场景'], experiences=['第一次骑摩托','偶尔骑一骑','经常骑行','还不确定'], footings=['优先双脚着地','单脚着地也可以']
const focuses=[['轻松好骑'],['安全配置'],['乘坐舒适'],['储物空间'],['省心耐用'],['轻松好骑','安全配置'],['轻松好骑','乘坐舒适','储物空间'],['预算合适','安全配置']]
let combinations=0,empty=0;const anomalies=[]
for(const budget of Object.keys(budgets))for(const scenario of scenarios)for(const experience of experiences)for(const height of heights)for(const footing of footings)for(const priorities of focuses){
 const answers={budget:[budget],scenario:[scenario],experience:[experience],height:[height],footing:[footing],priorities}
 const result=recommend(models,answers);combinations++;if(!result.top.length)empty++
 for(const m of result.top)if(m.is_public_service || (experience==='第一次骑摩托'&&m.difficulty===5) || (Number.isFinite(budgets[budget])&&(m.official_price_cny===null||m.official_price_cny>budgets[budget])) || m.total<65)anomalies.push({answers,id:m.id})
}
assert.equal(combinations,8960);assert.equal(anomalies.length,0)
const cases=[
 ['首次通勤预算紧',0,0,0,0,0,0],['矮个双脚城市短途',1,1,0,0,0,1],['首次周末休闲',2,2,0,2,0,2],['经验丰富多场景',3,3,2,3,1,3],
 ['身高156–160双脚',4,0,0,1,0,4],['身高161–165单脚',0,1,1,2,1,5],['偶尔骑预算1.5万',1,2,1,6,0,6],['周末舒适储物',2,2,2,0,1,6],
 ['高个新手安全关注',3,0,0,6,0,1],['经验不确定',4,1,3,2,1,1],['高座单脚参考',4,2,2,3,1,2],['预算强调与安全',1,3,3,4,1,7]
]
const profiles=cases.map(([name,b,s,e,h,f,p])=>({name,answers:{budget:[Object.keys(budgets)[b]],scenario:[scenarios[s]],experience:[experiences[e]],height:[heights[h]],footing:[footings[f]],priorities:focuses[p]}}))
const reports=profiles.map(p=>{const r=recommend(models,p.answers);return {...p,...r,top:r.top.map(m=>({id:m.id,name:m.modelName,family:m.family_id,total:m.total,breakdown:m.breakdown,price:m.official_price_cny,evidence:m.scoring_methods,safety:m.safety_features_verified,review:m.review_status,variant:m.variant_note,source:m.official_source_urls,availability:m.is_available})),ranked:r.ranked.map(m=>({id:m.id,name:m.modelName,family:m.family_id,total:m.total,breakdown:m.breakdown})),pricePending:r.pricePending.map(m=>({id:m.id,name:m.modelName}))}})
fs.writeFileSync('reports/result-quality.json',JSON.stringify({status:'NOT_READY_FOR_PRODUCTION',combinations,empty,anomalies,warning:'四项约束无异常不代表推荐准确率或安全性；业务合理性及版本配置需人工复核',profiles:reports},null,2))
let md='# NOT_READY_FOR_PRODUCTION\n\n自动审计 '+combinations+' 组，四项约束异常 '+anomalies.length+'；无推荐 '+empty+' 组。该结果不是推荐准确率或安全性证明。\n\n'
for(const p of reports){md+='## '+p.name+'\n\n'+JSON.stringify(p.answers)+'\n\n';if(!p.top.length)md+='无符合条件结果。\n\n';for(const m of p.top)md+='- '+m.name+'：'+m.total.toFixed(2)+'分，用途 '+m.breakdown.usage+'，经验 '+m.breakdown.experience+'，着地 '+m.breakdown.seat+'，关注 '+m.breakdown.priorities.toFixed(2)+'；参考座高 '+m.breakdown.seatReference+'mm；关注拆分 '+JSON.stringify(m.breakdown.focus)+'；价格 '+m.price+'；车系 '+m.family+'；安全 '+m.safety.status+'；证据：门槛L2、用途与关注点混合/L3待核验。\n';md+='\n车系数量：'+p.diversity+'。其他车型逐辆排除原因、全部候选得分、来源和证据详见 result-quality.json 对应画像。\n\n'}
md+='## 业务审核（需门店人员签字）\n\n- 矮个双脚画像仍可能得到着地0分但总分≥65的车型，算法没有座高硬限制；不可当作保证适合，必须试坐。\n- 经常骑行所有门槛经验分都是20，难度不影响此项排序，需确认TOP3实际用途适配。\n- 安全关注仍参与内部评分，但56款版本证据待复核，3款质量表记录直接官网证据；核对不同SKU后才能宣称ABS/CBS/TCS。\n- 原表55款耐用3分为中性，另4款为5分（UHR150三个版本、UH110S）；交付材料未提供足够整车寿命证据，需审核这些高分，不得宣传更耐用；舒适及储物L3需实车复核。\n- 同车系去重可能优先较低分的其他车系，查看完整候选表确认多样性规则符合门店目标。\n- 缺价不参与有限预算，但未定预算允许缺价候选，必须询价。\n- 1–1.5万及1.5–2万按文档为上限，不设下限；可能推荐更便宜车型。\n- 核对价格、配置、扶手/箱杠/年份一一对应；禁止混用。\n'
fs.writeFileSync('reports/result-quality.md',md)
console.log(JSON.stringify({combinations,empty,anomalies:anomalies.length,profiles:reports.length}))

const delivery=require('../reports/source-audit.json').authoritative_sheets
fs.writeFileSync('reports/model-status.json',JSON.stringify({status:'NOT_READY_FOR_PRODUCTION',total:models.length,publicService:models.filter(m=>m.is_public_service).length,consumers:models.filter(m=>!m.is_public_service).length,screeningEligible:models.filter(m=>m.eligible).length,consumerKnownPrice:models.filter(m=>!m.is_public_service&&m.official_price_cny!==null).length,consumerUnknownPrice:models.filter(m=>!m.is_public_service&&m.official_price_cny===null).length,directSafetyEvidence:models.filter(m=>m.safety_features_verified.status==='直接官网证据').length,issues:delivery['交付_待解决问题'].slice(1),models:models.map(m=>({id:m.id,name:m.modelName,family:m.family_id,eligible:m.eligible,publicService:m.is_public_service,price:m.official_price_cny,priceStatus:m.price_status,difficulty:m.difficulty,seat:m.seat_height_mm,mass:m.curb_mass_kg,safety:m.safety_features_verified,review:m.review_status,availability:m.is_available,version:m.variant_note}))},null,2))

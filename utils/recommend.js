const heights = ['≤155cm','156–160cm','161–165cm','166–170cm','171–175cm','176–180cm','181cm以上']
const seatReferences = [[720,740],[740,760],[750,780],[760,790],[780,810],[800,830],[820,850]]
const experiences = { '第一次骑摩托':[20,17,10,3,null], '偶尔骑一骑':[20,20,17,10,3], '经常骑行':[20,20,20,20,20], '还不确定':[20,18,13,6,0] }
const budgets = {'1 万元以内':10000,'1–1.5 万元':15000,'1.5–2 万元':20000,'2 万元以上':Infinity,'还没确定':Infinity}
const priorities = ['预算合适','轻松好骑','安全配置','乘坐舒适','储物空间','省心耐用']
const first = (a,k) => Array.isArray(a[k]) ? a[k][0] : undefined
const five = n => Number.isInteger(n) && n>=1 && n<=5
function validateModel(m) {
 const errors=[]
 if (typeof m.is_public_service !== 'boolean' || typeof m.eligible !== 'boolean') errors.push('推荐资格类型异常')
 if (![m.model_id,m.family_id,m.variant_id].every(v=>typeof v==='string'&&v.length>0)) errors.push('车型ID/车系缺失')
 if (m.official_price_cny !== null && (!Number.isFinite(m.official_price_cny) || m.official_price_cny<=0)) errors.push('价格类型或值域异常')
 if (m.seat_height_mm !== null && (!Number.isFinite(m.seat_height_mm) || m.seat_height_mm<400 || m.seat_height_mm>1200)) errors.push('座高异常')
 if (m.curb_mass_kg !== null && (!Number.isFinite(m.curb_mass_kg) || m.curb_mass_kg<=0)) errors.push('重量异常')
 if (m.difficulty !== null && !five(m.difficulty)) errors.push('门槛异常')
 if (!m.scoring || ['日常通勤','城市短途','周末休闲','多种场景','轻松好骑','安全配置','乘坐舒适','储物空间','省心耐用'].some(k=>!five(m.scoring[k]))) errors.push('评分异常')
 if (![null,true,false].includes(m.is_available)) errors.push('门店状态异常')
 return errors
}
function seatScore(seat,reference) {
 if (!Number.isFinite(seat)) return null
 const gap=seat-reference
 return gap<=0?20:gap<=20?15:gap<=40?8:gap<=60?3:0
}
function recommend(models, answers) {
 const budget=budgets[first(answers,'budget')], scenario=first(answers,'scenario'), experience=experiences[first(answers,'experience')], height=heights.indexOf(first(answers,'height')), footing=first(answers,'footing')
 const selected=answers.priorities || []
 const invalid = ['budget','scenario','experience','height','footing'].some(k=>!Array.isArray(answers[k])||answers[k].length!==1) || budget===undefined || !['日常通勤','城市短途','周末休闲','多种场景'].includes(scenario) || !experience || height<0 || !['优先双脚着地','单脚着地也可以'].includes(footing) || !Array.isArray(selected) || selected.length>3 || new Set(selected).size!==selected.length || selected.some(p=>!priorities.includes(p))
 if (invalid) return {status:'invalid_answers',message:'请检查并完成六项选车需求',top:[],ranked:[],excluded:[],pricePending:[]}
 const scoringPriorities=selected.filter(p=>p!=='预算合适')
 if (!scoringPriorities.length) return {status:'priority_rule_pending',message:'关注点评分规则待确认，请补选至少一个非预算关注项后再试',top:[],ranked:[],excluded:[],pricePending:[]}
 const reference=seatReferences[height][footing==='优先双脚着地'?0:1], ranked=[],excluded=[],pricePending=[]
 const counts={}; models.forEach(m=>{counts[m.model_id]=(counts[m.model_id]||0)+1})
 models.forEach(m=>{
  let reason=null
  const errors=validateModel(m)
  if(counts[m.model_id]>1) reason='重复车型ID'
  else if(errors.length) reason=errors.join('；')
  else if(m.is_public_service) reason='公务车型'
  else if(m.is_available===false) reason='门店停卖/下架'
  else if(!m.eligible || m.difficulty===null) reason='自动推荐停用：关键数据待核验'
  else if(m.seat_height_mm===null) reason='座高待核验，不能计算着地分'
  else if(experience[m.difficulty-1]===null) reason='首次骑行排除门槛5'
  else if(Number.isFinite(budget) && m.official_price_cny===null) reason='价格待确认，不进入预算合规排名'
  else if(m.official_price_cny!==null && m.official_price_cny>budget) reason='超预算'
  if(reason) {excluded.push({id:m.id,model:m.modelName,reason}); if(reason.startsWith('价格待确认')) pricePending.push(m);return}
  const focus=scoringPriorities.map(p=>({name:p,raw:m.scoring[p],points:m.scoring[p]/5*25/scoringPriorities.length}))
  const breakdown={usage:m.scoring[scenario]/5*35,experience:experience[m.difficulty-1],seat:seatScore(m.seat_height_mm,reference),priorities:focus.reduce((s,p)=>s+p.points,0),focus,seatReference:reference}
  const total=breakdown.usage+breakdown.experience+breakdown.seat+breakdown.priorities
  if(!Number.isFinite(total) || total<65) {excluded.push({id:m.id,model:m.modelName,reason:'总分低于65',total,breakdown});return}
  ranked.push({...m,total,scoreText:total.toFixed(1),breakdown,breakdownText:'用途 '+breakdown.usage.toFixed(1)+' / 经验 '+breakdown.experience+' / 着地 '+breakdown.seat+' / 关注点 '+breakdown.priorities.toFixed(1)})
 })
 ranked.sort((a,b)=>b.total-a.total || a.id.localeCompare(b.id))
 const top=[],families=new Set()
 ranked.forEach(m=>{if(top.length<3&&!families.has(m.family_id)){top.push(m);families.add(m.family_id)}})
 ranked.forEach(m=>{if(top.length<3&&!top.some(t=>t.id===m.id))top.push(m)})
 return {status:'ok',top:top.map(m=>({...m,alternatives:models.filter(x=>x.family_id===m.family_id&&x.id!==m.id&&!x.is_public_service&&x.is_available!==false).map(x=>({id:x.id,name:x.modelName}))})),ranked,excluded,pricePending,diversity:families.size,message:top.length?'内部算法初筛 · 非官方评级；安全配置、版本与门店有售状态待核验':'没有达到65分且符合条件的车型，请调整需求或咨询门店'}
}
module.exports={recommend,validateModel,seatScore,seatReferences,heights,budgets,priorities}

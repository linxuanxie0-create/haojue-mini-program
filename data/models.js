const assets = require('./model-assets.js').models
const source = require('./audited-source.js')
const quality = require('./quality.js')
const overrides = require('./store-overrides.js')
const parameterFields = { displacement: '排量', power: '最大功率', torque: '最大扭矩', weight: '整备质量', seat: '座高', wheelbase: '轴距', clearance: '最小离地间隙', tank: '油箱容量', tires: '轮胎规格', brakes: '制动 / ABS / TCS' }
function numeric(value) {
  if (typeof value !== 'string' || !/^\d+(\.\d+)?(mm|kg)$/.test(value)) return null
  return Number(value.match(/^\d+(\.\d+)?/)[0])
}
function normalizeShift(value) {
  if (/无级|CVT/i.test(value)) return { type: 'CVT', operationScore: 1 }
  if (/循环|弯梁/.test(value)) return { type: 'SEMI_AUTO', operationScore: 2 }
  if (/手动|离合|六挡|往复/.test(value)) return { type: 'MANUAL', operationScore: 3 }
  return { type: 'UNKNOWN', operationScore: null }
}
const models = source.items.map(item => {
  const asset = assets.find(a => a.modelName === item.model)
  if (!asset) throw new Error('Missing asset mapping: ' + item.model)
  const raw = item.raw_excel
  const q = quality.find(row => row.A === item.model)
  const shift = normalizeShift(raw['操作方式'])
  const parameters = {}
  Object.keys(parameterFields).forEach(key => {
    const value = raw[parameterFields[key]]
    parameters[key] = typeof value === 'string' && !/未|待|^—$/.test(value) ? value : '官方数据待核验'
  })
  // Only the current delivery quality sheet can authorize a confirmed feature.
  const verified = q.K === '直接官网证据'
  if (!verified) parameters.brakes = 'ABS/CBS/TCS 待版本核验；原表描述（未确认）：' + (raw['制动 / ABS / TCS'] || '待核验')
  const scoring = {}
  ;['日常通勤','城市短途','周末休闲','多种场景','轻松好骑','安全配置','乘坐舒适','储物空间','省心耐用'].forEach(key => { scoring[key] = raw[key + '评分'] })
  const price = item.price_usable_for_budget_filter ? item.official_reference_price_cny : null
  const versionUnknown = /\/|（|\(/.test(raw['整备质量'] || '') || / 起/.test(raw['官网当前价格'] || '')
  return { ...asset, verificationStatus: 'provisional', model_id: asset.id, model_name: item.model, family_id: item.family, variant_id: asset.id,
    official_price_cny: price, price_status: price === null ? 'unknown' : 'snapshot_reference', priceText: price === null ? '价格待确认 · 请询价' : '官网快照参考价 ¥' + price,
    official_source_urls: [raw['官方来源'], raw['价格来源']].filter(Boolean), seat_height_mm: numeric(raw['座高']), curb_mass_kg: numeric(raw['整备质量']),
    shift_type: shift.type, operation_score: shift.operationScore, difficulty: Number.isInteger(raw['驾驭门槛（1-5）']) ? raw['驾驭门槛（1-5）'] : null,
    is_public_service: item.is_public_service, eligible: item.recommendation_eligible_for_screening,
    safety_features_verified: { ABS: verified && /ABS/.test(q.L) ? true : null, CBS: verified && /CBS/.test(q.L) ? true : null, TCS: verified && /TCS/.test(q.L) ? true : null, status: q.K, note: q.L },
    scoring, scoring_methods: { usage: {level:'L3 / 混合待复核',note:raw['用途评分依据']}, difficulty:{level:'L2',note:raw['门槛评分依据']}, priorities:{level:'L1/L2/L3 混合待复核',note:raw['关注点评分依据']} },
    review_status: q.N, is_available: overrides[asset.id] === undefined ? null : overrides[asset.id], updated_at: source.as_of,
    variant_note: versionUnknown ? '存在多配置参数；所售版本、重量及对应价格待核验，不拼接配置' : '车型级快照；所售版本及价格请到店核对',
    parameters, raw_excel: raw }
})
module.exports = { models, normalizeShift, parameterFields }

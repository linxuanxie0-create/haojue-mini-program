const assert=require('node:assert/strict')
let definition;const calls=[]
global.Page=p=>{definition=p};global.wx={showToast:x=>calls.push(x),navigateTo:x=>calls.push(x),navigateBack:()=>{},redirectTo:()=>{},reLaunch:()=>{},showModal:()=>{}}
function page(path){delete require.cache[require.resolve(path)];require(path);const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(patch){Object.assign(this.data,patch)}};return p}
const p=page('../pages/index/index')
const selections=[0,0,0,6,1,1]
selections.forEach((index,step)=>{assert.equal(p.data.stepIndex,step);p.chooseOption({currentTarget:{dataset:{index}}});p.nextStep()})
assert.equal(p.data.showSummary,true);p.nextStep();assert.equal(p.data.showResult,true);assert.ok(p.data.recommendations.length>0);assert.equal(p.data.answers.priorities[0],'轻松好骑');p.viewModel({currentTarget:{dataset:{id:p.data.recommendations[0].id}}});assert.match(calls.at(-1).url,/detail/);p.resetAll();assert.deepEqual(p.data.answers,{});assert.deepEqual(p.data.recommendations,[])
const c=page('../pages/compare/compare');c.onLoad({a:'afr125',b:'uhr150-2026'});assert.equal(c.data.modelA.id,'afr125');c.goParameters();assert.match(calls.at(-1).url,/params/);c.openPicker({currentTarget:{dataset:{slot:'B'}}});c.chooseModel({currentTarget:{dataset:{index:c.data.models.findIndex(m=>m.id==='afr125')}}});assert.equal(c.data.modelB.id,'uhr150-2026')
const params=page('../pages/compare/params');params.onLoad({a:'ufr150a',b:'afr125'});assert.equal(params.data.parameters.length,10);assert.equal(params.data.parameters[0].valueA,'官方数据待核验');assert.notEqual(params.data.parameters[0].valueB,'官方数据待核验');params.onLoad({a:'%invalid'});assert.equal(params.data.modelA,null)
const d=page('../pages/detail/detail');d.onLoad({model:'ufr150a'});assert.equal(d.data.model.eligible,false);assert.equal(d.data.parameterRows.length,10);d.onLoad({model:'%broken'});assert.equal(d.data.model,null)
console.log('PASS JS page integration smoke: six questions / results / reset / detail / comparison / missing and invalid routes (mocked wx; no visual or WeChat runtime verification)')

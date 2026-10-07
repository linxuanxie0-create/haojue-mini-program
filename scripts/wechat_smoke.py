"""Local WeChat runtime verification; no upload or deployment."""
import subprocess,json,pathlib,tempfile,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
CLI='/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide'
TEMP=pathlib.Path(tempfile.mkdtemp(prefix='haojue-wechat-')); results=[]
def call(tool,*args):
 p=subprocess.run([CLI,'-c','Codex',tool,'--project',str(ROOT),*args],capture_output=True,text=True,timeout=60)
 start=p.stdout.find('{')
 if start<0: raise RuntimeError(p.stdout+p.stderr)
 data=json.loads(p.stdout[start:]);results.append({'tool':tool,'args':args,'response':data})
 if not data.get('ok'): raise RuntimeError(data)
 print(tool,'OK',flush=True)
 return data.get('result')
def evaluate(fn):
 r=call('automation_evaluate','--fn-source',fn)
 return r['result']['result']
def navigate(url):
 result=evaluate('function(){return new Promise(function(resolve){wx.reLaunch({url:'+json.dumps(url)+',success:function(){resolve("success")},fail:function(e){resolve(e)}})});}')
 assert result=='success',result
try:
 navigate('/pages/index/index')
 result=evaluate('''function(){var p=getCurrentPages().slice(-1)[0]; if(typeof p.chooseOption!=="function")throw Error("Page not loaded"); var seen=[];[0,0,0,6,1,1].forEach(function(index){seen.push({step:p.data.stepIndex,title:p.data.currentStep.title});p.chooseOption({currentTarget:{dataset:{index:index}}});p.nextStep()});if(!p.data.showSummary)throw Error("Summary missing");p.nextStep();if(!p.data.showResult||!p.data.recommendations.length)throw Error("Results missing");return {seen:seen,showResult:p.data.showResult,top:p.data.recommendations.map(function(m){return {id:m.id,total:m.total,breakdown:m.breakdown}})};}''')
 assert len(result['seen'])==6 and result['showResult']; print('PASS real six-question / summary / recommendation flow',flush=True)
 call('simulator_screenshot','--path',str(TEMP/'wechat-results.jpg'))
 navigate('/pages/compare/params?a=ufr150a&b=afr125')
 result=evaluate('function(){var p=getCurrentPages().slice(-1)[0];return {route:p.route,rows:p.data.parameters};}')
 assert len(result['rows'])==10 and result['rows'][0]['valueA']=='官方数据待核验' and result['rows'][0]['valueB']!='官方数据待核验'
 print('PASS real 10-parameter comparison / missing data',flush=True)
 call('simulator_screenshot','--path',str(TEMP/'wechat-params.jpg'))
 navigate('/pages/detail/detail?model=ufr150a')
 result=evaluate('function(){var p=getCurrentPages().slice(-1)[0];return {eligible:p.data.model.eligible,rows:p.data.parameterRows.length};}')
 assert result=={'eligible':False,'rows':10};print('PASS real excluded-model detail',flush=True)
 navigate('/pages/index/index')
 result=evaluate('function(){var p=getCurrentPages().slice(-1)[0];return {step:p.data.stepIndex,answers:p.data.answers};}')
 assert result=={'step':0,'answers':{}}
 call('simulator_screenshot','--path',str(TEMP/'wechat-question.jpg'))
 results.append({'verification':'all assertions passed'})
finally:
 for shot in TEMP.glob('*.jpg'):shutil.copy2(shot,ROOT/'reports'/shot.name)
 passed=any(r.get('verification')=='all assertions passed' for r in results)
 output='wechat-runtime.json' if passed else 'wechat-automation-last-attempt.json'
 (ROOT/'reports'/output).write_text(json.dumps(results,ensure_ascii=False,indent=2))

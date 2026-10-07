"""No third-party dependencies. Verify authoritative XLSX before importing JSON."""
import json, zipfile, xml.etree.ElementTree as E, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
NS={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def workbook(path):
 z=zipfile.ZipFile(path); strings=[]
 if 'xl/sharedStrings.xml' in z.namelist():
  strings=[''.join(s.itertext()) for s in E.fromstring(z.read('xl/sharedStrings.xml'))]
 rel={r.attrib['Id']:r.attrib['Target'] for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
 out={}
 for sheet in E.fromstring(z.read('xl/workbook.xml')).find('x:sheets',NS):
  target=rel[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
  target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
  rows=[]
  for row in E.fromstring(z.read(target)).findall('.//x:sheetData/x:row',NS):
   cells={}
   for c in row:
    col=re.sub(r'\d','',c.attrib['r']); typ=c.attrib.get('t'); v=c.find('x:v',NS)
    val=v.text if v is not None else None
    if typ=='inlineStr': val=''.join(c.find('x:is',NS).itertext())
    elif typ=='s': val=strings[int(val)]
    elif val is not None and typ not in ('str','e'): val=float(val); val=int(val) if val.is_integer() else val
    cells[col]=val
   rows.append(cells)
  out[sheet.attrib['name']]=rows
 return out
def validate_schema(value, schema, path='$'):
 """Validate the keywords used in source.schema.json, without installing packages."""
 types={'object':lambda v:isinstance(v,dict),'array':lambda v:isinstance(v,list),'string':lambda v:isinstance(v,str),'integer':lambda v:type(v) is int,'number':lambda v:type(v) in (int,float),'boolean':lambda v:type(v) is bool,'null':lambda v:v is None}
 if 'type' in schema:
  allowed=schema['type'] if isinstance(schema['type'],list) else [schema['type']]
  assert any(types[t](value) for t in allowed), f'{path}: invalid type'
 if 'enum' in schema: assert value in schema['enum'], f'{path}: invalid enum'
 if isinstance(value,dict):
  for key in schema.get('required',[]): assert key in value, f'{path}.{key}: required'
  for key,sub in schema.get('properties',{}).items():
   if key in value: validate_schema(value[key],sub,path+'.'+key)
 if isinstance(value,list):
  assert len(value)>=schema.get('minItems',0) and len(value)<=schema.get('maxItems',float('inf')), f'{path}: invalid length'
  for i,v in enumerate(value): validate_schema(v,schema.get('items',{}),f'{path}[{i}]')
 if isinstance(value,str):
  assert len(value)>=schema.get('minLength',0), f'{path}: empty string'
  if 'pattern' in schema: assert re.search(schema['pattern'],value), f'{path}: invalid format'
 if type(value) in (int,float): assert schema.get('minimum',float('-inf'))<=value<=schema.get('maximum',float('inf')), f'{path}: invalid range'

if __name__=='__main__':
 sheets=workbook(ROOT/'data/source/豪爵59款_系统性优化_Codex交付审核版.xlsx')
 data=json.loads((ROOT/'data/source/豪爵选车_59款交付数据_审计版.json').read_text())
 validate_schema(data,json.loads((ROOT/'data/source.schema.json').read_text()))
 headers=sheets['59款车型对比'][0]; conflicts=[]
 assert data['schema']=='haojue-select-handoff-audit-v1' and data['data_is_provisional'] is True
 assert isinstance(data['items'],list) and len(data['items'])==59
 assert {i['excel_row'] for i in data['items']}==set(range(2,61))
 quality={r['A']:r for r in sheets['交付_车型质量状态'][1:]}
 assert len(quality)==59
 seen=set()
 for item in data['items']:
  assert isinstance(item['model'],str) and item['model'] not in seen
  seen.add(item['model'])
  assert isinstance(item['family'],str) and isinstance(item['excel_row'],int)
  for k in ['is_public_service','recommendation_eligible_for_screening','price_usable_for_budget_filter','review_required']: assert type(item[k]) is bool
  price=item['official_reference_price_cny']
  assert price is None or (type(price) in (int,float) and price>0)
  raw=item['raw_excel']
  for k,v in raw.items():
   if k.endswith('评分'): assert type(v) is int and 1<=v<=5
  difficulty=raw['驾驭门槛（1-5）']
  assert difficulty=='待核验' or (type(difficulty) is int and 1<=difficulty<=5)
  q=quality[item['model']]
  expected={'family':q['C'],'official_reference_price_cny':q.get('E'),'is_public_service':q['B']=='公务车','recommendation_eligible_for_screening':q['D']=='可参加条件推荐','price_usable_for_budget_filter':q['F']=='已有价格'}
  for key,value in expected.items():
   if item[key]!=value: conflicts.append({'model':item['model'],'field':key,'quality_sheet':value,'json':item[key]})
  if q['H']!=(None if difficulty=='待核验' else difficulty): conflicts.append({'model':item['model'],'field':'difficulty','quality_sheet':q['H'],'json':difficulty})
 for item in data['items']:
  row=sheets['59款车型对比'][item['excel_row']-1]
  for col,key in headers.items():
   if row.get(col)!=item['raw_excel'].get(key): conflicts.append({'model':item['model'],'field':key,'excel':row.get(col),'json':item['raw_excel'].get(key)})
 (ROOT/'reports/source-audit.json').write_text(json.dumps({'conflicts':conflicts,'authoritative_sheets':{k:v for k,v in sheets.items() if k in ['交付_车型质量状态','交付_推荐规则','交付_待解决问题']}},ensure_ascii=False,indent=2))
 if conflicts: raise SystemExit(f'BLOCKED: {len(conflicts)} source conflicts')
 (ROOT/'data/quality.json').write_text(json.dumps(sheets['交付_车型质量状态'],ensure_ascii=False,indent=2))
 (ROOT/'data/audited-source.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
 for name,value in [('audited-source',data),('quality',sheets['交付_车型质量状态']),('store-overrides',json.loads((ROOT/'data/store-overrides.json').read_text()))]:
  (ROOT/('data/'+name+'.js')).write_text('// Generated by scripts/import_data.py; edit source inputs, then re-import.\nmodule.exports = '+json.dumps(value,ensure_ascii=False,indent=2)+';\n')
 print(f"Verified {len(data['items'])} rows, every main-sheet field matches JSON")

# 验证与验收记录（2026-10-07）

**NOT_READY_FOR_PRODUCTION**。实现已完成本地验收准备，正式顾客推荐仍受 README 中 P0 限制。本次无上传、无部署。

## 已通过

- Excel59行主表全部字段与JSON一致；当前质量表的车型、车系、价格、资格、门槛及价格可用状态一致。UFR150A的质量表空门槛与主表“待核验”统一为null。
- 输入JSON Schema（本项目使用的关键字）、评分/价格/门槛/座高/重量值域与重复ID校验。
- `node tests/recommend.test.js`：26组，通过预算9个边界、缺价、划线价、多版本、CVT、首次骑行门槛5、座高差值、缺座高、0/1/2/3关注项、公务车、停卖、NaN、重复ID、同系去重和不足3款。
- `node tests/pages.test.js`：mock wx页面集成通过；六题、汇总、结果、重置、详情、两车重复选择、十参数、无效路由。此测试不是微信运行时测试。
- `node scripts/audit_recommendations.js`：8960组合，四项约束异常0；当前真实快照均有结果，0/1/2结果分支另用构造数据单元测试覆盖。12组代表画像完整分项与排除追踪见result-quality文件。
- `node scripts/business_audit.js`：4个耐用高分争议记录及10分敏感性分析；仅报告建议，没有改源评分。
- 本机微信开发者工具，基础库3.17.2：实际Page实例断言通过六步→汇总→TOP3（AFR125/NFR125/U100，各93分）；缺价与缺参数对比页10行、UFR150A详情eligible=false、重新进入第一题答案为空。
- 真实运行曾发现问答空白，已将JSON镜像转换为原生JS数据模块并实际验证恢复。
- 最终WXML/WXSS编译通过；实际截图核对保留原问答样式。填充参数后发现窄列重叠，已调整列宽、换行与局部滚动；最终参数截图显示双方10项完整行且无重叠。
- Git diff空白字符检查通过。原文件/评分保留；答案不写storage，无云端接入。

## 工具限制与人工验收

微信自动化工具曾引用旧页面，样式热更新后会话重复超时，后改用直接编译/截图完成最终布局核验。最后一次自动化失败诊断保留在wechat-automation-last-attempt.json，不当作测试通过；此前真实功能断言及截图单独记录如上。可复现脚本scripts/wechat_smoke.py需已登录并有稳定自动化会话；会话超时不是算法失败。

请人工确认：手机真机点击与滚动、不同屏幕尺寸、长来源/配置文字、重复选择拦截、最多三项、预算单选阻断、询价入口和同系版本链接；实车座垫/着地、安全配置、所售SKU现价、门店有售、12画像业务合理性及四款耐用高分证据未获自动确认。

“只选预算合适”未获产品规则确认，暂保留待确认并阻断排名，不分配25分；可以返回补选已有非预算关注项。

## 修改文件

- data/model-assets.js：原59款ID与授权素材映射保留。
- data/models.js：权威快照字段映射、参数与价格状态、版本、来源、安全验证。
- data/audited-source.json与.js、quality.json与.js、source.schema.json：导入与校验产物。
- data/store-overrides.json与.js：未知/有售/下架门店状态，默认为未知。
- data/source/：三个原始交付文件副本，未删除原文件。
- utils/recommend.js：确定性纯函数100分评分与约束。
- pages/index/index.js/.wxml/.wxss：六题保留、关注点按文档修正、结果接入、拆分分数、同系版本。
- pages/compare/compare.js：异常选择和无效路由处理。
- pages/compare/params.js/.wxml/.wxss：双方10项参数、缺失显示、证据提示、长文字显示。
- pages/detail/detail.js/.wxml/.wxss：真实快照参数、来源、配置核验和咨询提示，无效车型不默认替换。
- project.config.json：原始源表、JSON审计镜像、校验脚本、测试、报告排除打包，保留实际所需JS模块。
- scripts/import_data.py、audit_recommendations.js、business_audit.js、wechat_smoke.py：可复现导入和审计。
- tests/recommend.test.js、pages.test.js：纯函数及页面集成检查。
- README.md、reports/：维护说明、全量状态、待办、12画像、业务问题、验收记录及模拟器截图。

未修改现有封面、图片、业务范围；未加入依赖。

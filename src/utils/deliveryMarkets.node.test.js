const {test} = require('node:test');
const assert = require('node:assert/strict');
const {deliveryMarketOptions} = require('./deliveryMarkets');
const writable = item => ({...item,status:1,access_key:'$MARKET_ACCESS_KEY',access_actions:['Write']});
test('market labels use the API alias, keep the submission identifier and deduplicate identical bindings',()=>{
  const id='112530304174481d91398b63d845401e';
  const result=deliveryMarketOptions([{name:id,alias:'好雨科技企业服务商店',url:'https://hub.grapps.cn',domain:'enterprise'},
    {name:'RainbondMarket',alias:'开源应用市场',url:'https://hub.grapps.cn',domain:'rainbond'},
    {name:'RainbondMarket',alias:'开源应用市场',url:'https://hub.grapps.cn',domain:'rainbond'}].map(writable));
  assert.equal(result.length,2);
  assert.equal(result[0].id,id);
  assert.equal(result[0].name,'好雨科技企业服务商店');
  assert.equal(result[1].name,'开源应用市场');
});
test('different markets with the same alias use their real address and namespace for distinction',()=>{
  const result=deliveryMarketOptions([{name:'first',alias:'团队商店',url:'https://one.example.test',domain:'team'},
    {name:'second',alias:'团队商店',url:'https://two.example.test',domain:'team'}].map(writable));
  assert.notEqual(result[0].name,result[1].name);
  assert.ok(result[0].name.includes('one.example.test'));
});
test('unavailable aliases never expose opaque identifiers or URL credentials as display names',()=>{
  const id='112530304174481d91398b63d845401e';
  const result=deliveryMarketOptions([{name:id,alias:id,url:'https://user:placeholder@hub.example.test?private=placeholder',domain:'enterprise'}].map(writable));
  assert.equal(result[0].name,'hub.example.test / enterprise');
  assert.equal(result[0].id,id);
});
test('legacy publish restrictions exclude read-only, unauthorized and inactive markets',()=>{
  const source=writable({name:'private',alias:'可发布商店'});
  const result=deliveryMarketOptions([source,{...source,name:'RainbondMarket',alias:'开源应用市场',access_actions:['ReadInstall','OnlyRead']},
    {...source,name:'no-key',access_key:''},{...source,name:'inactive',status:0}]);
  assert.deepEqual(result.map(item=>item.id),['private']);
  assert.ok(!JSON.stringify(result).includes('$MARKET_ACCESS_KEY'));
});

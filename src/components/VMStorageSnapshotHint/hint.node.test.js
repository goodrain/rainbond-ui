const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
function load(file, dependencies) {
  const filename=path.resolve(__dirname,file);
  const code=babel.transformSync(fs.readFileSync(filename,'utf8'),{filename,babelrc:false,configFile:false,
    presets:[[require('@umijs/deps/compiled/babel/preset-env').default,{targets:{node:'current'}}],require('@umijs/deps/compiled/babel/preset-react').default],
    plugins:[[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default,{loose:true}]]}).code;
  const exports={};vm.runInNewContext(code,{exports,require:name=>{if(Object.hasOwn(dependencies,name))return dependencies[name];throw new Error(name);}});return exports;
}
const hint=load('index.js',{react:React,antd:{Alert:'Alert',Button:'Button'},'@/utils/intl':{formatMessage:({id})=>id}}).default;
const ui={Alert:'Alert',Button:'Button',Card:'Card',Descriptions:{Item:'D'},Form:{Item:'Item',create:()=>Component=>Component},Input:'Input',InputNumber:'InputNumber',Radio:{Group:'RadioGroup',Button:'RadioButton'},Select:{Option:'Option'},Steps:{Step:'Step'}};
const Creator=load('../../pages/VirtualMachineDemo/CreateVm.js',{react:React,antd:ui,'../../components/VMStorageSnapshotHint':hint,
 '@/utils/intl':{formatMessage:({id})=>id},'./state':{createValues:()=>({cpu:4,memory:8,disk:30})},'./messages':{t:key=>key},'./index.less':{},'./HelpLabel':()=>null}).default;

test('only explicit authority presentation state is supported; storage names cannot imply support',()=>{
 for(const storageName of ['nfs','ceph','standard','snapshot-fast']){
  const result=hint({storageName});assert.equal(result.props.type,'info');assert.ok(result.props.message.endsWith('.unknown'));
 }
 assert.equal(hint({state:'supported'}).props.type,'success');
 assert.equal(hint({state:'unsupported'}).props.type,'warning');
 assert.equal(hint({state:'failed'}).props.type,'warning');
});
test('snapshot unsupported, unknown and failed never disable ordinary VM creation',()=>{
 for(const state of ['supported','unsupported','unknown','failed']){
  let created;
  const instance=new Creator({snapshotCreateStorage:{state},creationStorage:{status:'ready',options:[{value:'storage-a',label:'A'}]},
   form:{validateFields:(_,__,callback)=>callback(null,{cpu:4,memory:8,disk:30,disk_volume_type:'storage-a'})},onCreate:value=>{created=value;}});
  instance.submit();assert.equal(created.disk_volume_type,'storage-a');assert.equal(created.cpu,4);
 }
});
test('multi-disk support explanation does not introduce a restore disable action',()=>{
 const result=hint({state:'unsupported',mode:'component',blockingDisks:['system disk','data disk 2']});
 assert.equal(result.props.type,'warning');assert.equal(result.props.disabled,undefined);
 const serialized=JSON.stringify(result.props.description);assert.ok(serialized.includes('restorePlanIndependent'));
});

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /const isVirtualMachine = this\.isVirtualMachine\(\);/,
  'AddStorage should detect the VM scenario'
);

assert.match(
  source,
  /{isVirtualMachine \? null : \(\s*<FormItem[\s\S]*label={<FormattedMessage id="componentOverview\.body\.tab\.AddStorage\.mode" \/>}/,
  'AddStorage should hide the mode input for VM config file injection'
);

assert.doesNotMatch(
  source,
  /mode:\s*values\.mode \|\| 777/,
  'AddStorage should not keep a fake mode value in the VM config file scenario'
);

assert.match(
  source,
  /label={isVirtualMachine \? '配置盘文件名' : <FormattedMessage id="componentOverview\.body\.tab\.AddStorage\.path" \/>}/,
  'AddStorage should describe the VM field as a config disk filename'
);

assert.match(
  source,
  /message: isVirtualMachine \? '请输入配置盘文件名'/,
  'AddStorage should require a config disk filename in the VM scenario'
);

assert.match(
  source,
  /placeholder={isVirtualMachine \? '例如 app\.env 或 rainbond\.env'/,
  'AddStorage should no longer suggest a path-like placeholder in the VM scenario'
);

console.log('AddStorage VM config injection form test passed');

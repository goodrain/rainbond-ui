const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'customEnvironmentVariables.js'), 'utf8');

assert.match(
  source,
  /title:\s*isVirtualMachine \? '配置盘文件名' : formatMessage\(\{ id: 'componentOverview\.body\.tab\.env\.setting\.volume_path' \}\)/,
  'VM config file list should render the filename column instead of the path label'
);

assert.match(
  source,
  /\.\.\.\(!isVirtualMachine \? \[\{\s*title:\s*formatMessage\(\{ id: 'componentOverview\.body\.tab\.env\.setting\.mode' \}\)/,
  'VM config file list should only render the mode column for non-VM components'
);

assert.match(
  source,
  /这里配置的是配置盘文件名，不是 guest 内路径，也不再支持权限配置/,
  'VM config file page should explain that path and mode are not supported'
);

console.log('customEnvironmentVariables VM config file list test passed');

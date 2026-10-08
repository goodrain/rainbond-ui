const assert = require('assert');
const fs = require('fs');
const path = require('path');

const files = [
  'EnterpriseSetting/index.js',
  'EnterpriseTeams/index.js'
];

files.forEach(file => {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');

  assert.match(
    source,
    /const clusters = Array\.isArray\(cluster_info\) \? cluster_info : \[\];[\s\S]*?clusters\.forEach/,
    `${file} should normalize cluster_info before iterating`
  );
  assert.doesNotMatch(
    source,
    /\(cluster_info \|\| \[\]\)\.forEach/,
    `${file} should not assume every truthy cluster_info value is an array`
  );
});

console.log('enterprise cluster info normalization tests passed');

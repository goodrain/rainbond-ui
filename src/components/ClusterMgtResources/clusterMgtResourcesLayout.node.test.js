const assert = require('assert');
const fs = require('fs');
const path = require('path');

const resourcesJs = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const resourcesLess = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');
const listJs = fs.readFileSync(path.join(__dirname, '../ClusterMgtList/index.js'), 'utf8');
const listLess = fs.readFileSync(path.join(__dirname, '../ClusterMgtList/index.less'), 'utf8');
const pageSource = fs.readFileSync(
  path.join(__dirname, '../../pages/EnterpriseClusters/ClustersMGT/index.js'),
  'utf8'
);
const diskAlertSource = fs.readFileSync(
  path.join(__dirname, '../DiskAlertBar/index.js'),
  'utf8'
);
const diskUtilsSource = fs.readFileSync(
  path.join(__dirname, '../../utils/nodeDisk.js'),
  'utf8'
);

assert.ok(
  /<ClusterList[\s\S]*?titleIcon=\{SVG\.getSvg\("listSvg", 20\)\}[\s\S]*?titleText=\{formatMessage\(\{ id: 'enterpriseColony\.mgt\.cluster\.clusterList' \}\)\}/.test(pageSource),
  'node list title should be passed into the card component'
);

assert.ok(
  /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(listLess) &&
    /className=\{styles\.cardContainer\}/.test(listJs),
  'node list should use the gradient card surface'
);

assert.ok(
  /diskAlerts=\{diskAlerts\}/.test(pageSource) &&
    /<DiskAlertBar[\s\S]*?alerts=\{diskAlerts\}[\s\S]*?onView=\{this\.handleViewDiskAlert\}[\s\S]*?<Table/.test(listJs),
  'node list should show disk alerts above the original table'
);

assert.ok(
  /dataIndex: 'role'/.test(listJs) &&
    /dataIndex: 'arch'/.test(listJs) &&
    !/enterpriseColony\.disk\.title|dataIndex: 'disk'|<Progress|getNodeDisk|getDiskStatusRank/.test(listJs),
  'node list should keep its original columns without a disk column'
);

assert.ok(
  /NODE_DISK_USAGE_QUERY/.test(pageSource) &&
    /global\/fetchClusterUsed/.test(pageSource) &&
    /container_fs_usage_bytes/.test(diskUtilsSource) &&
    /enterpriseColony\.disk\.alert\.usageTitle/.test(diskAlertSource) &&
    !/diskPreview|getPreview|mock|preview/i.test(pageSource + diskUtilsSource),
  'node disk alerts should use real Prometheus metrics without mock data'
);

assert.ok(
  /<DetectionResources[\s\S]*?titleIcon=\{SVG\.getSvg\("userSvg", 20\)\}[\s\S]*?titleText=\{formatMessage\(\{ id: 'enterpriseColony\.mgt\.cluster\.user' \}\)\}/.test(pageSource),
  'resource usage title should be passed into the card component'
);

assert.ok(
  /\.cardContainer\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(resourcesLess) &&
    /className=\{styles\.clusterMetrics\}/.test(resourcesJs),
  'resource usage should use the gradient card and metric grid'
);

assert.ok(
  /\.clusterMetrics\s*\{[\s\S]*?grid-template-columns:\s*1\.3fr 1\.3fr 0\.9fr 0\.9fr;/m.test(resourcesLess) &&
    /chartType="progressGauge"/.test(resourcesJs) &&
    /\.clusterGaugeFloat\s*\{[\s\S]*?position:\s*absolute;/m.test(resourcesLess),
  'resource usage should match the home cluster metric style with floating gauges'
);

console.log('cluster management list and resources layout tests passed');

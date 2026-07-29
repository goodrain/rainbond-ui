const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const lessSource = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');
const enterpriseLayoutSource = fs.readFileSync(
  path.join(__dirname, '../../layouts/EnterpriseLayout.js'),
  'utf8'
);
const enterpriseLayoutLess = fs.readFileSync(
  path.join(__dirname, '../../layouts/EnterpriseLayout.less'),
  'utf8'
);

assert.ok(
  /<ScrollerX\s+sm=\{`calc\(1100px - var\(--agent-panel-width,\s*0px\)\)`\}>/.test(
    jsSource
  ),
  'enterprise page should reduce its horizontal min width when the agent panel is open'
);

assert.ok(
  /className=\{enterpriseStyles\.clusterOverviewCard\}/.test(jsSource),
  'cluster information should use the overview card container'
);

assert.ok(
  /className=\{enterpriseStyles\.overviewCardHeader\}[\s\S]*enterpriseOverview\.information\.colonyInfo/.test(jsSource),
  'cluster information title should use the unified overview card header'
);

assert.ok(
  /className=\{enterpriseStyles\.clusterSummary\}/.test(jsSource),
  'cluster name, status, icon, and metadata should be fused into a single summary header'
);

assert.ok(
  /const clusterDiskAlerts = diskAlerts\.filter\([\s\S]*?alert\.regionName === region_name/.test(jsSource) &&
    /className=\{enterpriseStyles\.clusterDiskAlerts\}[\s\S]*?<DiskAlertBar[\s\S]*?alerts=\{clusterDiskAlerts\}/.test(jsSource) &&
    /className=\{enterpriseStyles\.clusterSummary\}[\s\S]*?className=\{enterpriseStyles\.clusterDiskAlerts\}[\s\S]*?className=\{enterpriseStyles\.clusterDivider\}/.test(jsSource) &&
    /\.clusterDiskAlerts\s*\{[\s\S]*?margin-top:\s*14px;/m.test(lessSource),
  'disk alerts should render inside their cluster card between the summary and resource metrics'
);

assert.ok(
  /type: 'global\/fetchClusterUsed'[\s\S]*?query: NODE_DISK_USAGE_QUERY[\s\S]*?normalizeNodeDiskMetrics/.test(jsSource) &&
    !/getRainbondAlert|diskPreview|getPreview|mockDisk/.test(jsSource),
  'cluster disk alerts should use real Prometheus metrics without preview data'
);

assert.ok(
  !/DiskAlertBar|loadDiskAlerts|diskAlertWrap/.test(enterpriseLayoutSource) &&
    !/diskAlertWrap/.test(enterpriseLayoutLess),
  'enterprise layout should not render or poll platform-wide disk alerts'
);

assert.ok(
  /\.clusterMetrics\s*\{[\s\S]*?grid-template-columns:\s*1\.3fr 1\.3fr 0\.9fr 0\.9fr;/m.test(lessSource),
  'cluster main metrics should render as four stable columns'
);

assert.ok(
  /\.clusterIconBox\s*\{[\s\S]*?width:\s*64px;[\s\S]*?height:\s*64px;/m.test(lessSource),
  'cluster icon should be displayed in a compact square next to the cluster name'
);

assert.ok(
  /chartType="progressGauge"/.test(jsSource) &&
    /handleClickStatus\('cpu'\)/.test(jsSource) &&
    /handleClickStatus\('memory'\)/.test(jsSource) &&
    /typeStatusMemory \? 'enterpriseOverview\.overview\.memory_used' : 'enterpriseOverview\.overview\.memory_allocated'/.test(jsSource),
  'cluster resource metrics should use independently switchable ECharts gauges'
);

assert.ok(
  /enterpriseOverview\.overview\.node_normal/.test(jsSource) &&
    /enterpriseOverview\.overview\.running_components/.test(jsSource),
  'cluster card should show only the primary node and running component metrics below the summary'
);

assert.ok(
  !/mockAppAlertList|displayAppAlertList|mock-plugin-daemon|平台插件|2026-06-15/.test(jsSource) &&
    /!\s*appAlertLoding && appAlertList\.length > 0/.test(jsSource) &&
    /\{appAlertList\.map\(item =>/.test(jsSource),
  'app alert list should render only real API records without temporary mock data'
);

assert.ok(
  /className=\{enterpriseStyles\.appAlertItem\}/.test(jsSource) &&
    /\.appAlertInfo\s*\{[\s\S]*?grid-template-columns:\s*180px 180px 220px 120px;/m.test(lessSource),
  'app alert list should render as horizontal summary cards'
);

assert.ok(
  /className=\{enterpriseStyles\.appAlertCard\}/.test(jsSource) &&
    /\.appAlertCard\s*\{[\s\S]*?background-image:\s*radial-gradient/m.test(lessSource),
  'app alert section should use the same gradient card surface as other overview cards'
);

console.log('enterprise agent layout tests passed');

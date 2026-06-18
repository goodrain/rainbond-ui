const assert = require('assert');
const fs = require('fs');
const path = require('path');

const resourceShowSource = fs.readFileSync(
  path.join(__dirname, 'component/monitor/resourceshow.js'),
  'utf8'
);
const rangeChartSource = fs.readFileSync(
  path.join(__dirname, '../../components/CustomChart/rangeChart.js'),
  'utf8'
);
const rangeChartLess = fs.readFileSync(
  path.join(__dirname, '../../components/CustomChart/index.less'),
  'utf8'
);

assert.ok(
  /moduleName="ResourceMonitoring"/.test(resourceShowSource) &&
    /RangeData=\{\[[\s\S]*?'containerMem'[\s\S]*?'containerCpu'[\s\S]*?'containerNetR'[\s\S]*?'containerNetT'[\s\S]*?\]\}/.test(resourceShowSource),
  'ResourceShow should keep the four resource monitoring metrics'
);

assert.ok(
  /import \* as echarts from 'echarts';/.test(rangeChartSource) &&
    /moduleName === 'ResourceMonitoring' \? \([\s\S]*className=\{styless\.resourceLineChart\}/.test(rangeChartSource),
  'resource monitoring should render with an ECharts container'
);

assert.ok(
  /type:\s*'line'/.test(rangeChartSource) &&
    /smooth:\s*true/.test(rangeChartSource) &&
    /xAxis:\s*\{[\s\S]*?type:\s*'time'/.test(rangeChartSource),
  'resource monitoring ECharts option should be a smooth time-series line chart'
);

assert.ok(
  /lineStyle:\s*\{[\s\S]*?width:\s*1\.5[\s\S]*?\}/m.test(rangeChartSource) &&
    /areaStyle:\s*\{[\s\S]*?new echarts\.graphic\.LinearGradient\(0, 0, 0, 1/m.test(rangeChartSource),
  'resource monitoring line chart should use thinner lines with gradient area shadow'
);

assert.ok(
  /legend:\s*\{[\s\S]*?bottom:\s*8,[\s\S]*?fontSize:\s*10/m.test(rangeChartSource),
  'resource monitoring legend should be placed at the bottom with compact text'
);

assert.ok(
  /xAxis:\s*\{[\s\S]*?axisLabel:\s*\{[\s\S]*?hideOverlap:\s*true,[\s\S]*?interval:\s*'auto'[\s\S]*?rotate:\s*30/m.test(rangeChartSource),
  'resource monitoring x-axis labels should avoid dense overlap'
);

assert.ok(
  /<Chart[\s\S]*<Geom[\s\S]*type="line"[\s\S]*<\/Chart>/.test(rangeChartSource) &&
    /moduleName === 'ResourceMonitoring' \?/.test(rangeChartSource),
  'existing BizCharts line rendering should remain only in the non-resource branch'
);

assert.ok(
  /\.resourceLineChart\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*400px;/m.test(rangeChartLess),
  'resource ECharts line chart should have a stable container size'
);

console.log('resource monitor ECharts tests passed');

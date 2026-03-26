const assert = require('assert');
const { buildPodLogsStreamUrl } = require('./teamResourceLogStream');

assert.strictEqual(
  buildPodLogsStreamUrl({
    baseUrl: '',
    team: 'yirlz5nj',
    region: 'rainbond',
    pod_name: 'nginx-demo-2048-cb6cd9b69-hx5nj',
    container: 'demo-2048',
    lines: 200,
  }),
  '/console/teams/yirlz5nj/regions/rainbond/resource-center/pods/nginx-demo-2048-cb6cd9b69-hx5nj/logs?container=demo-2048&lines=200',
  'resource center pod logs should use the resource center console route'
);

assert.strictEqual(
  buildPodLogsStreamUrl({
    baseUrl: '',
    team: 'team-a',
    region: 'region-a',
    pod_name: 'pod-a',
  }),
  '/console/teams/team-a/regions/region-a/resource-center/pods/pod-a/logs',
  'resource center pod logs should encode team and region in the console route'
);

console.log('resource center log stream url tests passed');

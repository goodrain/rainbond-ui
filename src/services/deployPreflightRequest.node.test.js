const assert = require('assert');
const {
  buildDeployPreflightRequestData
} = require('./deployPreflightRequest');

const payload = {
  group_id: 7,
  git_url: 'https://git.example.com/team/web.git'
};

assert.deepStrictEqual(
  buildDeployPreflightRequestData({
    deploy_type: 'source_code',
    group_id: 8,
    payload
  }),
  {
    deploy_type: 'source_code',
    group_id: 8,
    payload
  },
  'an explicit request group should take precedence over the compatibility payload value'
);

assert.deepStrictEqual(
  buildDeployPreflightRequestData({
    deploy_type: 'source_code',
    payload
  }),
  {
    deploy_type: 'source_code',
    group_id: 7,
    payload
  },
  'an existing application group should be promoted from the preflight payload'
);

assert.deepStrictEqual(
  buildDeployPreflightRequestData({
    deploy_type: 'image',
    payload: { docker_cmd: 'nginx:latest' }
  }),
  {
    deploy_type: 'image',
    payload: { docker_cmd: 'nginx:latest' }
  },
  'new application preflight requests should omit the application scope'
);

console.log('deploy preflight request tests passed');

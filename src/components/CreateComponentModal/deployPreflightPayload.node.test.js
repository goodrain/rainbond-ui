const assert = require('assert');
const {
  buildDeployPreflightPayload,
  buildOauthDeployPreflightPayload
} = require('./deployPreflightPayload');

assert.deepStrictEqual(
  buildDeployPreflightPayload({
    currentFormType: 'code-custom',
    teamName: 'team-a',
    regionName: 'region-a',
    value: {
      group_id: 7,
      service_cname: 'web',
      git_url: 'https://git.example.com/team/web.git',
      code_version: 'main',
      username_1: 'git-user',
      password_1: 'git-password'
    }
  }),
  {
    team_name: 'team-a',
    region_name: 'region-a',
    deploy_type: 'source_code',
    payload: {
      group_id: 7,
      service_cname: 'web',
      git_url: 'https://git.example.com/team/web.git',
      code_version: 'main',
      username_1: 'git-user',
      password_1: 'git-password',
      code_from: 'gitlab_manual',
      username: 'git-user',
      password: 'git-password',
      region_name: 'region-a'
    }
  },
  'manual source forms should send source_code preflight payload with normalized auth fields'
);

assert.deepStrictEqual(
  buildDeployPreflightPayload({
    currentFormType: 'code-jwar',
    teamName: 'team-a',
    regionName: 'region-a',
    eventId: 'event-1',
    value: {
      group_id: 7,
      service_cname: 'web'
    }
  }),
  {
    team_name: 'team-a',
    region_name: 'region-a',
    deploy_type: 'package',
    payload: {
      group_id: 7,
      service_cname: 'web',
      event_id: 'event-1',
      region: 'region-a',
      region_name: 'region-a'
    }
  },
  'package forms should include the upload event and region in deploy preflight payload'
);

assert.deepStrictEqual(
  buildDeployPreflightPayload({
    currentFormType: 'image',
    teamName: 'team-a',
    regionName: 'region-a',
    value: {
      group_id: 7,
      service_cname: 'web',
      docker_cmd: 'registry.example.com/team/web:v1'
    }
  }),
  {
    team_name: 'team-a',
    region_name: 'region-a',
    deploy_type: 'image',
    payload: {
      image_type: 'docker_image',
      group_id: 7,
      service_cname: 'web',
      docker_cmd: 'registry.example.com/team/web:v1',
      region_name: 'region-a'
    }
  },
  'image forms should send image deploy preflight payload'
);

assert.strictEqual(
  buildDeployPreflightPayload({
    currentFormType: 'docker-compose',
    teamName: 'team-a',
    regionName: 'region-a',
    value: {}
  }),
  null,
  'unsupported create form types should not call deploy preflight'
);

assert.deepStrictEqual(
  buildOauthDeployPreflightPayload({
    teamName: 'team-a',
    regionName: 'region-a',
    selectedOauthService: { service_id: 17 },
    value: {
      group_id: 7,
      service_cname: 'web',
      project_url: 'git@github.com:goodrain/demo.git',
      code_version: 'main',
      project_id: 101,
      project_full_name: 'goodrain/demo',
      open_webhook: true,
      k8s_component_name: 'web',
      arch: 'amd64'
    }
  }),
  {
    service_id: 17,
    code_version: 'main',
    git_url: 'git@github.com:goodrain/demo.git',
    group_id: 7,
    server_type: 'git',
    service_cname: 'web',
    is_oauth: true,
    git_project_id: 101,
    team_name: 'team-a',
    open_webhook: true,
    full_name: 'goodrain/demo',
    k8s_component_name: 'web',
    arch: 'amd64',
    region_name: 'region-a'
  },
  'OAuth source forms should normalize selected repository fields before source_code preflight'
);

console.log('deploy preflight payload tests passed');

const buildDeployPreflightPayload = ({
  currentFormType,
  value = {},
  eventId,
  teamName,
  regionName
}) => {
  if (currentFormType === 'code-custom') {
    return {
      team_name: teamName,
      region_name: regionName,
      deploy_type: 'source_code',
      payload: {
        ...value,
        code_from: 'gitlab_manual',
        username: value.username_1,
        password: value.password_1,
        region_name: regionName
      }
    };
  }
  if (currentFormType === 'code-jwar') {
    return {
      team_name: teamName,
      region_name: regionName,
      deploy_type: 'package',
      payload: {
        ...value,
        event_id: eventId,
        region: regionName,
        region_name: regionName
      }
    };
  }
  if (!currentFormType || currentFormType === 'image' || currentFormType === 'docker') {
    return {
      team_name: teamName,
      region_name: regionName,
      deploy_type: 'image',
      payload: {
        image_type: 'docker_image',
        ...value,
        region_name: regionName
      }
    };
  }
  return null;
};

const buildOauthDeployPreflightPayload = ({
  selectedOauthService = {},
  value = {},
  teamName,
  regionName
}) => ({
  service_id: selectedOauthService.service_id,
  code_version: value.code_version,
  git_url: value.project_url,
  group_id: value.group_id,
  server_type: 'git',
  service_cname: value.service_cname,
  is_oauth: true,
  git_project_id: value.project_id,
  team_name: teamName,
  open_webhook: value.open_webhook,
  full_name: value.project_full_name,
  k8s_component_name: value.k8s_component_name,
  arch: value.arch,
  region_name: regionName
});

module.exports = {
  buildDeployPreflightPayload,
  buildOauthDeployPreflightPayload
};

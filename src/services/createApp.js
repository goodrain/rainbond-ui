import apiconfig from '../../config/api.config';
import request from '../utils/request';

/*
   源码创建应用
*/
export async function createAppByCode(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/source_code`,
    {
      method: 'post',
      data: {
        group_id: body.group_id,
        code_from: body.code_from,
        service_cname: body.service_cname,
        git_url: body.git_url,
        // 好雨git应用id
        git_project_id: body.git_project_id || '',
        code_version: body.code_version,
        username: body.username,
        password: body.password,
        server_type: body.server_type,
        k8s_component_name: body.k8s_component_name
      }
    }
  );
}

/*
   源码第三方创建应用
*/
export async function createThirtAppByCodes(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/source_code`,
    {
      method: 'post',
      data: {
        service_id: body.service_id,
        code_version: body.code_version,
        git_url: body.git_url,
        group_id: body.group_id,
        server_type: body.server_type,
        service_cname: body.service_cname,
        is_oauth: body.is_oauth,
        git_project_id: body.git_project_id || '',
        check_uuid: body.check_uuid || '',
        event_id: body.event_id || '',
        open_webhook: body.open_webhook,
        full_name: body.full_name
      }
    }
  );
}
/*
   源码创建应用
*/
export async function createThirdPartyServices(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/third_party`,
    {
      method: 'post',
      data: body
    }
  );
}

/*
   compose创建应用
*/
export async function createAppByCompose(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/docker_compose`,
    {
      method: 'post',
      data: {
        group_name: body.group_name,
        image_type: 'docker_image',
        yaml_content: body.yaml_content,
        user_name: body.user_name,
        password: body.password,
        k8s_app: body.k8s_app
      }
    }
  );
}

/*
   指定镜像或docuer run 创建应用
*/
export async function createAppByDockerrun(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/docker_run`,
    {
      method: 'post',
      data: {
        group_id: body.group_id,
        docker_cmd: body.docker_cmd,
        service_cname: body.service_cname,
        image_type: body.image_type,
        user_name: body.user_name,
        password: body.password,
        k8s_component_name: body.k8s_component_name
      }
    }
  );
}

/*
   获取应用检测的事件Id
*/
export function getCreateCheckId(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/check`,
    {
      method: 'post',
      handleError
    }
  );
}

/*
	获取应用检测结果
*/
export function getCreateCheckResult(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/check`,
    {
      method: 'get',
      params: {
        check_uuid: body.check_uuid
      }
    }
  );
}

/*
  获取compose应用创建检测结果
*/
export function getCreateComposeCheckInfo(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/check`,
    {
      method: 'post',
      data: {
        compose_id: body.compose_id
      }
    }
  );
}

/*
  获取compose应用创建检测结果
*/
export function getCreateComposeCheckResult(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/check`,
    {
      method: 'get',
      params: {
        check_uuid: body.check_uuid,
        compose_id: body.compose_id
      }
    }
  );
}

/*
   构建应用
*/
export function buildApp(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/build`,
    {
      method: 'post',
      data: {
        is_deploy: body.is_deploy
      }
    }
  );
}

/*
  获取分支
*/
export function getCodeBranchs(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/code_repo/branchs`,
    {
      method: 'post',
      data: {
        type: body.type,
        service_code_clone_url: body.git_url,
        service_code_id: body.service_project_id
      }
    }
  );
}

/*
    获取创建应用的check_uuid
*/
export function getCheckuuid(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/get_check_uuid`,
    {
      method: 'get'
    }
  );
}

/*
    获取compose创建应用的check_uuid
*/
export function getComposeCheckuuid(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups/${body.group_id}/get_check_uuid`,
    {
      method: 'get',
      params: {
        compose_id: body.compose_id
      }
    }
  );
}

/*
   获取云市应用
*/
export function getMarketApp(body = {}) {
  return request(`${apiconfig.baseUrl}/console/apps`, {
    method: 'get',
    params: body
  });
}

/*
  从云市安装应用
*/
export async function installApp(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/market_create`,
    {
      method: 'post',
      data: {
        group_id: body.group_id,
        app_id: body.app_id,
        group_key: body.group_key,
        app_version: body.app_version,
        is_deploy: body.is_deploy,
        install_from_cloud: body.install_from_cloud
          ? body.install_from_cloud
          : false,
        market_name: body.marketName
      },
      params: {
        region_name: body.region_name
      }
    }
  );
}

export async function installHelmApp(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/groups`,
    {
      method: 'post',
      data: body
    }
  );
}

/*
   根据compose_id获取应用
*/
export async function getAppsByComposeId(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/compose/${body.compose_id}/services`,
    {
      method: 'get'
    }
  );
}

/*
   根据compose_id获取compose内容
*/
export async function getComposeByComposeId(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/compose/${body.compose_id}/content`,
    {
      method: 'get'
    }
  );
}

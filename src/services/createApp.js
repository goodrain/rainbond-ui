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
        k8s_component_name: body.k8s_component_name,
        k8s_component_name: body.k8s_component_name,
        k8s_app: body.k8s_app || '',
        is_demo: body.is_demo,
        arch: body.arch,
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
        full_name: body.full_name,
        k8s_component_name: body.k8s_component_name,
        arch: body.arch,
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
   Jar、War包上传文件获取事件记录
*/
export async function createJarWarServices(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/package_build/record`,
    {
      method: 'post',
      data: {
        region: body.region,
        component_id: body && body.component_id ? body.component_id : ''
      }
    }
  );
}
/*
   Jar、War包上传文件状态
*/
export async function createJarWarUploadStatus(
  body = { enterprise_id, event_id },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/package_build/record`,
    {
      method: 'get',
      params: {
        region: body.region,
        event_id: body.event_id
      },
      handleError
    }
  );
}
/*
   Jar、War包 删除上传文件状态
*/
export async function deleteJarWarUploadStatus(
  body = { enterprise_id, event_id },
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/package_build/record`,
    {
      method: 'put',
      data: {
        event_id: body.event_id
      },
      handleError
    }
  );
}
/*
   Jar、War包上传文件记录
*/
export async function createJarWarUploadRecord(
  body = {},
  handleError
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/package_build/last-record`,
    {
      method: 'get',
      params: {
        region: body.region,
        component_id: body && body.component_id ? body.component_id : '',
        file_type: body.file_type
      },
      handleError
    }
  );
}
/*
   Jar、War创建应用提交表单
*/
export async function createJarWarFormSubmit(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/package_build`,
    {
      method: 'post',
      data: {
        region: body.region_name,
        event_id: body.event_id,
        group_id: body.group_id,
        service_cname: body.service_cname,
        k8s_component_name: body.k8s_component_name,
        arch: body.arch,
      }
    }
  );
}
/*
   Jar、War构建源修改重新上传文件
*/
export async function createJarWarSubmit(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/package_build`,
    {
      method: 'put',
      data: {
        region: body.region_name,
        event_id: body.event_id,
        group_id: body.group_id,
        service_cname: body.service_cname,
        service_id: body && body.service_id
      }
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
        // group_name: body.group_name,
        image_type: 'docker_image',
        yaml_content: body.yaml_content,
        user_name: body.user_name,
        password: body.password,
        group_id: body.group_id,
        // k8s_app: body.k8s_app,
        arch: body.arch,
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
        k8s_component_name: body.k8s_component_name,
        k8s_app: body.k8s_app || '',
        is_demo: body.is_demo,
        arch: body.arch,
      }
    }
  );
}

/*
   获取本地已有镜像
*/
export async function getImageRepositories(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/image_repositories`,
    {
      method: 'get',
    }
  );
}

/*
   获取本地已有镜像的tags
*/
export async function getImageTags(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/image_tags`,
    {
      method: 'get',
      params: {
        repository: body.repository
      }
    }
  );
}

/*
   检测通过之后选择镜像保存
*/
export async function saveTarImageName(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/tar_image`,
    {
      method: 'post',
      data: {
        image_name: body.image_name
      }
    }
  );
}

/*
   虚拟机镜像创建应用
*/
export async function createAppByVirtualMachine(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/vm_run`,
    {
      method: 'post',
      data: {
        group_id: body.group_id,
        service_cname: body.service_cname,
        k8s_component_name: body.k8s_component_name,
        image_name: body.image_name,
        arch: body.arch,
        vm_url: body.vm_url,
        event_id: body.event_id,
      }
    }
  );
}

/*
   虚拟机获取已有镜像
*/
export async function getAppByVirtualMachineImage(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/virtual_machine_image`,
    {
      method: 'get',
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
      data: {
        event_id: body.event_id
      },
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
        check_uuid: body.check_uuid,
        event_id: body.event_id
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
export function buildApp(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/build`,
    {
      method: 'post',
      data: {
        is_deploy: body.is_deploy,
        nodejs_type: body.nodejs_type,
        nodejs_dependency: body.nodejs_dependency,
      },
      handleError
    }
  );
}

/*
  Node项目设置语言和依赖
*/
export async function setNodeLanguage(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/package_tool`,
    {
      method: 'post',
      data: {
        lang: body.lang,
        package_tool: body.package_tool,
        dist: body.dist
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
export async function installApp(body = {}, handleError) {
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
        market_name: body.marketName,
        dry_run: body.dry_run
      },
      params: {
        region_name: body.region_name
      },
      handleError
    }
  );
}
/*
  从云市安装应用下的插件
*/
export async function installAppPlugin(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/plugins`,
    {
      method: 'post',
      data: {
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
/*
  切换应用版本信息
*/
export async function changeAppVersions(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/plugins`,
    {
      method: 'get',
      params: {
        region_name: body.region_name,
        app_id: body.app_id,
        group_key: body.group_key,
        app_version: body.app_version,
        is_deploy: body.is_deploy,
        install_from_cloud: body.install_from_cloud
          ? body.install_from_cloud
          : false,
        market_name: body.marketName
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
   通过上传.tgz包，点击安装获取helm应用信息
*/
export async function getHelmUploadChartInfo(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/get_upload_chart_information`,
    {
      method: 'get',
      params: {
        event_id: body.event_id
      }
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
// 检测helm应用进度
export async function helmAppInstall(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/helm_app`,
    {
      method: 'get',
      params: {
        name: body.name,
        version: body.version,
        repo_name: body.repo_name,
        chart_name: body.chart_name,
        app_id: body.app_id
      },
      handleError
    }
  );
}
// 获取helm应用版本信息
export async function getHelmVersion(params, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/chart/version`,
    {
      method: 'get',
      params: {
        repo_name: params.repo_name,
        chart_name: params.chart_name || 1,
        highest: params.highest || '',
        app_id: params.app_id
      },
      handleError
    }
  );
}
// helm命令行安装
export async function installHelmAppCmd(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/helm_command`,
    {
      method: 'post',
      data: {
        app_id: body.app_id,
        command: body.command
      },
      handleError
    }
  );
}
// ram命令行安装
export async function installRamAppCmd(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/cmd_create`,
    {
      method: 'post',
      data: {
        group_id: body.group_id,
        cmd: body.command
      },
      handleError
    }
  );
}

// 通过helm包上传的应用检测helm包
export async function checkHelmChartApp(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/check_upload_chart`,
    {
      method: 'post',
      data: {
        event_id: body.event_id,
        name: body.name,
        version: body.version,
      },
      handleError
    }
  );
}

// 通过helm包上传获取yaml
export async function getHelmChartYaml(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/get_upload_chart_value`,
    {
      method: 'get',
      params: {
        event_id: body.event_id
      }
    }
  )
}

// 通过helm包上传部署组件
export async function installHelmUploadApp(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/import_upload_chart_resource`,
    {
      method: 'post',
      data: {
        resource: body.resource,
        app_id: body.group_id
      }
    }
  )
}
// 用户自定义语言
export async function updateCustomLanguage(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_id}/lang-update`,
    {
      method: 'put',
      params: {
        lang: body.lang
      },
      data: {
        dockerfile_path: body.dockerfile_path || ""
      }
    }
  )
}

/*
  初始化分片上传会话
*/
export async function initChunkUpload(body = {}, handleError) {
  // upload_url 只包含域名，需要拼接完整路径
  const baseUrl = body.upload_url || apiconfig.baseUrl;

  return request(
    `${baseUrl}/upload/init`,
    {
      method: 'post',
      data: {
        file_name: body.file_name,
        file_size: body.file_size,
        file_md5: body.file_md5,
        chunk_size: body.chunk_size
      },
      headers: {
        accept: '*/*'
      },
      handleError
    }
  );
}

/*
  上传分片
*/
export async function uploadChunk(body = {}, handleError) {
  const formData = new FormData();
  formData.append('session_id', body.session_id);
  formData.append('chunk_index', body.chunk_index);
  formData.append('file', body.file);

  // upload_url 只包含域名，需要拼接完整路径
  const baseUrl = body.upload_url || apiconfig.baseUrl;

  return request(
    `${baseUrl}/upload/chunk`,
    {
      method: 'post',
      data: formData,
      headers: {
        accept: '*/*'
      },
      handleError
    }
  );
}

/*
  完成分片上传
*/
export async function completeChunkUpload(body = {}, handleError) {
  const baseUrl = body.upload_url || apiconfig.baseUrl;

  return request(
    `${baseUrl}/upload/complete`,
    {
      method: 'post',
      data: {
        session_id: body.session_id
      },
      headers: {
        accept: '*/*'
      },
      handleError
    }
  );
}

/*
  查询分片上传状态
*/
export async function getChunkUploadStatus(body = {}, handleError) {
  const baseUrl = body.upload_url || apiconfig.baseUrl;

  return request(
    `${baseUrl}/upload/status/${body.session_id}`,
    {
      method: 'get',
      headers: {
        accept: '*/*'
      },
      handleError
    }
  );
}

/*
  取消分片上传
*/
export async function cancelChunkUpload(body = {}, handleError) {
  const baseUrl = body.upload_url || apiconfig.baseUrl;

  return request(
    `${baseUrl}/upload/${body.session_id}`,
    {
      method: 'delete',
      headers: {
        accept: '*/*'
      },
      handleError
    }
  );
}
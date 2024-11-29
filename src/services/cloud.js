import request from '../utils/request';
import apiconfig from '../../config/api.config';

/* 获取阿里云的kubernetes集群列表 */
export async function loadKubereneteClusters(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters`,
    {
      method: 'get',
      params: {
        provider_name: body.provider_name
      },
      handleError
    }
  );
}

/* 创建Kubernetes集群 */
export async function createKubernetesCluster(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters`,
    {
      method: 'post',
      data: {
        encodedRKEConfig: body.encodedRKEConfig,
        name: body.name,
        provider_name: body.provider_name,
        resourceType: body.resourceType,
        workerNum: body.workerNum,
        region: body.region,
        nodes: body.nodes,
        kubeconfig: body.kubeconfig,
        eip: body.eip
      },
      handleError
    }
  );
}

/* 获取task event 列表 */
export async function loadTaskEvents(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/tasks/${body.taskID}/events`,
    {
      method: 'get',
      handleError
    }
  );
}

/* 获取上一次未完成的create kubernetes task */
export async function loadLastTask(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/last-ck-task`,
    {
      method: 'get',
      params: {
        provider_name: body.provider_name
      },
      handleError
    }
  );
}

/* 获取指定的create kubernetes task */
export async function loadTask(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/ck-task/${body.taskID}`,
    {
      method: 'get',
      handleError
    }
  );
}

/* 获取指定集群的init task */
export async function loadInitRainbondTask(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/init-task/${body.clusterID}`,
    {
      method: 'get',
      params: {
        provider_name: body.providerName
      },
      handleError
    }
  );
}

/* 获取指定集群的init task */
export async function initRainbondRegion(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/init-cluster`,
    {
      method: 'post',
      data: {
        providerName: body.providerName,
        clusterID: body.clusterID,
        retry: body.retry
      },
      handleError
    }
  );
}

/* 获取running init task */
export async function loadRunningInitRainbondTasks(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/init-tasks`,
    {
      method: 'get',
      handleError
    }
  );
}

/* 获取running init task */
export async function loadRegionConfig(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/regionconfig`,
    {
      method: 'get',
      params: {
        provider_name: body.providerName
      },
      handleError
    }
  );
}

export async function updateInitTaskStatus(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/init-tasks/${body.taskID}/status`,
    {
      method: 'put',
      data: {
        status: body.status
      },
      handleError
    }
  );
}

export async function deleteKubernetesCluster(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/rke2/${body.clusterID}`,
    {
      method: 'delete',
      handleError
    }
  );
}

export async function getInitNodeCmd(handleError) {
  return request(`/console/proxy/enterprise-server/api/v1/init_node_cmd`, {
    method: 'get',
    handleError
  });
}
export async function rkeconfig(body) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/prune-update-rkeconfig`,
    {
      method: 'post',
      data: body,
      noModels: true,
      showMessage: false
    }
  );
}
export async function queryCreateLog(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/createlog`,
    {
      method: 'get',
      params: {
        provider_name: body.providerName
      },
      handleError
    }
  );
}

export async function reInstall(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/reinstall`,
    {
      method: 'post',
      handleError
    }
  );
}

export async function getKubeConfig(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/kubeconfig`,
    {
      method: 'get',
      params: {
        provider_name: body.providerName
      },
      handleError
    }
  );
}

export async function getRainbondComponents(body) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/rainbond-components`,
    {
      method: 'get',
      params: {
        providerName: body.providerName
      },
      showMessage: false,
      noModels: true
    }
  );
}
export async function getPodEvent(body) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/rainbond-components/${body.podName}/events`,
    {
      method: 'get',
      params: {
        providerName: body.providerName
      }
    }
  );
}

export async function getUpdateKubernetesTask(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/update-cluster/${body.clusterID}`,
    {
      method: 'get',
      params: {
        provider_name: body.providerName
      },
      handleError
    }
  );
}

export async function updateKubernetesCluster(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/update-cluster`,
    {
      method: 'post',
      data: body,
      handleError
    }
  );
}

export async function getRainbondClusterConfig(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/rainbondcluster`,
    {
      method: 'get',
      handleError
    }
  );
}

export async function setRainbondClusterConfig(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/rke2/install/rainbond/${body.clusterID}`,
    {
      method: 'put',
      data: {
        config: body.config
      },
      handleError
    }
  );
}

export async function uninstallRegion(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters/${body.clusterID}/uninstall`,
    {
      method: 'post',
      data: body,
      handleError
    }
  );
}

// 检测ssh
export async function fetchCheckSsh(body, handleError) {
  return request(
    `/console/proxy/enterprise-server/api/v1/check_ssh`,
    {
      method: 'post',
      data: {
        host: body.host,
        port: body.port,
      },
      handleError
    }
  );
}
// 新建k8s集群
export async function AddClusterRke2(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.eid}/rke2`,
    {
      method: 'post',
      data: {
        name: body.name,
        nodes: body.nodes,
      },
      handleError
    }
  )
}
// 检测节点账户密码是否正确
export async function fetchCheckSshPwd(body, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/check_ssh_pwd`,
    {
      method: 'post',
      data: body.data,
      handleError
    }
  )
}

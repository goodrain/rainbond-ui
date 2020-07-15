import request from '../utils/request';

/* 获取企业的cloud access key */
export async function queryEnterpriseAccesskey(body = {}) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/accesskey`,
    {
      method: 'get',
      params: {
        provider_name: body.provider_name,
      },
    }
  );
}

/* 设置企业的cloud access key */
export async function setEnterpriseAccesskey(body = {}) {
  return request(
    `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/accesskey`,
    {
      method: 'post',
      data: {
        provider_name: body.provider_name,
        access_key: body.access_key,
        secret_key: body.secret_key,
      },
    }
  );
}

/* 获取阿里云的kubernetes集群列表 */
export async function loadKubereneteClusters(body, handleError) {
    return request(
      `/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/kclusters`,
      {
        method: 'get',
        params: {
          provider_name: body.provider_name,
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
        name: body.name,
        provider_name: body.provider_name,
        resourceType: body.resourceType,
        workerNum: body.workerNum,
        region: body.region
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
        provider_name: body.provider_name,
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
        provider_name: body.providerName,
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
        provider_name: body.providerName,
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
        status: body.status,
      },
      handleError
    }
  );
}
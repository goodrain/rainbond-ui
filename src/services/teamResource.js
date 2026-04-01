import apiconfig from '../../config/api.config';
import request from '../utils/request';
import { buildPodLogsStreamUrl } from './teamResourceLogStream';

const base = (team, region) =>
  `${apiconfig.baseUrl}/console/teams/${team}/regions/${region}`;

export async function listNsResources(body = {}) {
  return request(`${base(body.team, body.region)}/ns-resources`, {
    method: 'get',
    params: { group: body.group, version: body.version, resource: body.resource }
  });
}

export async function getNsResource(body = {}) {
  return request(`${base(body.team, body.region)}/ns-resources/${body.name}`, {
    method: 'get',
    params: { group: body.group, version: body.version, resource: body.resource },
    handleError: body.handleError,
    showLoading: body.showLoading
  });
}

export async function createNsResource(body = {}) {
  return request(`${base(body.team, body.region)}/ns-resources?source=${body.source || 'manual'}`, {
    method: 'post',
    data: body.yaml,
    params: { group: body.group, version: body.version, resource: body.resource },
    headers: { 'Content-Type': 'application/yaml' }
  });
}

export async function updateNsResource(body = {}) {
  return request(`${base(body.team, body.region)}/ns-resources/${body.name}`, {
    method: 'put',
    data: body.yaml,
    params: { group: body.group, version: body.version, resource: body.resource },
    headers: { 'Content-Type': 'application/yaml' }
  });
}

export async function deleteNsResource(body = {}) {
  return request(
    `${base(body.team, body.region)}/ns-resources/${body.name}`,
    {
      method: 'delete',
      params: { group: body.group, version: body.version, resource: body.resource }
    }
  );
}

export async function listHelmReleases(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases`, { method: 'get' });
}

export async function installHelmRelease(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases`, {
    method: 'post',
    data: {
      source_type: body.source_type,
      repo_name: body.repo_name,
      repo_url: body.repo_url,
      chart: body.chart,
      chart_name: body.chart_name,
      chart_url: body.chart_url,
      version: body.version,
      release_name: body.release_name,
      values: body.values,
      username: body.username,
      password: body.password,
      event_id: body.event_id,
    }
  });
}

export async function previewHelmChart(body = {}) {
  return request(`${base(body.team, body.region)}/helm/chart-preview`, {
    method: 'post',
    data: {
      source_type: body.source_type,
      repo_name: body.repo_name,
      repo_url: body.repo_url,
      chart: body.chart,
      chart_name: body.chart_name,
      chart_url: body.chart_url,
      version: body.version,
      username: body.username,
      password: body.password,
      event_id: body.event_id,
    }
  });
}

export async function uninstallHelmRelease(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases/${body.release_name}`, { method: 'delete' });
}

export async function getHelmReleaseHistory(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases/${body.release_name}/history`, { method: 'get' });
}

export async function getHelmReleaseDetail(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases/${body.release_name}`, { method: 'get' });
}

export async function upgradeHelmRelease(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases/${body.release_name}`, {
    method: 'put',
    data: {
      source_type: body.source_type,
      repo_name: body.repo_name,
      repo_url: body.repo_url,
      chart: body.chart,
      chart_name: body.chart_name,
      chart_url: body.chart_url,
      version: body.version,
      values: body.values,
      username: body.username,
      password: body.password,
      event_id: body.event_id,
      allow_chart_replace: body.allow_chart_replace,
    }
  });
}

export async function rollbackHelmRelease(body = {}) {
  return request(`${base(body.team, body.region)}/helm/releases/${body.release_name}/rollback`, {
    method: 'post',
    data: {
      revision: body.revision,
    }
  });
}

export async function getWorkloadDetail(body = {}) {
  return request(`${base(body.team, body.region)}/resource-center/workloads/${body.resource}/${body.name}`, {
    method: 'get',
    params: { group: body.group, version: body.version }
  });
}

export async function getPodDetail(body = {}) {
  return request(`${base(body.team, body.region)}/resource-center/pods/${body.pod_name}`, {
    method: 'get'
  });
}

export async function getResourceEvents(body = {}) {
  return request(`${base(body.team, body.region)}/resource-center/events`, {
    method: 'get',
    params: { kind: body.kind, name: body.name, namespace: body.namespace }
  });
}

export async function getResourceWSInfo(body = {}) {
  return request(`${base(body.team, body.region)}/resource-center/ws-info`, {
    method: 'get'
  });
}

export function getPodLogsStreamUrl(body = {}) {
  return buildPodLogsStreamUrl({
    ...body,
    baseUrl: apiconfig.baseUrl,
  });
}

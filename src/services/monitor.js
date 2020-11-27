/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
import apiconfig from '../../config/api.config';
import request from '../utils/request';

/*
	获取应用在线人数监控数据(当前请求时间点的数据)
*/
export function getMonitorRangeData(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.teamName}/apps/${body.componentAlias}/monitor/query_range`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: body.query,
        start: body.start || new Date().getTime() / 1000 - 60 * 60,
        end: body.end || new Date().getTime() / 1000,
        step: body.step || 72
      },
      showLoading: false
    }
  );
}

export function getComponentCPURange(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `max(app_requestclient{service_id="${body.serviceId}"})`
      },
      showLoading: false
    }
  );
}

export function getComponentNetworkRange(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/monitor/query`,
    {
      method: 'get',
      showMessage: false,
      params: {
        query: `max(app_requestclient{service_id="${body.serviceId}"})`
      },
      showLoading: false
    }
  );
}

export function getServiceMonitor(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/service_monitor`,
    {
      method: 'get',
      params: body
    }
  );
}

export async function postServiceMonitor(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/service_monitor`,
    {
      method: 'post',
      data: params
    }
  );
}

export async function deleteServiceMonitor(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/service_monitor/${params.name}`,
    {
      method: 'delete'
    }
  );
}
export async function updateServiceMonitor(body) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/service_monitor/${body.name}`,
    {
      method: 'put',
      data: body
    }
  );
}

export function getServiceMonitorFigure(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/graphs`,
    {
      method: 'get'
    }
  );
}
export function getComponentMetrics(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.service_alias}/metrics`,
    {
      method: 'get'
    }
  );
}
export async function addKeyImport(params) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${params.team_name}/apps/${params.app_alias}/internal-graphs`,
    {
      method: 'post',
      data: { graph_name: params.graph_name }
    }
  );
}
export function getKeyImport(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/internal-graphs`,
    {
      method: 'get'
    }
  );
}
export function getServiceMonitorFigureInfo(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/graphs/${body.graph_id}`,
    {
      method: 'get'
    }
  );
}
export function addServiceMonitorFigure(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/graphs`,
    {
      method: 'post',
      data: body
    }
  );
}
export async function updataServiceMonitorFigure(body) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/graphs/${body.graph_id}`,
    {
      method: 'put',
      data: body
    }
  );
}

export async function deleteServiceMonitorFigure(body) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/graphs/${body.graph_id}`,
    {
      method: 'delete'
    }
  );
}

export async function batchDeleteServiceMonitorFigure(body) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_alias}/graphs`,
    {
      method: 'delete',
      data: body
    }
  );
}
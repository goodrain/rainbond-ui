/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
import apiconfig from "../../config/api.config";
import request from "../utils/request";

/*
	获取应用在线人数监控数据(当前请求时间点的数据)
*/
export function getMonitorRangeData(
  body = {
    teamName,
    componentAlias,
    serviceID,
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.teamName}/apps/${
      body.componentAlias
    }/monitor/query_range`,
    {
      method: "get",
      showMessage: false,
      params: {
        query: body.query,
        start: body.start || (new Date().getTime() / 1000 - 60*60),
        end: body.end || new Date().getTime() / 1000,
        step: body.step || 72
      },
      showLoading: false,
    }
  );
}

export function getComponentCPURange(
  body = {
    teamName,
    componentAlias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${
      body.app_alias
    }/monitor/query`,
    {
      method: "get",
      showMessage: false,
      params: {
        query: `max(app_requestclient{service_id="${body.serviceId}"})`
      },
      showLoading: false
    }
  );
}

export function getComponentNetworkRange(
  body = {
    teamName,
    componentAlias,
    serviceId
  }
) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${
      body.app_alias
    }/monitor/query`,
    {
      method: "get",
      showMessage: false,
      params: {
        query: `max(app_requestclient{service_id="${body.serviceId}"})`
      },
      showLoading: false
    }
  );
}

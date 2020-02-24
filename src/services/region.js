import request from '../utils/request';
import apiconfig from '../../config/api.config';

/*
	获取数据中心下的协议
*/
export async function getProtocols(body = {
  team_name,
  region_name
}) {
  return request(apiconfig.baseUrl + `/console/teams/${body.team_name}/protocols`, {method: 'get',params: {
    region_name: body.region_name
  }});
}
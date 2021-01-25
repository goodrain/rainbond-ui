import apiconfig from '../../config/api.config';
import request from '../utils/request';

/* 获取企业服务信息 */
export async function queryEnterpriseService(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/subscribe`,
    {
      method: 'get'
    }
  );
}

/* 刷新企业服务信息 */
export async function queryEnterpriseServiceRefresh(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/proxy/enterprise-server/api/v1/enterprises/${body.enterprise_id}/sync`,
    {
      method: 'post'
    }
  );
}

/* 创建订单 */
export async function CreateOrder(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/orders`,
    {
      method: 'post',
      data: body,
      handleError
    }
  );
}

/* 获取企业订单列表 */
export async function queryEnterpriseOrderList(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/orders`,
    {
      method: 'get',
      params: {
        query: body.query,
        page: body.page,
        page_size: body.page_size
      }
    }
  );
}

/* 获取企业订单详情 */
export async function queryEnterpriseOrderDetails(body = {}, handleError) {
  return request(
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/orders/${body.order_id}`,
    {
      method: 'get',
      handleError
    }
  );
}

/* 获取银行详情 */
export async function queryBankInfo(body = {}) {
  return request(`${apiconfig.baseUrl}/console/bank/info`, {
    method: 'get'
  });
}

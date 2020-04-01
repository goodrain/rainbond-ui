import request from '../utils/request';
import apiconfig from '../../config/api.config';

/* 获取企业服务信息 */
export async function queryEnterpriseService(body = {}) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/${body.enterprise_id}/subscribe`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/subscribe`,
    {
      method: 'get',
    }
  );
}

/* 创建订单 */
export async function CreateOrder(body = {},handleError) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/enterprise/${body.enterprise_id}/subscribe`,

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
    // `http://doc.goodrain.org/mock/18/enterprise/${body.enterprise_id}/orders`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/orders`,
    {
      method: 'get',
    }
  );
}

/* 获取企业订单详情 */
export async function queryEnterpriseOrderDetails(body = {},handleError) {
  return request(
    // `http://doc.goodrain.org/mock/18/enterprise/${body.enterprise_id}/orders/${body.order_id}`,
    `${apiconfig.baseUrl}/console/enterprise/${body.enterprise_id}/orders/${body.order_id}`,
    {
      method: 'get',
      handleError
    }
  );
}

/* 获取银行详情 */
export async function queryBankInfo(body = {}) {
  return request(
    // `http://doc.goodrain.org/mock/18/console/bankinfo`,
    `${apiconfig.baseUrl}/console/bank/info`,
    {
      method: 'get',
    }
  );
}

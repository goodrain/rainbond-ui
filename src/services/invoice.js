import request from '../utils/request';
import apiconfig from '../../config/api.config';

 /*
   查询发票详情
 */
export function getInvoiceInfo(body = {}){
	return request(apiconfig.baseUrl + `/console/receipts/${body.receipt_id}`, {
        method: 'get',
        params: body
    });
}

 /*
   提交发票申请
 */
export function submitApplyInvoice(body = {}){
	return request(apiconfig.baseUrl + `/console/receipts`, {
        method: 'post',
        data: body
    });
}


 /*
   确认发票申请
 */
export function confirmApplyInvoice(body = {}){
	return request(apiconfig.baseUrl + `/console/receipts/confirm`, {
        method: 'post',
        data: body
    });
}


 /*
   获取已申请发票记录
 */
export function getInovices(body = {}){
	return request(apiconfig.baseUrl + `/console/receipts`, {
        method: 'get',
        params: body
    });
}

 /*
   获取可以申请发票的订单
 */
export function getOrders(body = {}){
	return request(apiconfig.baseUrl + `/console/receipt-orders`, {
        method: 'get',
        params: body
    });
}
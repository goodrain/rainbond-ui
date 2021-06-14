import request from '../utils/request';

/* 获取企业数据备份记录 */
export async function loadBackups(body = {}) {
  return request(`/console/enterprise/${body.enterprise_id}/backups`, {
    method: 'get',
    noModels: body.noModels
  });
}

/* 新增数据备份 */
export async function createBackup(body = {}) {
  return request(`/console/enterprise/${body.enterprise_id}/backups`, {
    method: 'post'
  });
}

/* 移除数据备份 */
export async function removeBackup(body = {}) {
  return request(`/console/enterprise/${body.enterprise_id}/backups`, {
    method: 'delete',
    data: {
      name: body.name
    }
  });
}

/* 恢复数据 */
export async function recoverBackup(body = {}) {
  return request(`/console/enterprise/${body.enterprise_id}/recover`, {
    method: 'post',
    data: {
      name: body.name,
      password: body.password
    }
  });
}

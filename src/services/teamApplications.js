import apiconfig from '../../config/api.config';
import request from '../utils/request';
const { identity } = require('../utils/teamApplications');

const urlFor = user => `${apiconfig.baseUrl}/console/enterprises/${encodeURIComponent(identity(user).enterprise)}/team-applications`;
const call = (url, options) => request(url, { ...options, showMessage: false, handleError: error => { throw error; } });

export async function listTeamApplications({ user, scope = 'mine' }) {
  const list = [];
  for (let page = 1; ; page += 1) {
    const response = await call(urlFor(user), { method: 'get', params: { scope, page, page_size: 100 } });
    if (!response || !response.bean || !Array.isArray(response.bean.list)) throw new Error('workspace.unavailable');
    list.push(...response.bean.list);
    if (response.bean.list.length < 100 || list.length >= response.bean.total) return { bean: { list, total: list.length } };
  }
}

export async function submitTeamApplication({ user, values, previousId }) {
  return call(urlFor(user), { method: 'post', data: { ...values, previous_id: previousId || null } });
}

export async function reviewTeamApplication({ user, id, decision, comment }) {
  return call(`${urlFor(user)}/${encodeURIComponent(id)}/review`, { method: 'post', data: { decision, comment } });
}

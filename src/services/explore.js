import apiconfig from '../../config/api.config';
import request from '../utils/request';

const MARKET_ID = '859a51f9bb3b48b5bfd222e3bef56425';

// 获取应用市场列表
export async function fetchExploreApps(params = {}) {
  const { page, page_size, query, usedSort, timeSort, apptype } = params;
  return request(`/app-server/marketui/${MARKET_ID}/indexApps`, {
    method: 'get',
    params: {
      marketId: MARKET_ID,
      page,
      pageSize: page_size,
      usedSort,
      timeSort,
      apptype,
      query
    }
  });
}

// 获取应用详情
export async function fetchExploreAppDetail(params = {}) {
  const { app_id } = params;
  return request(`/app-server/marketui/apps/${app_id}/detail`, {
    method: 'get'
  });
}

// 获取应用分类
export async function fetchExploreCategories(params = {}) {
  return request(`/app-server/marketui/${MARKET_ID}/classifications`, {
    method: 'get',
    params: {
      marketId: MARKET_ID,
      ...params
    }
  });
}

// 获取应用标签
export async function fetchExploreTags(params = {}) {
  return request(`/app-server/api/v1/tags`, {
    method: 'get',
    params
  });
}

// 安装应用
export async function installExploreApp(params = {}) {
  const { app_id, ...rest } = params;
  return request(`/app-server/api/v1/apps/${app_id}/install`, {
    method: 'post',
    data: rest
  });
}

// 获取推荐应用
export async function fetchRecommendedApps() {
  return request(`/app-server/marketui/recommendedApps`, {
    method: 'get'
  });
}

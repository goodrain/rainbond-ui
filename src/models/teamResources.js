import {
  listNsResources,
  getNsResource,
  createNsResource,
  updateNsResource,
  deleteNsResource,
  listHelmReleases,
  installHelmRelease,
  previewHelmChart,
  uninstallHelmRelease,
  getHelmReleaseHistory,
  getHelmReleaseDetail,
  upgradeHelmRelease,
  rollbackHelmRelease,
} from '../services/teamResource';

const SUCCESS_CODE = 200;

const isBusinessSuccess = response =>
  response && (response._condition === SUCCESS_CODE || response.business_code === SUCCESS_CODE);

const buildBusinessError = (response, fallbackMessage) => {
  const responseData = (response && response.response_data) || {
    code: response && (response.business_code || response._condition),
    msg_show: response && response.msg_show,
    data: response || {},
  };
  const message = responseData.msg_show || fallbackMessage;
  const error = new Error(message);
  error.response = { data: responseData };
  error.msg_show = message;
  error.code = responseData.code;
  error.data = responseData;
  return error;
};

const normalizeSourceInfo = (sourceInfo = {}, release = {}) => ({
  source_type: sourceInfo.source_type || 'legacy',
  repo_name: sourceInfo.repo_name || '',
  repo_url: sourceInfo.repo_url || '',
  chart_name: sourceInfo.chart_name || release.chart || '',
  chart_version: sourceInfo.chart_version || release.chart_version || '',
  upgrade_mode: sourceInfo.upgrade_mode || (sourceInfo.source_type === 'store' ? 'store_locked' : 'manual_select'),
});

const normalizeHelmRelease = (release = {}) => {
  const chartMeta = (release.chart && release.chart.metadata) || {};
  const info = release.info || {};

  const normalized = {
    name: release.name || '',
    chart: typeof release.chart === 'string' ? release.chart : (chartMeta.name || ''),
    chart_version: release.chart_version || chartMeta.version || '',
    app_version: release.app_version || chartMeta.appVersion || '',
    status: release.status || info.status || '',
    version: release.version,
    namespace: release.namespace || '',
    updated: release.updated || info.last_deployed || '',
  };
  normalized.source_info = normalizeSourceInfo(release.source_info, normalized);
  return normalized;
};

const normalizeHelmReleaseDetail = (detail = {}) => {
  const summary = detail.summary || {};
  const normalizedSummary = {
    ...summary,
    source_info: normalizeSourceInfo(summary.source_info, summary),
  };
  return {
    summary: normalizedSummary,
    workloads: detail.workloads || [],
    services: detail.services || [],
    others: detail.others || [],
    history: detail.history || [],
  };
};

export default {
  namespace: 'teamResources',
  state: {
    resources: [],
    helmReleases: [],
    total: 0,
    resourceDetail: null,
    helmPreview: null,
    helmReleaseHistory: [],
    helmReleaseDetail: null,
  },
  effects: {
    *fetchResources({ payload }, { call, put }) {
      const res = yield call(listNsResources, payload);
      if (res && res.bean) {
        yield put({ type: 'save', payload: { resources: res.bean.list || [], total: res.bean.total || 0 } });
      }
    },
    *fetchConfigResources({ payload }, { call, put }) {
      const configMapsRes = yield call(listNsResources, { ...payload, resource: 'configmaps' });
      const secretsRes = yield call(listNsResources, { ...payload, resource: 'secrets' });
      const configMaps = (configMapsRes && configMapsRes.bean && configMapsRes.bean.list) || [];
      const secrets = (secretsRes && secretsRes.bean && secretsRes.bean.list) || [];
      const resources = [...configMaps, ...secrets];
      yield put({ type: 'save', payload: { resources, total: resources.length } });
    },
    *createResource({ payload, callback, handleError }, { call }) {
      const res = yield call(createNsResource, { ...payload, handleError });
      if (res && callback) callback(res);
    },
    *fetchResource({ payload, callback, handleError }, { call, put }) {
      try {
        const res = yield call(getNsResource, payload);
        if (res && res.bean) {
          yield put({ type: 'save', payload: { resourceDetail: res.bean } });
        }
        if (callback) callback(res && res.bean);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
    *updateResource({ payload, callback }, { call }) {
      const res = yield call(updateNsResource, payload);
      if (callback) callback(res);
    },
    *deleteResource({ payload, callback }, { call }) {
      const res = yield call(deleteNsResource, payload);
      if (callback) callback(res);
    },
    *fetchHelmReleases({ payload }, { call, put }) {
      const res = yield call(listHelmReleases, payload);
      if (isBusinessSuccess(res) && res.bean) {
        const helmReleases = (res.bean.list || []).map(normalizeHelmRelease);
        yield put({ type: 'save', payload: { helmReleases } });
      }
    },
    *installRelease({ payload, callback, handleError }, { call }) {
      try {
        const res = yield call(installHelmRelease, payload);
        if (!isBusinessSuccess(res)) {
          throw buildBusinessError(res, '安装失败');
        }
        if (callback) callback(res);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
    *previewHelmChart({ payload, callback, handleError }, { call, put }) {
      try {
        const res = yield call(previewHelmChart, payload);
        if (!isBusinessSuccess(res)) {
          throw buildBusinessError(res, 'Chart 检测失败');
        }
        if (res && res.bean) {
          yield put({ type: 'save', payload: { helmPreview: res.bean } });
        }
        if (callback) callback(res && res.bean);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
    *uninstallRelease({ payload, callback }, { call }) {
      const res = yield call(uninstallHelmRelease, payload);
      if (isBusinessSuccess(res) && callback) callback(res);
    },
    *fetchHelmReleaseHistory({ payload, callback, handleError }, { call, put }) {
      try {
        const res = yield call(getHelmReleaseHistory, payload);
        if (!isBusinessSuccess(res)) {
          throw buildBusinessError(res, '获取回滚历史失败');
        }
        const history = (res && res.bean && res.bean.list) || [];
        yield put({ type: 'save', payload: { helmReleaseHistory: history } });
        if (callback) callback(history);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
    *fetchHelmReleaseDetail({ payload, callback, handleError }, { call, put }) {
      try {
        const res = yield call(getHelmReleaseDetail, payload);
        if (!isBusinessSuccess(res)) {
          throw buildBusinessError(res, '获取 Helm 详情失败');
        }
        const detail = normalizeHelmReleaseDetail((res && res.bean) || {});
        yield put({ type: 'save', payload: { helmReleaseDetail: detail } });
        if (callback) callback(detail);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
    *upgradeRelease({ payload, callback, handleError }, { call }) {
      try {
        const res = yield call(upgradeHelmRelease, payload);
        if (!isBusinessSuccess(res)) {
          throw buildBusinessError(res, '升级失败');
        }
        if (callback) callback(res);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
    *rollbackRelease({ payload, callback, handleError }, { call }) {
      try {
        const res = yield call(rollbackHelmRelease, payload);
        if (!isBusinessSuccess(res)) {
          throw buildBusinessError(res, '回滚失败');
        }
        if (callback) callback(res);
      } catch (e) {
        if (handleError) handleError(e);
      }
    },
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};

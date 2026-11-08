import { message } from 'antd';
import { formatMessage } from '@/utils/intl';
import { listDeliveryTemplates, loadDeliveryComponents, loadDeliveryConfig, loadDeliveryMarkets, publishDeliveryTemplate, loadTemplateChanges, deleteDeliveryVersion } from '../services/templateDelivery';
import { startTemplateSync, getTemplateSync, retryTemplateSync, cancelTemplateSync, loadTemplateSyncLogs } from '../services/templateSync';

export default {
  namespace: 'templateDelivery',
  state: { records: [], activeSyncs: [], failed: false },
  effects: {
    *synchronize({ payload, callback, onError }, { call }) {
      try {
        const operations = { start: startTemplateSync, status: getTemplateSync, retry: retryTemplateSync, cancel: cancelTemplateSync, logs: loadTemplateSyncLogs };
        if (!operations[payload.operation]) throw new Error('delivery.syncUnavailable');
        const response = yield call(operations[payload.operation], payload);
        if (!response || !response.bean) throw new Error('delivery.syncUnavailable');
        if (payload.operation !== 'logs') {
          const job = response.bean;
          if (!job.id || !['syncing', 'success', 'failed', 'cancelled'].includes(job.status) || !Array.isArray(job.components) || !job.components.length ||
            job.components.some(item => !item.service_id || !['queued', 'syncing', 'success', 'failed'].includes(item.status)) ||
            payload.syncId && job.id !== payload.syncId || job.status === 'success' && job.components.some(item => item.status !== 'success')) {
            throw new Error('delivery.syncUnavailable');
          }
        }
        if (callback) callback(response.bean);
      } catch (error) {
        if (onError) onError(error && /^delivery\./.test(error.message) ? error.message.replace(/^delivery\./, '') : 'syncUnavailable');
      }
    },
    *changes({ payload, callback, onError }, { call }) {
      try {
        const response = yield call(loadTemplateChanges, payload);
        if (!response || !response.bean || !Array.isArray(response.bean.checks) || response.bean.checks.some(check =>
          !check.baseline_id || !['changed', 'unchanged', 'unknown'].includes(check.status) || !Array.isArray(check.details) || !check.summary ||
          check.details.some(item => !item.service_id || !['added', 'updated', 'removed'].includes(item.type) || !Array.isArray(item.fields)))) throw new Error();
        if (callback) callback(response.bean);
      } catch (error) { if (onError) onError(error); }
    },
    *deleteVersion({ payload, callback, onError }, { call }) {
      try {
        const response = yield call(deleteDeliveryVersion, payload);
        if (!response || !response.bean) throw new Error('delivery.unavailable');
        message.success(formatMessage({ id: 'delivery.versionDeleted' }));
        if (callback) callback();
      } catch (error) { message.error(formatMessage({ id: error && /^delivery\./.test(error.message) ? error.message : 'delivery.unavailable' }));if (onError) onError(error); }
    },
    records: [function* ({ payload, callback }, { call, put }) {
      yield put({ type: 'save', payload: { records: [], failed: false } });
      try {
        const response = yield call(listDeliveryTemplates, payload);
        if (!response || !response.bean || !Array.isArray(response.bean.items)) throw new Error();
        yield put({ type: 'save', payload: { records: response.bean.items, activeSyncs: response.bean.active_syncs || [] } });
        if (callback) callback(response.bean.items, response.bean.active_syncs || []);
      } catch (error) { yield put({ type: 'save', payload: { failed: true } }); }
    }, { type: 'takeLatest' }],
    *load({ payload, callback, onError }, { call }) {
      try {
        const operation = payload.kind === 'config' ? loadDeliveryConfig : payload.kind === 'markets' ? loadDeliveryMarkets : loadDeliveryComponents;
        const response = yield call(operation, payload.kind === 'config' ? payload : payload.scope);
        if (!response || !response.bean) throw new Error('delivery.unavailable');
        if (callback) callback(response.bean);
      } catch (error) { if (onError) onError(error); }
    },
    *publish({ payload, callback, onError }, { call }) {
      try {
        const response = yield call(publishDeliveryTemplate, payload);
        if (!response || !response.bean) throw new Error('delivery.unavailable');
        message.success(formatMessage({ id: 'delivery.publishSuccess' }));
        if (callback) callback(response.bean);
      } catch (error) {
        const key = error && /^delivery\./.test(error.message) ? error.message : 'delivery.publishFailed';
        if (onError) onError(key);
      }
    }
  },
  reducers: { save(state, { payload }) { return { ...state, ...payload }; }, reset() { return { records: [], activeSyncs: [], failed: false }; } }
};

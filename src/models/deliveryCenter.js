import { message } from 'antd';
import { formatMessage } from '@/utils/intl';
import { loadDeliveryCenter, actOnDelivery, retryDeliveryTask, loadDeliveryUpgrade } from '../services/deliveryCenter';
export default {
  namespace: 'deliveryCenter', state: {},
  effects: {
    *upgrade({ payload, callback, onError }, { call }) {
      try {
        const response = yield call(loadDeliveryUpgrade, payload);
        if (!response || !response.bean) throw new Error('workflow.unavailable');
        if (callback) callback(response.bean);
      } catch (error) { if (onError) onError(error); }
    },
    *retry({ payload, callback }, { call }) {
      const response = yield call(retryDeliveryTask, payload);
      if (response && response.bean) {
        message.success(formatMessage({ id: 'workflow.saved' }));
        if (callback) callback();
      }
    },
    *load({ payload, callback, onError }, { call }) {
      try {
        const response = yield call(loadDeliveryCenter, payload);
        if (!response || !response.bean) throw new Error('workflow.unavailable');
        if (callback) callback(response.bean);
      } catch (error) { if (onError) onError(error); }
    },
    *act({ payload, callback, onError }, { call }) {
      try {
        const response = yield call(actOnDelivery, payload);
        if (!response || !response.bean) throw new Error('workflow.unavailable');
        message.success(formatMessage({ id: 'workflow.saved' }));
        if (callback) callback(response.bean);
      } catch (error) {
        message.error(formatMessage({ id: error && /^workflow\./.test(error.message) ? error.message : 'workflow.unavailable' }));
        if (onError) onError(error);
      }
    }
  }
};

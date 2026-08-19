import { getRainskillsAccess } from '../services/rainskillsAccess';

export default {
  namespace: 'rainskillsAccess',

  state: {},

  effects: {
    *check({ callback }, { call }) {
      try {
        const response = yield call(getRainskillsAccess);
        if (callback) {
          callback(response);
        }
      } catch (error) {
        if (callback) {
          callback(null, error);
        }
      }
    }
  }
};

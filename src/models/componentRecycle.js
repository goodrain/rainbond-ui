import { recycleRequest } from '../services/componentRecycle';

function* operate(action, { call }, operation) {
  const active = () => typeof action.shouldApply === 'function' && action.shouldApply();
  if (!active()) return;
  let error;
  let response;
  try {
    response = yield call(recycleRequest, action.payload, operation, value => { error = value; }, active);
    if (!error && (Number(response?.status_code) !== 200 || Number(response?.business_code) !== 200)) error = {};
    if (!error && operation === 'list' && (!Array.isArray(response.list) || !Number.isInteger(response.total) || response.total < 0)) error = {};
    if (!error && operation !== 'list' && response?.bean?.service_id !== action.payload.service_id) error = {};
  } catch (_) { error = {}; }
  if (!active()) return;
  if (error) {
    if (action.handleError) action.handleError(error);
  } else if (action.callback) {
    action.callback(operation === 'list' ? { items: response.list, total: response.total } : response.bean);
  }
}

export default {
  namespace: 'componentRecycle', state: {},
  effects: {
    *list(action, helpers) { yield* operate(action, helpers, 'list'); },
    *restore(action, helpers) { yield* operate(action, helpers, 'restore'); },
    *purge(action, helpers) { yield* operate(action, helpers, 'purge'); }
  }
};

import { getVMSnapshots, getVMSnapshot } from '../services/vmSnapshots';
import { snapshotReadError, readSnapshotList, readSnapshotDetail } from '../utils/vmSnapshotRead';

function* read(action, { call }, service, project) {
  const active = () => {
    try { return typeof action.shouldApply === 'function' && action.shouldApply(); } catch (_) { return false; }
  };
  if (!active()) return;
  let failure;
  let data;
  try {
    const response = yield call(service, action.payload, error => {
      if (active()) failure = snapshotReadError(error);
    }, active);
    if (!active()) return;
    if (failure) {
      if (action.handleError) action.handleError(failure);
      return;
    }
    if (Number(response?.status_code) !== 200 || Number(response?.business_code) !== 200) {
      failure = snapshotReadError(response);
    } else data = project(response, action.payload);
  } catch (_) {
    failure = { kind: 'failed', status: 502, code: 'vm_snapshot_read_failed', retryable: true };
  }
  if (!active()) return;
  if (failure) { if (action.handleError) action.handleError(failure); }
  else if (action.callback) action.callback(data);
}

// Read results live only in the mounted, context-bound panel, never a global list.
export default {
  namespace: 'vmSnapshotReads',
  state: {},
  effects: {
    *list(action, effects) { yield* read(action, effects, getVMSnapshots, readSnapshotList); },
    *detail(action, effects) { yield* read(action, effects, getVMSnapshot, readSnapshotDetail); }
  }
};

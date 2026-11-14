import { getVMSnapshots, getVMSnapshot, getVMExistingSnapshotCapability, enqueueVMSnapshot, getVMSnapshotJob } from '../services/vmSnapshots';
import { snapshotReadError, readSnapshotList, readSnapshotDetail } from '../utils/vmSnapshotRead';
import { readExistingSnapshotCapability } from '../utils/vmExistingSnapshotCapability';
import { readSnapshotEnqueue, readSnapshotJob, snapshotPrepareError } from '../utils/vmSnapshotCreate';

function* enqueue(action, { call }, readback = false) {
  const active = () => {
    try { return typeof action.shouldApply === 'function' && action.shouldApply(); } catch (_) { return false; }
  };
  if (!active()) return;
  let failure;
  let data;
  try {
    const response = yield call(readback ? getVMSnapshotJob : enqueueVMSnapshot, action.payload, error => {
      if (active()) failure = snapshotPrepareError(error);
    }, active);
    if (!active()) return;
    if (!failure) data = (readback ? readSnapshotJob : readSnapshotEnqueue)(response, action.payload);
  } catch (_) { failure = { kind: 'unknown', retryable: false }; }
  if (!active()) return;
  if (failure) { if (action.handleError) action.handleError(failure); }
  else if (action.callback) action.callback(data);
}

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
    *detail(action, effects) { yield* read(action, effects, getVMSnapshot, readSnapshotDetail); },
    *capability(action, effects) { yield* read(action, effects, getVMExistingSnapshotCapability, readExistingSnapshotCapability); },
    *enqueue(action, effects) { yield* enqueue(action, effects); },
    *jobStatus(action, effects) { yield* enqueue(action, effects, true); }
  }
};

import { getVMSnapshots, getVMSnapshot, getVMExistingSnapshotCapability, enqueueVMSnapshot, getVMSnapshotJob,
  startVMSnapshotRestore, getVMSnapshotRestore, getActiveVMSnapshotJob, retryVMSnapshotJob } from '../services/vmSnapshots';
import { snapshotReadError, readSnapshotList, readSnapshotDetail } from '../utils/vmSnapshotRead';
import { readExistingSnapshotCapability } from '../utils/vmExistingSnapshotCapability';
import { readSnapshotEnqueue, readSnapshotJob, readActiveSnapshot, snapshotPrepareError } from '../utils/vmSnapshotCreate';
import { readVMRestore, vmRestoreError } from '../utils/vmSnapshotRestore';

function* enqueue(action, { call }, readback = false, retry = false) {
  const active = () => {
    try { return typeof action.shouldApply === 'function' && action.shouldApply(); } catch (_) { return false; }
  };
  if (!active()) return;
  let failure;
  let data;
  try {
    const response = yield call(readback ? getVMSnapshotJob : retry ? retryVMSnapshotJob : enqueueVMSnapshot, action.payload, error => {
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

function* restore(action, { call }, readback) {
  const active = () => {
    try { return typeof action.shouldApply === 'function' && action.shouldApply(); } catch (_) { return false; }
  };
  if (!active()) return;
  let failure;
  let data;
  try {
    const response = yield call(readback ? getVMSnapshotRestore : startVMSnapshotRestore, action.payload, error => {
      if (active()) failure = vmRestoreError(error);
    }, active);
    if (!active()) return;
    if (!failure) data = readVMRestore(response, action.payload, !readback);
  } catch (_) { failure = { kind: 'failed', status: 502, code: 'vm_snapshot_read_failed', retryable: false }; }
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
    *jobStatus(action, effects) { yield* enqueue(action, effects, true); },
    *activeSnapshot(action, effects) { yield* read(action, effects, getActiveVMSnapshotJob, readActiveSnapshot); },
    *retrySnapshot(action, effects) { yield* enqueue(action, effects, false, true); },
    *startRestore(action, effects) { yield* restore(action, effects, false); },
    *restoreStatus(action, effects) { yield* restore(action, effects, true); }
  }
};

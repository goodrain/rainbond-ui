import { applyDemoAction } from '../pages/VirtualMachineDemo/state';
import {
  bindWorkflowData,
  emptyWorkflowData
} from '../pages/VirtualMachineDemo/liveContext';
import { getDetail } from '../services/app';
import {
  isVmWorkflowDemoEnabled,
  isVmWorkflowComponent
} from '../utils/vmWorkflowDemo';

const STORAGE_KEY = 'rainbond.vm.workflow-demo.v2';
function initialContexts() {
  if (!isVmWorkflowDemoEnabled()) return {};
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return saved &&
      saved.version === 2 &&
      saved.contexts &&
      typeof saved.contexts === 'object'
      ? saved.contexts
      : {};
  } catch (_) {
    return {};
  }
}
function persist(contexts) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, contexts })
    );
  } catch (_) {
    /* in-memory preview remains available */
  }
}
const vmActions = [
  'create',
  'power',
  'hardware',
  'network',
  'finish',
  'addDisk',
  'detach',
  'attach',
  'deleteDisk',
  'snapshot',
  'restore',
  'integration',
  'initialization',
  'external',
  'scenario'
];

export default {
  namespace: 'vmDemo',
  state: { contexts: initialContexts() },
  effects: {
    *bind({ payload, callback }, { put, select }) {
      if (!isVmWorkflowDemoEnabled() || !payload.scope) return;
      const contexts = yield select((state) => state.vmDemo.contexts || {});
      const next = bindWorkflowData(
        contexts[payload.scope],
        payload.components,
        payload.detail
      );
      if (payload.resetId && payload.detail) {
        const fresh = bindWorkflowData(null, [], payload.detail).components[0];
        if (fresh && fresh.id === payload.resetId)
          next.components = next.components.map((c) =>
            c.id === fresh.id ? fresh : c
          );
      }
      const updated = { ...contexts, [payload.scope]: next };
      yield put({ type: 'save', payload: updated });
      persist(updated);
      if (callback) callback(next);
    },
    *change({ payload, callback }, { put, select }) {
      if (
        !isVmWorkflowDemoEnabled() ||
        !payload.scope ||
        !vmActions.includes(payload.type)
      ) {
        if (callback) callback({ ok: false, error: 'invalidOperation' });
        return;
      }
      try {
        const contexts = yield select((state) => state.vmDemo.contexts || {});
        const next = applyDemoAction(
          contexts[payload.scope] || emptyWorkflowData(),
          payload
        );
        const updated = { ...contexts, [payload.scope]: next };
        yield put({ type: 'save', payload: updated });
        persist(updated);
        if (callback) callback({ ok: true, data: next });
      } catch (error) {
        if (callback) callback({ ok: false, error: error.message });
      }
    },
    *resolveGraphAction({ payload, callback }, { call }) {
      if (!isVmWorkflowDemoEnabled()) {
        callback({ vm: null });
        return;
      }
      try {
        for (const alias of payload.aliases) {
          const response = yield call(
            getDetail,
            { team_name: payload.team, app_alias: alias },
            () => {}
          );
          if (!response || !response.bean || !response.bean.service)
            throw new Error('unresolved');
          if (isVmWorkflowComponent(response.bean)) {
            callback({ vm: alias });
            return;
          }
        }
        callback({ vm: null });
      } catch (_) {
        callback({ error: true });
      }
    }
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, contexts: payload };
    }
  }
};

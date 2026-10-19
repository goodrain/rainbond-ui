import {
  fetchPlatformClusterOverview,
  fetchPlatformOverviewMetrics,
  fetchPlatformOverviewRuntime,
  fetchPlatformOverviewShell
} from '../services/api';
import effectFactory from '../utils/platformOverviewEffect';
import overviewState from '../utils/platformOverviewState';

export default {
  namespace: 'platformOverview',
  state: overviewState.createInitialState(),
  effects: {
    fetchShell: effectFactory.createFetchEffect('shell', fetchPlatformOverviewShell),
    fetchRuntime: effectFactory.createFetchEffect('runtime', fetchPlatformOverviewRuntime),
    fetchCluster: effectFactory.createFetchEffect('cluster', fetchPlatformClusterOverview),
    fetchMetrics: effectFactory.createFetchEffect('metrics', fetchPlatformOverviewMetrics)
  },
  reducers: {
    begin(state, { payload }) {
      return overviewState.beginState(state, payload);
    },
    resolve(state, { payload }) {
      return overviewState.resolveState(state, payload);
    },
    reject(state, { payload }) {
      return overviewState.rejectState(state, payload);
    },
    reset() {
      return overviewState.createInitialState();
    }
  }
};

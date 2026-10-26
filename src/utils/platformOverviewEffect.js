const requestGuard = require('./platformOverviewRequestGuard');
const overviewState = require('./platformOverviewState');

let requestSequence = 0;

function createFetchEffect(section, service) {
  return function* fetchSection({ payload = {}, callback }, { call, put, select }) {
    requestSequence += 1;
    const requestId = requestGuard.createRequestId(section, requestSequence);
    const context = requestGuard.requestContext(section, payload);
    if (!payload.force && overviewState.cacheName(section)) {
      const cached = yield select(state =>
        overviewState.readCacheEntry(state.platformOverview, section, context)
      );
      if (cached) {
        yield put({ type: 'begin', payload: { section, requestId, context } });
        yield put({
          type: 'resolve',
          payload: {
            section,
            requestId,
            context,
            data: cached.data,
            receivedAt: cached.receivedAt
          }
        });
        if (callback) callback(cached.data);
        return;
      }
    }
    yield put({ type: 'begin', payload: { section, requestId, context } });
    try {
      const key = requestGuard.requestKey(section, payload);
      const response = yield call(requestGuard.runDeduped, key, () => service(payload));
      if (!response || !response.bean) throw new Error('invalid platform overview response');
      const receivedAt = Date.now();
      yield put({
        type: 'resolve',
        payload: { section, requestId, context, data: response.bean, receivedAt }
      });
      if (callback) callback(response.bean);
    } catch (error) {
      yield put({
        type: 'reject',
        payload: { section, requestId, error: requestGuard.getErrorMessage(error) }
      });
    }
  };
}

function resetRequestSequence() {
  requestSequence = 0;
}

module.exports = { createFetchEffect, resetRequestSequence };

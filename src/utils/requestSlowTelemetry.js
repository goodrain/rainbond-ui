function trackSlowRequestLifecycle(requestPromise, options = {}) {
  let completed = false;

  function finish(outcome) {
    if (completed) {
      return;
    }
    completed = true;
    if (typeof options.finish !== 'function') {
      return;
    }
    try {
      options.finish(options.context, outcome);
    } catch (error) {
      // Telemetry must not change request behavior.
    }
  }

  return requestPromise
    .then(response => {
      finish({ status: response && response.status });
      return typeof options.checkStatus === 'function'
        ? options.checkStatus(response)
        : response;
    })
    .catch(error => {
      let cancelled = false;
      try {
        cancelled = typeof options.isCancel === 'function' && options.isCancel(error) === true;
      } catch (cancelError) {
        cancelled = false;
      }
      finish({
        status: error && error.response && error.response.status,
        cancelled
      });
      throw error;
    });
}

module.exports = {
  trackSlowRequestLifecycle
};

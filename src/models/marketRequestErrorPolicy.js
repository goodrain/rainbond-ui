export function createMarketRequestErrorHandlers(payload, onError) {
  const silent = !!(payload && payload.silent);
  let handled = false;

  const reportError = error => {
    if (handled) {
      return;
    }
    handled = true;
    if (onError) {
      onError(error);
    }
  };

  return {
    requestHandleError: silent ? reportError : undefined,
    handleMissingResponse: () => {
      if (silent || onError) {
        reportError();
      }
    },
    handleException: error => {
      if (silent || onError) {
        reportError(error);
      }
      if (silent) {
        return;
      }
      throw error;
    }
  };
}

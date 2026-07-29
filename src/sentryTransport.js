function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function resolveSendBeacon(dependencies) {
  if (hasOwn(dependencies, 'sendBeacon')) {
    return dependencies.sendBeacon;
  }
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return null;
  }
  return function(url, body) {
    return navigator.sendBeacon(url, body);
  };
}

function resolveFetch(dependencies) {
  if (hasOwn(dependencies, 'fetch')) {
    return dependencies.fetch;
  }
  return typeof fetch === 'function' ? fetch : null;
}

function sendEnvelope(client, event, options = {}, dependencies = {}) {
  if (!client || !event) {
    return;
  }
  const envelopeUrl = options.direct ? client.directEnvelopeUrl : client.envelopeUrl;
  if (!envelopeUrl) {
    return;
  }

  let payload;
  try {
    payload = [
      JSON.stringify({
        event_id: event.event_id,
        sent_at: new Date().toISOString(),
        dsn: client.dsn
      }),
      JSON.stringify({
        type: options.itemType || 'event',
        content_type: 'application/json'
      }),
      JSON.stringify(event)
    ].join('\n');
  } catch (error) {
    return;
  }

  const sendBeacon = resolveSendBeacon(dependencies);
  if (!options.preferFetch && typeof sendBeacon === 'function') {
    try {
      if (sendBeacon(envelopeUrl, payload)) {
        return;
      }
    } catch (error) {
      // Fall through to the single fetch attempt.
    }
  }

  const fetchTransport = resolveFetch(dependencies);
  if (typeof fetchTransport !== 'function') {
    return;
  }
  try {
    const request = fetchTransport(envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: payload,
      keepalive: true
    });
    if (request && typeof request.catch === 'function') {
      request.catch(() => {});
    }
  } catch (error) {
    // Telemetry transport must not affect application requests.
  }
}

module.exports = {
  sendEnvelope
};

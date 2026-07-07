const normalizeMessage = message => (message || '').trim();

const getPreflightDisplay = (preflight = {}) => {
  const summary = normalizeMessage(preflight.summary);
  const checks = Array.isArray(preflight.checks) ? preflight.checks : [];
  const seen = {};
  const messages = [];

  checks.forEach(item => {
    if (!item || (item.status !== 'block' && item.status !== 'warning')) {
      return;
    }
    const message = normalizeMessage(item.message);
    if (!message || message === summary || seen[message]) {
      return;
    }
    seen[message] = true;
    messages.push(message);
  });

  if (!summary && messages.length === 0 && preflight.msg_show) {
    messages.push(normalizeMessage(preflight.msg_show));
  }

  return {
    summary,
    messages: messages.slice(0, 4)
  };
};

module.exports = {
  getPreflightDisplay
};

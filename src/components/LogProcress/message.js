function extractLogMessageText(message) {
  if (!message) {
    return '';
  }

  if (typeof message === 'string') {
    return message;
  }

  if (typeof message.message === 'string' && message.message) {
    return message.message;
  }

  let summary = '';
  if (message.id) {
    summary += `${message.id}:`;
  }
  summary += message.status || '';
  summary += message.progress || '';
  if (summary) {
    return summary;
  }

  if (typeof message.stream === 'string' && message.stream) {
    return message.stream;
  }

  if (typeof message.error === 'string' && message.error) {
    return message.error;
  }

  return '';
}

module.exports = {
  extractLogMessageText
};
module.exports.default = module.exports;

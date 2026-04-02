function runCloseCallback(callback) {
  if (typeof callback === 'function') {
    callback();
  }
}

module.exports = {
  runCloseCallback
};

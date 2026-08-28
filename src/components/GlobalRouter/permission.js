function isSourceRoute(path) {
  if (typeof path !== 'string') {
    return false;
  }

  const pathname = path.split(/[?#]/)[0];
  return pathname.split('/').includes('source');
}

module.exports = {
  isSourceRoute
};

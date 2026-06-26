function getInstanceDisplayStatus(podStatus) {
  if (podStatus === 'UNHEALTHY') {
    return 'checking';
  }
  return podStatus;
}

module.exports = {
  getInstanceDisplayStatus
};

const RESOURCE_CHECK_SOURCES = [
  'source_code',
  'package_build',
  'docker_image',
  'docker_run'
];

const normalizeNonNegativeNumber = value => {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : null;
};

const normalizeAvailableResources = response => {
  const source = response && (response.bean || response);
  if (!source) {
    return null;
  }
  const freeCpu = normalizeNonNegativeNumber(source.free_cpu);
  const freeMemory = normalizeNonNegativeNumber(source.free_memory);
  if (freeCpu === null || freeMemory === null) {
    return null;
  }
  return {
    freeCpu,
    freeMemory
  };
};

const shouldCheckAvailableResources = appDetail => {
  const service = appDetail && appDetail.service;
  const serviceSource = appDetail && (
    appDetail.service_source || (service && service.service_source)
  );
  return !!(
    service &&
    service.extend_method !== 'vm' &&
    RESOURCE_CHECK_SOURCES.indexOf(serviceSource) !== -1
  );
};

const evaluateResourceAvailability = (requirements = {}, snapshot) => {
  const requiredCpu = normalizeNonNegativeNumber(requirements.min_cpu);
  const requiredMemory = normalizeNonNegativeNumber(requirements.min_memory);
  if (
    requiredCpu === null ||
    requiredMemory === null ||
    !snapshot ||
    normalizeNonNegativeNumber(snapshot.freeCpu) === null ||
    normalizeNonNegativeNumber(snapshot.freeMemory) === null
  ) {
    return {
      status: 'invalid',
      shortages: []
    };
  }

  const shortages = [];
  if (requiredCpu > 0 && requiredCpu > snapshot.freeCpu) {
    shortages.push({
      key: 'cpu',
      label: 'CPU',
      unit: 'm',
      required: requiredCpu,
      available: snapshot.freeCpu,
      missing: requiredCpu - snapshot.freeCpu
    });
  }
  if (requiredMemory > 0 && requiredMemory > snapshot.freeMemory) {
    shortages.push({
      key: 'memory',
      label: '内存',
      unit: 'Mi',
      required: requiredMemory,
      available: snapshot.freeMemory,
      missing: requiredMemory - snapshot.freeMemory
    });
  }

  return {
    status: shortages.length > 0 ? 'insufficient' : 'sufficient',
    shortages
  };
};

module.exports = {
  evaluateResourceAvailability,
  normalizeAvailableResources,
  shouldCheckAvailableResources
};

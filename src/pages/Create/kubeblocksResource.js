const MIN_CPU_SLIDER_VALUE = 3;
const MIN_MEMORY_SLIDER_VALUE = 3;
const DEFAULT_CPU_MILLICORES = 500;
const DEFAULT_MEMORY_MB = 512;

const CPU_SLIDER_TO_MILLICORES = {
  0: 500,
  1: 500,
  2: 500,
  3: 500,
  4: 1000,
  5: 2000,
  6: 4000,
  7: 8000,
  8: 16000
};

const MEMORY_SLIDER_TO_MB = {
  0: 512,
  1: 512,
  2: 512,
  3: 512,
  4: 1024,
  5: 2048,
  6: 4096,
  7: 8192,
  8: 16384,
  9: 32768
};

function parsePositiveInteger(value, fallback) {
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

function parseKubeBlocksCpuValue(value) {
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return DEFAULT_CPU_MILLICORES;
  }

  if (numeric >= 0 && numeric <= 8) {
    return CPU_SLIDER_TO_MILLICORES[Math.max(numeric, MIN_CPU_SLIDER_VALUE)] || DEFAULT_CPU_MILLICORES;
  }

  return Math.max(parsePositiveInteger(numeric, DEFAULT_CPU_MILLICORES), DEFAULT_CPU_MILLICORES);
}

function parseKubeBlocksMemoryValue(value) {
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return DEFAULT_MEMORY_MB;
  }

  if (numeric >= 0 && numeric <= 9) {
    return MEMORY_SLIDER_TO_MB[Math.max(numeric, MIN_MEMORY_SLIDER_VALUE)] || DEFAULT_MEMORY_MB;
  }

  return Math.max(parsePositiveInteger(numeric, DEFAULT_MEMORY_MB), DEFAULT_MEMORY_MB);
}

function formatKubeBlocksCpuValue(cpuMillicores) {
  const cpuMap = {
    100: '100m',
    250: '250m',
    500: '500m',
    1000: '1',
    2000: '2',
    4000: '4',
    8000: '8',
    16000: '16'
  };

  return cpuMap[Math.max(parsePositiveInteger(cpuMillicores, DEFAULT_CPU_MILLICORES), DEFAULT_CPU_MILLICORES)] || '500m';
}

function formatKubeBlocksMemoryValue(memoryMB) {
  const memoryMap = {
    128: '128Mi',
    256: '256Mi',
    512: '512Mi',
    1024: '1Gi',
    2048: '2Gi',
    4096: '4Gi',
    8192: '8Gi',
    16384: '16Gi',
    32768: '32Gi'
  };

  return memoryMap[Math.max(parsePositiveInteger(memoryMB, DEFAULT_MEMORY_MB), DEFAULT_MEMORY_MB)] || '512Mi';
}

module.exports = {
  formatKubeBlocksCpuValue,
  formatKubeBlocksMemoryValue,
  parseKubeBlocksCpuValue,
  parseKubeBlocksMemoryValue
};

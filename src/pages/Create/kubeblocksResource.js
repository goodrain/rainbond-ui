const CPU_SLIDER_TO_MILLICORES = {
  0: 100,
  1: 100,
  2: 250,
  3: 500,
  4: 1000,
  5: 2000,
  6: 4000,
  7: 8000,
  8: 16000
};

const MEMORY_SLIDER_TO_MB = {
  0: 128,
  1: 128,
  2: 256,
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
    return 1000;
  }

  if (numeric >= 0 && numeric <= 8) {
    return CPU_SLIDER_TO_MILLICORES[numeric] || 1000;
  }

  return parsePositiveInteger(numeric, 1000);
}

function parseKubeBlocksMemoryValue(value) {
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return 1024;
  }

  if (numeric >= 0 && numeric <= 9) {
    return MEMORY_SLIDER_TO_MB[numeric] || 1024;
  }

  return parsePositiveInteger(numeric, 1024);
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

  return cpuMap[parsePositiveInteger(cpuMillicores, 1000)] || '1';
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

  return memoryMap[parsePositiveInteger(memoryMB, 1024)] || '1Gi';
}

module.exports = {
  formatKubeBlocksCpuValue,
  formatKubeBlocksMemoryValue,
  parseKubeBlocksCpuValue,
  parseKubeBlocksMemoryValue
};

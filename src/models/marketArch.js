export function normalizeMarketArch(rawArch, clusterArchInfo) {
  if (typeof rawArch === 'string') {
    return rawArch.trim();
  }

  if (Array.isArray(rawArch)) {
    const archList = rawArch.filter(Boolean);
    return archList.length === 1 ? archList[0] : '';
  }

  if (typeof clusterArchInfo === 'string') {
    return clusterArchInfo.trim();
  }

  if (Array.isArray(clusterArchInfo)) {
    const archList = clusterArchInfo.filter(Boolean);
    return archList.length === 1 ? archList[0] : '';
  }

  return '';
}

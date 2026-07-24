function normalizePath(fileKey) {
  return (fileKey || '').replace(/\\/g, '/');
}

function getPathSegments(fileKey) {
  return normalizePath(fileKey).split('/').filter(Boolean);
}

function getFilePriority(fileKey) {
  const normalized = normalizePath(fileKey);
  const segments = getPathSegments(normalized);
  const basename = segments[segments.length - 1] || '';
  const chartsIndex = segments.indexOf('charts');

  return {
    exactValuesName: basename === 'values.yaml' ? 0 : 1,
    nestedDependency: chartsIndex > -1 ? 1 : 0,
    depth: segments.length || Number.MAX_SAFE_INTEGER,
    normalized,
  };
}

function compareHelmValuesFileKeys(left, right) {
  const leftPriority = getFilePriority(left);
  const rightPriority = getFilePriority(right);

  if (leftPriority.exactValuesName !== rightPriority.exactValuesName) {
    return leftPriority.exactValuesName - rightPriority.exactValuesName;
  }
  if (leftPriority.nestedDependency !== rightPriority.nestedDependency) {
    return leftPriority.nestedDependency - rightPriority.nestedDependency;
  }
  if (leftPriority.depth !== rightPriority.depth) {
    return leftPriority.depth - rightPriority.depth;
  }
  return leftPriority.normalized.localeCompare(rightPriority.normalized);
}

function getSortedHelmValuesFileKeys(valuesMap) {
  return Object.keys(valuesMap || {}).sort(compareHelmValuesFileKeys);
}

function getPreferredHelmValuesFileKey(valuesMap) {
  return getSortedHelmValuesFileKeys(valuesMap)[0] || '';
}

function getBrowserBase64Decoder() {
  if (typeof window === 'undefined' || typeof window.atob !== 'function') {
    return null;
  }
  return window.atob.bind(window);
}

function decodeBase64Text(value, decodeBase64) {
  if (!value) {
    return '';
  }
  try {
    const decoder = decodeBase64 || getBrowserBase64Decoder();
    if (!decoder) {
      return '';
    }
    const binary = decoder(value);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return '';
  }
}

module.exports = {
  decodeBase64Text,
  getPreferredHelmValuesFileKey,
  getSortedHelmValuesFileKeys,
};

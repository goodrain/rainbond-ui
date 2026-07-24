const yaml = require('js-yaml');

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

function isRootHelmValuesFileKey(fileKey) {
  const segments = getPathSegments(fileKey);
  const basename = segments[segments.length - 1] || '';
  return basename === 'values.yaml'
    && segments.indexOf('charts') === -1
    && segments.length <= 2;
}

function isHelmChartValuesFileKey(fileKey) {
  const segments = getPathSegments(fileKey);
  const basename = segments[segments.length - 1] || '';
  if (basename !== 'values.yaml') {
    return false;
  }
  const chartsIndex = segments.lastIndexOf('charts');
  if (chartsIndex === -1) {
    return segments.length <= 2;
  }
  return chartsIndex === segments.length - 3;
}

function getSortedHelmValuesFileKeys(valuesMap) {
  return Object.keys(valuesMap || {})
    .filter(isHelmChartValuesFileKey)
    .sort(compareHelmValuesFileKeys);
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

function decodeHelmValuesFiles(valuesMap, decodeBase64) {
  return getSortedHelmValuesFileKeys(valuesMap).reduce((drafts, fileKey) => ({
    ...drafts,
    [fileKey]: decodeBase64Text(valuesMap[fileKey], decodeBase64),
  }), {});
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseValuesMapping(value, fileKey) {
  try {
    const parsed = yaml.load(value || '') || {};
    if (!isPlainObject(parsed)) {
      throw new Error('values.yaml must contain a YAML mapping');
    }
    return parsed;
  } catch (error) {
    throw new Error(`${fileKey || 'values.yaml'}: ${error.message}`);
  }
}

function mergeValues(base, overrides) {
  const result = { ...(base || {}) };
  Object.keys(overrides || {}).forEach((key) => {
    if (isPlainObject(result[key]) && isPlainObject(overrides[key])) {
      result[key] = mergeValues(result[key], overrides[key]);
      return;
    }
    result[key] = overrides[key];
  });
  return result;
}

function getSubchartValuesPath(fileKey) {
  const segments = getPathSegments(fileKey);
  const dependencyPath = [];
  for (let index = 0; index < segments.length - 1; index += 1) {
    if (segments[index] === 'charts' && segments[index + 1]) {
      dependencyPath.push(segments[index + 1]);
    }
  }
  return dependencyPath;
}

function setDependencyValues(rootValues, dependencyPath, dependencyValues) {
  let current = rootValues;
  dependencyPath.forEach((dependencyName, index) => {
    const isLeaf = index === dependencyPath.length - 1;
    const existing = isPlainObject(current[dependencyName]) ? current[dependencyName] : {};
    if (isLeaf) {
      current[dependencyName] = mergeValues(dependencyValues, existing);
      return;
    }
    current[dependencyName] = existing;
    current = existing;
  });
}

function getDraftValue(drafts, valuesMap, fileKey) {
  if (Object.prototype.hasOwnProperty.call(drafts || {}, fileKey)) {
    return drafts[fileKey];
  }
  return decodeBase64Text((valuesMap || {})[fileKey]);
}

function buildHelmValuesOverride({ valuesMap, drafts, dirtyFiles, fallbackValues = '' }) {
  const valueFiles = getSortedHelmValuesFileKeys(valuesMap);
  const rootFileKey = valueFiles.find(isRootHelmValuesFileKey) || '';
  const rootDraft = rootFileKey
    ? getDraftValue(drafts, valuesMap, rootFileKey)
    : fallbackValues;
  const dirtyDependencyFiles = valueFiles.filter(fileKey => (
    fileKey !== rootFileKey
    && dirtyFiles
    && dirtyFiles[fileKey]
  ));

  if (dirtyDependencyFiles.length === 0) {
    return rootDraft;
  }

  const rootValues = parseValuesMapping(rootDraft, rootFileKey);
  dirtyDependencyFiles.forEach((fileKey) => {
    const dependencyPath = getSubchartValuesPath(fileKey);
    if (dependencyPath.length === 0) {
      return;
    }
    const dependencyValues = parseValuesMapping(getDraftValue(drafts, valuesMap, fileKey), fileKey);
    setDependencyValues(rootValues, dependencyPath, dependencyValues);
  });
  return yaml.dump(rootValues, { lineWidth: -1, noRefs: true });
}

module.exports = {
  buildHelmValuesOverride,
  decodeHelmValuesFiles,
  decodeBase64Text,
  getPreferredHelmValuesFileKey,
  getSortedHelmValuesFileKeys,
};

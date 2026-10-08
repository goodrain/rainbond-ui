export function normalizeTerminalLink(uri) {
  if (typeof uri !== 'string') {
    return '';
  }
  return uri.trim().replace(/:(\d+);(?=\/|$)/g, ':$1');
}

export function getSafeTerminalLink(uri, baseHref) {
  const normalized = normalizeTerminalLink(uri);
  if (!normalized) {
    return '';
  }
  try {
    const url = new URL(normalized, baseHref);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.href;
  } catch (error) {
    return '';
  }
}

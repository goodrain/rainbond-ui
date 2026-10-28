// Keep the builder's literal ?dir= protocol, including SCP-style Git URLs.
export function splitBuildSourceUrl(value = '') {
  const url = (value || '').trim();
  const index = url.indexOf('?dir=');
  return index < 0
    ? { url, directory: '' }
    : { url: url.slice(0, index), directory: url.slice(index + 5) };
}

export function normalizeBuildDirectory(value = '') {
  return value.trim().replace(/^(\.\/)+/, '').replace(/\/+$/, '').replace(/^\.$/, '');
}

export function isValidBuildDirectory(value = '') {
  const directory = value.trim();
  return !(/^[\/]|^[a-z]:|[\\?#&\x00-\x1f\x7f]/i.test(directory) ||
    directory.split('/').includes('..'));
}

export function joinBuildSourceUrl(url, directory = '') {
  const repository = splitBuildSourceUrl(url).url;
  const path = normalizeBuildDirectory(directory);
  return path ? `${repository}?dir=${path}` : repository;
}

export function canUseBuildDirectory(url, directory) {
  return isValidBuildDirectory(directory) &&
    (!normalizeBuildDirectory(directory) || !/[?#]/.test(splitBuildSourceUrl(url).url));
}

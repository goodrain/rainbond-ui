// Shared by the navigation badge and overview. Keep build channels before display shortening.
function parseVersion(value) {
  const match = String(value || '').trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([\w.-]+))?$/i);
  if (!match) return null;
  const suffix = (match[4] || '').toLowerCase();
  const prerelease = /^(dev|alpha|beta|rc)(?:[.\d-]|$)/.test(suffix);
  return { parts: [Number(match[1]), Number(match[2]), Number(match[3] || 0)], prerelease };
}

function isVersionNewer(latest, current) {
  const next = parseVersion(latest);
  const installed = parseVersion(current);
  if (!next || !installed) return false;
  for (let index = 0; index < 3; index += 1) {
    if (next.parts[index] !== installed.parts[index]) return next.parts[index] > installed.parts[index];
  }
  return installed.prerelease && !next.prerelease;
}

function latestStableVersion(versions) {
  return (Array.isArray(versions) ? versions : [])
    .filter(value => {
      const parsed = parseVersion(value);
      return parsed && !parsed.prerelease;
    })
    .reduce((latest, value) => (!latest || isVersionNewer(value, latest) ? value : latest), '');
}

function isDevelopmentVersion(version) {
  const parsed = parseVersion(version);
  return !!(parsed && parsed.prerelease);
}

module.exports = { isDevelopmentVersion, isVersionNewer, latestStableVersion, parseVersion };

const MAX_ACCESS_TOKEN_EXPIRE_TIME = 2147483647;

function getAccessTokenExpiration(value, nowMs = Date.now()) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, empty: true };
  }
  let expiresAtMs;
  try {
    expiresAtMs = value.valueOf();
  } catch (error) {
    return { valid: false, empty: false };
  }
  if (
    typeof expiresAtMs !== 'number' || !Number.isFinite(expiresAtMs) ||
    typeof nowMs !== 'number' || !Number.isFinite(nowMs)
  ) {
    return { valid: false, empty: false };
  }
  const expiresAt = Math.floor(expiresAtMs / 1000);
  const age = Math.floor((expiresAtMs - nowMs) / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt > MAX_ACCESS_TOKEN_EXPIRE_TIME || age < 1) {
    return { valid: false, empty: false };
  }
  return { valid: true, empty: false, age };
}

module.exports = { MAX_ACCESS_TOKEN_EXPIRE_TIME, getAccessTokenExpiration };

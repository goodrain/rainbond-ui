import cookie from './cookie';

const RENEWED_TOKEN_HEADER = 'x-renewed-token';

function getHeader(headers, name) {
  if (!headers) {
    return '';
  }
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || '';
}

function parseAuthorizationToken(value) {
  if (!value) {
    return '';
  }
  const parts = value.split(' ');
  if (parts.length === 2 && ['GRJWT', 'JWT', 'Bearer'].indexOf(parts[0]) > -1) {
    return parts[1];
  }
  return value;
}

export function updateRenewedTokenFromResponse(response) {
  const headers = response && response.headers;
  const renewedToken =
    getHeader(headers, RENEWED_TOKEN_HEADER) ||
    parseAuthorizationToken(getHeader(headers, 'authorization'));

  if (renewedToken) {
    cookie.set('token', renewedToken);
  }
}

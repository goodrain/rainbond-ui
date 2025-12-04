// use localStorage to store the authority info, which might be sent from server in actual project.
import { formatMessage } from '@/utils/intl';
export function getAuthority() {
  return localStorage.getItem('antd-pro-authority') || 'admin';
}

export function setAuthority(data = {}) {
  return localStorage.setItem('antd-pro-authority', data.authority);
}
export function fetchMarketMap(data) {
  const map = {
    OnlyRead: formatMessage({id:'button.read_only'}),
    ReadInstall: formatMessage({id:'button.install'}),
    Write: formatMessage({id:'button.push'}),
  };
  return map[data] || data;
}
export function fetchMarketAuthority(Info, Authority) {
  if (Info && Info.access_actions && Info.access_actions.length > 0) {
    return Info.access_actions.includes(Authority);
  }
  return false;
}

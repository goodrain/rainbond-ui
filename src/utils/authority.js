// use localStorage to store the authority info, which might be sent from server in actual project.

export function getAuthority() {
  return localStorage.getItem('antd-pro-authority') || 'admin';
}

export function setAuthority(data = {}) {
  return localStorage.setItem('antd-pro-authority', data.authority);
}
export function fetchMarketAuthority(data) {
  const map = {
    OnlyRead: '只读',
    ReadInstall: '安装',
    Write: '推送',
  };
  return map[data] || data;
}

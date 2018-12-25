const appPortUtil = {
  // 是否打开内部访问
  isOpenInner(portBean) {
    return portBean.is_inner_service;
  },
  // 是否打开了外部访问
  isOpenOuter(portBean) {
    return portBean.is_outer_service;
  },
  // 获取绑定的域名
  getDomains(portBean) {
    return portBean.bind_domains||[];
  },
  
  // 获取绑定的tcp域名
  getTcpDomains(portBean) {
    return portBean.bind_tcp_domains||[]
  },
  // 是否可以绑定域名
  canBindDomain(portBean) {
    return !!(portBean.protocol === 'http');
  },
  // 获取显示的标明
  getShowAlias(portBean) {
    const alias = portBean.port_alias || '';
    return `${alias}_HOST:${alias}_PORT`;
  },
  // 获取内部服务地址
  getInnerUrl(portBean) {
    if (this.isOpenInner(portBean)) {
      return portBean.inner_url;
    }
    return '';
  },
  // 获取外部访问地址
  getOuterUrl(portBean) {
    if (this.isOpenOuter(portBean)) {
      if (portBean.protocol === 'http') {
        return `http://${portBean.outer_url}`;
      }
      return portBean.outer_url;
    }
    return '';
  },
};

export default appPortUtil;

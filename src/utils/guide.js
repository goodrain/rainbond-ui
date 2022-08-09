const guideutil = {
  getStatus(key, info) {
    let status = false;
    info.map(item => {
      if (item.key == key) {
        status = item.status;
      }
    });
    return status;
  },
  getStep(info) {
    return [
      {
        title: '创建应用',
        status: this.getStatus('app_create', info),
        key: 'app_create'
      },
      {
        title: '基于源码创建组件',
        status: this.getStatus('source_code_service_create', info),
        key: 'source_code_service_create'
      },
      {
        title: '基于镜像安装数据库',
        status: this.getStatus('image_service_create', info),
        key: 'image_service_create'
      },
      {
        title: '组件连接数据库',
        status: this.getStatus('service_connect_db', info),
        key: 'service_connect_db'
      },
      {
        title: '发布应用到应用市场',
        status: this.getStatus('share_app', info),
        key: 'share_app'
      },
      {
        title: '配置应用访问策略',
        status: this.getStatus('custom_gw_rule', info),
        key: 'custom_gw_rule'
      },
      {
        title: '安装性能分析插件',
        status: this.getStatus('install_plugin', info),
        key: 'install_plugin'
      }
    ];
  }
};
export default guideutil;

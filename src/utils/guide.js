import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
        title: formatMessage({id:'utils.guide.app_create'}),
        status: this.getStatus('app_create', info),
        key: 'app_create'
      },
      {
        title: formatMessage({id:'utils.guide.source_code_service_create'}),
        status: this.getStatus('source_code_service_create', info),
        key: 'source_code_service_create'
      },
      {
        title: formatMessage({id:'utils.guide.image_service_create'}),
        status: this.getStatus('image_service_create', info),
        key: 'image_service_create'
      },
      {
        title: formatMessage({id:'utils.guide.service_connect_db'}),
        status: this.getStatus('service_connect_db', info),
        key: 'service_connect_db'
      },
      {
        title: formatMessage({id:'utils.guide.share_app'}),
        status: this.getStatus('share_app', info),
        key: 'share_app'
      },
      {
        title: formatMessage({id:'utils.guide.custom_gw_rule'}),
        status: this.getStatus('custom_gw_rule', info),
        key: 'custom_gw_rule'
      },
      {
        title: formatMessage({id:'utils.guide.install_plugin'}),
        status: this.getStatus('install_plugin', info),
        key: 'install_plugin'
      }
    ];
  }
};
export default guideutil;

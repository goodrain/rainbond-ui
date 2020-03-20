import React from 'react';
import { Link } from 'dva/router';
import { connect } from 'dva';
import styles from './UserLayout.less';
import globalUtil from '../utils/global';
import oauthUtil from '../utils/oauth';
import rainbondUtil from '../utils/rainbond';

class UserLayout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isRender: false,
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;

    // 初始化 获取RainbondInfo信息
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: info => {
        if (info) {
          globalUtil.putLog(info);
          // check auto login
          const disable_auto_login = rainbondUtil.OauthParameter(
            'disable_auto_login'
          );
          const isOauth = rainbondUtil.OauthbEnable(info);
          const oauth_servicesList =
            info &&
            info.oauth_services &&
            info.oauth_services.value &&
            info.oauth_services.value.length > 0 &&
            info.oauth_services.value;
          if (isOauth && oauth_servicesList) {
            let isRender = true;
            oauth_servicesList.map(item => {
              const { is_auto_login } = item;
              if (is_auto_login && disable_auto_login != 'true') {
                isRender = false;
                window.location.href = oauthUtil.getAuthredictURL(item);
              }
            });
            this.isRender(isRender);
          } else {
            this.isRender(true);
          }
        }
      },
    });
  }

  isRender = isRender => {
    this.setState({
      isRender,
    });
  };
  render() {
    const { rainbondInfo, nouse, children } = this.props;
    const { isRender } = this.state;
    if (!rainbondInfo || !isRender) {
      return null;
    }
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          {!nouse && (
            <div className={styles.top}>
              <div className={styles.header}>
                <Link to="/">
                  <h1 className={styles.titles}>
                    {rainbondInfo && rainbondInfo.enterprise_name
                      ? rainbondInfo.enterprise_name
                      : 'Rainbond'}
                  </h1>
                </Link>
              </div>
              <div className={styles.desc}>
                以企业云原生应用开发、架构、运维、共享、交付为核心的Kubernetes多云赋能平台
              </div>
            </div>
          )}
          <div>{children}</div>
        </div>
      </div>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  nouse: global.nouse,
}))(UserLayout);

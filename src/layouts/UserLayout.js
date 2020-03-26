import React from 'react';
import { Link } from 'dva/router';
import { connect } from 'dva';
import styles from './UserLayout.less';
import globalUtil from '../utils/global';
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
          const isOauth = rainbondUtil.OauthbEnable(info);
          const oauthInfo = info.enterprise_center_oauth.value;
          if (isOauth && oauthInfo) {
            if (oauthInfo.is_auto_login) {
              window.location.href = oauthUtil.getAuthredictURL(oauthInfo);
            }
            this.isRender(!oauthInfo.is_auto_login);
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
                    {rainbondInfo && rainbondInfo.title&&rainbondInfo.title.enable
                      ? rainbondInfo.title.value
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

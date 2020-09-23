import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import globalUtil from '../utils/global';
import oauthUtil from '../utils/oauth';
import rainbondUtil from '../utils/rainbond';
import styles from './UserLayout.less';

class UserLayout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isRender: false
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
          const oauthInfo =
            info.enterprise_center_oauth && info.enterprise_center_oauth.value;
          if (isOauth && oauthInfo) {
            if (oauthInfo.is_auto_login) {
              globalUtil.removeCookie();
              window.location.href = oauthUtil.getAuthredictURL(oauthInfo);
            }
            this.isRender(!oauthInfo.is_auto_login);
          } else {
            this.isRender(true);
          }
        }
      }
    });
  }
  isRender = isRender => {
    this.setState({
      isRender
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
                    {rainbondInfo &&
                    rainbondInfo.title &&
                    rainbondInfo.title.enable
                      ? rainbondInfo.title.value
                      : ''}
                  </h1>
                </Link>
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
  nouse: global.nouse
}))(UserLayout);

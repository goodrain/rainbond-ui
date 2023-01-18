import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import cloud from '../../public/cloud.png';
import logo from '../../public/logoLogin.png';
import topLogo from '../../public/topLogo.png';
import globalUtil from '../utils/global';
import oauthUtil from '../utils/oauth';
import rainbondUtil from '../utils/rainbond';
import CustomFooter from './CustomFooter';
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
          const { query } = this.props.location;
          const isLogin = this.props.location.pathname === '/user/login';
          if (isLogin) {
            const { redirect } = query;
            if (redirect) {
              window.localStorage.setItem('redirect', redirect);
            }
          }
          // check auto login
          const isOauth =
            rainbondUtil.OauthbEnable(info) ||
            rainbondUtil.OauthEnterpriseEnable(info);
          let oauthInfo =
            info.enterprise_center_oauth && info.enterprise_center_oauth.value;
          if (!oauthInfo && info.oauth_services && info.oauth_services.value) {
            info.oauth_services.value.map(item => {
              if (item.is_auto_login) {
                oauthInfo = item;
              }
              return null;
            });
          }
          const isDisableAutoLogin = query && query.disable_auto_login;
          if (
            isOauth &&
            oauthInfo &&
            isLogin &&
            oauthInfo.is_auto_login &&
            isDisableAutoLogin !== 'true'
          ) {
            globalUtil.removeCookie();
            window.location.href = oauthUtil.getAuthredictURL(oauthInfo);
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
    const { rainbondInfo, children } = this.props;
    const { isRender } = this.state;
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo) || logo;
    const isEnterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    if (!rainbondInfo || !isRender) {
      return null;
    }
    return (
      <div className={styles.container}>
        <div className={styles.headers}>
        </div>
        <div className={styles.content}>
          <div className={styles.left}>
            <img src={topLogo}></img>
          </div>
          <div className={styles.right}>
            <div className={styles.login}>
              <div className={styles.contentBox}>
                <div className={styles.contentBoxRight}>{children}</div>
              </div>
            </div>
          </div>
        </div>
        < div style={{ bottom: 0, width: '100%', position: 'fixed' }} className={styles.CustomFooterStyle}>
          {!isEnterpriseEdition && <CustomFooter />}
        </div>
      </div>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo
}))(UserLayout);

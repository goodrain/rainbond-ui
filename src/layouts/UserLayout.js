import { connect } from 'dva';
import React from 'react';
import { Link } from 'dva/router';
import CustomFooter from './CustomFooter';
import globalUtil from '../utils/global';
import oauthUtil from '../utils/oauth';
import rainbondUtil from '../utils/rainbond';
import logo from '../../public/logo.png';
import cloud from '../../public/cloud.png';
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
    const disableAutoLogin = rainbondUtil.OauthParameter('disable_auto_login');
    // 初始化 获取RainbondInfo信息
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: (info) => {
        if (info) {
          globalUtil.putLog(info);
          // check auto login
          const isOauth =
            rainbondUtil.OauthbEnable(info) ||
            rainbondUtil.OauthEnterpriseEnable(info);
          let oauthInfo =
            info.enterprise_center_oauth && info.enterprise_center_oauth.value;
          if (!oauthInfo && info.oauth_services && info.oauth_services.value) {
            info.oauth_services.value.map((item) => {
              if (item.is_auto_login) {
                oauthInfo = item;
              }
              return null;
            });
          }
          if (isOauth && oauthInfo) {
            if (oauthInfo.is_auto_login && disableAutoLogin != 'true') {
              globalUtil.removeCookie();
              window.location.href = oauthUtil.getAuthredictURL(oauthInfo);
            } else if (disableAutoLogin) {
              this.isRender(true);
            } else {
              this.isRender(!oauthInfo.is_auto_login);
            }
          } else {
            this.isRender(true);
          }
        }
      }
    });
  }
  isRender = (isRender) => {
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
          <div className={styles.logo}>
            <Link to="/">
              <img src={fetchLogo} alt="LOGO" />
            </Link>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.contentBox}>
            <div className={styles.contentBoxLeft}>
              <img src={cloud} alt="云原生" />
            </div>
            <div className={styles.contentBoxRight}>{children}</div>
          </div>
        </div>
        {!isEnterpriseEdition && <CustomFooter />}
      </div>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo
}))(UserLayout);

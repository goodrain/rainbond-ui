import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import cloud from '../../public/cloud.png';
import logo from '../../public/logoLogin.png';
import topLogo from '../../public/topLogo1.png';
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
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const { isRender } = this.state;
    const login_image = rainbondInfo && rainbondInfo.login_image && rainbondInfo.login_image.value || topLogo;
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo) || logo;
    const isEnterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const isSaas = rainbondInfo && rainbondInfo.is_saas || false;
    if (!rainbondInfo || !isRender) {
      return null;
    }
    return (
      <div style={{ height:'100%' }}>
        {isSaas ? (
          <div className={styles.saasContainer}>

            <div className={styles.saasLeft}>
              <div className={styles.saasLeftContent}>
                <div className={styles.introSection}>
                  <h1>Rainbond Cloud</h1>
                  <p className={styles.subTitle}>无需学习Kubernetes，像管理手机APP一样管理企业应用</p>
                </div>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud1')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3>企业级护航</h3>
                      <p>SLA 99.95% 可用性承诺，技术支持</p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud2')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3>按需计费</h3>
                      <p>业务实际使用量，分钟级按需付费</p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud3')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3>快速部署业务</h3>
                      <p>整合资源，工程师代运维，专注业务开发</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.saasRight}>
              <div className={styles.saasLoginBox}>
                <h2>欢迎回来</h2>
                <p>优秀选择的伙伴</p>
                <div className={styles.loginForm}>
                  {children}
                </div>
                <div className={styles.loginFooter}>
                登录即表示您同意我们的 <Link to="/help">用户协议</Link> 和 <Link to="/privacy">隐私声明</Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.headers}>
            </div>
            <div className={styles.content}>
              <div className={styles.left}>
                <img src={login_image}></img>
              </div>
              <div className={styles.right}>
                {children}
              </div>
            </div>
            < div style={{ bottom: 0, width: '100%', position: 'fixed', zIndex: '1' }} className={styles.CustomFooterStyle}>
              <CustomFooter />
            </div>
          </div>
        )
        }
      </div>

    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo
}))(UserLayout);

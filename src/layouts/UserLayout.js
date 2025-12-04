import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import cloud from '../../public/cloud.png';
import logo from '../../public/logoLogin.png';
import topLogo from '../../public/topLogo1.png';
import enlogo from '../../public/login_en.png';
import globalUtil from '../utils/global';
import oauthUtil from '../utils/oauth';
import rainbondUtil from '../utils/rainbond';
import { setLocale, getLocale } from 'umi'
import CustomFooter from './CustomFooter';
import cookie from '../utils/cookie';
import styles from './UserLayout.less';

class UserLayout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isRender: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    let lan = navigator.systemLanguage || navigator.language;
    const Language = cookie.get('language')
    if (Language == null) {
      if (lan.toLowerCase().indexOf('zh') !== -1) {
        const language = 'zh-CN'
        cookie.set('language', language)
        setLocale('zh-CN')
        this.setState({
          language: true,
        })
      } else {
        const language = 'en-US'
        cookie.set('language', language)
        setLocale('en-US')
        this.setState({
          language: false,
        })
      }
    }
    // 初始化 获取RainbondInfo信息
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: info => {
        if (info) {
          globalUtil.putLog(info);
          const { query } = this.props.location;
          const isLogin = this.props.location.pathname === '/user/login';
          if (isLogin) {
            const { redirect, link } = query;
            if (link) {
              window.localStorage.setItem('link', link);
            }
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
    const { isRender, language } = this.state;
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
                  <p className={styles.subTitle}>无门槛免费试用，一键部署任意应用</p>
                </div>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud1')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3>高可用性</h3>
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
                      <h3>开箱即用</h3>
                      <p>整合资源，无需运维，专注业务开发</p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud4')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3>应用市场</h3>
                      <p>上百款应用即点即用，涵盖AI、博客、低代码等类型</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.saasRight}>
              <div className={styles.saasLoginBox}>
                <h2>Rainbond Cloud</h2>
                <p>开启平台之旅</p>
                <div className={styles.loginForm}>
                  {children}
                </div>
                <div className={styles.loginFooter}>
                登录即表示您同意我们的 <a target='_blank' href="https://www.rainbond.com/server">服务协议</a> 和 <a target='_blank' href="https://www.rainbond.com/privacy">隐私条款</a>
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
                <img src={language ? login_image : enlogo}></img>
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

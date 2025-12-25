import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { FormattedMessage } from 'umi';
import logo from '../../public/logo-white.png';
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
                  <p className={styles.subTitle}><FormattedMessage id="layout.userLayout.saas.subtitle" defaultMessage="无门槛免费试用，一键部署任意应用" /></p>
                </div>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud1')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3><FormattedMessage id="layout.userLayout.saas.feature1.title" defaultMessage="高可用性" /></h3>
                      <p><FormattedMessage id="layout.userLayout.saas.feature1.desc" defaultMessage="SLA 99.95% 可用性承诺，技术支持" /></p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud2')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3><FormattedMessage id="layout.userLayout.saas.feature2.title" defaultMessage="按需计费" /></h3>
                      <p><FormattedMessage id="layout.userLayout.saas.feature2.desc" defaultMessage="业务实际使用量，分钟级按需付费" /></p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud3')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3><FormattedMessage id="layout.userLayout.saas.feature3.title" defaultMessage="开箱即用" /></h3>
                      <p><FormattedMessage id="layout.userLayout.saas.feature3.desc" defaultMessage="整合资源，无需运维，专注业务开发" /></p>
                    </div>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.iconWrapper}>
                      {globalUtil.fetchSvg('loginCloud4')}
                    </div>
                    <div className={styles.featureContent}>
                      <h3><FormattedMessage id="layout.userLayout.saas.feature4.title" defaultMessage="应用市场" /></h3>
                      <p><FormattedMessage id="layout.userLayout.saas.feature4.desc" defaultMessage="上百款应用即点即用，涵盖AI、博客、低代码等类型" /></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.saasRight}>
              <div className={styles.saasLoginBox}>
                <h2>Rainbond Cloud</h2>
                <p><FormattedMessage id="layout.userLayout.saas.welcomeText" defaultMessage="开启平台之旅" /></p>
                <div className={styles.loginForm}>
                  {children}
                </div>
                <div className={styles.loginFooter}>
                  <FormattedMessage id="layout.userLayout.saas.agreement" defaultMessage="登录即表示您同意我们的" /> <a target='_blank' href="https://www.rainbond.com/server"><FormattedMessage id="layout.userLayout.saas.termsOfService" defaultMessage="服务协议" /></a> <FormattedMessage id="layout.userLayout.saas.and" defaultMessage="和" /> <a target='_blank' href="https://www.rainbond.com/privacy"><FormattedMessage id="layout.userLayout.saas.privacyPolicy" defaultMessage="隐私条款" /></a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.normalContainer}>
            <div className={styles.normalLeft}>
              <div className={styles.normalLeftContent}>
                <div className={styles.logoSection}>
                  <span className={styles.logoText}>Rainbond</span>
                </div>
                <div className={styles.mainSection}>
                  <div className={styles.titleSection}>
                    <h1><FormattedMessage id="layout.userLayout.normal.title1" defaultMessage="无需学习 Kubernetes" /></h1>
                    <h1><FormattedMessage id="layout.userLayout.normal.title2" defaultMessage="的容器平台" /></h1>
                  </div>
                  <p className={styles.description}>
                    <FormattedMessage id="layout.userLayout.normal.description" defaultMessage="在 Kubernetes 上构建、部署、组装和管理应用，无需 K8s 专业知识，全流程图形化管理" />
                  </p>
                </div>
                <div className={styles.companyInfo}>
                  <FormattedMessage id="layout.userLayout.normal.companyInfo" defaultMessage="北京好雨科技有限公司出品" />
                </div>
              </div>
            </div>
            <div className={styles.normalRight}>
              <div className={styles.normalLoginBox}>
                {children}
              </div>
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

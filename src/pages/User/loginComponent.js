import React, { Component } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Link } from 'dva/router';
import userUtil from '../../utils/global';
import Login from '../../components/Login';
import { getCaptchaURL } from '../../services/user';
import styles from './Login.less';
import LoginHeader from './loginHeader';

const { UserName, Password, ImageCaptcha, Submit } = Login;

@connect(({ loading, global }) => ({
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
  thirdLogin: loading.effects['user/thirdLogin'],
  userLogin: loading.effects['user/login']
}))
export default class LoginComponent extends Component {
  state = {
    captchaVersion: Date.now()
  };

  componentDidUpdate(prevProps) {
    const { userLogin } = this.props;
    if (prevProps.userLogin && !userLogin && this.isCaptchaEnabled()) {
      this.refreshCaptcha();
    }
  }

  isCaptchaEnabled = () => {
    const { rainbondInfo, type } = this.props;
    return !!(
      type !== 'thirdLogin' &&
      rainbondInfo &&
      rainbondInfo.captcha_code &&
      rainbondInfo.captcha_code.enable
    );
  };

  refreshCaptcha = () => {
    this.setState(({ captchaVersion }) => ({
      captchaVersion: captchaVersion + 1
    }));
  };

  handleSubmit = (err, values) => {

    const { onSubmit } = this.props;
    if (!err && onSubmit) {
      const redirect = window.localStorage.getItem('redirect');
      const redirectUrl = encodeURIComponent(redirect);
      if (redirect && redirect.includes('invite')) {
        values.isInvite = true
      }
      userUtil.removeCookie();
      onSubmit(values);
    }
  };
  // 获取地址栏重定向参数
  getRedirectParams = () => {
    const redirect = window.localStorage.getItem('redirect');
    const redirectUrl = encodeURIComponent(redirect);
    if (redirect && redirect.includes('invite')) {

      return '/user/register?redirect=' + redirectUrl;
    }
    return '/user/register';
  }

  render() {
    const { thirdLogin, userLogin, type } = this.props;
    const { captchaVersion } = this.state;
    const captchaEnabled = this.isCaptchaEnabled();
    return (
      <div className={styles.loginWrapper}>
        <LoginHeader />
        <Login defaultActiveKey="account" onSubmit={this.handleSubmit}>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.loginComponent.username.label" defaultMessage="用户名" /></label>
            <UserName name="nick_name" placeholder={formatMessage({id:'login.loginComponent.name'})} />
          </div>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.loginComponent.password.label" defaultMessage="密码" /></label>
            <Password name="password" placeholder={formatMessage({id:'login.loginComponent.pass'})}/>
          </div>
          {captchaEnabled && (
            <div className={styles.formItem}>
              <label><FormattedMessage id="login.captcha.label" defaultMessage="验证码" /></label>
              <div className={styles.captchaRow}>
                <div className={styles.captchaInput}>
                  <ImageCaptcha
                    name="captcha_code"
                    placeholder={formatMessage({ id: 'login.captcha.placeholder' })}
                  />
                </div>
                <button
                  type="button"
                  className={styles.captchaRefresh}
                  onClick={this.refreshCaptcha}
                  aria-label={formatMessage({ id: 'login.captcha.refresh' })}
                >
                  <img
                    src={getCaptchaURL(captchaVersion)}
                    alt={formatMessage({ id: 'login.captcha.imageAlt' })}
                  />
                </button>
              </div>
            </div>
          )}
          <Submit loading={type !== 'thirdLogin' ? userLogin : thirdLogin}>
            {type === 'thirdLogin' ? <FormattedMessage id="login.loginComponent.loginandband"/> : <FormattedMessage id="login.loginComponent.login"/>}
          </Submit>
          <div className={styles.other}>
            {this.props.isRegist && type !== 'thirdLogin' && (
              <div className={styles.registerLink}>
                <span><FormattedMessage id="login.loginComponent.noAccount" defaultMessage="还没有账户？" /></span>
                <Link to={this.getRedirectParams()}>
                  <FormattedMessage id="login.loginComponent.registerAccount" defaultMessage="注册账户"/>
                </Link>
              </div>
            )}
          </div>
        </Login>
      </div>
    );
  }
}

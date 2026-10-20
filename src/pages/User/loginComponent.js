import React, { Component } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Link } from 'dva/router';
import userUtil from '../../utils/global';
import Login from '../../components/Login';
import { getCaptchaURL } from '../../services/user';
import styles from './Login.less';

const { Tab, UserName, Password, Mobile, Captcha, ImageCaptcha, Submit } = Login;

@connect(({ loading, global }) => ({
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
  thirdLogin: loading.effects['user/thirdLogin'],
  userLogin: loading.effects['user/login'],
  smsLogin: loading.effects['user/smsLogin']
}))
export default class LoginComponent extends Component {
  state = {
    captchaVersion: Date.now(),
    loginType: 'account',
    mobile: ''
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

  handleTabChange = loginType => {
    this.setState({ loginType });
  };

  handleMobileChange = event => {
    this.setState({ mobile: event.target?.value || '' });
  };

  handleGetSmsCode = () => {
    const { dispatch } = this.props;
    const { mobile } = this.state;
    dispatch({
      type: 'user/getSmsCode',
      payload: {
        phone: mobile,
        purpose: 'login'
      }
    });
  };

  handleSubmit = (error, values) => {
    const { loginType } = this.state;
    const { onSubmit, onSmsSubmit } = this.props;
    const submit = loginType === 'mobile' ? onSmsSubmit : onSubmit;
    if (!error && submit) {
      const redirect = window.localStorage.getItem('redirect');
      if (redirect && redirect.includes('invite')) {
        values.isInvite = true;
      }
      userUtil.removeCookie();
      submit(values);
    }
  };

  getRedirectParams = () => {
    const redirect = window.localStorage.getItem('redirect');
    const redirectUrl = encodeURIComponent(redirect);
    if (redirect && redirect.includes('invite')) {
      return '/user/register?redirect=' + redirectUrl;
    }
    return '/user/register';
  };

  renderAccountFields = () => {
    const { captchaVersion } = this.state;
    return (
      <>
        <div className={styles.formItem}>
          <label><FormattedMessage id="login.loginComponent.username.label" defaultMessage="用户名" /></label>
          <UserName name="nick_name" placeholder={formatMessage({ id: 'login.loginComponent.name' })} />
        </div>
        <div className={styles.formItem}>
          <label><FormattedMessage id="login.loginComponent.password.label" defaultMessage="密码" /></label>
          <Password name="password" placeholder={formatMessage({ id: 'login.loginComponent.pass' })} />
        </div>
        {this.isCaptchaEnabled() && (
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
      </>
    );
  };

  renderSmsFields = () => {
    const { mobile } = this.state;
    return (
      <>
        <div className={styles.formItem}>
          <label><FormattedMessage id="login.loginSmsComponent.phone.label" defaultMessage="手机号" /></label>
          <Mobile
            name="phone"
            placeholder={formatMessage({
              id: 'login.loginSmsComponent.phone.placeholder',
              defaultMessage: '请输入手机号'
            })}
            onChange={this.handleMobileChange}
          />
        </div>
        <div className={styles.formItem}>
          <label><FormattedMessage id="login.loginSmsComponent.code.label" defaultMessage="验证码" /></label>
          <Captcha
            name="code"
            placeholder={formatMessage({
              id: 'login.loginSmsComponent.code.placeholder',
              defaultMessage: '请输入验证码'
            })}
            mobile={mobile}
            onGetCaptcha={this.handleGetSmsCode}
          />
        </div>
      </>
    );
  };

  render() {
    const {
      enableSmsLogin,
      thirdLogin,
      userLogin,
      smsLogin,
      type
    } = this.props;
    const { loginType } = this.state;
    const accountFields = this.renderAccountFields();
    const submitLoading = type === 'thirdLogin'
      ? thirdLogin
      : loginType === 'mobile'
        ? smsLogin
        : userLogin;
    const hiSvg = (
      <svg className={styles.welcomeIcon} viewBox="0 0 1066 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
        <path d="M879.701333 182.4l-2.346666-2.346667C694.442667-3.370667 397.525333-2.901333 214.144 180.053333s-182.912 480.426667 0 663.338667A467.285333 467.285333 0 0 0 546.218667 981.333333h349.866666a36.138667 36.138667 0 0 0 36.138667-36.138666V778.666667a487.168 487.168 0 0 0 60.501333-121.045334 470.613333 470.613333 0 0 0-113.066666-475.221333z m-373.802666 518.4l28.586666-152.021333H402.688l-29.056 152.021333H296.234667L365.226667 339.114667h77.397333l-26.752 141.226666h132.266667l27.221333-141.226666h77.354667l-68.949334 361.685333h-77.824z m224.170666 0h-77.397333l50.218667-262.698667h77.354666l-50.176 262.698667z m53.461334-306.816a42.24 42.24 0 0 1-32.341334 11.733333 35.669333 35.669333 0 0 1-37.546666-33.792V368.213333a43.946667 43.946667 0 0 1 44.544-44.117333 36.693333 36.693333 0 0 1 38.954666 34.261333v3.754667c0 11.733333-5.162667 23.466667-13.610666 31.914667z" fill="currentColor" />
      </svg>
    );

    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginHeader}>
          <h1><FormattedMessage id="login.loginComponent.title" defaultMessage="登录" /></h1>
          <p>
            <span className={styles.welcome}>{hiSvg} ~ </span>
            <FormattedMessage id="login.loginComponent.subtitle" defaultMessage="欢迎回来，请登录您的账户" />
          </p>
        </div>
        <Login
          defaultActiveKey="account"
          onTabChange={this.handleTabChange}
          onSubmit={this.handleSubmit}
        >
          {enableSmsLogin && (
            <Tab
              tab={formatMessage({ id: 'login.loginComponent.tab.account' })}
              key='account'
            >
              {accountFields}
            </Tab>
          )}
          {enableSmsLogin && (
            <Tab
              tab={formatMessage({ id: 'login.loginComponent.tab.mobile' })}
              key='mobile'
            >
              {this.renderSmsFields()}
            </Tab>
          )}
          {!enableSmsLogin && accountFields}
          <Submit loading={submitLoading}>
            {type === 'thirdLogin'
              ? <FormattedMessage id="login.loginComponent.loginandband" />
              : <FormattedMessage id="login.loginComponent.login" />}
          </Submit>
          <div className={styles.other}>
            {this.props.isRegist && type !== 'thirdLogin' && (
              <div className={styles.registerLink}>
                <span><FormattedMessage id="login.loginComponent.noAccount" defaultMessage="还没有账户？" /></span>
                <Link to={this.getRedirectParams()}>
                  <FormattedMessage id="login.loginComponent.registerAccount" defaultMessage="注册账户" />
                </Link>
              </div>
            )}
          </div>
        </Login>
      </div>
    );
  }
}

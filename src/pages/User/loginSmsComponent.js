import React, { Component } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Link } from 'dva/router';
import userUtil from '../../utils/global';
import Login from '../../components/Login';
import styles from './Login.less';
import { message } from 'antd';

const { UserName, Password, Submit } = Login;
const { Mobile, Captcha } = Login;

@connect(({ loading, global }) => ({
  isRegist: global.isRegist,
  thirdLogin: loading.effects['user/thirdLogin'],
  userLogin: loading.effects['user/login']
}))
export default class LoginComponent extends Component {
  state = {
    mobile: '',
    countdown: 0
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

  getRedirectParams = () => {
    const redirect = window.localStorage.getItem('redirect');
    const redirectUrl = encodeURIComponent(redirect);
    if (redirect && redirect.includes('invite')) {
      return '/user/register?redirect=' + redirectUrl;
    }
    return '/user/register';
  }

  handleMobileChange = (e) => {
    const mobile = e.target?.value || '';  // 获取输入值
    this.setState({ mobile });
  };

  onGetCaptcha = (e) => {
    if (e) {
      e.persist();
    }
    
    const { dispatch } = this.props;
    const { mobile } = this.state;
    if (!mobile) {
      message.error('请输入手机号');
      return;
    }

    dispatch({
      type: 'user/getSmsCode',
      payload: {
        phone: mobile,
        purpose: 'login'
      },
      callback: () => {
        this.setState({
          countdown: 120
        })
      }
    })
  }

  render() {
    const { thirdLogin, userLogin, type } = this.props;
    const { mobile } = this.state;
    return (
      <div className={styles.loginWrapper}>

        <Login defaultActiveKey="account" onSubmit={this.handleSubmit}>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.loginSmsComponent.phone.label" defaultMessage="手机号" /></label>
            <Mobile
              name="phone"
              placeholder={formatMessage({id: 'login.loginSmsComponent.phone.placeholder', defaultMessage: '请输入手机号'})}
              onChange={this.handleMobileChange}
            />
          </div>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.loginSmsComponent.code.label" defaultMessage="验证码" /></label>
            <Captcha
              name="code"
              placeholder={formatMessage({id: 'login.loginSmsComponent.code.placeholder', defaultMessage: '请输入验证码'})}
              countDown={120}
              mobile={mobile}
              onGetCaptcha={this.onGetCaptcha}
            />
          </div>
          <Submit loading={type !== 'thirdLogin' ? userLogin : thirdLogin}>
            {type === 'thirdLogin' ? <FormattedMessage id="login.loginComponent.loginandband" defaultMessage="登录并绑定"/> : <FormattedMessage id="login.loginComponent.login" defaultMessage="登录"/>}
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

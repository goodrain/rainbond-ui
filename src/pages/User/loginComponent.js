import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Link } from 'dva/router';
import userUtil from '../../utils/global';
import Login from '../../components/Login';
import styles from './Login.less';

const { UserName, Password, Submit } = Login;

@connect(({ loading, global }) => ({
  isRegist: global.isRegist,
  thirdLogin: loading.effects['user/thirdLogin'],
  userLogin: loading.effects['user/login']
}))
export default class LoginComponent extends Component {
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
    return (
      <div>
        <Login defaultActiveKey="account" onSubmit={this.handleSubmit}>
          <UserName name="nick_name" placeholder={formatMessage({id:'login.loginComponent.name'})} />
          <Password name="password" placeholder={formatMessage({id:'login.loginComponent.pass'})}/>
          <Submit loading={type !== 'thirdLogin' ? userLogin : thirdLogin}>
            {type === 'thirdLogin' ? <FormattedMessage id="login.loginComponent.loginandband"/> : <FormattedMessage id="login.loginComponent.login"/>}
          </Submit>
          <div className={styles.other}>
            {this.props.isRegist && type !== 'thirdLogin' && (
              <Link className={styles.register} to={this.getRedirectParams()}>
                <FormattedMessage id= 'login.loginComponent.register'/>
              </Link>
            )}
          </div>
        </Login>
      </div>
    );
  }
}

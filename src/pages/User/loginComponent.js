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
      userUtil.removeCookie();
      onSubmit(values);
    }
  };

  render() {
    const { thirdLogin, userLogin, type } = this.props;
    return (
      <div className={styles.main}>
        <Login defaultActiveKey="account" onSubmit={this.handleSubmit}>
          <UserName name="nick_name" placeholder={formatMessage({id:'login.loginComponent.name'})} />
          <Password name="password" placeholder={formatMessage({id:'login.loginComponent.pass'})}/>
          <Submit loading={type !== 'thirdLogin' ? userLogin : thirdLogin}>
            {type === 'thirdLogin' ? <FormattedMessage id="login.loginComponent.loginandband"/> : <FormattedMessage id="login.loginComponent.login"/>}
          </Submit>
          <div className={styles.other}>
            {this.props.isRegist && type !== 'thirdLogin' && (
              <Link className={styles.register} to="/user/register">
                <FormattedMessage id= 'login.loginComponent.register'/>
              </Link>
            )}
          </div>
        </Login>
      </div>
    );
  }
}

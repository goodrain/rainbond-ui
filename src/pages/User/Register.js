import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import logo from '../../../public/logoLogin.png';
import styles from './Register.less';
import RegisterComponent from './registerComponent';
import RegisterSmsComponent from './registerSmsComponent';

@connect(({ user, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
  isRegist: global.isRegist
}))
export default class Register extends Component {
  // first user, to register admin
  state = {};

  handleSubmit = values => {
    const { rainbondInfo } = this.props;
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const version =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const { dispatch } = this.props;
    dispatch({
      type: 'user/register',
      payload: {
        ...values
      },
      complete: data => {
        if (firstRegist) { 
          globalUtil.putRegistLog(
            Object.assign(
              { enterprise_alias: values.enter_name, version },
              data
            )
          );
        }
      }
    });
  };

  handleUserSource = (value) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchUserSource',
      payload: {
        content: value
      },
      callback: data => {
        window.localStorage.removeItem('link');
        window.localStorage.removeItem('redirect');
      }
    })
  }
  handleSmsSubmit = values => {
    const { dispatch } = this.props;
    const link = window.localStorage.getItem('link');
    const redirect = window.localStorage.getItem('redirect');
    let content = '';
    if(link) {
      content = `
        ${formatMessage({ id: 'login.registerComponent.smslink'})}:${link}
        ${formatMessage({ id: 'login.registerComponent.smsusers'})}:${values.nick_name}
        ${formatMessage({ id: 'login.registerComponent.smsphone'})}:${values.phone}
      `;
    } else if(redirect.includes('app_name')) {
      const hashPart = redirect.split('#')[1];
      const queryPart = hashPart.split('?')[1];
      const urlSearchParams = new URLSearchParams(queryPart);
      const appName = urlSearchParams.get('app_name');
      content = `
        ${formatMessage({ id: 'login.registerComponent.smslink'})}:${appName}
        ${formatMessage({ id: 'login.registerComponent.smsusers'})}:${values.nick_name}
        ${formatMessage({ id: 'login.registerComponent.smsphone'})}:${values.phone}
      `;
    } 
    
    dispatch({
      type: 'user/smsRegister',
      payload: values,
      complete: data => {
        console.log('Register Success')
        if(content){
          this.handleUserSource(content)
        }
      }
    });
  };
  render() {
    const { isRegist, dispatch, rainbondInfo } = this.props;
    if (!isRegist) {
      dispatch(routerRedux.replace('/user/login'));
      return null;
    }
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const isSaas = rainbondInfo?.is_saas || false;
    return (
      <div className={styles.main}>
        {(firstRegist || !isSaas) && <RegisterComponent onSubmit={this.handleSubmit} type="register" />}
        {isSaas && !firstRegist && <RegisterSmsComponent onSubmit={this.handleSmsSubmit} type="register" />}
      </div>
    );
  }
}

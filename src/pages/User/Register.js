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
  handleSmsSubmit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/smsRegister',
      payload: values,
      complete: data => {
        console.log('Register Success')
        
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

import React, { Component } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import styles from './Register.less';
import RegisterComponent from './registerComponent';
import rainbondUtil from '../../utils/rainbond';

@connect(({ user, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
  isRegist: global.isRegist,
}))
export default class Register extends Component {
  // first user, to register admin
  state = {
    time: Date.now(),
  };

  handleSubmit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/register',
      payload: {
        ...values,
      },
      complete: () => {
        this.setState({
          time: Date.now(),
        });
      },
    });
  };

  render() {
    const { isRegist, dispatch, rainbondInfo } = this.props;
    if (!isRegist) {
      dispatch(routerRedux.replace('/user/login'));
      return null;
    }
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    return (
      <div className={styles.main}>
        <h3>{firstRegist ? '管理员注册' : '用户注册'}</h3>
        <RegisterComponent onSubmit={this.handleSubmit} type="register" />
      </div>
    );
  }
}

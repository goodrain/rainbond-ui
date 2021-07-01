/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { message } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component } from 'react';
import Result from '../../components/Result';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';

const loginUrl = '/user/login?disable_auto_login=true';

@connect()
export default class ThirdLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resultState: 'ing',
      title: '第三方认证中...',
      desc: '此过程可能比较耗时，请耐心等待'
    };
  }
  // eslint-disable-next-line consistent-return
  componentWillMount() {
    const code = rainbondUtil.OauthParameter('code');
    const service_id = rainbondUtil.OauthParameter('service_id');
    const { dispatch } = this.props;
    if (
      code &&
      service_id &&
      code !== 'None' &&
      service_id !== 'None' &&
      code !== '' &&
      service_id !== ''
    ) {
      const token = cookie.get('token');
      // if user login
      if (token) {
        dispatch({ type: 'global/hideNeedLogin' });
        dispatch({
          type: 'user/fetchThirdLoginBinding',
          payload: {
            code,
            service_id
          },
          callback: res => {
            if (res) {
              if (
                res.response_data &&
                res.response_data.status &&
                res.response_data.status === 400 &&
                res.msg_show
              ) {
                message.warning(res.msg_show);
              }
              if (res.status && res.status === 400) {
                this.setState(
                  {
                    resultState: 'error',
                    title: '第三方认证未通过',
                    desc: '认证失败,请重新认证'
                  },
                  () => {
                    dispatch(routerRedux.push(`/`));
                  }
                );
              } else if (res.status_code && res.status_code === 200) {
                this.setState(
                  {
                    resultState: 'success',
                    title: '第三方认证通过',
                    desc: ''
                  },
                  () => {
                    if (res.bean && res.bean.token) {
                      cookie.set('token', res.bean.token);
                    }
                    this.handleSuccess();
                  }
                );
              }
            }
          },
          handleError: err => {
            this.handleError(err);
          }
        });
        return null;
      }
      globalUtil.removeCookie();
      // if not login
      dispatch({
        type: 'user/fetchThirdCertification',
        payload: {
          code,
          service_id,
          domain: window.location.host
        },
        callback: res => {
          if (res && (res.status_code === 400 || res.status_code === 401)) {
            this.setState(
              {
                resultState: 'error',
                title: '第三方认证未通过',
                desc: res.msg_show || '未成功获取access_token,请重新认证。'
              },
              () => {
                dispatch(routerRedux.push(loginUrl));
              }
            );
          } else if (res && res.status_code === 200) {
            const data = res.bean;
            if (data && data.token) {
              cookie.set('token', data.token);
              this.handleSuccess();
              return null;
            }
            if (data && data.result) {
              // if not login
              if (!data.result.is_authenticated) {
                dispatch(
                  routerRedux.push(
                    `/user/third/register?code=${data.result.code}&service_id=${data.result.service_id}&oauth_user_id=${data.result.oauth_user_id}&oauth_type=${data.result.oauth_type}`
                  )
                );
              } else {
                dispatch(
                  routerRedux.push(
                    `/user/third/login?code=${data.result.code}&service_id=${data.result.service_id}&oauth_user_id=${data.result.oauth_user_id}&oauth_type=${data.result.oauth_type}`
                  )
                );
              }
            }
          }
        },
        handleError: err => {
          this.handleError(err);
        }
      });
    } else {
      globalUtil.removeCookie();
      dispatch(routerRedux.replace(loginUrl));
    }
  }

  handleError = err => {
    const { dispatch } = this.props;
    const status = err && err.status;
    if (err && (status || err.msg_show)) {
      message.warning(
        (status && status === 500 && '第三方认证失败，请重新认证') ||
          err.msg_show,
        1,
        () => {
          dispatch(routerRedux.push(loginUrl));
        }
      );
    }
  };
  handleSuccess = () => {
    const { dispatch } = this.props;
    let redirect = window.localStorage.getItem('redirect');
    if (!redirect || redirect === '') {
      redirect = '/';
    }
    window.localStorage.setItem('redirect', '');
    if (redirect.startsWith('/')) {
      dispatch(routerRedux.push(redirect));
    } else {
      window.location.href = redirect;
    }
  };

  render() {
    const { resultState, title, desc } = this.state;
    return (
      <Result
        type={resultState}
        title={title}
        description={desc}
        style={{
          marginTop: '20%',
          marginBottom: 16
        }}
      />
    );
  }
}

/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { message } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Result from '../../components/Result';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';

const loginUrl = '/user/login?disable_auto_login=true';

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo
}))
export default class ThirdLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resultState: 'ing',
      title: formatMessage({id:'login.Third.authentication'}),
      desc: formatMessage({id:'login.Third.wait_for'})
    };
  }
  // eslint-disable-next-line consistent-return
  componentWillMount() {
    const code = rainbondUtil.OauthParameter('code');
    const service_id = rainbondUtil.OauthParameter('service_id');
    const isSaas = rainbondInfo?.is_saas || false;
    const { dispatch, rainbondInfo } = this.props;
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
              const status = res.response_data && res.response_data.status;
              if (status && status === 400) {
                this.setState(
                  {
                    resultState: 'error',
                    title: formatMessage({id:'login.Third.Failed'}),
                    desc: formatMessage({id:'login.Third.Authentication'})
                  },
                  () => {
                    setTimeout(() => {
                      this.handleLoginUrl();
                    }, 1000);
                  }
                );
              } else if (res.status_code && res.status_code === 200) {
                this.setState(
                  {
                    resultState: 'success',
                    title: formatMessage({id:'login.Third.success'}),
                    desc: ''
                  },
                  () => {
                    if (res.bean && res.bean.token) {
                      cookie.set('token', res.bean.token);
                    }
                    this.handleSuccess();
                  }
                );
              } else {
                this.handleLoginUrl();
              }
            } else {
              this.handleLoginUrl();
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
          if (res) {
            const status = res.response_data && res.response_data.status;
            if (
              status &&
              (status === 400 || status === 401 || status === 404)
            ) {
              this.setState(
                {
                  resultState: 'error',
                  title: formatMessage({id:'login.Third.Failed'}),
                  desc: res.msg_show || formatMessage({id:'login.Third.token'})
                },
                () => {
                  setTimeout(() => {
                    this.handleLoginUrl();
                  }, 1000);
                }
              );
            } else if (res.status_code === 200) {
              const data = res.bean;
              if (data && data.token) {
                cookie.set('token', data.token);
                this.handleSuccess();
                return null;
              }
              if (data && data.result) {
                // if not login
                if (!data.result.is_authenticated) {
                  if(isSaas) {
                    this.handleThirdRegister(data.result.code, data.result.service_id, data.result.oauth_user_id, data.result);
                  }else {
                    dispatch(
                    routerRedux.push(
                      `/user/third/register?code=${data.result.code}&service_id=${data.result.service_id}&oauth_user_id=${data.result.oauth_user_id}&oauth_type=${data.result.oauth_type}`
                    )
                  );
                  }
                } else {
                  if(!isSaas){
                    dispatch(
                      routerRedux.push(
                        `/user/third/login?code=${data.result.code}&service_id=${data.result.service_id}&oauth_user_id=${data.result.oauth_user_id}&oauth_type=${data.result.oauth_type}`
                      )
                    );
                  }
                }
              }
            } else {
              this.handleLoginUrl();
            }
          } else {
            this.handleLoginUrl();
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

  handleThirdRegister = (code, service_id, oauth_user_id, data) => {
    const { dispatch } = this.props;

    if (code && service_id && oauth_user_id) {
      dispatch({
        type: 'user/thirdRegister',
        payload: {
          user_name: data.oauth_user_name,
          password: data.oauth_user_name,
          confirmPassword: data.oauth_user_name,
          email: data.oauth_user_email,
        },
        callback: data => {
          if (data && data.token !== '') {
            cookie.set('token', data.token);
            dispatch({
              type: 'user/fetchThirdBinding',
              payload: {
                service_id,
                oauth_user_id
              },
              callback: res => {
                if (res && res.status_code === 200) {
                  message.success(formatMessage({id:'login.ThirdLogin.success'}), 1, () => {
                    // support redirect to the page before login
                    let redirect = window.localStorage.getItem('redirect');
                    if (!redirect || redirect === '') {
                      redirect = '/';
                    }
                    if (redirect.startsWith('/')) {
                      dispatch(routerRedux.push(redirect));
                    } else {
                      window.location.href = redirect;
                    }
                  });
                } else {
                  this.handleError();
                }
              },
              handleError: () => {
                this.handleError();
              }
            });
          } else {
            this.handleError();
          }
        }
      });
    }
  }
  handleLoginUrl = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(loginUrl));
  };
  handleError = err => {
    const status = (err && err.status) || (err.response && err.response.status);
    if (status && status === 500) {
      message.warning(formatMessage({id:'login.Third.again'}));
    } else {
      handleAPIError(err);
    }
    setTimeout(() => {
      this.handleLoginUrl();
    }, 1000);
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
      <div 
      style={{
        paddingTop: '20%',
        paddingBottom: 16
      }}>
        <Result
          type={resultState}
          title={title}
          description={desc}
        />
      </div>
    );
  }
}

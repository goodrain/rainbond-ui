import React, { Component } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import rainbondUtil from '../../utils/rainbond';
import cookie from '../../utils/cookie';
import Result from '../../components/Result';
import { message } from 'antd';

@connect()
export default class ThirdLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resultState: 'ing',
      title: '第三方认证中...',
      desc: '此过程可能比较耗时，请耐心等待',
    };
  }
  componentWillMount() {
    const code = rainbondUtil.OauthParameter('code');
    const service_id = rainbondUtil.OauthParameter('service_id');
    const { dispatch } = this.props;
    if (
      code &&
      service_id &&
      code != 'None' &&
      service_id != 'None' &&
      code != '' &&
      service_id != ''
    ) {
      const token = cookie.get('token');
      // if user login
      if (token) {
        dispatch({
          type: 'user/fetchThirdLoginBinding',
          payload: {
            code,
            service_id,
          },
          callback: resdata => {
            if (resdata && resdata.status && resdata.status === 400) {
              this.setState(
                {
                  resultState: 'error',
                  title: '第三方认证未通过',
                  desc: '认证失败,请重新认证',
                },
                () => {
                  dispatch(routerRedux.push(`/`));
                }
              );
            } else if (resdata && resdata._code === 200) {
              this.setState(
                {
                  resultState: 'success',
                  title: '第三方认证通过',
                  desc: '',
                },
                () => {
                  dispatch(routerRedux.push(`/`));
                }
              );
            }
          },
          handleError: res => {
            if (res && res.status === 500) {
              message.warning('第三方认证失败，请重新认证', 1, () => {
                this.props.dispatch(
                  routerRedux.push(`/user/login?disable_auto_login=true`)
                );
              });
            }
          },
        });
        return null;
      }

      // if not login

      dispatch({
        type: 'user/fetchThirdCertification',
        payload: {
          code,
          service_id,
          domain: window.location.host,
        },
        callback: res => {
          if (res && res.status && res.status === 400) {
            this.setState(
              {
                resultState: 'error',
                title: '第三方认证未通过',
                desc: '未成功获取access_token,请重新认证。',
              },
              () => {
                dispatch(
                  routerRedux.push(`/user/login?disable_auto_login=true`)
                );
              }
            );
          } else if (res && res._code === 200) {
            const data = res.bean;
            if (data && data.token) {
              cookie.set('token', data.token);
              dispatch(routerRedux.push(`/`));
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
        handleError: res => {
          if (res && res.status === 500) {
            message.warning('第三方认证失败，请重新认证', 1, () => {
              this.props.dispatch(
                routerRedux.push(`/user/login?disable_auto_login=true`)
              );
            });
          }
        },
      });
    } else {
      this.props.dispatch(
        routerRedux.replace('/user/login?disable_auto_login=true')
      );
    }
  }

  render() {
    const { resultState, title, desc } = this.state;
    return (
      <Result
        type={resultState}
        title={title}
        description={desc}
        style={{
          marginTop: '20%',
          marginBottom: 16,
        }}
      />
    );
  }
}

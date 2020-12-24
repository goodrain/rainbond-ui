import { Alert, Col, message, Row } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Component } from 'react';
import cookie from '../../utils/cookie';
import rainbondUtil from '../../utils/rainbond';
import styles from './Login.less';
import LoginComponent from './loginComponent';

const code = rainbondUtil.OauthParameter('code');
const service_id = rainbondUtil.OauthParameter('service_id');
const oauth_user_id = rainbondUtil.OauthParameter('oauth_user_id');
const oauth_type = rainbondUtil.OauthParameter('oauth_type');

@connect(({ loading, global }) => ({
  login: {},
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
  submitting: loading.effects['user/login']
}))
export default class LoginPage extends Component {
  state = {
    user_info: null
  };

  componentDidMount() {
    this.props.dispatch({
      type: 'user/fetchThirdInfo',
      payload: {
        code,
        service_id
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            user_info: res.bean.user_info
          });
        }
      }
    });
  }
  handleSubmit = values => {
    const { dispatch } = this.props;
    if (code && service_id && oauth_user_id) {
      dispatch({
        type: 'user/thirdLogin',
        payload: {
          ...values
        },
        callback: data => {
          if (data && data._code === 200) {
            cookie.set('token', data.bean.token);
            dispatch({
              type: 'user/fetchThirdBinding',
              payload: {
                service_id,
                oauth_user_id
              },
              callback: res => {
                if (res && res.status && res.status === 400) {
                  message.warning('认证失败，请重新认证', 1, () => {
                    dispatch(routerRedux.replace('/user/login'));
                  });
                } else if (res && res._code === 200) {
                  message.success('认证成功', 1, () => {
                    // support redirect to the page before login
                    let redirect = window.localStorage.getItem('redirect');
                    if (!redirect || redirect == '') {
                      redirect = '/';
                    }
                    console.log('third login success, redirect to ' + redirect);
                    if (redirect.startsWith('/')) {
                      dispatch(routerRedux.push(redirect));
                    } else {
                      window.location.href = redirect;
                    }
                    window.localStorage.setItem('redirect', '');
                  });
                }
              }
            });
          }
        }
      });
    }
  };

  render() {
    const { rainbondInfo, isRegist } = this.props;
    const { user_info } = this.state;
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const code = rainbondUtil.OauthParameter('code');
    const service_id = rainbondUtil.OauthParameter('service_id');
    let oauthServer = null;
    // eslint-disable-next-line no-unused-expressions
    rainbondUtil.OauthbEnable(rainbondInfo) &&
      rainbondInfo.oauth_services &&
      rainbondInfo.oauth_services.value &&
      rainbondInfo.oauth_services.value.map(item => {
        if (item.service_id == service_id) {
          oauthServer = item;
        }
      });
    return (
      <div className={styles.main}>
        <Alert
          style={{ margin: '24px 0' }}
          message={`来自${oauthServer && oauthServer.name}登录的
          ${user_info && user_info.oauth_user_name}
          您好！你需要补充完整平台账号信息`}
          type="info"
        />
        <Row style={{ marginBottom: '24px' }}>
          <Col
            span={10}
            className={styles.boxJump}
            style={{ background: '#CDE2FF' }}
          >
            {!firstRegist && (
              <Link
                to={`/user/third/login?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`}
              >
                已有账号，马上绑定
              </Link>
            )}
          </Col>
          {isRegist && (
            <Col span={10} className={styles.boxJump} offset={4}>
              <Link
                to={`/user/third/register?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`}
              >
                未有账号，创建账号
              </Link>
            </Col>
          )}
        </Row>
        <LoginComponent onSubmit={this.handleSubmit} type="thirdLogin" />
      </div>
    );
  }
}

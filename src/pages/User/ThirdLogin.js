import { Alert, Col, message, Row } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import rainbondUtil from '../../utils/rainbond';
import styles from './Login.less';
import LoginComponent from './loginComponent';

const code = rainbondUtil.OauthParameter('code');
const service_id = rainbondUtil.OauthParameter('service_id');
const oauth_user_id = rainbondUtil.OauthParameter('oauth_user_id');

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
        if (res && res.status_code === 200) {
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
          if (data && data.status_code === 200) {
            cookie.set('token', data.bean.token);
            dispatch({
              type: 'user/fetchThirdBinding',
              payload: {
                service_id,
                oauth_user_id
              },
              callback: res => {
                if (res && res.status && res.status === 400) {
                  message.warning(`${formatMessage({id:'login.Third.Authentication'})}`, 1, () => {
                    dispatch(
                      routerRedux.replace('/user/login?disable_auto_login=true')
                    );
                  });
                } else if (res && res.status_code === 200) {
                  message.success(`${formatMessage({id:'login.ThirdLogin.success'})}`, 1, () => {
                    // support redirect to the page before login
                    let redirect = window.localStorage.getItem('redirect');
                    if (!redirect || redirect == '') {
                      redirect = '/';
                    }
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
    const oauthServerName = (oauthServer && oauthServer.name) || '';
    const oauthUserName = (user_info && user_info.oauth_user_name) || '';
    const welcome = oauthServerName && `${formatMessage({id:'login.ThirdLogin.from'},{name:oauthServerName})}`;
    const jumpAddress = targets => {
      return `/user/third/${targets}?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`;
    };
    return (
      <div className={styles.main}>
        <Alert
          style={{ margin: '24px 0' }}
          message={`${welcome}${oauthUserName}${formatMessage({id:'login.ThirdLogin.supplement'})}`}
          type="info"
        />
        <Row style={{ marginBottom: '24px' }}>
          <Col
            span={10}
            className={styles.boxJump}
            style={{ background: '#CDE2FF' }}
          >
            {!firstRegist && (
              <Link to={jumpAddress('login')}><FormattedMessage id="login.ThirdLogin.bind"/></Link>
            )}
          </Col>
          {isRegist && (
            <Col span={10} className={styles.boxJump} offset={4}>
              <Link to={jumpAddress('register')}><FormattedMessage id="login.ThirdLogin.creat"/></Link>
            </Col>
          )}
        </Row>
        <LoginComponent onSubmit={this.handleSubmit} type="thirdLogin" />
      </div>
    );
  }
}

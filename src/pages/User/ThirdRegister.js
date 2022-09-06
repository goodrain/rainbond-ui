/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { Alert, Col, Form, message, Row } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import rainbondUtil from '../../utils/rainbond';
import styles from './Register.less';
import RegisterComponent from './registerComponent';

const oauth_user_id = rainbondUtil.OauthParameter('oauth_user_id');
const code = rainbondUtil.OauthParameter('code');
const service_id = rainbondUtil.OauthParameter('service_id');
const loginUrl = '/user/login?disable_auto_login=true';

@connect(({ user, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
  isRegist: global.isRegist
}))
@Form.create()
export default class Register extends Component {
  // first user, to register admin
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
        type: 'user/thirdRegister',
        payload: {
          ...values
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
  };
  handleError = () => {
    const { dispatch } = this.props;
    message.warning(formatMessage({id:'ogin.Third.Authentication'}), 1, () => {
      dispatch(routerRedux.push(loginUrl));
    });
  };

  render() {
    const { isRegist, dispatch, rainbondInfo } = this.props;
    if (!isRegist) {
      dispatch(
        routerRedux.replace(
          code && service_id && oauth_user_id
            ? `/user/login?code=${code}&service_id=${service_id}`
            : loginUrl
        )
      );
      return null;
    }
    const { user_info } = this.state;
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    let oauthServer = null;
    // eslint-disable-next-line no-unused-expressions
    rainbondUtil.OauthbEnable(rainbondInfo) &&
      rainbondInfo.oauth_services &&
      rainbondInfo.oauth_services.value &&
      rainbondInfo.oauth_services.value.map(item => {
        if (item.service_id === service_id) {
          oauthServer = item;
        }
        return item;
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
          <Col span={10} className={styles.boxJump}>
            {!firstRegist && (
              <Link to={jumpAddress('login')}><FormattedMessage id="login.ThirdLogin.bind"/></Link>
            )}
          </Col>
          <Col
            span={10}
            style={{ background: '#CDE2FF' }}
            className={styles.boxJump}
            offset={4}
          >
            <Link to={jumpAddress('register')}><FormattedMessage id="login.ThirdLogin.creat"/></Link>
          </Col>
        </Row>
        <RegisterComponent
          user_info={user_info}
          onSubmit={this.handleSubmit}
          type="thirdRegister"
        />
      </div>
    );
  }
}

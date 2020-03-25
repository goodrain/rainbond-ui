import React, { Component } from 'react';
import { connect } from 'dva';
import { Divider, Row, Col } from 'antd';
import styles from './Login.less';
import rainbondUtil from '../../utils/rainbond';
import LoginComponent from './loginComponent';
import oauthUtil from '../../utils/oauth';

@connect(({ global }) => ({
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
}))
export default class LoginPage extends Component {
  handleSubmit = values => {
    const { dispatch } = this.props;
    const query_params = new URLSearchParams(this.props.location.search);
    const redirect = query_params.get('redirect');
    dispatch({
      type: 'user/login',
      payload: {
        ...values,
      },
      callback: () => {
        let url = '/';
        if (redirect) {
          url = redirect;
        }
        window.location.href = url;
      },
    });
  };
  componentWillMount() {
    const { dispatch } = this.props;
    dispatch({ type: 'global/hideNeedLogin' });
  }

  render() {
    const { rainbondInfo } = this.props;

    const oauthInfo =
      rainbondInfo &&
      rainbondInfo.enterprise_center_oauth &&
      rainbondInfo.enterprise_center_oauth.value;
    const url = oauthInfo && oauthUtil.getAuthredictURL(oauthInfo);
    const icon = oauthInfo && oauthUtil.getIcon(oauthInfo);

    return (
      <div className={styles.main}>
        <LoginComponent onSubmit={this.handleSubmit} type="login" />
        {rainbondUtil.OauthbEnable(rainbondInfo) && oauthInfo && (
          <div className={styles.thirdBox}>
            <Divider>
              <div className={styles.thirdLoadingTitle}>第三方登录</div>
            </Divider>
            <Row className={styles.third}>
              <Col
                span={8}
                className={styles.thirdCol}
                key={oauthInfo.client_id}
              >
                <a href={url}>
                  {icon}
                  <p>{oauthInfo.name}</p>
                </a>
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  }
}

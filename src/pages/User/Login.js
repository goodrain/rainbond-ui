import React, { Component } from "react";
import { connect } from "dva";
import { Divider, Row, Col } from "antd";
import styles from "./Login.less";
import rainbondUtil from "../../utils/rainbond";
import LoginComponent from "./loginComponent";
import oauthUtil from "../../utils/oauth";

@connect(({ global }) => ({
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
}))
export default class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      oauthServicesList: []
    };
  }
  componentWillMount() {
    const { dispatch, rainbondInfo } = this.props;
    dispatch({ type: "global/hideNeedLogin" });
    // if (rainbondInfo.enterprise_id) {
    //   this.fetchEnterpriseInfo(rainbondInfo.enterprise_id);
    // }
  }
  handleSubmit = values => {
    const { dispatch, location } = this.props;
    const query_params = new URLSearchParams(location.search);
    const redirect = query_params.get("redirect");
    dispatch({
      type: "user/login",
      payload: {
        ...values
      },
      callback: () => {
        let url = "/";
        if (redirect) {
          url = redirect;
        }
        window.location.href = url;
      }
    });
  };
  fetchEnterpriseInfo = eid => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchEnterpriseInfo",
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._code === 200 && res.bean && res.bean.oauth_services) {
          // eslint-disable-next-line camelcase
          const { oauth_services = {} } = res.bean;
          if (oauth_services.enable) {
            this.setState({
              // eslint-disable-next-line react/no-unused-state
              oauthServicesList:
                oauth_services.value &&
                oauth_services.value.length > 0 &&
                oauth_services.value
            });
          }
        }
      }
    });
  };

  render() {
    const { rainbondInfo } = this.props;
    const { oauthServicesList } = this.state;
    const oauthInfo =
      rainbondInfo &&
      rainbondInfo.enterprise_center_oauth &&
      rainbondInfo.enterprise_center_oauth.value;
    const url = oauthInfo && oauthUtil.getAuthredictURL(oauthInfo);
    const icon = oauthInfo && oauthUtil.getIcon(oauthInfo);

    return (
      <div className={styles.main}>
        <LoginComponent onSubmit={this.handleSubmit} type="login" />
        {rainbondUtil.OauthbEnable(rainbondInfo) &&
          (oauthInfo ||
            (oauthServicesList && oauthServicesList.length > 0)) && (
            <div className={styles.thirdBox}>
              <Divider>
                <div className={styles.thirdLoadingTitle}>第三方登录</div>
              </Divider>
              <Row className={styles.third}>
                {oauthInfo && (
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
                )}
                {oauthServicesList.map(item => {
                  const { name, service_id } = item;
                  return (
                    <Col span="8" className={styles.thirdCol} key={service_id}>
                      <a href={oauthUtil.getAuthredictURL(item)}>
                        {oauthUtil.getIcon(item)}
                        <p>{name}</p>
                      </a>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
      </div>
    );
  }
}

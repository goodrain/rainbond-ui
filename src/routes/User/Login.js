import React, { Component } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import { Checkbox, Alert, Divider, Row, Col, Icon } from "antd";
import Login from "../../components/Login";
import styles from "./Login.less";
import cookie from "../../utils/cookie";
import Gitte from "../../../public/images/gitee.svg";
import rainbondUtil from "../../utils/rainbond";

const { Tab, UserName, Password, Submit } = Login;

@connect(({ loading, global }) => ({
  login: {},
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
  submitting: loading.effects["user/login"]
}))
export default class LoginPage extends Component {
  state = {
    type: "account",
    autoLogin: true
  };

  onTabChange = type => {
    this.setState({ type });
  };

  handleSubmit = (err, values) => {
    if (!err) {
      this.props.dispatch({
        type: "user/login",
        payload: {
          ...values
        }
      });
      let id = rainbondUtil.OauthParameter("id");
      let service_id = rainbondUtil.OauthParameter("service_id");
      if (id && service_id) {
        this.props.dispatch({
          type: "user/fetchThirdBinding",
          payload: {
            oauth_user_id: id,
            service_id
          }
        });
      }
    }
  };

  changeAutoLogin = e => {
    this.setState({ autoLogin: e.target.checked });
  };

  renderMessage = content => (
    <Alert
      style={{
        marginBottom: 24
      }}
      message={content}
      type="error"
      showIcon
    />
  );

  render() {
    const { login, submitting, rainbondInfo } = this.props;
    const { type } = this.state;
    return (
      <div className={styles.main}>
        <Login
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.handleSubmit}
        >
          <Tab key="account" tab="">
            {login.status === "error" &&
              login.type === "account" &&
              !login.submitting &&
              this.renderMessage("账户或密码错误")}
            <UserName name="nick_name" placeholder="用户名/邮箱" />
            <Password name="password" placeholder="密码" />
          </Tab>
          <div>
            <Checkbox
              checked={this.state.autoLogin}
              onChange={this.changeAutoLogin}
            >
              自动登录
            </Checkbox>
          </div>
          <Submit loading={submitting}>登录</Submit>
          <div className={styles.other}>
            {this.props.isRegist && (
              <Link className={styles.register} to="/user/register">
                注册账户
              </Link>
            )}
          </div>
        </Login>
        {rainbondUtil.OauthbEnable(rainbondInfo) && (
          <div>
            <Divider>
              <div className={styles.thirdLoading}>第三方登录</div>
            </Divider>
            <Row className={styles.third}>
              {rainbondInfo &&
                rainbondInfo.oauth_services.value &&
                rainbondInfo.oauth_services.value.map(item => {
                  const {
                    oauth_type,
                    name,
                    client_id,
                    auth_url,
                    redirect_uri,
                    service_id
                  } = item;
                  return (
                    <Col span="8" key={client_id} style={{ cursor: "pointer" }}>
                      <a
                        href={`${auth_url}?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}/console/oauth/redirect/${service_id}`}
                      >
                        {oauth_type === "gitte" ? (
                          <img src={Gitte} />
                        ) : (
                          <Icon
                            type={oauth_type === "other" ? "star" : oauth_type}
                          />
                        )}
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

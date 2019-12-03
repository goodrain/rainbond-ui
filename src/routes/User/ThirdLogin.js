import React, { Component } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import {
  Checkbox,
  Alert,
  Divider,
  Row,
  Col,
  Icon,
  notification,
  message
} from "antd";
import Login from "../../components/Login";
import styles from "./Login.less";
import rainbondUtil from "../../utils/rainbond";
import LoginComponent from "./loginComponent";
import cookie from "../../utils/cookie";
import Gitee from "../../../public/images/gitee.png";
import Github from "../../../public/images/github.png";
import Gitlab from "../../../public/images/gitlab.png";

const code = rainbondUtil.OauthParameter("code");
const service_id = rainbondUtil.OauthParameter("service_id");
const oauth_user_id = rainbondUtil.OauthParameter("oauth_user_id");
const oauth_type = rainbondUtil.OauthParameter("oauth_type");

@connect(({ loading, global }) => ({
  login: {},
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo,
  submitting: loading.effects["user/login"]
}))
export default class LoginPage extends Component {
  state = {
    user_info: null
  };

  componentDidMount() {
    this.props.dispatch({
      type: "user/fetchThirdInfo",
      payload: {
        code,
        service_id
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            user_info: res.data.bean.user_info
          });
        }
      }
    });
  }
  handleSubmit = values => {
    const { dispatch } = this.props;
    if (code && service_id && oauth_user_id) {
      dispatch({
        type: "user/thirdLogin",
        payload: {
          ...values
        },
        callback: data => {
          if (data && data._code === 200) {
            cookie.set("token", data.bean.token);
            dispatch({
              type: "user/fetchThirdBinding",
              payload: {
                service_id,
                oauth_user_id
              },
              callback: res => {
                if (res && res.status && res.status === 400) {
                  message.warning("认证失败，请重新认证", 2, () => {
                    window.location.reload();
                  });
                } else if (res && res._code === 200) {
                  message.success("认证成功", 2, () => {
                    window.location.reload();
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
    const { login, submitting, rainbondInfo, user_info } = this.props;
    const { type } = this.state;
    let code = rainbondUtil.OauthParameter("code");
    let service_id = rainbondUtil.OauthParameter("service_id");
    const map = {
      github: Github,
      gitlab: Gitlab,
      gitee: Gitee
    };
    console.log("oauth_type", map[oauth_type]);

    return (
      <div className={styles.main}>
        <p style={{ marginBottom: "24px" }}>
          来自 <img src={map[oauth_type]} alt={oauth_type} /> 登录的
          {user_info && user_info.oauth_user_name} 您好！你现在可以进行绑定
        </p>
        <Row style={{ marginBottom: "24px" }}>
          <Col
            span={10}
            className={styles.boxJump}
            style={{ background: "#CDE2FF" }}
          >
            {!this.state.firstRegist && (
              <Link
                to={`/user/third/login?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`}
              >
                已有账号，马上绑定
              </Link>
            )}
          </Col>
          <Col span={10} className={styles.boxJump} offset={4}>
            <Link
              to={`/user/third/register?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`}
            >
              未有账号，创建账号
            </Link>
          </Col>
        </Row>
        <LoginComponent onSubmit={this.handleSubmit} type="thirdLogin" />
      </div>
    );
  }
}

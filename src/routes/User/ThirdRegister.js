import React, { Component } from "react";
import { connect } from "dva";
import { routerRedux, Link } from "dva/router";
import { Form, Input, Button, Row, Col, message } from "antd";
import styles from "./Register.less";
import config from "../../config/config";
import cookie from "../../utils/cookie";
import RegisterComponent from "./registerComponent";
import rainbondUtil from "../../utils/rainbond";

const FormItem = Form.Item;

const passwordProgressMap = {
  ok: "success",
  pass: "normal",
  poor: "exception"
};

const oauth_user_id = rainbondUtil.OauthParameter("oauth_user_id");
const code = rainbondUtil.OauthParameter("code");
const service_id = rainbondUtil.OauthParameter("service_id");

@connect(({ user, loading, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
  isRegist: global.isRegist
}))
@Form.create()
export default class Register extends Component {
  // first user, to register admin
  state = {
    user_info: null,
    firstRegist:
      this.props.rainbondInfo && !this.props.rainbondInfo.is_user_register
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
        type: "user/thirdRegister",
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

  changeTime = () => {
    this.setState({
      time: Date.now()
    });
  };

  render() {
    if (!this.props.isRegist) {
      this.props.dispatch(
        routerRedux.replace(
          code && service_id && oauth_user_id
            ? `/user/login?code=${code}&service_id=${service_id}`
            : "/user/login"
        )
      );
      return null;
    }
    const { user_info } = this.state;
    const { form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <div className={styles.main}>
        <p style={{ marginBottom: "24px" }}>
          来自 github 登录的{user_info && user_info.oauth_user_name}{" "}
          您好！你现在可以进行绑定
        </p>
        <Row style={{ marginBottom: "24px" }}>
          <Col span={10} className={styles.boxJump}>
            {!this.state.firstRegist && (
              <Link
                to={`/user/third/login?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`}
              >
                已有账号，马上绑定
              </Link>
            )}
          </Col>
          <Col
            span={10}
            style={{ background: "#CDE2FF" }}
            className={styles.boxJump}
            offset={4}
          >
            <Link
              to={`/user/third/register?code=${code}&service_id=${service_id}&oauth_user_id=${oauth_user_id}`}
            >
              未有账号，创建账号
            </Link>
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

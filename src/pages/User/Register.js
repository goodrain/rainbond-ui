import React, { Component } from "react";
import { connect } from "dva";
import { routerRedux, Link } from "dva/router";
import { Form, Input, Button, Row, Col, Progress } from "antd";
import styles from "./Register.less";
import RegisterComponent from "./registerComponent";
import cookie from "../../utils/cookie";

const FormItem = Form.Item;

const passwordProgressMap = {
  ok: "success",
  pass: "normal",
  poor: "exception"
};

@connect(({ user, loading, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
  isRegist: global.isRegist,
  submitting: loading.effects["user/register"]
}))
@Form.create()
export default class Register extends Component {
  // first user, to register admin
  state = {
    count: 0,
    confirmDirty: false,
    visible: false,
    help: "",
    prefix: "86",
    time: Date.now(),
    firstRegist:
      this.props.rainbondInfo && !this.props.rainbondInfo.is_user_register
  };


  handleSubmit = values => {
    this.props.dispatch({
      type: "user/register",
      payload: {
        ...values
      },
      complete: () => {
        this.changeTime();
      }
    });
  };

  changeTime = () => {
    this.setState({
      time: Date.now()
    });
  };
  render() {
    if (!this.props.isRegist) {
      this.props.dispatch(routerRedux.replace("/user/login"));
      return null;
    }
    return (
      <div className={styles.main}>
        <h3>{this.state.firstRegist ? "管理员注册" : "用户注册"}</h3>
        <RegisterComponent onSubmit={this.handleSubmit} type="register" />
      </div>
    );
  }
}

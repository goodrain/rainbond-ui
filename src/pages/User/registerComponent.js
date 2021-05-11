/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/alt-text */
import { Button, Col, Form, Input, Progress, Row } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import apiconfig from '../../../config/api.config';
import userUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import styles from './Register.less';

const FormItem = Form.Item;

const passwordProgressMap = {
  ok: 'success',
  pass: 'normal',
  poor: 'exception'
};

@connect(({ user, loading, global }) => ({
  register: user.register,
  rainbondInfo: global.rainbondInfo,
  isRegist: global.isRegist,
  submitting: loading.effects['user/register'],
  thirdsubmitting: loading.effects['user/thirdRegister']
}))
@Form.create()
export default class RegisterComponent extends Component {
  // first user, to register admin
  state = {
    confirmDirty: false,
    visible: false,
    help: '',
    time: Date.now()
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getPasswordStatus = () => {
    const { form } = this.props;
    const value = form.getFieldValue('password');
    if (value && value.length > 9) {
      return 'ok';
    }
    if (value && value.length > 5) {
      return 'pass';
    }
    return 'poor';
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          userUtil.removeCookie();
          if (onSubmit) {
            onSubmit(values);
          }
        }
      }
    );
  };

  handleConfirmBlur = e => {
    const { value } = e.target;
    this.setState({
      confirmDirty: this.state.confirmDirty || !!value
    });
  };

  checkConfirm = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue('password')) {
      callback('两次输入的密码不匹配!');
    } else {
      callback();
    }
  };

  checkPassword = (rule, value, callback) => {
    if (!value) {
      this.setState({
        help: '请输入密码！',
        visible: !!value
      });
      callback('error');
    } else {
      this.setState({ help: '' });
      if (!this.state.visible) {
        this.setState({
          visible: !!value
        });
      }
      if (value.length < 8) {
        this.setState({
          help: '密码不能少于8位！',
          visible: !!value
        });
        callback('error');
      } else {
        const { form } = this.props;
        if (value && this.state.confirmDirty) {
          form.validateFields(['confirm'], { force: true });
        }
        callback();
      }
    }
  };

  changeTime = () => {
    this.setState({
      time: Date.now()
    });
  };
  renderPasswordProgress = () => {
    const { form } = this.props;
    const value = form.getFieldValue('password');
    const passwordStatus = this.getPasswordStatus();
    return value && value.length ? (
      <div className={styles[`progress-${passwordStatus}`]}>
        <Progress
          status={passwordProgressMap[passwordStatus]}
          className={styles.progress}
          strokeWidth={6}
          percent={value.length * 10 > 100 ? 100 : value.length * 10}
          showInfo={false}
        />
      </div>
    ) : null;
  };

  render() {
    const {
      form,
      submitting,
      thirdsubmitting,
      type,
      user_info,
      rainbondInfo
    } = this.props;
    const { getFieldDecorator } = form;
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const { time, help } = this.state;
    return (
      <Form onSubmit={this.handleSubmit}>
        {firstRegist && (
          <FormItem>
            {getFieldDecorator('enter_name', {
              rules: [
                {
                  required: true,
                  message: '请输入企业名称'
                }
              ]
            })(
              <Input autoComplete="off" size="large" placeholder="企业名称" />
            )}
          </FormItem>
        )}
        <Row>
          <Col span="12" style={{ padding: '0 8px 0 0' }}>
            <FormItem>
              {getFieldDecorator('real_name', {
                initialValue: user_info ? user_info.oauth_user_name : '',
                rules: [
                  { required: true, message: '请输入姓名' },
                  {
                    max: 24,
                    message: '最大长度24位'
                  },
                  {
                    pattern: /^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/,
                    message: '只支持字母、数字、中文、_和-组合'
                  }
                ]
              })(<Input autoComplete="off" size="large" placeholder="姓名" />)}
            </FormItem>
          </Col>
          <Col span="12" style={{ padding: '0 0 0 8px' }}>
            <FormItem>
              {getFieldDecorator('user_name', {
                initialValue: firstRegist ? 'admin' : '',
                rules: [
                  { required: true, message: '请输入用户名!' },
                  {
                    min: 3,
                    message: '最小长度3位'
                  },
                  {
                    max: 24,
                    message: '最大长度24位'
                  },
                  {
                    pattern: /^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/,
                    message: '只支持字母、数字、中文、_和-组合'
                  }
                ]
              })(
                <Input autoComplete="off" size="large" placeholder="用户名" />
              )}
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span="12" style={{ padding: '0 8px 0 0' }}>
            <FormItem>
              {getFieldDecorator('email', {
                initialValue: user_info ? user_info.oauth_user_email : '',
                rules: [
                  {
                    required: true,
                    message: '请输入邮箱地址！'
                  },
                  {
                    type: 'email',
                    message: '邮箱地址格式错误！'
                  }
                ]
              })(<Input autoComplete="off" size="large" placeholder="邮箱" />)}
            </FormItem>
          </Col>
          <Col span="12" style={{ padding: '0 0 0 8px' }}>
            <FormItem>
              {getFieldDecorator('phone', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: '请输入手机号'
                  },
                  {
                    pattern: /^[0-9]{11}$/,
                    message: '请输入正确的手机号'
                  }
                ]
              })(
                <Input autoComplete="off" size="large" placeholder="手机号" />
              )}
            </FormItem>
          </Col>
        </Row>
        <FormItem help={help}>
          {getFieldDecorator('password', {
            rules: [
              {
                validator: this.checkPassword
              }
            ]
          })(
            <Input
              size="large"
              type="password"
              placeholder="密码不能少于8位！"
              autoComplete="new-password"
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('password_repeat', {
            rules: [
              {
                required: true,
                message: '请确认密码！'
              },
              {
                validator: this.checkConfirm
              }
            ]
          })(
            <Input
              size="large"
              type="password"
              placeholder="确认密码"
              autoComplete="new-password"
            />
          )}
        </FormItem>
        <FormItem>
          <Row gutter={8}>
            <Col span={16}>
              {getFieldDecorator('captcha_code', {
                rules: [
                  {
                    required: true,
                    message: '请输入验证码！'
                  }
                ]
              })(
                <Input autoComplete="off" size="large" placeholder="验证码" />
              )}
            </Col>
            <Col span={8}>
              <img
                onClick={this.changeTime}
                src={`${apiconfig.baseUrl}/console/captcha?_=${time}`}
                style={{
                  width: '100%',
                  height: 40
                }}
              />
            </Col>
          </Row>
        </FormItem>
        <FormItem>
          <Button
            size="large"
            loading={type === 'register' ? submitting : thirdsubmitting}
            className={styles.submit}
            style={{ width: type === 'register' ? '50%' : '100%' }}
            type="primary"
            htmlType="submit"
          >
            {firstRegist
              ? '管理员注册'
              : type === 'register'
              ? '注册'
              : '注册并绑定'}
          </Button>

          {!firstRegist && type === 'register' && (
            <Link className={styles.login} to="/user/login">
              使用已有账户登录
            </Link>
          )}
        </FormItem>
        {firstRegist && (
          <Row>
            <Col
              span={24}
              style={{ fontSize: 12, marginTop: -12, color: '#666666' }}
            >
              请注意：注册使用即同意产品发行版用户许可协议。
            </Col>
          </Row>
        )}
      </Form>
    );
  }
}

/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/alt-text */
import { Button, Col, Form, Input, Row } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import apiconfig from '../../../config/api.config';
import userUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import styles from './Register.less';

const FormItem = Form.Item;

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
    time: Date.now()
  };
  componentDidMount() {
    userUtil.removeCookie();
  }
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
          const info = Object.assign({}, values);
          if (!values.name) {
            info.name = values.user_name;
          }
          if (onSubmit) {
            onSubmit(info);
          }
        }
      }
    );
  };

  checkPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value.length < 8) {
      callback('密码长度至少为8位');
    } else if (value && value.length > 16) {
      callback('最大长度16位');
    } else if (
      rule &&
      rule.field === 'password_repeat' &&
      value &&
      value !== form.getFieldValue('password')
    ) {
      callback('两次输入的密码不匹配!');
    } else {
      callback();
    }
  };

  changeTime = () => {
    this.setState({
      time: Date.now()
    });
  };

  render() {
    const {
      form,
      submitting,
      thirdsubmitting,
      type,
      user_info: userInfo,
      rainbondInfo
    } = this.props;
    const { getFieldDecorator } = form;
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const { time } = this.state;
    const checks = message => {
      return [
        {
          required: true,
          message
        },
        {
          validator: this.checkPassword
        }
      ];
    };
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
                initialValue: userInfo ? userInfo.oauth_user_name : '',
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
                    pattern: /^[a-zA-Z0-9_\-]+$/,
                    message: '只支持字母、数字、_和-组合'
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
                initialValue: userInfo ? userInfo.oauth_user_email : '',
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
        <FormItem>
          {getFieldDecorator('password', {
            rules: checks('请输入密码')
          })(
            <Input
              size="large"
              type="password"
              placeholder="请输入密码"
              autoComplete="new-password"
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('password_repeat', {
            rules: checks('请确认密码')
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
                  },
                  {
                    min: 4,
                    message: '请输入4位的验证码'
                  },
                  {
                    max: 4,
                    message: '请输入正确的验证码'
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

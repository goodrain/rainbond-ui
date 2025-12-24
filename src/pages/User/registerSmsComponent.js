/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/alt-text */
import { Button, Col, Form, Input, Row, Divider, Icon } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
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
    time: Date.now(),
    countdown: 0  // 添加倒计时状态
  };
  componentDidMount() {
    userUtil.removeCookie();
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

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

  changeTime = () => {
    this.setState({
      time: Date.now()
    });
  };
  getRedirectParams = () => {
    const redirect = window.localStorage.getItem('redirect');
    const redirectUrl = encodeURIComponent(redirect);
    if (redirect && redirect.includes('invite')) {
      return '/user/login?redirect=' + redirectUrl;
    }
    return '/user/login';
  }

  // 添加发送验证码方法
  handleSendCode = () => {
    const { form } = this.props;
    form.validateFields(['phone'], { force: true }, (err, values) => {
      if (!err) {
        const { dispatch } = this.props;
        dispatch({
          type: 'user/getSmsCode',
          payload: {
            phone: values.phone,
            purpose: 'register'
          },
          callback: () => {
            // 开始倒计时
            this.setState({ countdown: 60 });
            this.interval = setInterval(() => {
              const { countdown } = this.state;
              if (countdown <= 1) {
                clearInterval(this.interval);
              }
              this.setState({ countdown: countdown - 1 });
            }, 1000);
          }
        });
      }
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
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 0
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 24
        }
      }
    };
    const { getFieldDecorator } = form;
    const firstRegist = !rainbondUtil.fetchIsFirstRegist(rainbondInfo);
    const { time } = this.state;
    return (
      <div className={styles.registerWrapper}>
        <Form onSubmit={this.handleSubmit}>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.registerSmsComponent.username.label" defaultMessage="用户名" /></label>
            <FormItem {...formItemLayout}>
              {getFieldDecorator('nick_name', {
                rules: [
                  { required: true, message: formatMessage({ id: 'login.registerSmsComponent.username.required', defaultMessage: '请输入用户名' }) },
                  {
                    min: 3,
                    message: formatMessage({ id: 'login.registerSmsComponent.username.min', defaultMessage: '最小长度3位' })
                  },
                  {
                    max: 24,
                    message: formatMessage({ id: 'login.registerSmsComponent.username.max', defaultMessage: '最大长度24位' })
                  },
                  {
                    pattern: /^[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*$/,
                    message: formatMessage({ id: 'login.registerSmsComponent.username.pattern', defaultMessage: '只支持小写字母、数字和-组合' })
                  }
                ]
              })(
                <Input
                  autoComplete="off"
                  size="large"
                  prefix={<Icon type="user" className={styles.prefixIcon} />}
                  placeholder={formatMessage({ id: 'login.registerSmsComponent.username.placeholder', defaultMessage: '请输入用户名' })}
                />
              )}
            </FormItem>
          </div>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.registerSmsComponent.phone.label" defaultMessage="手机号" /></label>
            <FormItem {...formItemLayout}>
              {getFieldDecorator('phone', {
                rules: [
                  { required: true, message: formatMessage({ id: 'login.registerSmsComponent.phone.required', defaultMessage: '请输入手机号' }) },
                  {
                    pattern: /^1[3-9]\d{9}$/,
                    message: formatMessage({ id: 'login.registerSmsComponent.phone.pattern', defaultMessage: '手机号格式错误！' })
                  }
                ],
              })(
                <Input
                  autoComplete="off"
                  size="large"
                  prefix={<Icon type="mobile" className={styles.prefixIcon} />}
                  placeholder={formatMessage({ id: 'login.registerSmsComponent.phone.placeholder', defaultMessage: '请输入手机号' })}
                />
              )}
            </FormItem>
          </div>
          <div className={styles.formItem}>
            <label><FormattedMessage id="login.registerSmsComponent.code.label" defaultMessage="验证码" /></label>
            <FormItem {...formItemLayout}>
              <Row gutter={8}>
                <Col span={16}>
                  {getFieldDecorator('code', {
                    rules: [
                      { required: true, message: formatMessage({ id: 'login.registerSmsComponent.code.required', defaultMessage: '请输入验证码' }) },
                      { len: 6, message: formatMessage({ id: 'login.registerSmsComponent.code.len', defaultMessage: '请输入6位验证码' }) }
                    ],
                  })(
                    <Input
                      size="large"
                      prefix={<Icon type="safety-certificate" className={styles.prefixIcon} />}
                      placeholder={formatMessage({ id: 'login.registerSmsComponent.code.placeholder', defaultMessage: '请输入验证码' })}
                    />
                  )}
                </Col>
                <Col span={8}>
                  <Button
                    size="large"
                    disabled={this.state.countdown > 0}
                    onClick={this.handleSendCode}
                    style={{ width: '100%' }}
                  >
                    {this.state.countdown > 0
                      ? `${this.state.countdown}s`
                      : <FormattedMessage id="login.registerSmsComponent.getCode" defaultMessage="获取验证码" />
                    }
                  </Button>
                </Col>
              </Row>
            </FormItem>
          </div>
          <FormItem>
            <Button
              size="large"
              loading={type === 'register' ? submitting : thirdsubmitting}
              className={styles.submit}
              style={{ width: '100%' }}
              type="primary"
              htmlType="submit"
            >
              {firstRegist
                ? <FormattedMessage id="login.registerSmsComponent.adminRegister" defaultMessage="管理员注册" />
                : type === 'register'
                  ? <FormattedMessage id="login.registerSmsComponent.register" defaultMessage="注册" />
                  : <FormattedMessage id="login.registerSmsComponent.registerAndBind" defaultMessage="注册并绑定" />
              }
            </Button>
          </FormItem>
          {!firstRegist && type === 'register' && (
            <div className={styles.loginLink}>
              <span><FormattedMessage id="login.registerSmsComponent.hasAccount" defaultMessage="已有账户？" /></span>
              <Link to={this.getRedirectParams()}>
                <FormattedMessage id="login.registerSmsComponent.goLogin" defaultMessage="立即登录" />
              </Link>
            </div>
          )}
          {firstRegist && (
            <Row>
              <Col
                span={24}
                style={{ fontSize: 12, marginTop: -12, color: '#666666' }}
              >
                <FormattedMessage id="login.registerSmsComponent.agreement" defaultMessage="请注意：注册使用即同意产品发行版用户许可协议。" />
              </Col>
            </Row>
          )}
        </Form>
      </div>
    );
  }
}
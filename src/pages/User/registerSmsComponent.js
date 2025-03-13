/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/alt-text */
import { Button, Col, Form, Input, Row, Divider } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
      <Form onSubmit={this.handleSubmit}>
        <FormItem {...formItemLayout}>
          {getFieldDecorator('nick_name', {
            rules: [
              { required: true, message: formatMessage({ id: 'login.registerComponent.username' }) },
              {
                min: 3,
                message: formatMessage({ id: 'login.registerComponent.min_length' })
              },
              {
                max: 24,
                message: formatMessage({ id: 'login.registerComponent.max_length' })
              },
              {
                pattern: /^[a-z][a-z0-9_\-]*$/,
                message: formatMessage({ id: 'login.registerComponent.Only' })
              }
            ]
          })(
            <Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.user' })} />
          )}
        </FormItem>
        {/* 手机号 */}
        <FormItem>
          {getFieldDecorator('phone', {
            rules: [
              { required: true, message: formatMessage({ id: 'login.registerComponent.phone' }) },
              {
                pattern: /^1[3-9]\d{9}$/,
                message: formatMessage({ id: 'login.registerComponent.phone_error' })
              }
            ],
          })(<Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.phone' })} />)}
        </FormItem>
        
        {/* 验证码 */}
        <FormItem>
          <Row gutter={8}>
            <Col span={16}>
              {getFieldDecorator('code', {
                rules: [
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '请输入6位验证码' }
                ],
              })(<Input 
                placeholder={'请输入验证码'}
              />)}
            </Col>
            <Col span={8}>
              <Button
                disabled={this.state.countdown > 0}
                onClick={this.handleSendCode}
                style={{ width: '100%', marginTop: '-16px', color: '#000' }}
              >
                {this.state.countdown > 0 ? `${this.state.countdown}s` : '发送验证码'}
              </Button>
            </Col>
          </Row>
        </FormItem>
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
              ? <FormattedMessage id='login.registerComponent.admin' />
              : type === 'register'
                ? <FormattedMessage id='login.registerComponent.register' />
                : <FormattedMessage id='login.registerComponent.bind' />}
          </Button>

          {!firstRegist && type === 'register' && (
            <Link className={styles.login} to={this.getRedirectParams()}>
              <FormattedMessage id='login.registerComponent.use' />
            </Link>
          )}
        </FormItem>
        {firstRegist && (
          <Row>
            <Col
              span={24}
              style={{ fontSize: 12, marginTop: -12, color: '#666666' }}
            >
              <FormattedMessage id='login.registerComponent.be_careful' />
            </Col>
          </Row>
        )}
      </Form>
    );
  }
}
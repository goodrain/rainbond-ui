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
          if (values.password) {
            values.password_repeat = values.password
          }
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
      callback(formatMessage({ id: 'login.registerComponent.min' }));
    } else if (value && value.length > 16) {
      callback(formatMessage({ id: 'login.registerComponent.max' }));
    } else if (
      rule &&
      rule.field === 'password_repeat' &&
      value &&
      value !== form.getFieldValue('password')
    ) {
      callback(formatMessage({ id: 'login.registerComponent.pass' }));
    } else {
      callback();
    }
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
        {firstRegist &&
          <Divider >平台信息</Divider>
        }
        {firstRegist && (
          <FormItem {...formItemLayout}>
            {getFieldDecorator('enter_name', {
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'login.registerComponent.input_en_name' })
                }
              ]
            })(
              <Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.en_name' })} />
            )}
          </FormItem>
        )}
        <FormItem {...formItemLayout}>
          {getFieldDecorator('user_name', {
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
                pattern: /^[a-zA-Z0-9_\-]+$/,
                message: formatMessage({ id: 'login.registerComponent.Only' })
              }
            ]
          })(
            <Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.user' })} />
          )}
        </FormItem>
        <FormItem {...formItemLayout}>
          {getFieldDecorator('password', {
            rules: checks(formatMessage({ id: 'login.registerComponent.password' }))
          })(
            <Input
              size="large"
              type="password"
              placeholder={formatMessage({ id: 'login.registerComponent.password' })}
              autoComplete="new-password"
            />
          )}
        </FormItem>
        <FormItem {...formItemLayout}>
          {getFieldDecorator('confirmPassword', {
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'login.registerComponent.confirmPassword' }),
              },
              {
                validator: (rule, value, callback) => {
                  const { getFieldValue } = this.props.form;
                  if (value && value !== getFieldValue('password')) {
                    callback(formatMessage({ id: 'login.registerComponent.passwordMismatch' }));
                  } else {
                    callback();
                  }
                },
              },
            ],
          })(
            <Input
              size="large"
              type="password"
              placeholder={formatMessage({ id: 'login.registerComponent.confirmPassword' })}
              autoComplete="new-password"
            />
          )}
        </FormItem>
        <FormItem {...formItemLayout}>
          {getFieldDecorator('email', {
            initialValue: userInfo ? userInfo.oauth_user_email : '',
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'login.registerComponent.input_add' })
              },
              {
                type: 'email',
                message: formatMessage({ id: 'login.registerComponent.add_error' })
              }
            ]
          })(<Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.mailbox' })} />)}
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
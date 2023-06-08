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
          if(values.password){
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
          <Divider>企业信息</Divider>
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
        {firstRegist && 
          <Divider>用户详情</Divider>
        }
        <FormItem {...formItemLayout}>
          {getFieldDecorator('real_name', {
            initialValue: userInfo ? userInfo.oauth_user_name : '',
            rules: [
              { required: true, message: formatMessage({ id: 'login.registerComponent.input_name' }) },
              {
                max: 24,
                message: formatMessage({ id: 'login.registerComponent.Max' })
              },
              {
                pattern: /^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/,
                message: formatMessage({ id: 'login.registerComponent.only' })
              }
            ]
          })(<Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.name' })} />)}
        </FormItem>
        <Row>
          <Col span="12" style={{ padding: '0 8px 0 0' }}>
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
          </Col>
          <Col span="12" style={{ padding: '0 0 0 8px' }}>
            <FormItem {...formItemLayout}>
              {getFieldDecorator('phone', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'login.registerComponent.iphone' })
                  },
                  {
                    pattern: /^[0-9]{11}$/,
                    message: formatMessage({ id: 'login.registerComponent.input_iphone' })
                  }
                ]
              })(
                <Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.Iphone' })} />
              )}
            </FormItem>
          </Col>
        </Row>
        <FormItem {...formItemLayout}>
          <Row gutter={8}>
            <Col span={16}>
              {getFieldDecorator('captcha_code', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'login.registerComponent.Verification_Code' })
                  },
                  {
                    min: 4,
                    message: formatMessage({ id: 'login.registerComponent.four' })
                  },
                  {
                    max: 4,
                    message: formatMessage({ id: 'login.registerComponent.success' })
                  }
                ]
              })(
                <Input autoComplete="off" size="large" placeholder={formatMessage({ id: 'login.registerComponent.Verification' })} />
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
              ? <FormattedMessage id='login.registerComponent.admin' />
              : type === 'register'
                ? <FormattedMessage id='login.registerComponent.register' />
                : <FormattedMessage id='login.registerComponent.bind' />}
          </Button>

          {!firstRegist && type === 'register' && (
            <Link className={styles.login} to="/user/login">
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
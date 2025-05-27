import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PropTypes from 'prop-types';
import { Form, Button, Row, Col, notification } from 'antd';
import omit from 'omit.js';
import styles from './index.less';
import map from './map';

const FormItem = Form.Item;

function generator({ defaultProps, defaultRules, type }) {
  return (WrappedComponent) => {
    return class BasicComponent extends Component {
      static contextTypes = {
        form: PropTypes.object,
        updateActive: PropTypes.func
      };
      constructor(props) {
        super(props);
        this.state = {
          count: 0
        };
      }
      componentDidMount() {
        if (this.context.updateActive) {
          this.context.updateActive(this.props.name);
        }
      }
      componentWillUnmount() {
        clearInterval(this.interval);
      }
      onGetCaptcha = () => {
        const { mobile } = this.props;
        if (!mobile) {
          notification.error({
            message: '请输入手机号'
          });
          return;
        } else if (!/^1[3-9]\d{9}$/.test(mobile)) {
          notification.error({
            message: '手机号格式不正确'
          });
          return;
        }
        let count = 59;
        this.setState({ count });
        if (this.props.onGetCaptcha) {
          this.props.onGetCaptcha();
        }
        this.interval = setInterval(() => {
          count -= 1;
          this.setState({ count });
          if (count === 0) {
            clearInterval(this.interval);
          }
        }, 1000);
      };
      render() {
        const { getFieldDecorator } = this.context.form;
        const options = {};
        let otherProps = {};
        const {
          onChange,
          defaultValue,
          rules,
          name,
          ...restProps
        } = this.props;
        const { count } = this.state;
        options.rules = rules || defaultRules;
        if (onChange) {
          options.onChange = onChange;
        }
        if (defaultValue) {
          options.initialValue = defaultValue;
        }
        otherProps = restProps || otherProps;
        if (type === 'Captcha') {
          const inputProps = omit(otherProps, ['onGetCaptcha']);
          return (
            <FormItem>
              <Row gutter={8}>
                <Col span={16}>
                  {getFieldDecorator(
                    name,
                    options
                  )(<WrappedComponent {...defaultProps} {...inputProps} />)}
                </Col>
                <Col span={8}>
                  <Button
                    disabled={count}
                    className={styles.getCaptcha}
                    size="large"
                    onClick={this.onGetCaptcha}
                  >
                    {/* {count ? `${count} s` : `${formatMessage({id:'login.LoginItem'})}`} */}
                    {count ? `${count} s` : `获取验证码`}
                  </Button>
                </Col>
              </Row>
            </FormItem>
          );
        }
        return (
          <FormItem>
            {getFieldDecorator(
              name,
              options
            )(<WrappedComponent {...defaultProps} {...otherProps} />)}
          </FormItem>
        );
      }
    };
  };
}

const LoginItem = {};
Object.keys(map).forEach((item) => {
  LoginItem[item] = generator({
    defaultProps: map[item].props,
    defaultRules: map[item].rules,
    type: item
  })(map[item].component);
});

export default LoginItem;

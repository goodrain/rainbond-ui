/* eslint-disable camelcase */
import { Button, Drawer, Form, Input, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import Parameterinput from '../Parameterinput';
import cookie from '../../utils/cookie';
import styles from './index.less';

const FormItem = Form.Item;

@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
  editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy']
}))
class ParameterForm extends PureComponent {
  constructor(props) {
    super(props);
    const { editInfo } = this.props;
    this.state = {
      proxyBuffering: !!(
        editInfo &&
        editInfo.proxy_buffering &&
        editInfo.proxy_buffering === 'on'
      ),
      WebSocket: !!(editInfo && editInfo.WebSocket),
      webSockets: [
        { item_key: 'Connection', item_value: 'Upgrade' },
        { item_key: 'Upgrade', item_value: '$http_upgrade' }
      ],
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  onChangeWebSocket = () => {
    const { setFieldsValue } = this.props.form;
    this.setState({ WebSocket: !this.state.WebSocket }, () => {
      setFieldsValue({ WebSocket: this.state.WebSocket });
    });
  };

  handleOk = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    const { webSockets } = this.state;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        const info = Object.assign({}, values);
        const setWebSocket = values.WebSocket;
        // 请求头
        let setHeaders = Array.isArray(values.set_headers)
          ? values.set_headers
          : [];
        const isWebSocket = this.handleSetWebSocket(setHeaders);
        const firstHeaders = setHeaders && setHeaders.length === 1;
        if (
          firstHeaders &&
          (!setHeaders[0].item_key || !setHeaders[0].item_value)
        ) {
          setHeaders = [];
        }
        if (setWebSocket && !isWebSocket) {
          setHeaders = [...setHeaders, ...webSockets];
        }
        info.response_headers = setHeaders;

        // 响应头
        let responseHeaders = Array.isArray(values.response_headers)
          ? values.response_headers
          : [];
        const isResponseWebSocket = this.handleSetWebSocket(responseHeaders);
        const firstResponseHeaders = responseHeaders && responseHeaders.length === 1;
        if (
          firstResponseHeaders &&
          (!responseHeaders[0].item_key || !responseHeaders[0].item_value)
        ) {
          responseHeaders = [];
        }
        if (setWebSocket && !isResponseWebSocket) {
          responseHeaders = [...responseHeaders, ...webSockets];
        }
        info.response_headers = responseHeaders;
        onOk(info);
      }
    });
  };
  handleSetWebSocket = (data, newHeaders) => {
    const arr = [];
    const [first, second] = this.state.webSockets;
    let results = false;

    if (data && data.length > 0) {
      data.map(item => {
        const { item_key, item_value } = item;
        if (
          (item_key === first.item_key && item_value === first.item_value) ||
          (item_key === second.item_key && item_value === second.item_value)
        ) {
          results = true;
        } else {
          arr.push(item);
        }
      });
    }
    if (newHeaders) {
      return arr;
    }
    return results;
  };

  checkContent = (_, value, callback) => {
    const num = Number(value);
    if (num) {
      if (num < 0) {
        callback(formatMessage({id:'placeholder.min0'}));
        return;
      }
      if (num > 65535) {
        callback(formatMessage({id:'placeholder.max65535'}));
        return;
      }
    }
    callback();
  };
  checkBufferSize = (res, value, callback) => {
    const num = Number(value);
    if (num <= 0) {
      callback(formatMessage({id:'placeholder.4k'}));
      return;
    }
    if (num > 65535) {
      callback(formatMessage({id:'placeholder.max65535'}));
      return;
    }
    callback();
  };

  render() {
    const { editInfo, form, onClose, visible } = this.props;
    const { getFieldDecorator } = form;
    const { proxyBuffering, WebSocket, language } = this.state;
    const customRules = [
      {
        pattern: new RegExp(/^[0-9]\d*$/, 'g'),
        message: formatMessage({id:'placeholder.int'})
      },
      { validator: this.checkContent }
    ];
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout
    const setHeaders = editInfo && editInfo.set_headers;
    const defaultSetHeaders = this.handleSetWebSocket(setHeaders, true);
    return (
      <div>
        <Drawer
          title={formatMessage({id:'popover.config.title'})}
          placement="right"
          width={550}
          closable={false}
          onClose={onClose}
          visible={visible}
          maskClosable={false}
          style={{
            overflow: 'auto'
          }}
        >
          <Form>
            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_connect_timeout'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_connect_timeout', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.proxy_connect_timeout'})
                  }
                ],
                initialValue: editInfo ? editInfo.proxy_connect_timeout : '5'
              })(<Input addonAfter={formatMessage({id:'popover.config.lable.second'})} />)}
            </FormItem>

            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_send_timeout'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_send_timeout', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.proxy_send_timeout'})
                  }
                ],
                initialValue: editInfo ? editInfo.proxy_send_timeout : '60'
              })(<Input addonAfter={formatMessage({id:'popover.config.lable.second'})} />)}
            </FormItem>

            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_read_timeout'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_read_timeout', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.proxy_read_timeout'})
                  }
                ],
                initialValue: editInfo ? editInfo.proxy_read_timeout : '60'
              })(<Input addonAfter={formatMessage({id:'popover.config.lable.second'})} />)}
            </FormItem>

            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_body_size'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_body_size', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.proxy_body_size'})
                  },
                  ...customRules
                ],
                initialValue: editInfo ? editInfo.proxy_body_size : '0'
              })(<Input addonAfter="Mb" />)}
            </FormItem>
            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_buffer_numbers'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_buffer_numbers', {
                rules: customRules,
                initialValue: editInfo ? editInfo.proxy_buffer_numbers : '4'
              })(<Input />)}
            </FormItem>
            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_buffer_size'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_buffer_size', {
                rules: [{ validator: this.checkBufferSize }],
                initialValue: editInfo ? editInfo.proxy_buffer_size : '4'
              })(<Input addonAfter="K" placeholder={formatMessage({id:'placeholder.proxy_buffer_size'})} />)}
            </FormItem>
            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.WebSocket'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('WebSocket', {
                initialValue: WebSocket
              })(
                <Switch
                  checkedChildren={formatMessage({id:'button.switch.open'})}
                  unCheckedChildren={formatMessage({id:'button.switch.close'})}
                  checked={WebSocket}
                  onClick={() => {
                    this.onChangeWebSocket();
                  }}
                />
              )}
            </FormItem>
            <FormItem
              {...is_language}
              label={formatMessage({id:'popover.config.lable.proxy_buffering'})}
              className={styles.antd_form}
            >
              {getFieldDecorator('proxy_buffering', {
                initialValue: proxyBuffering
              })(
                <Switch
                  checkedChildren={formatMessage({id:'button.switch.open'})}
                  unCheckedChildren={formatMessage({id:'button.switch.close'})}
                  checked={proxyBuffering}
                  onClick={() => {
                    this.setState({ proxyBuffering: !proxyBuffering });
                  }}
                />
              )}
            </FormItem>

            <FormItem {...is_language} label={formatMessage({id:'popover.config.lable.set_headers'})}>
              {getFieldDecorator('set_headers', {
                initialValue: defaultSetHeaders
              })(<Parameterinput editInfo={defaultSetHeaders} />)}
            </FormItem>
          </Form>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              borderTop: '1px solid #e8e8e8',
              padding: '10px 16px',
              textAlign: 'right',
              left: 0,
              background: '#fff',
              borderRadius: '0 0 4px 4px',
              zIndex: 9999
            }}
          >
            <Button
              style={{
                marginRight: 8
              }}
              onClick={onClose}
            >
              {formatMessage({id:'popover.cancel'})}
            </Button>
            <Button type="primary" onClick={this.handleOk}>
              {formatMessage({id:'popover.confirm'})}
            </Button>
          </div>
        </Drawer>
      </div>
    );
  }
}
const parameterForm = Form.create()(ParameterForm);
export default parameterForm;

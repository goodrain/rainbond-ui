import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Input, Modal } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { TextArea } = Input;

@connect()
class CreatDataCenter extends PureComponent {
  handleSubmit = () => {
    const { form, onOk } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        onOk && onOk(values);
      }
    });
  };
  render() {
    const { form, onCancel, title, regionInfo } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 9 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 },
      },
    };
    const reUrl = /(http|ws|https|wss):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/;

    return (
      <Modal
        visible
        title={title || '集群'}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={1000}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <div style={{ display: 'flex' }}>
            <FormItem
              {...formItemLayout}
              label="数据中心唯一标识"
              style={{
                width: '50%',
              }}
            >
              {getFieldDecorator('region_name', {
                initialValue: regionInfo ? regionInfo.region_alias : '',
                rules: [{ required: true, message: '请填写数据中心唯一标识!' }],
              })(
                <Input
                  placeholder="请填写数据中心唯一标识!"
                  disabled={regionInfo}
                />
              )}
            </FormItem>

            <FormItem
              {...formItemLayout}
              label="数据中心名称"
              style={{
                width: '50%',
              }}
            >
              {getFieldDecorator('region_alias', {
                initialValue: regionInfo ? regionInfo.region_alias : '',
                rules: [{ required: true, message: '请填写数据中心名称!' }],
              })(
                <Input
                  placeholder="请填写数据中心名称!"
                  disabled={regionInfo}
                />
              )}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label="API地址"
              {...formItemLayout}
              style={{
                width: '50%',
              }}
            >
              {getFieldDecorator('url', {
                initialValue: regionInfo.url,
                rules: [
                  { required: true, message: 'API通信地址是必填项' },
                  {
                    pattern: reUrl,
                    message: '格式不正确',
                  },
                ],
              })(<Input placeholder="请输入API通信地址" />)}
            </FormItem>

            <FormItem
              label="WebSocket通信地址"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('wsurl', {
                initialValue: regionInfo.wsurl,
                rules: [
                  { required: true, message: 'WebSocket通信地址是必填项' },
                  {
                    pattern: reUrl,
                    message: '格式不正确',
                  },
                ],
              })(<Input placeholder="请输入WebSocket通信地址" />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label="HTTP应用默认顶级域名"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('httpdomain', {
                initialValue: regionInfo.httpdomain,
                rules: [
                  { required: true, message: 'HTTP应用默认顶级域名是必填项' },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: '格式不正确',
                  },
                ],
              })(<Input placeholder="请输入HTTP应用默认顶级域名" />)}
            </FormItem>

            <FormItem
              label="TCP应用默认访问IP"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('tcpdomain', {
                initialValue: regionInfo.tcpdomain,
                rules: [
                  { required: true, message: 'TCP应用默认访问IP是必填项' },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: '格式不正确',
                  },
                ],
              })(<Input placeholder="请输入TCP应用默认访问IP" />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label="API-CA证书"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('ssl_ca_cert', {
                initialValue: regionInfo.ssl_ca_cert,
                rules: [{ required: true, message: 'API-CA证书' }],
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder="API-CA证书内容"
                />
              )}
            </FormItem>
            <FormItem
              label="API-Client证书"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('cert_file', {
                initialValue: regionInfo.cert_file,
                rules: [{ required: true, message: 'API-Client证书必填' }],
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder="API-Client证书内容"
                />
              )}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label="API-Client证书密钥"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('key_file', {
                initialValue: regionInfo.key_file,
                rules: [{ required: true, message: 'API-Client证书密钥必填' }],
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder="API-Client证书密钥内容"
                />
              )}
            </FormItem>
            <FormItem
              label="数据中心说明"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('desc', {
                initialValue: regionInfo.desc,
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder="数据中心简介"
                />
              )}
            </FormItem>
          </div>
        </Form>
      </Modal>
    );
  }
}
const createDataCenter = Form.create()(CreatDataCenter);
export default createDataCenter;

import { Alert, Form, Input, Modal, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../../CreateTeam/index.less';

const FormItem = Form.Item;
const { TextArea } = Input;

@connect()
class EditClusterInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      healthStatus: true
    };
  }
  handleSubmit = () => {
    const { form } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        this.upClusters(values);
      }
    });
  };
  upClusters = values => {
    const { dispatch, eid, regionInfo, onOk } = this.props;
    dispatch({
      type: 'region/upEnterpriseCluster',
      payload: {
        region_id: regionInfo && regionInfo.region_id,
        ...values,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.bean && res.bean.health_status === 'failure') {
            this.setState({ healthStatus: false });
          } else {
            notification.success({ message: '编辑成功' });
            onOk && onOk();
          }
        }
      }
    });
  };

  render() {
    const { form, onCancel, title, regionInfo } = this.props;
    const { healthStatus } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 9 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    };
    const rulesApiUrl = /(http|https):\/\/+([\w]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/;
    const rulesWebSocketUrl = /(ws|wss):\/\/+([\w]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/;

    return (
      <Modal
        visible
        title={title || '集群'}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={1000}
        onCancel={onCancel}
      >
        {!healthStatus && (
          <Alert
            style={{ textAlign: 'center', marginBottom: '8px' }}
            message="集群连接失败，请确认配置是否正确"
            type="error"
          />
        )}
        <Form onSubmit={this.handleSubmit}>
          <div style={{ display: 'flex' }}>
            <FormItem
              {...formItemLayout}
              label="集群ID"
              style={{
                width: '50%'
              }}
            >
              {getFieldDecorator('region_name', {
                initialValue: regionInfo ? regionInfo.region_name : '',
                rules: [{ required: true, message: '集群ID不可修改' }]
              })(
                <Input
                  placeholder="请填写集群ID"
                  disabled={regionInfo !== undefined}
                />
              )}
            </FormItem>

            <FormItem
              {...formItemLayout}
              label="集群名称"
              style={{
                width: '50%'
              }}
            >
              {getFieldDecorator('region_alias', {
                initialValue: regionInfo ? regionInfo.region_alias : '',
                rules: [
                  { required: true, message: '请填写集群名称!' },
                  { max: 24, message: '最大长度24位' }
                ]
              })(<Input placeholder="请填写集群名称" />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label="API地址"
              {...formItemLayout}
              style={{
                width: '50%'
              }}
            >
              {getFieldDecorator('url', {
                initialValue: regionInfo.url,
                rules: [
                  { required: true, message: 'API通信地址是必填项' },
                  {
                    pattern: rulesApiUrl,
                    message: '只支持https或http协议头'
                  }
                ]
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
                    pattern: rulesWebSocketUrl,
                    message: '只支持ws或wss协议头'
                  }
                ]
              })(<Input placeholder="请输入WebSocket通信地址" />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label="HTTP应用默认域名后缀"
              {...formItemLayout}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('httpdomain', {
                initialValue: regionInfo.httpdomain,
                rules: [
                  { required: true, message: 'HTTP应用默认域名后缀是必填项' },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: '格式不正确'
                  }
                ]
              })(<Input placeholder="请输入HTTP应用默认域名后缀" />)}
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
                    message: '格式不正确'
                  }
                ]
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
                rules: [{ required: true, message: 'API-CA证书' }]
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
                rules: [{ required: true, message: 'API-Client证书必填' }]
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
                rules: [{ required: true, message: 'API-Client证书密钥必填' }]
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder="API-Client证书密钥内容"
                />
              )}
            </FormItem>
            <FormItem label="备注" {...formItemLayout} style={{ width: '50%' }}>
              {getFieldDecorator('desc', {
                initialValue: regionInfo.desc
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder="集群备注信息"
                />
              )}
            </FormItem>
          </div>
        </Form>
      </Modal>
    );
  }
}
const editClusterInfo = Form.create()(EditClusterInfo);
export default editClusterInfo;

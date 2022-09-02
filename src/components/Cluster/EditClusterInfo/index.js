import { Alert, Form, Input, Modal, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../../utils/cookie';
import styles from '../../CreateTeam/index.less';

const FormItem = Form.Item;
const { TextArea } = Input;

@connect()
class EditClusterInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      healthStatus: true,
      language: cookie.get('language') === 'zh-CN' ? true : false
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
            notification.success({ message: formatMessage({id:'notification.success.edit'}) });
            onOk && onOk();
          }
        }
      }
    });
  };

  render() {
    const { form, onCancel, title, regionInfo } = this.props;
    const { healthStatus, language } = this.state;
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
      const formItemLayouts = {
        labelCol: {
          xs: { span: 24 },
          sm: { span: 14 }
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 10 }
        }
      }
    const rulesApiUrl = /(http|https):\/\/+([\w]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/;
    const rulesWebSocketUrl = /(ws|wss):\/\/+([\w]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/;
    const is_language = language ? formItemLayout : formItemLayouts

    return (
      <Modal
        visible
        title={title || formatMessage({id:'enterpriseColony.title'}) }
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={1000}
        onCancel={onCancel}
      >
        {!healthStatus && (
          <Alert
            style={{ textAlign: 'center', marginBottom: '8px' }}
            message={formatMessage({id:'enterpriseColony.edit.alert'})}
            type="error"
          />
        )}
        <Form onSubmit={this.handleSubmit}>
          <div style={{ display: 'flex' }}>
            <FormItem
              {...is_language}
              label={formatMessage({id:'enterpriseColony.edit.form.label.region_name'})}
              style={{
                width: '50%'
              }}
            >
              {getFieldDecorator('region_name', {
                initialValue: regionInfo ? regionInfo.region_name : '',
                rules: [{ required: true, message: formatMessage({id:'placeholder.cluster.edit.region_name'}) }]
              })(
                <Input
                  placeholder={formatMessage({id:'placeholder.cluster.edit.region_name.content'})}
                  disabled={regionInfo !== undefined}
                />
              )}
            </FormItem>

            <FormItem
              {...is_language}
              label={formatMessage({id:'enterpriseColony.edit.form.label.region_alias'})}
              style={{
                width: '50%'
              }}
            >
              {getFieldDecorator('region_alias', {
                initialValue: regionInfo ? regionInfo.region_alias : '',
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.cluster.edit.region_alias'}) },
                  { max: 24, message: formatMessage({id:'placeholder.max24'}) }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.cluster.edit.region_alias'})} />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.url'})}
              {...is_language}
              style={{
                width: '50%'
              }}
            >
              {getFieldDecorator('url', {
                initialValue: regionInfo.url,
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.cluster.edit.url'}) },
                  {
                    pattern: rulesApiUrl,
                    message: formatMessage({id:'placeholder.cluster.edit.urlhttp'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.cluster.edit.url.content'})} />)}
            </FormItem>

            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.wsurl'})}
              {...is_language}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('wsurl', {
                initialValue: regionInfo.wsurl,
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.cluster.edit.wsurl'}) },
                  {
                    pattern: rulesWebSocketUrl,
                    message: formatMessage({id:'placeholder.cluster.edit.wss'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.cluster.edit.wsurl.content'})} />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.httpdomain'})}
              {...is_language}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('httpdomain', {
                initialValue: regionInfo.httpdomain,
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.cluster.edit.httpdomain'}) },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: formatMessage({id:'placeholder.appShare.formatError'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.cluster.edit.httpdomain.content'})} />)}
            </FormItem>

            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.tcpdomain'})}
              {...is_language}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('tcpdomain', {
                initialValue: regionInfo.tcpdomain,
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.cluster.edit.tcpdomain'}) },
                  {
                    pattern: /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                    message: formatMessage({id:'placeholder.appShare.formatError'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.cluster.edit.tcpdomain.content'})} />)}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.ssl_ca_cert'})}
              {...is_language}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('ssl_ca_cert', {
                initialValue: regionInfo.ssl_ca_cert,
                rules: [{ required: true, message: formatMessage({id:'placeholder.cluster.edit.ssl_ca_cert'}) }]
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder={formatMessage({id:'placeholder.cluster.edit.ssl_ca_cert.content'})}
                />
              )}
            </FormItem>
            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.cert_file'})}
              {...is_language}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('cert_file', {
                initialValue: regionInfo.cert_file,
                rules: [{ required: true, message: formatMessage({id:'placeholder.cluster.edit.cert_file'}) }]
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder={formatMessage({id:'placeholder.cluster.edit.cert_file.content'})}
                />
              )}
            </FormItem>
          </div>
          <div style={{ display: 'flex' }}>
            <FormItem
              label={formatMessage({id:'enterpriseColony.edit.form.label.key_file'})}
              {...is_language}
              style={{ width: '50%' }}
            >
              {getFieldDecorator('key_file', {
                initialValue: regionInfo.key_file,
                rules: [{ required: true, message: formatMessage({id:'placeholder.cluster.edit.key_file'}) }]
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder={formatMessage({id:'placeholder.cluster.edit.key_file.content'})}
                />
              )}
            </FormItem>
            <FormItem label={formatMessage({id:'enterpriseColony.edit.form.label.desc'})} {...is_language} style={{ width: '50%' }}>
              {getFieldDecorator('desc', {
                initialValue: regionInfo.desc
              })(
                <TextArea
                  autosize={{ minRows: 3, maxRows: 6 }}
                  placeholder={formatMessage({id:'placeholder.cluster.edit.desc'})}
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

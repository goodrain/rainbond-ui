import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Form,
  Input,
  Modal,
  Col,
  Row,
  Upload,
  Button,
} from 'antd';
import styles from '../CreateTeam/index.less';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import rainbondUtil from '../../utils/rainbond';

const { TextArea } = Input;
const FormItem = Form.Item;

@connect(({ global }) => ({
  enterprise: global.enterprise,
}))
@Form.create()
export default class CertificateForm extends PureComponent {
  handleSubmit = () => {
    const { form, onOk } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  checkConfigFile = (rules, value, callback) => {
    if (value) {
      if (value.fileList.length > 0) {
        const fileList = value.fileList.splice(-1);
        this.readFileContents(fileList, 'auto_ssl_config');
        callback();
        return;
      }
      return;
    }
    callback();
  };
  readFileContents = (fileList, name) => {
    const reader = new FileReader();
    reader.onload = evt => {
      this.props.form.setFieldsValue({ [name]: evt.target.result });
    };
    reader.readAsText(fileList[0].originFileObj, 'UTF-8');
  };

  render() {
    const {
      form,
      onCancel,
      enterprise,
      loading,
      AutomaticCertificate,
    } = this.props;

    const AutomaticCertificateValue = rainbondUtil.CertificateIssuedByValue(
      enterprise
    );
    const initialAutomaticCertificateValue = AutomaticCertificateValue
      ? JSON.stringify(AutomaticCertificateValue)
      : '';

    const { getFieldDecorator } = form;
    const token = cookie.get('token');
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
      },
      wrapperCol: {
        xs: { span: 24 },
      },
    };
    return (
      <Modal
        visible
        confirmLoading={loading}
        title={AutomaticCertificate ? '自动签发证书' : '开通自动签发证书'}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={800}
        onCancel={onCancel}
      >
        <Form labelAlign="left" onSubmit={this.handleSubmit}>
          <Col>
            <FormItem
              {...formItemLayout}
              label="扩展配置"
              style={{
                width: '100%',
                padding: '0 16px',
                margin: 0,
              }}
            >
              {getFieldDecorator('auto_ssl_config', {
                initialValue: initialAutomaticCertificateValue,
                rules: [{ required: true, message: '扩展配置是必须的' }],
              })(
                <TextArea
                  rows={8}
                  style={{ backgroundColor: '#02213f', color: '#fff' }}
                />
              )}
            </FormItem>
            <Row>
              <Col style={{ marginTop: '0', padding: '0 16px' }}>
                <FormItem>
                  {getFieldDecorator('auto_ssl_config_btn', {
                    rules: [{ validator: this.checkConfigFile }],
                  })(
                    <Upload
                      action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                      showUploadList={false}
                      withCredentials
                      headers={{ Authorization: `GRJWT ${token}` }}
                    >
                      <Button type="link" size="small">
                        上传文件
                      </Button>
                    </Upload>
                  )}
                </FormItem>
              </Col>
            </Row>
          </Col>
        </Form>
      </Modal>
    );
  }
}

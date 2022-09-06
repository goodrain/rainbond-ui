import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Form, Modal } from 'antd';
import CodeMirrorForm from '../../components/CodeMirrorForm';
import rainbondUtil from '../../utils/rainbond';
import styles from '../CreateTeam/index.less';

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

    const { getFieldDecorator, setFieldsValue } = form;
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
        title={AutomaticCertificate ? formatMessage({id:'enterpriseSetting.basicsSetting.certificate.title'}) : formatMessage({id:'enterpriseSetting.basicsSetting.Modal.title'})}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        width={800}
        onCancel={onCancel}
      >
        <Form labelAlign="left" onSubmit={this.handleSubmit}>
          <CodeMirrorForm
            setFieldsValue={setFieldsValue}
            formItemLayout={formItemLayout}
            Form={Form}
            getFieldDecorator={getFieldDecorator}
            name="auto_ssl_config"
            label={formatMessage({id:'enterpriseSetting.basicsSetting.Modal.label'})}
            message={formatMessage({id:'enterpriseSetting.basicsSetting.Modal.label.msg'})}
            width="752px"
            data={AutomaticCertificateValue || ''}
          />
        </Form>
      </Modal>
    );
  }
}

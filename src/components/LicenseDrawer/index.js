import { Button, Drawer, Form, Input, message, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import CodeMirrorForm from '../../components/CodeMirrorForm';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@connect(({ loading }) => ({
  editLicenseLoading: loading.effects['gateWay/editLicense'],
  addLicenseLoading: loading.effects['gateWay/addLicense']
}))
class LicenseDrawer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    const { onOk } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] === 'pem' ||
      fileArr[length - 1] === 'crt' ||
      fileArr[length - 1] === 'cer' ||
      fileArr[length - 1] === 'key';
    if (!isRightType) {
      if (isMessage) {
        message.warning('请上传以.pem, .crt, .cer, .key结尾的文件', 5);
      }
      return false;
    }
    return true;
  };
  render() {
    const {
      onClose,
      editData = {},
      addLicenseLoading,
      editLicenseLoading,
      form
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };

    const codeMirrorConfiguration = {
      setFieldsValue,
      formItemLayout,
      Form,
      getFieldDecorator
    };
    const certificateList = [
      {
        value: editData.certificate,
        name: 'certificate',
        label: formatMessage({id:'popover.manage.certificate.label.public'}),
        messages: formatMessage({id:'placeholder.certificate.name'}),
        uploadName: 'public_key_btn',
        mode: 'javascript'
      },
      {
        value: editData.private_key,
        name: 'private_key',
        label: formatMessage({id:'popover.manage.certificate.label.private'}),
        messages: formatMessage({id:'placeholder.certificate.private'}),
        uploadName: 'private_key_btn',
        mode: 'javascript'
      }
    ];
    return (
      <div>
        <Drawer
          title={editData ? formatMessage({id:'popover.manage.certificate.title.edit'}) : formatMessage({id:'popover.manage.certificate.title.add'})}
          placement="right"
          width={500}
          closable={false}
          onClose={onClose}
          visible={this.props.visible}
          maskClosable={false}
          style={{
            overflow: 'auto'
          }}
        >
          <Form onSubmit={this.handleSubmit}>
            <FormItem {...formItemLayout} label={formatMessage({id:'popover.manage.certificate.label.name'})}>
              {getFieldDecorator('alias', {
                rules: [
                  { required: true, message: formatMessage({id:'placeholder.certificate.name'}) },
                  {
                    max: 64,
                    message: formatMessage({id:'placeholder.appShare.max64'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.certificate.name'})} />)}
            </FormItem>
            <FormItem {...formItemLayout} label={formatMessage({id:'popover.manage.certificate.label.kind'})}>
              {getFieldDecorator('certificate_type', {
                initialValue: formatMessage({id:'popover.manage.certificate.label.server'}),
                rules: [{ required: true }]
              })(
                <RadioGroup>
                  <Radio value={formatMessage({id:'popover.manage.certificate.label.server'})}>{formatMessage({id:'popover.manage.certificate.label.server'})}</Radio>
                </RadioGroup>
              )}
            </FormItem>

            {certificateList.map(item => {
              const { value, name, label, messages, mode } = item;
              return (
                <Fragment key={name}>
                  <CodeMirrorForm
                    {...codeMirrorConfiguration}
                    data={value}
                    name={name}
                    label={label}
                    message={messages}
                    mode={mode}
                    beforeUpload={this.beforeUpload}
                  />
                </Fragment>
              );
            })}
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
                zIndex: 4
              }}
            >
              <Button
                style={{
                  marginRight: 8
                }}
                onClick={onClose}
              >
                {formatMessage({id:'button.cancel'})}
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                loading={editLicenseLoading || addLicenseLoading}
              >
                {formatMessage({id:'button.confirm'})}
              </Button>
            </div>
          </Form>
        </Drawer>
      </div>
    );
  }
}
const DrawerForm = Form.create()(LicenseDrawer);
export default DrawerForm;

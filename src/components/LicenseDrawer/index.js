import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import {
  Button,
  Drawer,
  Form,
  Input,
  Radio,
  message,
} from 'antd';

import CodeMirrorForm from '../../components/CodeMirrorForm';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@connect(({ loading }) => ({
  editLicenseLoading: loading.effects['gateWay/editLicense'],
  addLicenseLoading: loading.effects['gateWay/addLicense'],
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
      form,
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
    };

    const codeMirrorConfiguration = {
      setFieldsValue,
      formItemLayout,
      Form,
      width: '338px',
      getFieldDecorator,
    };
    const certificateList = [
      {
        value: editData.certificate,
        name: 'certificate',
        label: '公钥证书',
        messages: '请输入证书名称',
        uploadName: 'public_key_btn',
        mode: 'javascript',
      },
      {
        value: editData.private_key,
        name: 'private_key',
        label: '私钥',
        messages: '请输入私钥',
        uploadName: 'private_key_btn',
        mode: 'javascript',
      },
    ];
    return (
      <div>
        <Drawer
          title={editData ? '编辑证书' : '添加证书'}
          placement="right"
          width={500}
          closable={false}
          onClose={onClose}
          visible={this.props.visible}
          maskClosable={false}
          style={{
            overflow: 'auto',
          }}
        >
          <Form onSubmit={this.handleSubmit}>
            <FormItem {...formItemLayout} label="证书名称">
              {getFieldDecorator('alias', {
                rules: [{ required: true, message: '请输入证书名称!' }],
              })(<Input placeholder="请输入证书名称" />)}
            </FormItem>
            <FormItem {...formItemLayout} label="证书类型">
              {getFieldDecorator('certificate_type', {
                initialValue: '服务端证书',
                rules: [{ required: true }],
              })(
                <RadioGroup>
                  <Radio value="服务端证书">服务端证书</Radio>
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
                zIndex: 4,
              }}
            >
              <Button
                style={{
                  marginRight: 8,
                }}
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                loading={editLicenseLoading || addLicenseLoading}
              >
                确认
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

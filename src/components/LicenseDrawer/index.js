import { Alert, Button, Drawer, Form, Input, message, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import CodeMirrorForm from '../../components/CodeMirrorForm';

const FormItem = Form.Item;
@connect(({ loading }) => ({
  editLicenseLoading: loading.effects['gateWay/editLicense'],
  addLicenseLoading: loading.effects['gateWay/addLicense']
}))
class LicenseDrawer extends PureComponent {
  constructor(props) {
    super(props);
    const originalCertificateType = props.editData && props.editData.certificate_type
      ? props.editData.certificate_type
      : props.certificateType || 'gateway';
    const certificateType = originalCertificateType === 'client_ca' ? 'client_ca' : 'gateway';
    this.state = {
      rulesArr: [],
      certificateType
    };
  }
  componentDidMount(){
    this.rules(this.state.certificateType)
  }
  handleSubmit = e => {
    e.preventDefault();
    const { onOk } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err && onOk) {
        values.certificate_type = this.props.editData && this.props.editData.certificate_type
          ? this.props.editData.certificate_type
          : this.state.certificateType
        if (this.state.certificateType === 'client_ca') {
          values.private_key = ''
        }
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
  rules = certificateType => {
    const { isGateway } = this.props
    let defauleArr = [
      { required: true, message: formatMessage({id:'placeholder.certificate.name'}) },
      {
        max: 64,
        message: formatMessage({id:'placeholder.appShare.max64'})
      },
      // 名称中不能包含任何*符号
      {
        pattern: /^[^*]*$/,
        message: formatMessage({id:'placeholder.certificate.name.not_star'})
      }
    ]
    let gatewayArr = [
      { required: true, message: formatMessage({id:'placeholder.certificate.name'}) },
      {
        max: 64,
        message: formatMessage({id:'placeholder.appShare.max64'})
      },
      {
        pattern: /[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*/,
        message: formatMessage({id:'teamGateway.license.pattern'})
      }
    ]
    if(certificateType === 'client_ca') {
      this.setState({
        rulesArr: defauleArr
      })
    }else if(certificateType){
      this.setState({
        rulesArr: certificateType == "gateway" ? gatewayArr : defauleArr
      })
    }else{
      this.setState({
        rulesArr: isGateway ? gatewayArr : defauleArr
      })
    }

  }
  handleCertificateTypeChange = e => {
    const certificateType = e.target.value;
    this.setState({ certificateType });
    this.rules(certificateType);
    if (certificateType === 'client_ca') {
      this.props.form.setFieldsValue({ private_key: '' });
    }
  }
  render() {
    const {
      onClose,
      editData = {},
      addLicenseLoading,
      editLicenseLoading,
      form,
      isGateway = false,
      showCertificateType = false
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;

    const { rulesArr, certificateType } =this.state
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
        label: formatMessage({
          id: certificateType === 'client_ca'
            ? 'teamGateway.certificate.clientCA.content'
            : 'popover.manage.certificate.label.public'
        }),
        messages: formatMessage({
          id: certificateType === 'client_ca'
            ? 'teamGateway.certificate.clientCA.content.required'
            : 'placeholder.certificate.public'
        }),
        uploadName: 'public_key_btn',
        mode: 'javascript'
      },
      ...(certificateType === 'client_ca' ? [] : [{
        value: editData.private_key,
        name: 'private_key',
        label: formatMessage({id:'popover.manage.certificate.label.private'}),
        messages: formatMessage({id:'placeholder.certificate.private'}),
        uploadName: 'private_key_btn',
        mode: 'javascript'
      }])
    ];
    return (
      <div>
        <Drawer
          title={showCertificateType
            ? editData
              ? formatMessage({id:'popover.manage.certificate.title.edit'})
              : formatMessage({id:'popover.manage.certificate.title.add'})
            : certificateType === 'client_ca'
            ? formatMessage({
              id: editData
                ? 'teamGateway.certificate.clientCA.edit'
                : 'teamGateway.certificate.clientCA.add'
            })
            : editData
              ? formatMessage({id:'popover.manage.certificate.title.edit'})
              : formatMessage({id:'popover.manage.certificate.title.add'})}
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
            {showCertificateType && (
              <Fragment>
                <FormItem {...formItemLayout} label={formatMessage({id:'teamGateway.certificate.purpose'})}>
                  {getFieldDecorator('certificate_type', {
                    initialValue: certificateType
                  })(
                    <Radio.Group
                      disabled={!!editData}
                      onChange={this.handleCertificateTypeChange}
                    >
                      <Radio value="gateway">
                        {formatMessage({id:'teamGateway.certificate.server'})}
                      </Radio>
                      <Radio value="client_ca">
                        {formatMessage({id:'teamGateway.certificate.clientCA'})}
                      </Radio>
                    </Radio.Group>
                  )}
                </FormItem>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={formatMessage({
                    id: certificateType === 'client_ca'
                      ? 'teamGateway.certificate.purpose.clientCA.desc'
                      : 'teamGateway.certificate.purpose.server.desc'
                  })}
                />
              </Fragment>
            )}
            <FormItem {...formItemLayout} label={formatMessage({id:'popover.manage.certificate.label.name'})}>
              {getFieldDecorator('alias', {
                rules: rulesArr
              })(<Input placeholder={formatMessage({id:'placeholder.certificate.name'})} />)}
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
                zIndex: 98
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

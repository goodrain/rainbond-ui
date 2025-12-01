import { Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ region }) => {
  return {
    protocols: region.protocols || []
  };
})
export default class AddPort extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  handleCheckPort = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    if (this.props.isImageApp || this.props.isDockerfile) {
      if (value < 1 || value > 65534) {
        callback(<FormattedMessage id='componentOverview.body.AddPort.callback'/>);
        return;
      }
    }
    callback();
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const language = cookie.get('language') === 'zh-CN';
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const enFormItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const protocols = this.props.protocols || [];
    const { extendMethod } = this.props;
    const isKubeBlocks = extendMethod === 'kubeblocks_component';
    const layoutConfig = language ? formItemLayout : enFormItemLayout;
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.AddPort.title'/>}
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
        visible={true}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...layoutConfig} label={<FormattedMessage id='componentOverview.body.AddPort.label_port'/>}>
            {getFieldDecorator('port', {
              rules: [
                { required: true, message: formatMessage({id:'componentOverview.body.AddPort.required'}) },
                { validator: this.handleCheckPort }
              ]
            })(
              <Input
                type="number"
                placeholder={
                  this.props.isImageApp || this.props.isDockerfile
                    ? formatMessage({id:'componentOverview.body.AddPort.min'})
                    : formatMessage({id:'componentOverview.body.AddPort.max'})
                }
              />
            )}
          </FormItem>
          <FormItem {...layoutConfig} label={<FormattedMessage id='componentOverview.body.AddPort.label_agreement'/>}>
            {getFieldDecorator('protocol', {
              initialValue: !isKubeBlocks ? 'http' : 'tcp',
              rules: [{ required: true, message: formatMessage({id:'componentOverview.body.AddPort.add'})}]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                disabled={isKubeBlocks}
              >
                {protocols.map(item => {
                  return <Option key={item} value={item}>{item}</Option>;
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

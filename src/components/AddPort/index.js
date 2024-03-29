import { Form, Input, message, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
const FormItem = Form.Item;

@Form.create()
@connect(({ region }) => {
  return {
    protocols: region.protocols || []
  };
})
export default class AddPort extends PureComponent {
  constructor(props){
    super(props)
    this.state = {
      language: cookie.get('language') === 'zh-CN' ? true : false
    }
  }
  componentWillMount() {}
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
    const { language } = this.state;
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
    const en_formItemLayout = {
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
    const is_language = language ? formItemLayout : en_formItemLayout
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.AddPort.title'/>}
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
        visible={true}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...is_language}  label={<FormattedMessage id='componentOverview.body.AddPort.label_port'/>}>
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
                    ?  formatMessage({id:'componentOverview.body.AddPort.min'})
                    :  formatMessage({id:'componentOverview.body.AddPort.max'})
                }
              />
            )}
          </FormItem>
          <FormItem {...is_language} label = {<FormattedMessage id='componentOverview.body.AddPort.label_agreement'/>}>
            {getFieldDecorator('protocol', {
              initialValue: 'http',
              rules: [{ required: true,  message: formatMessage({id:'componentOverview.body.AddPort.add'})}]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {protocols.map(item => {
                  return <Option value={item}>{item}</Option>;
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

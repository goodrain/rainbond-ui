import { Form, Input, Modal, notification, Select } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

@Form.create()
export default class AddDomain extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          if (values.port == '请选择端口') {
            notification.info({ message: formatMessage({id:'notification.hint.selectPort'}) });
            return;
          }
          this.props.onOk && this.props.onOk(values);
        }
      }
    );
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    const postList = this.props.postList;
    const initialVal = postList[0].lb_mpping_port;
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.SubPort.title'/>}
        onOk={this.handleSubmit}
        visible={true}
        onCancel={this.props.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.SubPort.port'/>} >
            {getFieldDecorator('port', {
              initialValue: `${formatMessage({id:'componentOverview.body.SubPort.port'})}`,
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.SubPort.port'})
                }
              ]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {postList.map(port => {
                  return (
                    <Option
                      value={port.service_id + '||' + port.lb_mpping_port}
                    >
                      {port.lb_mpping_port}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

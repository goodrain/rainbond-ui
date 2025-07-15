/* eslint-disable prettier/prettier */
import { Form, Modal, notification, Select } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
const FormItem = Form.Item;
const { Option } = Select;

class MoveGroup extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    const { form, currGroupID } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.group_id === currGroupID) {
        notification.warning({ 
          message: formatMessage({id:'notification.warn.not_select_app'}) 
        });
        return;
      }
      this.props.onOk(fieldsValue.group_id);
    });
  };
  render() {
    const groups = this.props.groups || [];
    const { loading = false, currGroupID: initValue, form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <Modal
        title={formatMessage({id:'otherApp.AppMoveGroup.title'})}
        visible
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator('group_id', {
              initialValue: (initValue && Number(initValue)) || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'otherApp.AppMoveGroup.message'})
                }
              ]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {groups.map(group => {
                  return (
                    <Option key={group.group_id} value={group.group_id}>
                      {group.group_name}
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

export default Form.create()(MoveGroup);

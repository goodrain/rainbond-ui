import { Button, Form, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import AddGroup from '../../components/AddOrEditGroup';
const { Option } = Select;
const formItemLayouts = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};
@connect(
  ({ global }) => ({
    groups: global.groups
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class Application extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false
    };
  }
  onAddGroup = () => {
    this.setState({
      addGroup: true
    });
  };
  handleGroupId = id => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    setFieldsValue({ group_id: id });
  };
  handleOk = vals => {
    console.log(vals);
    this.handleCancel();
  };
  handleCancel = () => {
    this.setState({
      addGroup: false
    });
  };
  render() {
    const {
      form,
      handleType,
      showCreateGroup,
      data,
      groups,
      team_name,
      region_name,
      selectWidth,
      labelName,
      placeholder,
      formItemLayout
    } = this.props;
    const { addGroup } = this.state;
    const showCreateGroups =
      showCreateGroup === void 0 ? true : showCreateGroup;
    const { getFieldDecorator } = form;
    const handleTypes = handleType && handleType === 'Service';
    const setFormItemLayout = formItemLayout || formItemLayouts;
    return (
      <Fragment>
        <Form.Item {...setFormItemLayout} label={labelName || '应用名称'}>
          {getFieldDecorator('group_id', {
            initialValue:
              handleType && handleType === 'Service'
                ? Number(groupId)
                : data.group_id,
            rules: [{ required: true, message: '请选择' }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={placeholder || '请选择要所属应用'}
              style={{
                display: 'inline-block',
                width: handleTypes ? '' : selectWidth || 292,
                marginRight: 15
              }}
              disabled={!!(handleType && handleType === 'Service')}
            >
              {(groups || []).map(group => (
                <Option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </Option>
              ))}
            </Select>
          )}
          {handleType && handleType === 'Service' ? null : showCreateGroups ? (
            <Button onClick={this.onAddGroup}>新建应用</Button>
          ) : null}
        </Form.Item>
        {addGroup && (
          <AddGroup
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            team_name={team_name}
            region_name={region_name}
            onGroupId={this.handleGroupId}
          />
        )}
      </Fragment>
    );
  }
}
export default Application;

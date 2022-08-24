import { Form, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import RolePermsSelect from '../RolePermsSelect';

const FormItem = Form.Item;

@connect(({ teamControl }) => ({
  teamControl
}))
@Form.create()
class ConfirmModal extends PureComponent {
  componentDidMount() {
    this.loadMembers();
  }
  handleSubmit = () => {
    const { onOk, form } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  loadMembers = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        page_size: 200
      }
    });
  };
  render() {
    const { onCancel, actions, form } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const options = actions || [];
    const members = this.props.members || [];
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.SetMemberAppAction.member'/>}
        visible
        width={800}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        maskClosable={false}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.SetMemberAppAction.Select_member'/>} hasFeedback>
            {getFieldDecorator('user_ids', {
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.SetMemberAppAction.team_memner'}),
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                mode="multiple"
              >
                {members.map((member, index) => {
                  return (
                    <Select.Option key={index} value={member.user_id}>
                      {member.user_name}
                    </Select.Option>
                  );
                })}
              </Select>
            )}
          </FormItem>

          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.SetMemberAppAction.mode'/>}>
            {getFieldDecorator('perm_ids', {
              initialValue: [],
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.SetMemberAppAction.palce_mode'}),
                  
                }
              ]
            })(
              <RolePermsSelect
                showGroupName={false}
                hides={[`${formatMessage({id:'componentOverview.body.SetMemberAppAction.team'})}`]}
                datas={options}
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default ConfirmModal;

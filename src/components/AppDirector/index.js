import { Form, Modal, Select, Spin } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect()
export default class AppDirector extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fetching: false,
      page: 1,
      pageSize: 99,
      members: []
    };
  }
  componentWillMount() {
    this.fetchTeamMember();
  }
  onOk = e => {
    e.preventDefault();
    const { form, onOk, group_name: groupName, note } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        const val = Object.assign(vals, { group_name: groupName, note });
        onOk(val);
      }
    });
  };
  fetchTeamMember = value => {
    const { dispatch, teamName, regionName } = this.props;
    this.setState({
      fetching: true
    });
    dispatch({
      type: 'teamControl/fetchMember',
      payload: {
        query: value,
        team_name: teamName,
        region_name: regionName,
        page_size: this.state.pageSize,
        page: this.state.page
      },
      callback: data => {
        if (data) {
          this.setState({
            members: data.list || [],
            fetching: false
          });
        }
      }
    });
  };
  render() {
    const { title, onCancel, form, principal, loading = false } = this.props;
    const { members, fetching } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    return (
      <Modal
        title={title || formatMessage({id:'teamOther.edit.editHead'})}
        visible
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label={formatMessage({id:'teamOther.edit.head'})}>
            {getFieldDecorator('username', {
              initialValue: principal || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'teamOther.edit.choose'})
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                showSearch
                notFoundContent={fetching ? <Spin size="small" /> : null}
                filterOption={false}
                onSearch={this.fetchTeamMember}
                style={{ width: '100%' }}
              >
                {members.map(d => (
                  <Option key={d.nick_name}>
                    {d.nick_name}/{d.user_name}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

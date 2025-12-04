/* eslint-disable react/sort-comp */
/* eslint-disable react/jsx-indent */
import { Button, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import { getCodeBranchs } from '../../services/createApp';
import { getGithubInfo } from '../../services/team';
import globalUtil from '../../utils/global';

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
    githubBtnLoading: loading.effects['createApp/createAppByCode']
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      codeList: [],
      branchs: []
    };
  }
  componentDidMount() {
    this.getGithubInfo();
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const codeId = fieldsValue.git_project_id;
      const selectedProject = this.state.codeList.filter(
        item => item.code_id === codeId
      );
      if (selectedProject.length) {
        fieldsValue.git_url = selectedProject[0].code_repos;
      }
      if (onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };
  getGithubInfo = () => {
    const self = this;

    getGithubInfo({
      team_name: globalUtil.getCurrTeamName()
    }).then(data => {
      if (data && data.bean) {
        self.setState(
          {
            codeList: data.list || []
          },
          () => {
            const defaultProjectId = this.getDefaultProjectId();

            if (defaultProjectId) {
              this.getCodeBranchs(defaultProjectId);
            }
          }
        );
      }
    });
  };
  getCodeBranchs = projectId => {
    const git = this.state.codeList.filter(
      item => item.code_id === projectId
    )[0];
    getCodeBranchs({
      team_name: globalUtil.getCurrTeamName(),
      service_project_id: projectId,
      type: 'github',
      git_url: git.code_repos
    }).then(data => {
      if (data) {
        this.setState({
          branchs: data.list || []
        });
      }
    });
  };
  handleCodeIdChange = val => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ code_version: 'master' });
    this.getCodeBranchs(val);
  };
  getDefaultProjectId = () => {
    const data = this.props.data || {};
    const codeList = this.state.codeList || [];
    let defaultProject = data.git_project_id || '';
    if (!defaultProject && codeList.length) {
      defaultProject = codeList[0].code_id;
    }
    return defaultProject;
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      githubBtnLoading,
      handleType,
      ButtonGroupState,
      groupId
    } = this.props;
    const data = this.props.data || {};
    const { codeList, branchs, addGroup } = this.state;
    const defaultProject = this.getDefaultProjectId();
    const isService = handleType && handleType === 'Service';

    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newApp.appName'})}>
          {getFieldDecorator('group_id', {
            initialValue: isService ? Number(groupId) : data.group_id,
            rules: [
              {
                required: true,
                message: {formatMessage({id:'placeholder.select'})}
              }
            ]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              disabled={!!isService}
              style={{
                display: 'inline-block',
                width: isService ? '' : 292,
                marginRight: 15
              }}
            >
              {(groups || []).map(group => (
                <Option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </Option>
              ))}
            </Select>
          )}
          {isService ? null : (
            <Button onClick={this.onAddGroup}>{formatMessage({id:'popover.newApp.title'})}</Button>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newComponent.componentName'})}>
          {getFieldDecorator('service_cname', {
            initialValue: data.service_cname || '',
            rules: [
              {
                required: true,
                message: formatMessage({id:'placeholder.service_cname'})
              },
              {
                max: 24,
                message: formatMessage({id:'placeholder.max24'})
              }
            ]
          })(<Input placeholder={formatMessage({id:'placeholder.service_cname'})} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newComponent.gitHub'})}>
          {getFieldDecorator('git_project_id', {
            initialValue: data.git_project_id || defaultProject,
            rules: [
              {
                required: true,
                message: formatMessage({id:'placeholder.select'})
              }
            ]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={defaultProject ? formatMessage({id:'placeholder.select'}) : formatMessage({id:'placeholder.not_available'})}
              onChange={this.handleCodeIdChange}
            >
              {codeList.map(item => (
                <Option value={item.code_id}>{item.code_project_name}</Option>
              ))}
            </Select>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newComponent.versions'})}>
          {getFieldDecorator('code_version', {
            initialValue: data.code_version || 'master',
            rules: [
              {
                required: true,
                message: formatMessage({id:'placeholder.select'})
              }
            ]
          })(
            <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
              {branchs.map(item => (
                <Option value={item}>{item}</Option>
              ))}
            </Select>
          )}
        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: {
              span: 24,
              offset: 0
            },
            sm: {
              span: formItemLayout.wrapperCol.span,
              offset: formItemLayout.labelCol.span
            }
          }}
          label=""
        >
          {isService && !ButtonGroupState
            ? this.props.handleServiceBotton(
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={githubBtnLoading}
                >
                 {formatMessage({id:'popover.newComponent.title'})}
                </Button>,
                true
              )
            : !handleType && (
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={githubBtnLoading}
                >
                  {formatMessage({id:'popover.newApp.title'})}
                </Button>
              )}
        </Form.Item>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Form>
    );
  }
}

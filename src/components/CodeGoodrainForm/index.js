/* eslint-disable react/jsx-indent */
/* eslint-disable react/sort-comp */
/* eslint-disable react/no-multi-comp */
import { Button, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import { getCodeBranchs } from '../../services/createApp';
import { getGitlabInfo } from '../../services/team';
import globalUtil from '../../utils/global';

const FormItem = Form.Item;
@Form.create()
class CreateNewProject extends PureComponent {
  handleOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };
  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
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
        title="新建Gitlab项目"
        visible
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="项目名称">
            {getFieldDecorator('project_name', {
              initialValue: '',
              rules: [{ required: true, message: '项目名称' }]
            })(<Input placeholder="请为创建的项目起个名字吧" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

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
  ({ global }) => ({
    groups: global.groups
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
      showCreateProject: false,
      gitlabUrl: '',
      gitlabId: '',
      codeList: [],
      branchs: []
    };
  }
  componentDidMount() {
    this.getGitlabInfo();
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
  onCreateProject = () => {
    this.setState({ showCreateProject: true });
  };
  handleCancelCreateProject = () => {
    this.setState({ showCreateProject: false });
  };
  handleCreateProject = value => {
    this.props.dispatch({
      type: 'user/createGitlabProject',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...value
      },
      callback: bean => {
        if (bean) {
          this.setState({
            gitlabUrl: bean.http_repo_url,
            gitlabId: bean.project_id
          });
          this.handleCancelCreateProject();
          this.showCreateProjectOk();
        }
      }
    });
  };
  showCreateProjectOk = () => {
    Modal.success({
      title: '创建项目成功',
      content: (
        <div>
          <p>
            项目地址:{' '}
            <a target="_blank" href={this.state.gitlabUrl}>
              {this.state.gitlabUrl}
            </a>
          </p>
          <p>请前往上传源码, 完成后点击 已上传源码 继续创建</p>
        </div>
      ),
      onOk: () => {
        this.props.form.setFieldsValue({ git_project_id: this.state.gitlabId });
        this.getGitlabInfo();
      },
      okText: '已上传源码'
    });
  };
  getGitlabInfo = () => {
    const self = this;

    return getGitlabInfo({
      team_name: globalUtil.getCurrTeamName()
    }).then(data => {
      if (data && data.bean) {
        self.setState({ codeList: data.list || [] }, () => {
          const { getFieldValue } = this.props.form;
          const defaultProjectId =
            getFieldValue('git_project_id') || this.getDefaultProjectId();
          if (defaultProjectId) {
            this.getCodeBranchs(defaultProjectId);
          }
        });
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
      type: 'gitlab',
      git_url: git.code_repos
    }).then(data => {
      if (data) {
        this.setState({ branchs: data.list || [] });
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
    const { groups, handleType, groupId, ButtonGroupState } = this.props;
    const data = this.props.data || {};
    const { codeList, branchs, addGroup, showCreateProject } = this.state;
    const defaultProject = this.getDefaultProjectId();
    const isService = handleType && handleType === 'Service';

    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newApp.appName'})}>
          {getFieldDecorator('group_id', {
            initialValue: isService ? Number(groupId) : data.groupd_id,
            rules: [{ required: true, message: formatMessage({id:'placeholder.select'}) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              style={{
                display: 'inline-block',
                width: isService ? '' : 290,
                marginRight: 15
              }}
              disabled={!!isService}
            >
              {(groups || []).map(group => (
                <Option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </Option>
              ))}
            </Select>
          )}
          {isService ? null : (
            <Button onClick={this.onAddGroup}>
              {formatMessage({id:'popover.newApp.title'})}
            </Button>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newComponent.componentName'})}>
          {getFieldDecorator('service_cname', {
            initialValue: data.service_cname || '',
            rules: [
              { required: true, message: formatMessage({id:'placeholder.service_cname'}) },
              {
                max: 24,
                message: formatMessage({id:'placeholder.max24'})
              }
            ]
          })(<Input placeholder={formatMessage({id:'placeholder.service_cname'})} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newComponent.gitHub'})}>
          {getFieldDecorator('git_project_id', {
            initialValue: defaultProject,
            rules: [{ required: true, message: formatMessage({id:'placeholder.select'}) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={defaultProject ? formatMessage({id:'placeholder.select'}) : formatMessage({id:'placeholder.not_available'}) }
              onChange={this.handleCodeIdChange}
              style={{ display: 'inline-block', width: 290, marginRight: 15 }}
            >
              {codeList.map(item => (
                <Option value={item.code_id}>{item.code_project_name}</Option>
              ))}
            </Select>
          )}
          <Button onClick={this.onCreateProject}>{formatMessage({id:'popover.newComponent.newProject'})}</Button>
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'popover.newComponent.codeBranch'})}>
          {getFieldDecorator('code_version', {
            initialValue: data.code_version || 'master',
            rules: [{ required: true, message: formatMessage({id:'placeholder.select'}) }]
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
            xs: { span: 24, offset: 0 },
            sm: {
              span: formItemLayout.wrapperCol.span,
              offset: formItemLayout.labelCol.span
            }
          }}
          label=""
        >
          {isService && ButtonGroupState
            ? this.props.handleServiceBotton(
                <Button
                  disabled={!codeList.length}
                  onClick={this.handleSubmit}
                  type="primary"
                >
                  {formatMessage({id:'popover.newComponent.title'})}
                </Button>,
                false
              )
            : !handleType && (
                <Button
                  disabled={!codeList.length}
                  onClick={this.handleSubmit}
                  type="primary"
                >
                  {formatMessage({id:'popover.newApp.title'})}
                </Button>
              )}
        </Form.Item>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        {showCreateProject && (
          <CreateNewProject
            onOk={this.handleCreateProject}
            onCancel={this.handleCancelCreateProject}
          />
        )}
      </Form>
    );
  }
}

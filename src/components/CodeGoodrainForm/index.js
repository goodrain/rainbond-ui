import React, { PureComponent } from "react";
import { connect } from "dva";
import {
  Form,
  Button,
  Select,
  Input,
  Modal,
} from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";
import { getGitlabInfo } from "../../services/team";
import { getCodeBranchs } from "../../services/createApp";

const FormItem = Form.Item;
@Form.create()
class CreateNewProject extends PureComponent {
  handleOk = (e) => {
    e.preventDefault();
    this.props.form.validateFields({ force: true }, (err, vals) => {
      if (!err) {
        this.props.onOk && this.props.onOk(vals);
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
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
            {getFieldDecorator("project_name", {
              initialValue: "",
              rules: [{ required: true, message: "项目名称" }],
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
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@connect(
  ({ global }) => ({
    groups: global.groups,
  }),
  null,
  null,
  { withRef: true },
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      showCreateProject: false,
      gitlabUrl: "",
      gitlabId: "",
      codeList: [],
      branchs: [],
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
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const codeId = fieldsValue.git_project_id;
      const selectedProject = this.state.codeList.filter(item => item.code_id === codeId);
      if (selectedProject.length) {
        fieldsValue.git_url = selectedProject[0].code_repos;
      }
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  handleAddGroup = (vals) => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: "application/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
      },
      callback: (group) => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName(),
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            },
          });
        }
      },
    });
  };
  fetchGroup = () => {
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
    });
  };
  onCreateProject = () => {
    this.setState({ showCreateProject: true });
  };
  handleCancelCreateProject = () => {
    this.setState({ showCreateProject: false });
  };
  handleCreateProject = (value) => {
    this.props.dispatch({
      type: "user/createGitlabProject",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...value,
      },
      callback: (bean) => {
        if (bean) {
          this.setState({ gitlabUrl: bean.http_repo_url, gitlabId: bean.project_id });
          this.handleCancelCreateProject();
          this.showCreateProjectOk();
        }
      }
    });
  };
  showCreateProjectOk = () => {
    Modal.success({
      title: "创建项目成功",
      content: (
        <div>
          <p>
            项目地址:{" "}
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
      okText: "已上传源码",
    });
  };
  getGitlabInfo = () => {
    const self = this;

    return getGitlabInfo({
      team_name: globalUtil.getCurrTeamName(),
    }).then((data) => {
      if (data && data.bean) {
        self.setState({ codeList: data.list || [] }, () => {
          const { getFieldValue } = this.props.form;
          const defaultProjectId = getFieldValue("git_project_id") || this.getDefaultProjectId();
          if (defaultProjectId) {
            this.getCodeBranchs(defaultProjectId);
          }
        });
      }
    });
  };
  getCodeBranchs = (projectId) => {
    const git = this.state.codeList.filter(item => item.code_id === projectId)[0];

    getCodeBranchs({
      team_name: globalUtil.getCurrTeamName(),
      service_project_id: projectId,
      type: "gitlab",
      git_url: git.code_repos,
    }).then((data) => {
      if (data) {
        this.setState({ branchs: data.list || [] });
      }
    });
  };
  handleCodeIdChange = (val) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ code_version: "master" });
    this.getCodeBranchs(val);
  };
  getDefaultProjectId = () => {
    const data = this.props.data || {};
    const codeList = this.state.codeList || [];
    let defaultProject = data.git_project_id || "";
    if (!defaultProject && codeList.length) {
      defaultProject = codeList[0].code_id;
    }
    return defaultProject;
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { groups } = this.props;
    const data = this.props.data || {};
    const codeList = this.state.codeList || [];
    const defaultProject = this.getDefaultProjectId();
    const branchs = this.state.branchs || [];
    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label="应用名称">
          {getFieldDecorator("group_id", {
            initialValue: (this.props.handleType && this.props.handleType === "Service") ? Number(this.props.groupId) : data.groupd_id,
            rules: [{ required: true, message: "请选择" }],
          })(<Select style={{ display: "inline-block", width: (this.props.handleType && this.props.handleType === "Service") ? "" : 290, marginRight: 15 }}
            disabled={(this.props.handleType && this.props.handleType === "Service") ? true : false} >
            {(groups || []).map(group => <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>)}
          </Select>)}
          {(this.props.handleType && this.props.handleType === "Service") ? null : <Button onClick={this.onAddGroup}>新建应用</Button>}
        </Form.Item>
        <Form.Item {...formItemLayout} label="组件名称">
          {getFieldDecorator("service_cname", {
            initialValue: data.service_cname || "",
            rules: [{ required: true, message: "要创建的组件还没有名字" }],
          })(<Input placeholder="请为创建的组件起个名字吧" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Gitlab项目">
          {getFieldDecorator("git_project_id", {
            initialValue: defaultProject,
            rules: [{ required: true, message: "请选择" }],
          })(<Select
            placeholder={defaultProject ? "请选择" : "暂无项目，请先创建"}
            onChange={this.handleCodeIdChange}
            style={{ display: "inline-block", width: 290, marginRight: 15 }}
          >
            {codeList.map(item => <Option value={item.code_id}>{item.code_project_name}</Option>)}
          </Select>)}
          <Button onClick={this.onCreateProject}>新建项目</Button>
        </Form.Item>
        <Form.Item {...formItemLayout} label="代码分支">
          {getFieldDecorator("code_version", {
            initialValue: data.code_version || "master",
            rules: [{ required: true, message: "请选择" }],
          })(<Select>
            {branchs.map(item => <Option value={item}>{item}</Option>)}
          </Select>)}
        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: { span: formItemLayout.wrapperCol.span, offset: formItemLayout.labelCol.span },
          }}
          label=""
        >

          {this.props.handleType && this.props.handleType === "Service" && this.props.ButtonGroupState ?
            this.props.handleServiceBotton(<Button disabled={!codeList.length} onClick={this.handleSubmit} type="primary">
              新建组件
          </Button>, false) :
            !this.props.handleType && <Button disabled={!codeList.length} onClick={this.handleSubmit} type="primary">
              新建应用
          </Button>}

        </Form.Item>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        {this.state.showCreateProject && (
          <CreateNewProject
            onOk={this.handleCreateProject}
            onCancel={this.handleCancelCreateProject}
          />
        )}
      </Form>
    );
  }
}

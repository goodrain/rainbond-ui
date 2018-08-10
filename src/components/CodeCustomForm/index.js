import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Form, Button, Select, Input } from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";
import ShowRegionKey from "../../components/ShowRegionKey";

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
  ({ user, global }) => ({
    currUser: user.currentUser,
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
      showUsernameAndPass: false,
      showKey: false,
      addGroup: false,
      serverType: "git",
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  onChangeServerType = (value) => {
    this.setState({ serverType: value });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  checkURL = (rule, value, callback) => {
    if (this.state.serverType == "svn") {
      if (!/^(svn:\/\/).+$/gi.test(value)) {
        callback("不合法");
      }
    } else if (!/^(.+@.+\.git)|([^@]+\.git(\?.+)?)$/gi.test(value)) {
      callback("不合法");
    }
    callback();
  };
  handleAddGroup = (vals) => {
    const { setFieldsValue } = this.props.form;

    this.props.dispatch({
      type: "groupControl/addGroup",
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
              setFieldsValue({ group_id: group.ID });
              this.cancelAddGroup();
            },
          });
        }
      },
    });
  };
  hideShowKey = () => {
    this.setState({ showKey: false });
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        console.log(err);
        return;
      }
      if (fieldsValue.version_type == "tag") {
        fieldsValue.code_version = `tag:${fieldsValue.code_version}`;
      }
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups } = this.props;
    const { showUsernameAndPass, showKey } = this.state;
    const gitUrl = getFieldValue("git_url");
    let isHttp = /^(http:\/\/|https:\/\/)/.test(gitUrl || "");
    let urlCheck = /^(.+@.+\.git)|([^@]+\.git(\?.+)?)$/gi;
    if (this.state.serverType == "svn") {
      isHttp = true;
      urlCheck = /^(svn:\/\/).+$/gi;
    }
    const isSSH = !isHttp;
    const data = this.props.data || {};
    const showSubmitBtn = this.props.showSubmitBtn === void 0 ? true : this.props.showSubmitBtn;
    const showCreateGroup =
      this.props.showCreateGroup === void 0 ? true : this.props.showCreateGroup;
    const prefixSelector = getFieldDecorator("server_type", {
      initialValue: data.server_type || this.state.serverType,
    })(<Select onChange={this.onChangeServerType} style={{ width: 100 }}>
      <Option value="git">Git</Option>
      <Option value="svn">Svn</Option>
       </Select>);
    const versionSelector = getFieldDecorator("version_type", {
      initialValue: this.state.version_type || "branch",
    })(<Select style={{ width: 100 }}>
      <Option value="branch">分支</Option>
      <Option value="tag">Tag</Option>
    </Select>);
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator("service_cname", {
              initialValue: data.service_cname || "",
              rules: [
                { required: true, message: "要创建的应用还没有名字" },
                { min: 4, message: "应用名称必须大于4位" },
              ],
            })(<Input placeholder="请为创建的应用起个名字吧" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="应用组">
            {getFieldDecorator("group_id", {
              initialValue: data.group_id || -1,
              rules: [{ required: true, message: "请选择" }],
            })(<Select
              placeholder="请选择要所属应用组"
              style={{ display: "inline-block", width: 306, marginRight: 15 }}
            >
              {(groups || []).map(group => (
                <Option value={group.group_id}>{group.group_name}</Option>
                ))}
            </Select>)}
            {showCreateGroup ? <Button onClick={this.onAddGroup}>新建组</Button> : null}
          </Form.Item>
          <Form.Item {...formItemLayout} label="仓库地址">
            {getFieldDecorator("git_url", {
              initialValue: data.git_url || "",
              force: true,
              rules: [
                { required: true, message: "请输入仓库地址" },
                { validator: this.checkURL, message: "仓库地址不合法" },
              ],
            })(<Input addonBefore={prefixSelector} placeholder="请输入仓库地址" />)}
          </Form.Item>
          {gitUrl && isSSH ? (
            <div style={{ textAlign: "right" }}>
              这是一个私有仓库?{" "}
              <a
                onClick={() => {
                  this.setState({ showKey: true });
                }}
                href="javascript:;"
              >
                配置授权Key
              </a>
            </div>
          ) : (
            ""
          )}
          {gitUrl && isHttp ? (
            <div style={{ textAlign: "right" }}>
              这是一个私有仓库?{" "}
              <a
                onClick={() => {
                  this.setState({ showUsernameAndPass: true });
                }}
                href="javascript:;"
              >
                填写仓库账号密码
              </a>
            </div>
          ) : (
            ""
          )}
          <Form.Item
            style={{ display: showUsernameAndPass && isHttp ? "" : "none" }}
            {...formItemLayout}
            label="仓库用户名"
          >
            {getFieldDecorator("username_1", {
              initialValue: data.username || "",
              rules: [{ required: false, message: "请输入仓库用户名" }],
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{ display: showUsernameAndPass && isHttp ? "" : "none" }}
            {...formItemLayout}
            label="仓库密码"
          >
            {getFieldDecorator("password_1", {
              initialValue: data.password || "",
              rules: [{ required: false, message: "请输入仓库密码" }],
            })(<Input autoComplete="new-password" type="password" placeholder="请输入仓库密码" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="代码版本">
            {getFieldDecorator("code_version", {
              initialValue: data.code_version || "master",
              rules: [{ required: true, message: "请输入代码版本" }],
            })(<Input addonBefore={versionSelector} placeholder="请输入代码版本" />)}
          </Form.Item>

          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: { span: formItemLayout.wrapperCol.span, offset: formItemLayout.labelCol.span },
              }}
              label=""
            >
              <Button onClick={this.handleSubmit} type="primary">
                新建应用
              </Button>
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        {showKey && isSSH && <ShowRegionKey onCancel={this.hideShowKey} />}
      </Fragment>
    );
  }
}

import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Form, Button, Select, Input, Switch, Checkbox, Row, Col } from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";
import ShowRegionKey from "../../components/ShowRegionKey";

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
  ({ user, global, loading }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    createAppByCodeLoading: loading.effects["createApp/createAppByCode"]
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
      showUsernameAndPass: false,
      showKey: false,
      addGroup: false,
      serverType: "git",
      subdirectories: false,
      checkedList: []
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  onChangeServerType = value => {
    this.setState({
      serverType: value,
      checkedList: [],
      showUsernameAndPass: false,
      subdirectories: false
    });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  getUrlCheck() {
    if (this.state.serverType == "svn") {
      return /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    return /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
  }

  checkURL = (rule, value, callback) => {
    const urlCheck = this.getUrlCheck();
    if (urlCheck.test(value)) {
      callback();
    } else {
      callback("非法仓库地址");
    }
  };

  handleAddGroup = vals => {
    const { setFieldsValue } = this.props.form;

    this.props.dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: group => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.ID });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };
  hideShowKey = () => {
    this.handkeDeleteCheckedList("showKey");
    this.setState({ showKey: false });
  };
  handkeDeleteCheckedList = type => {
    const { checkedList } = this.state;
    let arr = checkedList;
    if (arr.indexOf(type) > -1) {
      arr.splice(arr.indexOf(type), 1);
      this.setState({ checkedList: arr });
    }
  };
  handleSubmit = e => {
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
      if (fieldsValue.subdirectories && fieldsValue.server_type !== "svg") {
        fieldsValue.git_url =
          fieldsValue.git_url + "?dir=" + fieldsValue.subdirectories;
      }

      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  getDefaultBranchName = () => {
    if (this.state.serverType == "svn") {
      return "trunk";
    } else {
      return "master";
    }
  };
  fetchCheckboxGroup = (type, serverType) => {
    const { checkedList, showKey } = this.state;
    let isSubdirectories = serverType !== "svn";
    return (
      <Checkbox.Group
        style={{ width: "100%", marginBottom: "10px" }}
        onChange={this.onChange}
        value={checkedList}
      >
        <Row>
          <Col span={isSubdirectories ? 16 : 24} style={{ textAlign: "right" }}>
            {type === "showKey" && (
              <Checkbox value="showKey" checked={showKey}>
                配置授权Key
              </Checkbox>
            )}
            {type === "showUsernameAndPass" && (
              <Checkbox value="showUsernameAndPass">填写仓库账号密码</Checkbox>
            )}
          </Col>
          {isSubdirectories && (
            <Col span={8} style={{ textAlign: "right" }}>
              <Checkbox value="subdirectories">填写子目录路径</Checkbox>
            </Col>
          )}
        </Row>
      </Checkbox.Group>
    );
  };
  onChange = checkedValues => {
    this.setState({
      checkedList: checkedValues,
      showUsernameAndPass: checkedValues.includes("showUsernameAndPass"),
      subdirectories: checkedValues.includes("subdirectories"),
      showKey: checkedValues.includes("showKey")
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups, createAppByCodeLoading } = this.props;
    const {
      showUsernameAndPass,
      showKey,
      subdirectories,
      checkedList
    } = this.state;

    const gitUrl = getFieldValue("git_url");

    let isHttp = /(http|https):\/\/([\w.]+\/?)\S*/.test(gitUrl || "");
    let urlCheck = /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    if (this.state.serverType == "svn") {
      isHttp = true;
      urlCheck = /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    const isSSH = !isHttp;
    const data = this.props.data || {};
    const showSubmitBtn =
      this.props.showSubmitBtn === void 0 ? true : this.props.showSubmitBtn;
    const showCreateGroup =
      this.props.showCreateGroup === void 0 ? true : this.props.showCreateGroup;
    const prefixSelector = getFieldDecorator("server_type", {
      initialValue: data.server_type || this.state.serverType
    })(
      <Select onChange={this.onChangeServerType} style={{ width: 100 }}>
        <Option value="git">Git</Option>
        <Option value="svn">Svn</Option>
      </Select>
    );
    const versionSelector = getFieldDecorator("version_type", {
      initialValue: this.state.version_type || "branch"
    })(
      <Select style={{ width: 100 }}>
        <Option value="branch">分支</Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    const serverType = getFieldValue("server_type");

    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator("group_id", {
              initialValue:
                this.props.handleType && this.props.handleType === "Service"
                  ? Number(this.props.groupId)
                  : data.group_id,
              rules: [{ required: true, message: "请选择" }]
            })(
              <Select
                placeholder="请选择要所属应用"
                style={{
                  display: "inline-block",
                  width:
                    this.props.handleType && this.props.handleType === "Service"
                      ? ""
                      : 292,
                  marginRight: 15
                }}
                disabled={
                  this.props.handleType && this.props.handleType === "Service"
                    ? true
                    : false
                }
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            {this.props.handleType &&
            this.props.handleType === "Service" ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>新建应用</Button>
            ) : null}
          </Form.Item>
          <Form.Item {...formItemLayout} label="组件名称">
            {getFieldDecorator("service_cname", {
              initialValue: data.service_cname || "",
              rules: [{ required: true, message: "要创建的组件还没有名字" }]
            })(<Input placeholder="请为创建的组件起个名字吧" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="仓库地址">
            {getFieldDecorator("git_url", {
              initialValue: data.git_url || "",
              force: true,
              rules: [
                { required: true, message: "请输入仓库地址" },
                { validator: this.checkURL, message: "仓库地址不合法" }
              ]
            })(
              <Input
                addonBefore={prefixSelector}
                placeholder="请输入仓库地址"
              />
            )}
          </Form.Item>
          {gitUrl && isSSH && this.fetchCheckboxGroup("showKey", serverType)}
          {gitUrl &&
            isHttp &&
            this.fetchCheckboxGroup("showUsernameAndPass", serverType)}

          {showUsernameAndPass && isHttp && (
            <Form.Item {...formItemLayout} label="仓库用户名">
              {getFieldDecorator("username_1", {
                initialValue: data.username || "",
                rules: [{ required: false, message: "请输入仓库用户名" }]
              })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
            </Form.Item>
          )}
          {showUsernameAndPass && isHttp && (
            <Form.Item {...formItemLayout} label="仓库密码">
              {getFieldDecorator("password_1", {
                initialValue: data.password || "",
                rules: [{ required: false, message: "请输入仓库密码" }]
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  placeholder="请输入仓库密码"
                />
              )}
            </Form.Item>
          )}

          {subdirectories && serverType !== "svn" && (
            <Form.Item {...formItemLayout} label="子目录路径">
              {getFieldDecorator("subdirectories", {
                initialValue: "",
                rules: [{ required: true, message: "请输入子目录路径" }]
              })(<Input placeholder="请输入子目录路径" />)}
            </Form.Item>
          )}
          <Form.Item {...formItemLayout} label="代码版本">
            {getFieldDecorator("code_version", {
              initialValue: data.code_version || this.getDefaultBranchName(),
              rules: [{ required: true, message: "请输入代码版本" }]
            })(
              <Input
                addonBefore={versionSelector}
                placeholder="请输入代码版本"
              />
            )}
          </Form.Item>

          {showSubmitBtn ? (
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
              {this.props.handleType &&
              this.props.handleType === "Service" &&
              this.props.ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      新建组件
                    </Button>,
                    false
                  )
                : !this.props.handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      确认创建
                    </Button>
                  )}
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

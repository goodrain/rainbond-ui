import React, { PureComponent } from "react";
import { Form, Modal, Input, Select, notification } from "antd";
import { connect } from "dva";
import { getCodeBranch } from "../../../services/app";
import globalUtil from "../../../utils/global";
import appUtil from "../../../utils/app";
import ShowRegionKey from "../../../components/ShowRegionKey";

const FormItem = Form.Item;
const { Option } = Select;
// 切换分支组件
@Form.create()
@connect()
export default class ChangeBuildSource extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      branch: this.props.branch || [],
      buildSource: this.props.buildSource || null,
      showUsernameAndPass: false,
      showKey: false,
      gitUrl: this.props.buildSource.git_url,
      serverType: this.props.buildSource.server_type
        ? this.props.buildSource.server_type
        : "git",
      showCode: appUtil.isCodeAppByBuildSource(this.props.buildSource),
      showImage: appUtil.isImageAppByBuildSource(this.props.buildSource)
    };
  }
  componentDidMount() {
    // this.changeURL(this.props.buildSource.git_url||null);
    if (appUtil.isCodeAppByBuildSource(this.state.buildSource)) {
      this.loadBranch();
    }
  }
  getUrlCheck() {
    if (this.state.serverType == "svn") {
      return /^(svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    return /^(git@|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
  }
  changeServerType = value => {
    this.setState({ serverType: value, showUsernameAndPass: false });
  };
  checkURL = (rule, value, callback) => {
    const urlCheck = this.getUrlCheck();
    if (urlCheck.test(value)) {
      callback();
    } else {
      callback("非法仓库地址");
    }
  };
  loadBranch() {
    getCodeBranch({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias
    }).then(data => {
      if (data) {
        this.setState({ branch: data.list });
      }
    });
  }
  handleSubmit = () => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.version_type == "tag") {
        fieldsValue.code_version = "tag:".concat(fieldsValue.code_version);
      }

      this.props.dispatch({
        type: "appControl/putAppBuidSource",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.appAlias,
          ...fieldsValue
        },
        callback: () => {
          notification.success({ message: "修改成功，下次构建部署时生效" });
          if (this.props.onOk) {
            this.props.onOk();
          }
        }
      });
    });
  };
  hideShowKey = () => {
    this.setState({ showKey: false });
  };

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {
    const { title, onCancel } = this.props;
    const branch = this.state.branch;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { showUsernameAndPass, showKey } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
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
    const gitUrl = getFieldValue("git_url");
    let isHttp = /(http|https):\/\/([\w.]+\/?)\S*/.test(gitUrl || "");
    let urlCheck = /^(git@|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    if (this.state.serverType == "svn") {
      isHttp = true;
      urlCheck = /^(svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    const isSSH = !isHttp;

    const prefixSelector = getFieldDecorator("server_type", {
      initialValue: this.state.buildSource.server_type
    })(
      <Select onChange={this.changeServerType} style={{ width: 100 }}>
        <Option value="git">Git</Option>
        <Option value="svn">Svn</Option>
      </Select>
    );
    let codeVersion = this.state.buildSource.code_version;
    let versionType = "branch";
    if (codeVersion && codeVersion.indexOf("tag:") == 0) {
      versionType = "tag";
      codeVersion = codeVersion.substr(4, codeVersion.length);
    }
    const versionSelector = getFieldDecorator("version_type", {
      initialValue: versionType
    })(
      <Select style={{ width: 100 }}>
        <Option value="branch">分支</Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    if (this.state.showCode) {
      getFieldDecorator("service_source", { initialValue: "source_code" });
    }
    const showImage = appUtil.isImageAppByBuildSource(this.state.buildSource);

    if (this.state.showImage) {
      getFieldDecorator("service_source", { initialValue: "docker_run" });
    }
    return (
      <Modal
        width={700}
        title={title}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        visible
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem
            style={{ display: showImage ? "" : "none" }}
            {...formItemLayout}
            label="镜像名称"
          >
            {getFieldDecorator("image", {
              rules: [{ required: true, message: "镜像名称不能为空" }],
              initialValue: this.state.buildSource.image
            })(<Input />)}
          </FormItem>
          <FormItem
            style={{ display: showImage ? "" : "none" }}
            {...formItemLayout}
            label="启动命令"
          >
            {getFieldDecorator("cmd", {
              initialValue: this.state.buildSource.cmd
            })(<Input />)}
          </FormItem>

          <Form.Item
            style={{ display: showImage ? "" : "none" }}
            {...formItemLayout}
            label="用户名"
          >
            {getFieldDecorator("user_name", {
              initialValue:
                this.state.buildSource.user_name ||
                this.state.buildSource.user ||
                "",
              rules: [{ required: false, message: "请输入仓库用户名" }]
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{ display: showImage ? "" : "none" }}
            {...formItemLayout}
            label="密码"
          >
            {getFieldDecorator("password", {
              initialValue: this.state.buildSource.password || "",
              rules: [{ required: false, message: "请输入仓库密码" }]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="请输入仓库密码"
              />
            )}
          </Form.Item>

          {this.state.showCode && (
            <Form.Item
              style={{ display: this.state.showCode ? "" : "none" }}
              {...formItemLayout}
              label="仓库地址"
            >
              {getFieldDecorator("git_url", {
                initialValue: this.state.buildSource.git_url,
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
          )}
          {this.state.showCode && (
            <Form.Item
              style={{ display: this.state.showCode ? "" : "none" }}
              {...formItemLayout}
              label="代码版本"
            >
              {getFieldDecorator("code_version", {
                initialValue: codeVersion,
                rules: [{ required: true, message: "请输入代码版本" }]
              })(
                <Input
                  addonBefore={versionSelector}
                  placeholder="请输入代码版本"
                />
              )}
            </Form.Item>
          )}

          {gitUrl && isSSH ? (
            <div style={{ textAlign: "left" }}>
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
            <div style={{ textAlign: "left" }}>
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
            label="用户名"
          >
            {getFieldDecorator("user_name", {
              initialValue:
                this.state.buildSource.user_name ||
                this.state.buildSource.user ||
                "",
              rules: [{ required: false, message: "请输入仓库用户名" }]
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{ display: showUsernameAndPass && isHttp ? "" : "none" }}
            {...formItemLayout}
            label="密码"
          >
            {getFieldDecorator("password", {
              initialValue: this.state.buildSource.password || "",
              rules: [{ required: false, message: "请输入仓库密码" }]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="请输入仓库密码"
              />
            )}
          </Form.Item>
        </Form>
        {showKey && isSSH && <ShowRegionKey onCancel={this.hideShowKey} />}
      </Modal>
    );
  }
}

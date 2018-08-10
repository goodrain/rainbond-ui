import React, { PureComponent } from "react";
import { Form, Modal, Input, Select, notification } from "antd";
import { connect } from "dva";
import { getCodeBranch } from "../../../services/app";
import globalUtil from "../../../utils/global";
import appUtil from "../../../utils/app";

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
    };
  }
  componentDidMount() {
    if (appUtil.isCodeAppByBuildSource(this.state.buildSource)) {
      this.loadBranch();
    }
  }
  loadBranch() {
    getCodeBranch({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
    }).then((data) => {
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
          ...fieldsValue,
        },
        callback: () => {
          notification.success({ message: "修改成功，下次构建部署时生效" });
          if (this.props.onOk) {
            this.props.onOk();
          }
        },
      });
    });
  };
  render() {
    const { title, onCancel } = this.props;
    const branch = this.state.branch;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 3,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 16,
        },
      },
    };
    const { showUsernameAndPass, showKey } = this.state;
    const isCustomCode = this.props.isCreateFromCustomCode;
    const { getFieldDecorator, setFieldsValue } = this.props.form;
    const gitUrl = this.state.buildSource.git_url;
    const serverType = this.state.buildSource.service_type || "git";
    let isHttp = /^(http:\/\/|https:\/\/)/.test(gitUrl || "");
    let urlCheck = /^(.+@.+\.git)|([^@]+\.git(\?.+)?)$/gi;
    if (serverType == "svn") {
      isHttp = true;
      urlCheck = /^(svn:\/\/).+$/gi;
    }
    const isSSH = !isHttp;
    const prefixSelector = getFieldDecorator("server_type", {
      initialValue: serverType,
    })(<Select style={{ width: 100 }}>
      <Option value="git">Git</Option>
      <Option value="svn">Svn</Option>
       </Select>);
    let codeVersion = this.state.buildSource.code_version;
    let versionType = "branch";
    if (codeVersion.indexOf("tag:") == 0) {
      versionType = "tag";
      codeVersion = codeVersion.substr(4, codeVersion.length);
    }
    const versionSelector = getFieldDecorator("version_type", {
      initialValue: versionType,
    })(<Select style={{ width: 100 }}>
      <Option value="branch">分支</Option>
      <Option value="tag">Tag</Option>
    </Select>);
    const showCode = appUtil.isCodeAppByBuildSource(this.state.buildSource);
    if (showCode) {
      getFieldDecorator("service_source", { initialValue: "source_code" });
    }
    const showImage = appUtil.isImageAppByBuildSource(this.state.buildSource);
    if (showCode) {
      getFieldDecorator("service_source", { initialValue: "docker_run" });
    }
    return (
      <Modal width={700} title={title} onOk={this.handleSubmit} onCancel={onCancel} visible>
        <Form onSubmit={this.handleSubmit}>
          <FormItem style={{ display: showImage ? "" : "none" }} {...formItemLayout} label="镜像名称">
            {getFieldDecorator("image", {
              rules: [{ required: true, message: "镜像名称不能为空" }],
              initialValue: this.state.buildSource.image,
            })(<Input />)}
          </FormItem>
          <FormItem style={{ display: showImage ? "" : "none" }} {...formItemLayout} label="启动命令">
            {getFieldDecorator("cmd", {
              initialValue: this.state.buildSource.cmd,
            })(<Input />)}
          </FormItem>
          <Form.Item style={{ display: showCode ? "" : "none" }} {...formItemLayout} label="仓库地址">
            {getFieldDecorator("git_url", {
              initialValue: this.state.buildSource.git_url,
              rules: [
                { required: true, message: "请输入仓库地址" },
                { pattern: urlCheck, message: "仓库地址不合法" },
              ],
            })(<Input addonBefore={prefixSelector} placeholder="请输入仓库地址" />)}
          </Form.Item>
          <Form.Item style={{ display: showCode ? "" : "none" }} {...formItemLayout} label="代码版本">
            {getFieldDecorator("code_version", {
              initialValue: codeVersion,
              rules: [{ required: true, message: "请输入代码版本" }],
            })(<Input addonBefore={versionSelector} placeholder="请输入代码版本" />)}
          </Form.Item>
          {gitUrl && isSSH ? (
            <div style={{ textAlign: "left", marginRight: 32 }}>
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
            <div style={{ textAlign: "left", marginRight: 32 }}>
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
          )}
          <Form.Item
            style={{ display: showUsernameAndPass ? "" : "none" }}
            {...formItemLayout}
            label="用户名"
          >
            {getFieldDecorator("user_name", {
              initialValue: this.state.buildSource.user_name || "",
              rules: [{ required: false, message: "请输入仓库用户名" }],
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{ display: showUsernameAndPass ? "" : "none" }}
            {...formItemLayout}
            label="密码"
          >
            {getFieldDecorator("password", {
              initialValue: this.state.buildSource.password || "",
              rules: [{ required: false, message: "请输入仓库密码" }],
            })(<Input autoComplete="new-password" type="password" placeholder="请输入仓库密码" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

//   if (!isCustomCode) {
//     return (
//       <FormItem {...formItemLayout} label="代码分支">
//         {getFieldDecorator("branch", {
//           initialValue: this.state.curr || "",
//           rules: [
//             {
//               required: true,
//               message: "请选择分支",
//             },
//           ],
//         })(<Select
//           style={{
//               width: 200,
//             }}
//         >
//           {branch.map(item => <Option value={item}>{item}</Option>)}
//            </Select>)}

//         <Button
//           onClick={this.handleSubmit}
//           style={{
//             marginLeft: 10,
//           }}
//           type="primary"
//         >
//           确定
//         </Button>
//       </FormItem>
//     );
//   }

//   return (

//     <FormItem {...formItemLayout} label="代码分支">
//       {getFieldDecorator("branch", {
//         initialValue: this.state.curr || "",
//         rules: [
//           {
//             required: true,
//             message: "请输入分支",
//           },
//         ],
//       })(<Input
//         type="text"
//         style={{
//             width: 200,
//           }}
//       />)}
//       <Button
//         onClick={this.handleSubmit}
//         style={{
//           marginLeft: 10,
//         }}
//         type="primary"
//       >
//         确定
//       </Button>
//     </FormItem>
//   );
// }
// }

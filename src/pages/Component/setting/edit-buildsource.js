/* eslint-disable react/no-redundant-should-component-update */
/* eslint-disable react/no-unused-state */
import { Alert, Form, Input, Modal, notification, Select, Tabs } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import ShowRegionKey from '../../../components/ShowRegionKey';
import { getCodeBranch } from '../../../services/app';
import appUtil from '../../../utils/app';
import globalUtil from '../../../utils/global';
const { TabPane } = Tabs;
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
      showUsernameAndPass: this.props.buildSource.user !== '',
      showKey: false,
      isFlag: true,
      tabValue: 'source_code',
      gitUrl: this.props.buildSource.git_url,
      serverType: this.props.buildSource.server_type
        ? this.props.buildSource.server_type
        : 'git',
      showCode: appUtil.isCodeAppByBuildSource(this.props.buildSource),
      showImage: appUtil.isImageAppByBuildSource(this.props.buildSource),
      tabKey: '',
    };
  }
  componentDidMount() {
    // this.changeURL(this.props.buildSource.git_url||null);
    if (appUtil.isCodeAppByBuildSource(this.state.buildSource)) {
      this.loadBranch();
    }
    const { buildSource } = this.props
    if (buildSource.service_source == "docker_image" || buildSource.service_source =='docker_run') {
      this.setState({
        tabKey: '2',
        tabValue: 'docker_run'
      })
    } else {
      this.setState({
        tabKey: '1',
        tabValue: 'source_code'
      })
    }

  }
  shouldComponentUpdate() {
    return true;
  }
  getUrlCheck() {
    if (this.state.serverType == 'svn') {
      return /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    return /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
  }
  changeServerType = value => {
    const { form } = this.props;
    const { getFieldValue } = form;
    const userName = getFieldValue('user_name');
    if (value == 'oss') {
      this.setState({ isFlag: false })
    } else {
      this.setState({ isFlag: true })
    }
    this.setState({ serverType: value, showUsernameAndPass: userName !== '' });
  };
  checkURL = (_rule, value, callback) => {
    const urlCheck = this.getUrlCheck();
    if (urlCheck.test(value)) {
      callback();
    } else {
      callback('非法仓库地址');
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
    const { form } = this.props;
    const { tabValue } = this.state
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.version_type == 'tag') {
        fieldsValue.code_version = 'tag:'.concat(fieldsValue.code_version);
      }
      this.props.dispatch({
        type: 'appControl/putAppBuidSource',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.appAlias,
          service_source: tabValue,
          ...fieldsValue
        },
        callback: () => {
          notification.success({ message: '修改成功，下次构建部署时生效' });
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
  handleTabs = (value) => {
    if (value == '2') {
      this.setState({
        tabValue: 'docker_run'
      })
    } else {
      this.setState({
        tabValue: 'source_code'
      })
    }
  }

  render() {
    const { title, onCancel, appBuidSourceLoading, form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const { showUsernameAndPass, showKey, isFlag, tabValue, buildSource, tabKey } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 5
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 10
        },
        sm: {
          span: 16
        }
      }
    };
    const gitUrl = getFieldValue('git_url');
    let isHttp = /(http|https):\/\/([\w.]+\/?)\S*/.test(gitUrl || '');
    if (this.state.serverType !== 'git') {
      isHttp = true;
    } else if (this.state.serverType === 'oss') {
      isHttp = true;
    }
    const isSSH = !isHttp;

    const prefixSelector = getFieldDecorator('server_type', {
      initialValue: 'git'
    })(
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        onChange={this.changeServerType}
        style={{ width: 100 }}
      >
        <Option value="git">Git</Option>
        <Option value="svn">Svn</Option>
        <Option value="oss">OSS</Option>
      </Select>
    );
    let codeVersion = this.state.buildSource.code_version;
    let versionType = 'branch';
    if (codeVersion && codeVersion.indexOf('tag:') === 0) {
      versionType = 'tag';
      codeVersion = codeVersion.substr(4, codeVersion.length);
    }
    const versionSelector = getFieldDecorator('version_type', {
      initialValue: versionType
    })(
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        style={{ width: 100 }}
      >
        <Option value="branch">分支</Option>
        <Option value="tag">Tag</Option>
      </Select>
    );

    return (
      <Modal
        width={700}
        title={title}
        confirmLoading={appBuidSourceLoading}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        visible
      >
        <Alert
          message="您可以在此修改创建方式"
          type="warning"
          closable
          size="small"
          style={{ marginBottom: '12px' }}
        // onClose={onClose}
        />
        <Tabs defaultActiveKey={tabKey} onChange={this.handleTabs} >
          <TabPane tab="源码" key="1" >
            {tabValue === 'source_code' && (
              <Form onSubmit={this.handleSubmit}>
                <Form.Item
                  {...formItemLayout}
                  label="仓库地址"
                >
                  {getFieldDecorator('git_url', {
                    initialValue: buildSource.service_source == "source_code" && buildSource.git_url ? buildSource.git_url : '',
                    force: true,
                    rules: [
                      { required: true, message: '请输入仓库地址' },
                      { validator: this.checkURL, message: '仓库地址不合法' }
                    ]
                  })(
                    <Input
                      addonBefore={prefixSelector}
                      placeholder="请输入仓库地址"
                    />
                  )}
                </Form.Item>
                {isFlag &&
                  <Form.Item
                    {...formItemLayout}
                    label="代码版本"
                  >
                    {getFieldDecorator('code_version', {
                      initialValue: buildSource.service_source == "source_code" && codeVersion ? codeVersion : '',
                      rules: [{ required: true, message: '请输入代码版本' }]
                    })(
                      <Input
                        addonBefore={versionSelector}
                        placeholder="请输入代码版本"
                      />
                    )}
                  </Form.Item>
                }
               

                <Form.Item
                  {...formItemLayout}
                  label="用户名"
                >
                  {getFieldDecorator('user_name', {
                    initialValue:
                      // buildSource.user_name ||
                      // buildSource.user ||
                      //   '',
                      (buildSource.service_source == "source_code") &&
                        (buildSource.user_name || buildSource.user) ? (buildSource.user_name || buildSource.user) : '',
                    rules: [{ required: false, message: '请输入仓库用户名' }]
                  })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
                </Form.Item>
                <Form.Item
                  {...formItemLayout}
                  label="密码"
                >
                  {getFieldDecorator('password', {
                    initialValue: buildSource.service_source == "source_code" && buildSource.password ? buildSource.password : '',
                    rules: [{ required: false, message: '请输入仓库密码' }]
                  })(
                    <Input
                      autoComplete="new-password"
                      type="password"
                      placeholder="请输入仓库密码"
                    />
                  )}
                </Form.Item>
              </Form>
            )}

          </TabPane>
          <TabPane tab="镜像" key="2">
            {tabValue === 'docker_run' && (
              <Form onSubmit={this.handleSubmit}>
                <FormItem
                  {...formItemLayout}
                  label="镜像名称"
                >
                  {getFieldDecorator('image', {
                    initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source =='docker_run') && buildSource.image ? buildSource.image : '',
                    rules: [
                      { required: true, message: '镜像名称不能为空' },
                      {
                        max: 190,
                        message: '最大长度190位'
                      }
                    ],
                  })(<Input placeholder="请输入镜像名称" />)}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="启动命令"
                >
                  {getFieldDecorator('cmd', {
                    initialValue: (buildSource.service_source == "docker_image" ) && buildSource.cmd ? buildSource.cmd : '',
                  })(<Input placeholder="请输入启动命令" />)}
                </FormItem>

                <Form.Item
                  {...formItemLayout}
                  label="用户名"
                >
                  {getFieldDecorator('user_name', {
                    initialValue:
                      (buildSource.service_source == "docker_image" ) &&
                      (buildSource.user_name || buildSource.user) ? (buildSource.user_name || buildSource.user) : '',
                    rules: [{ required: false, message: '请输入仓库用户名' }]
                  })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
                </Form.Item>
                <Form.Item
                  {...formItemLayout}
                  label="密码"
                >
                  {getFieldDecorator('password', {
                    initialValue: (buildSource.service_source == "docker_image") && buildSource.password ? buildSource.password : '',
                    rules: [{ required: false, message: '请输入仓库密码' }]
                  })(
                    <Input
                      autoComplete="new-password"
                      type="password"
                      placeholder="请输入仓库密码"
                    />
                  )}
                </Form.Item>
              </Form>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}

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
      gitUrl: this.props.buildSource.git_url,
      serverType: this.props.buildSource.server_type
        ? this.props.buildSource.server_type
        : 'git',
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

  render() {
    const { title, onCancel, appBuidSourceLoading, form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const { showUsernameAndPass, showKey } = this.state;
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
    }
    const isSSH = !isHttp;

    const prefixSelector = getFieldDecorator('server_type', {
      initialValue: this.state.buildSource.server_type
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
    if (this.state.showCode) {
      getFieldDecorator('service_source', { initialValue: 'source_code' });
    }
    const showImage = appUtil.isImageAppByBuildSource(this.state.buildSource);

    if (this.state.showImage) {
      getFieldDecorator('service_source', { initialValue: 'docker_run' });
    }
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
        <Tabs defaultActiveKey="1" >
          <TabPane tab="源码" key="1" >
            <Form onSubmit={this.handleSubmit}>
              <Form.Item
                {...formItemLayout}
                label="仓库地址"
              >
                {getFieldDecorator('git_url', {
                  initialValue: this.state.buildSource.git_url,
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
              <Form.Item
                {...formItemLayout}
                label="代码版本"
              >
                {getFieldDecorator('code_version', {
                  initialValue: codeVersion,
                  rules: [{ required: true, message: '请输入代码版本' }]
                })(
                  <Input
                    addonBefore={versionSelector}
                    placeholder="请输入代码版本"
                  />
                )}
              </Form.Item>

              {gitUrl && isSSH ? (
                <div style={{ textAlign: 'left' }}>
                  这是一个私有仓库?{' '}
                  <a
                    onClick={() => {
                      this.setState({ showKey: true });
                    }}
                  >
                    配置授权Key
                  </a>
                </div>
              ) : (
                ''
              )}
              {gitUrl && isHttp && !showUsernameAndPass ? (
                <div style={{ textAlign: 'left' }}>
                  这是一个私有仓库?
                  <a
                    onClick={() => {
                      this.setState({ showUsernameAndPass: true });
                    }}
                  >
                    填写仓库账号密码
                  </a>
                </div>
              ) : (
                ''
              )}

              <Form.Item
                style={{ display: showUsernameAndPass && isHttp ? '' : 'none' }}
                {...formItemLayout}
                label="用户名"
              >
                {getFieldDecorator('user_name', {
                  initialValue:
                    this.state.buildSource.user_name ||
                    this.state.buildSource.user ||
                    '',
                  rules: [{ required: false, message: '请输入仓库用户名' }]
                })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
              </Form.Item>
              <Form.Item
                style={{ display: showUsernameAndPass && isHttp ? '' : 'none' }}
                {...formItemLayout}
                label="密码"
              >
                {getFieldDecorator('password', {
                  initialValue: this.state.buildSource.password || '',
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
          </TabPane>
          <TabPane tab="镜像" key="2">
            <Form onSubmit={this.handleSubmit}>
              <FormItem
                {...formItemLayout}
                label="镜像名称"
              >
                {getFieldDecorator('image', {
                  rules: [
                    { required: true, message: '镜像名称不能为空' },
                    {
                      max: 190,
                      message: '最大长度190位'
                    }
                  ],
                  initialValue: this.state.buildSource.image
                })(<Input />)}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="启动命令"
              >
                {getFieldDecorator('cmd', {
                  initialValue: this.state.buildSource.cmd
                })(<Input />)}
              </FormItem>

              <Form.Item
                {...formItemLayout}
                label="用户名"
              >
                {getFieldDecorator('user_name', {
                  initialValue:
                    this.state.buildSource.user_name ||
                    this.state.buildSource.user ||
                    '',
                  rules: [{ required: false, message: '请输入仓库用户名' }]
                })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
              </Form.Item>
              <Form.Item
                {...formItemLayout}
                label="密码"
              >
                {getFieldDecorator('password', {
                  initialValue: this.state.buildSource.password || '',
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
          </TabPane>
        </Tabs>
        

        {/* {showKey && isSSH && <ShowRegionKey onCancel={this.hideShowKey} />} */}
      </Modal>
    );
  }
}

/* eslint-disable react/no-redundant-should-component-update */
/* eslint-disable react/no-unused-state */
import { Alert, Form, Input, Modal, notification, Select, Tabs, Radio } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ShowRegionKey from '../../../components/ShowRegionKey';
import { getCodeBranch } from '../../../services/app';
import appUtil from '../../../utils/app';
import cookie from '../../../utils/cookie';
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
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    // this.changeURL(this.props.buildSource.git_url||null);
    if (appUtil.isCodeAppByBuildSource(this.state.buildSource)) {
      this.loadBranch();
    }
    const { buildSource } = this.props
    if (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') {
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
      return /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/)[^\s]+$/gi;
    }
    return /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/)[^\s]+$/gi;
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
      callback(<FormattedMessage id='componentOverview.body.ChangeBuildSource.Illegal' />);
    }
  }

  checkImage = (_rule, value, callback) => {
    if (/^[^\s]+$/.test(value)) {
      callback();
    } else {
      callback(<FormattedMessage id='componentOverview.body.ChangeBuildSource.Illegal' />);
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
    const { form, buildSource } = this.props;
    const { tabValue } = this.state
    const archLegnth = buildSource.arch.length
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.version_type == 'tag') {
        fieldsValue.code_version = 'tag:'.concat(fieldsValue.code_version);
      }
      if(archLegnth && archLegnth != 2 && archLegnth != 0){
        fieldsValue.arch = buildSource.arch[0]
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
          notification.success({ message: formatMessage({ id: 'notification.success.edit_deploy' }) });
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
    const { title, onCancel, appBuidSourceLoading, form, archInfo } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const { showUsernameAndPass, showKey, isFlag, tabValue, buildSource, tabKey, language } = this.state;
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
    const en_formItemLayout = {
      labelCol: {
        xs: {
          span: 5
        },
        sm: {
          span: 5
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
    const is_language = language ? formItemLayout : en_formItemLayout
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
        <Option value="branch"><FormattedMessage id='componentOverview.body.ChangeBuildSource.git_branch' /></Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    const archLegnth = buildSource.arch.length
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
          message={<FormattedMessage id='componentOverview.body.ChangeBuildSource.creat' />}
          type="warning"
          closable
          size="small"
          style={{ marginBottom: '12px' }}
        // onClose={onClose}
        />
        <Tabs defaultActiveKey={tabKey} onChange={this.handleTabs} >
          <TabPane tab={<FormattedMessage id='componentOverview.body.ChangeBuildSource.Source_code' />} key="1" >
            {tabValue === 'source_code' && (
              <Form onSubmit={this.handleSubmit}>
                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.address' />}
                >
                  {getFieldDecorator('git_url', {
                    initialValue: buildSource.service_source == "source_code" && buildSource.git_url ? buildSource.git_url : '',
                    force: true,
                    rules: [
                      { required: true, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_address' }), },
                      { validator: this.checkURL, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.Illegal_address' }), }
                    ]
                  })(
                    <Input
                      addonBefore={prefixSelector}
                      placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_address' })}
                    />
                  )}
                </Form.Item>
                {isFlag &&
                  <Form.Item
                    {...is_language}
                    label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.version' />}
                  >
                    {getFieldDecorator('code_version', {
                      initialValue: buildSource.service_source == "source_code" && codeVersion ? codeVersion : '',
                      rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_version' }), }]
                    })(
                      <Input
                        addonBefore={versionSelector}
                        placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_version' })}
                      />
                    )}
                  </Form.Item>
                }


                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.name' />}
                >
                  {getFieldDecorator('user_name', {
                    initialValue:
                      // buildSource.user_name ||
                      // buildSource.user ||
                      //   '',
                      (buildSource.service_source == "source_code") &&
                        (buildSource.user_name || buildSource.user) ? (buildSource.user_name || buildSource.user) : '',
                    rules: [{ required: false, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' }), }]
                  })(<Input autoComplete="off" placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' })} />)}
                </Form.Item>
                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.password' />}
                >
                  {getFieldDecorator('password', {
                    initialValue: buildSource.service_source == "source_code" && buildSource.password ? buildSource.password : '',
                    rules: [{ required: false, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' }) }]
                  })(
                    <Input
                      autoComplete="new-password"
                      type="password"
                      placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' })}
                    />
                  )}
                </Form.Item>
                {archLegnth == 2 && 
                <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
                  {getFieldDecorator('arch', {
                    initialValue: archLegnth == 2 ? archInfo : (archLegnth == 1 && buildSource.arch[0]),
                  })(
                    <Radio.Group onChange={this.onChangeCpu}>
                      <Radio value='amd64'>amd64</Radio>
                      <Radio value='arm64'>arm64</Radio>
                    </Radio.Group>
                  )}
                </Form.Item>}
              </Form>
            )}

          </TabPane>
          <TabPane tab={<FormattedMessage id='componentOverview.body.ChangeBuildSource.image' />} key="2">
            {tabValue === 'docker_run' && (
              <Form onSubmit={this.handleSubmit}>
                <FormItem
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.image_name' />}
                >
                  {getFieldDecorator('image', {
                    initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') && buildSource.image ? buildSource.image : '',
                    rules: [
                      { required: true, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.image_name_null' }), },
                      {
                        max: 190,
                        message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.max' }),
                      },
                      { validator: this.checkImage, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.Illegal' }), }
                    ],
                  })(<Input placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_image_name' })} />)}
                </FormItem>
                <FormItem
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.Start' />}
                >
                  {getFieldDecorator('cmd', {
                    initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source == "docker_run") && buildSource.cmd ? buildSource.cmd : '',
                  })(<Input placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_Start' })} />)}
                </FormItem>

                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.name' />}
                >
                  {getFieldDecorator('user_name', {
                    initialValue:
                      (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') &&
                        (buildSource.user_name || buildSource.user) ? (buildSource.user_name || buildSource.user) : '',
                    rules: [{ required: false, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' }), }]
                  })(<Input autoComplete="off" placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' })} />)}
                </Form.Item>
                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.password' />}
                >
                  {getFieldDecorator('password', {
                    initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') && buildSource.password ? buildSource.password : '',
                    rules: [{ required: false, essage: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' }) }]
                  })(
                    <Input
                      autoComplete="new-password"
                      type="password"
                      placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' })}
                    />
                  )}
                </Form.Item>
                {archLegnth == 2 && 
                <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
                  {getFieldDecorator('arch', {
                    initialValue: archLegnth == 2 ? archInfo : (archLegnth == 1 && buildSource.arch[0]),
                  })(
                    <Radio.Group onChange={this.onChangeCpu}>
                      <Radio value='amd64'>amd64</Radio>
                      <Radio value='arm64'>arm64</Radio>
                    </Radio.Group>
                  )}
                </Form.Item>}
              </Form>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}

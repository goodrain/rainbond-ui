/* eslint-disable react/jsx-indent */
/* eslint-disable no-void */
/* eslint-disable no-nested-ternary */
import { Button, Checkbox, Col, Form, Input, Row, Select, Radio, Divider, Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import ShowRegionKey from '../../components/ShowRegionKey';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
import oauthUtil from '../../utils/oauth';
import handleAPIError from '../../utils/error';
import configureGlobal from '../../utils/configureGlobal';
import {
  createUrlValidator,
  getServiceNameRules,
  getK8sComponentNameRules,
  getGitUrlRules,
  getUsernameRules,
  getPasswordRules,
  getSubdirectoriesRules,
  getCodeVersionRules,
  getArchRules,
  getGroupNameRules
} from './validations';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};
const en_formItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};

// demo-2048 示例 placeholder（默认值）
const DEFAULT_DEMO = {
  gitUrl: `${configureGlobal.documentAddress}demo-2048.git`,
  name: 'demo-2048',
  codeVersion: 'master'
};

// 示例配置列表
const DEMO_CONFIGS = {
  'demo-2048': {
    gitUrl: `${configureGlobal.documentAddress}demo-2048.git`,
    name: 'demo-2048'
  },
  'static-demo': {
    gitUrl: `${configureGlobal.documentAddress}static-demo.git`,
    name: 'static-demo'
  },
  'php-demo': {
    gitUrl: `${configureGlobal.documentAddress}php-demo.git`,
    name: 'php-demo'
  },
  'python-demo': {
    gitUrl: `${configureGlobal.documentAddress}python-demo.git`,
    name: 'python-demo'
  },
  'nodejs-demo': {
    gitUrl: `${configureGlobal.documentAddress}nodejs-demo.git`,
    name: 'nodejs-demo'
  },
  'go-demo': {
    gitUrl: `${configureGlobal.documentAddress}go-demo.git`,
    name: 'go-demo'
  },
  'java-maven-demo': {
    gitUrl: `${configureGlobal.documentAddress}java-maven-demo.git`,
    name: 'java-maven-demo'
  },
  'java-jar-demo': {
    gitUrl: `${configureGlobal.documentAddress}java-jar-demo.git`,
    name: 'java-jar-demo'
  },
  'java-war-demo': {
    gitUrl: `${configureGlobal.documentAddress}java-war-demo.git`,
    name: 'java-war-demo'
  },
  'java-gradle-demo': {
    gitUrl: `${configureGlobal.documentAddress}java-gradle-demo.git`,
    name: 'java-gradle-demo'
  },
  'dotnet-demo': {
    gitUrl: `${configureGlobal.documentAddress}dotnet-demo.git`,
    name: 'dotnet-demo'
  }
};

@connect(
  ({ user, global, loading, teamControl, enterprise }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    createAppByCodeLoading: loading.effects['createApp/createAppByCode'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currentEnterprise: enterprise.currentEnterprise
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
      serverType: 'git',
      subdirectories: false,
      checkedList: [],
      visibleKey: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      comNames: [],
      creatComPermission: {},
      showDemoSelect: false,
      selectedDemo: undefined
    };
  }
  componentDidMount() {
    const { handleType, groupId } = this.props;
    const group_id = globalUtil.getAppID()
    if (handleType && handleType === 'Service') {
      this.fetchComponentNames(Number(groupId));
    }
    const isService = handleType && handleType === 'Service';
    if (!!isService || group_id) {
      this.setState({
        creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${globalUtil.getAppID() || group_id}`)
      })
    }
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
  onChange = checkedValues => {
    this.setState({
      checkedList: checkedValues,
      showUsernameAndPass: checkedValues.includes('showUsernameAndPass'),
      subdirectories: checkedValues.includes('subdirectories'),
      showKey: checkedValues.includes('showKey'),
      visibleKey: !this.state.showKey && checkedValues.includes('showKey')
    });
  };
  getDefaultBranchName = () => {
    if (this.state.serverType === 'svn') {
      return 'trunk';
    }
    return 'master';
  };

  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };

  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    role.refreshPermissionsInfo(groupId, false, this.handlePermissionCallback);
    this.cancelAddGroup();
  };

  handlePermissionCallback = (val) => {
    this.setState({ creatComPermission: val });
  }
  hideShowKey = () => {
    this.handkeDeleteCheckedList('showKey');
    this.setState({ showKey: false, visibleKey: false });
  };
  handleVisibleKey = () => {
    this.setState({ visibleKey: false });
  };
  handkeDeleteCheckedList = type => {
    const { checkedList } = this.state;
    const arr = checkedList;
    if (arr.indexOf(type) > -1) {
      arr.splice(arr.indexOf(type), 1);
      this.setState({ checkedList: arr });
    }
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo } = this.props;
    const group_id = globalUtil.getAppID();

    // 获取当前表单值
    const currentValues = form.getFieldsValue(['service_cname', 'k8s_component_name', 'git_url']);
    const serviceCname = currentValues.service_cname?.trim();
    const k8sComponentName = currentValues.k8s_component_name?.trim();
    const gitUrl = currentValues.git_url?.trim();

    // 检查是否全部为空（使用默认值模式）
    const allEmpty = !serviceCname && !k8sComponentName && !gitUrl;
    // 检查是否有部分填写
    const hasAnyValue = serviceCname || k8sComponentName || gitUrl;

    // 如果部分填写，验证必填字段
    if (hasAnyValue && !allEmpty) {
      const errors = [];
      if (!serviceCname) {
        errors.push(formatMessage({ id: 'placeholder.service_cname' }));
        form.setFields({
          service_cname: {
            value: currentValues.service_cname,
            errors: [new Error(formatMessage({ id: 'placeholder.service_cname' }))]
          }
        });
      }
      if (!k8sComponentName) {
        errors.push(formatMessage({ id: 'placeholder.k8s_component_name' }));
        form.setFields({
          k8s_component_name: {
            value: currentValues.k8s_component_name,
            errors: [new Error(formatMessage({ id: 'placeholder.k8s_component_name' }))]
          }
        });
      }
      if (!gitUrl) {
        errors.push(formatMessage({ id: 'placeholder.git_url' }));
        form.setFields({
          git_url: {
            value: currentValues.git_url,
            errors: [new Error(formatMessage({ id: 'placeholder.git_url' }))]
          }
        });
      }
      if (errors.length > 0) {
        return;
      }
    }

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }

      // 全部为空时使用 placeholder 默认值（demo-2048 示例）
      if (allEmpty) {
        fieldsValue.service_cname = DEFAULT_DEMO.name;
        fieldsValue.k8s_component_name = DEFAULT_DEMO.name;
        fieldsValue.git_url = DEFAULT_DEMO.gitUrl;
        fieldsValue.server_type = 'git';
      }

      // code_version 为空时使用默认值
      if (!fieldsValue.code_version?.trim()) {
        fieldsValue.code_version = DEFAULT_DEMO.codeVersion;
      }

      // 处理版本类型为 tag
      if (fieldsValue.version_type === 'tag') {
        fieldsValue.code_version = `tag:${fieldsValue.code_version}`;
      }

      // 处理子目录路径
      if (fieldsValue.subdirectories && fieldsValue.server_type !== 'svg') {
        fieldsValue.git_url = `${fieldsValue.git_url}?dir=${fieldsValue.subdirectories}`;
      }

      // 设置应用组 ID
      if (group_id) {
        fieldsValue.group_id = group_id;
      }

      // 设置应用组名称和 K8s 应用名
      if (!fieldsValue.k8s_app || !fieldsValue.group_name) {
        fieldsValue.group_name = fieldsValue.service_cname;
        fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname);
      }

      if (onSubmit) {
        // 处理架构信息
        if (archInfo && archInfo.length !== 2 && archInfo.length !== 0) {
          fieldsValue.arch = archInfo[0];
        }
        onSubmit(fieldsValue);
      }
    });
  };

  fetchCheckboxGroup = (type, serverType) => {
    const { checkedList, showKey } = this.state;
    const isSubdirectories = serverType === 'git';
    return (
      <Checkbox.Group
        style={{ width: '100%', marginBottom: '10px' }}
        onChange={this.onChange}
        value={checkedList}
      >
        <Row>
          <Col span={isSubdirectories ? 16 : 24} style={{ textAlign: 'right' }}>
            {type === 'showKey' && (
              <Checkbox value="showKey" checked={showKey}>
                {formatMessage({ id: 'teamPlugin.create.pages.key' })}
              </Checkbox>
            )}
            {type === 'showUsernameAndPass' && (
              <Checkbox value="showUsernameAndPass">
                {formatMessage({ id: 'teamAdd.create.code.fillInUser' })}
              </Checkbox>
            )}
          </Col>
          {isSubdirectories && (
            <Col span={8} style={{ textAlign: 'right' }}>
              <Checkbox value="subdirectories">
                {formatMessage({ id: 'teamAdd.create.code.fillInPath' })}
              </Checkbox>
            </Col>
          )}
        </Row>
      </Checkbox.Group>
    );
  };
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
    });
    dispatch({
      type: 'appControl/getComponentNames',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            comNames: res.bean.component_names && res.bean.component_names.length > 0 ? res.bean.component_names : []
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if (name === undefined) {
      return '';
    }

    const { comNames } = this.state;
    const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    const cleanedPinyinName = pinyinName.toLowerCase();

    if (comNames && comNames.length > 0) {
      const isExist = comNames.some(item => item === cleanedPinyinName);
      if (isExist) {
        const random = Math.floor(Math.random() * 10000);
        return `${cleanedPinyinName}${random}`;
      }
    }
    return cleanedPinyinName;
  }

  // 切换示例选择模式
  handleToggleDemoSelect = () => {
    const { showDemoSelect } = this.state;
    const { form } = this.props;

    if (!showDemoSelect) {
      // 开启时默认选中第一个示例
      const firstDemoKey = Object.keys(DEMO_CONFIGS)[0];
      const firstDemo = DEMO_CONFIGS[firstDemoKey];
      this.setState({
        showDemoSelect: true,
        selectedDemo: firstDemoKey,
        serverType: 'git'
      });
      form.setFieldsValue({
        service_cname: firstDemo.name,
        k8s_component_name: firstDemo.name,
        git_url: firstDemo.gitUrl,
        server_type: 'git',
        code_version: DEFAULT_DEMO.codeVersion
      });
    } else {
      // 关闭时清空示例相关字段
      this.setState({
        showDemoSelect: false,
        selectedDemo: undefined
      });
      form.setFieldsValue({
        service_cname: '',
        k8s_component_name: '',
        git_url: '',
        code_version: ''
      });
    }
  }

  // 选择示例
  handleDemoChange = (value) => {
    const { form } = this.props;
    const selectedDemo = DEMO_CONFIGS[value];
    if (selectedDemo) {
      this.setState({
        selectedDemo: value,
        serverType: 'git'
      });
      form.setFieldsValue({
        service_cname: selectedDemo.name,
        k8s_component_name: selectedDemo.name,
        git_url: selectedDemo.gitUrl,
        server_type: 'git',
        code_version: DEFAULT_DEMO.codeVersion
      });
    }
  }

  render() {
    const {
      groups,
      createAppByCodeLoading,
      form,
      handleType,
      groupId,
      data = {},
      showSubmitBtn = true,
      ButtonGroupState,
      handleServiceBotton,
      showCreateGroup,
      archInfo,
      enterpriseInfo
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;

    const {
      showUsernameAndPass,
      subdirectories,
      serverType,
      visibleKey,
      addGroup,
      language,
      creatComPermission: {
        isCreate
      },
      showDemoSelect,
      selectedDemo
    } = this.state;

    // 获取可用的 Git 仓库列表
    const codeRepositoryList = enterpriseInfo ? oauthUtil.getEnableGitOauthServer(enterpriseInfo) : [];

    let arch = 'amd64';
    const archLength = archInfo.length;
    if (archLength === 2) {
      arch = 'amd64';
    } else if (archInfo.length === 1) {
      arch = archInfo && archInfo[0];
    }

    const is_language = language ? formItemLayout : en_formItemLayout;
    const gitUrl = getFieldValue('git_url');

    let isHttp = /(http|https):\/\/([\w.]+\/?)\S*/.test(gitUrl || '');
    // eslint-disable-next-line no-unused-vars
    let urlCheck = /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    if (serverType === 'svn') {
      isHttp = true;
      urlCheck = /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    if (serverType === 'oss') {
      isHttp = true;
    }
    const isSSH = !isHttp;
    const showCreateGroups =
      showCreateGroup === void 0 ? true : showCreateGroup;
    const prefixSelector = getFieldDecorator('server_type', {
      initialValue: data.server_type || serverType
    })(
      <Select
        onChange={this.onChangeServerType}
        style={{ width: 100 }}
        getPopupContainer={triggerNode => triggerNode.parentNode}
      >
        <Option value="git">Git</Option>
        <Option value="svn">Svn</Option>
        <Option value="oss">OSS</Option>
      </Select>
    );
    const versionSelector = getFieldDecorator('version_type', {
      initialValue: this.state.version_type || 'branch'
    })(
      <Select
        style={{ width: 100 }}
        getPopupContainer={triggerNode => triggerNode.parentNode}
      >
        <Option value="branch">{formatMessage({ id: 'teamAdd.create.code.branch' })}</Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    // const serverType = getFieldValue("server_type");
    const isService = handleType && handleType === 'Service';
    const group_id = globalUtil.getAppID()
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Form.Item
            {...is_language}
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{formatMessage({ id: 'teamAdd.create.form.service_cname' })}</span>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto', fontSize: 14, display: 'flex', alignItems: 'center' }}
                  onClick={this.handleToggleDemoSelect}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: 4 }}
                  >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                    <path d="M4 17v2" />
                    <path d="M5 18H3" />
                  </svg>
                  {showDemoSelect ? formatMessage({ id: 'teamAdd.create.demo.cancel' }) : formatMessage({ id: 'teamAdd.create.demo.use' })}
                </Button>
              </div>
            }
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: showDemoSelect ? 2 : 1, transition: 'flex 0.3s ease' }}>
                {getFieldDecorator('service_cname', {
                  initialValue: data.service_cname || '',
                  rules: getServiceNameRules()
                })(
                  <Input placeholder={DEFAULT_DEMO.name} />
                )}
              </div>
              {showDemoSelect && (
                <div style={{ flex: 1, transition: 'flex 0.3s ease' }}>
                  <Select
                    placeholder={formatMessage({ id: 'teamAdd.create.demo.select' })}
                    value={selectedDemo}
                    onChange={this.handleDemoChange}
                    style={{ width: '100%' }}
                  >
                    {Object.keys(DEMO_CONFIGS).map(key => (
                      <Option key={key} value={key}>{DEMO_CONFIGS[key].name}</Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </Form.Item>
          {/* 集群内组件名称 */}
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
              rules: getK8sComponentNameRules()
            })(<Input placeholder={DEFAULT_DEMO.name} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.address' })}>
            {getFieldDecorator('git_url', {
              initialValue: data.git_url || '',
              force: true,
              rules: getGitUrlRules(createUrlValidator(serverType))
            })(
              <Input
                addonBefore={prefixSelector}
                placeholder={DEFAULT_DEMO.gitUrl}
              />
            )}
          </Form.Item>
          {gitUrl && isSSH && this.fetchCheckboxGroup('showKey', serverType)}
          {gitUrl &&
            isHttp &&
            this.fetchCheckboxGroup('showUsernameAndPass', serverType)}

          {showUsernameAndPass && isHttp && (
            <Form.Item {...is_language} label={formatMessage({ id: "teamAdd.create.form.user" })}>
              {getFieldDecorator('username_1', {
                initialValue: data.username || '',
                rules: getUsernameRules()
              })(<Input autoComplete="off" placeholder={formatMessage({ id: 'placeholder.username_1' })} />)}
            </Form.Item>
          )}
          {showUsernameAndPass && isHttp && (
            <Form.Item {...is_language} label={formatMessage({ id: "teamAdd.create.form.password" })}>
              {getFieldDecorator('password_1', {
                initialValue: data.password || '',
                rules: getPasswordRules()
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  placeholder={formatMessage({ id: 'placeholder.password_1' })}
                />
              )}
            </Form.Item>
          )}

          {subdirectories && serverType === 'git' && (
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.path' })}>
              {getFieldDecorator('subdirectories', {
                initialValue: '',
                rules: getSubdirectoriesRules()
              })(<Input placeholder={formatMessage({ id: 'placeholder.subdirectories' })} />)}
            </Form.Item>
          )}
          {serverType !== 'oss' && (
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.versions' })}>
              {getFieldDecorator('code_version', {
                initialValue: data.code_version || '',
                rules: getCodeVersionRules()
              })(
                <Input
                  addonBefore={versionSelector}
                  placeholder={DEFAULT_DEMO.codeVersion}
                />
              )}
            </Form.Item>
          )}

          {archLength === 2 &&
            <Form.Item {...is_language} label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
              {getFieldDecorator('arch', {
                initialValue: arch,
                rules: getArchRules()
              })(
                <Radio.Group>
                  <Radio value='amd64'>amd64</Radio>
                  <Radio value='arm64'>arm64</Radio>
                </Radio.Group>
              )}
            </Form.Item>}
          {!group_id && <>
            <div className="advanced-btn">
              <Button
                type="link"
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  padding: '0px 0',
                  display: 'flex',
                  alignItems: 'center',
                  // color: '#1890ff'
                }}
                onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
              >
                <Icon type={this.state.showAdvanced ? "up" : "down"} />
                {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
              </Button>
            </div>

            {this.state.showAdvanced && (
              <div
                className="userpass-card">
                <div className="advanced-divider" style={{ margin: '0 0 10px 0' }} />
                <Form.Item
                  label={formatMessage({ id: 'popover.newApp.appName' })}
                  colon={false}
                  {...formItemLayout}
                  style={{ marginBottom: 18 }}
                >
                  {getFieldDecorator('group_name', {
                    initialValue: this.props.form.getFieldValue('service_cname') || '',
                    rules: getGroupNameRules()
                  })(<Input
                    placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })}
                    style={{
                      borderRadius: 6,
                      height: 40,
                      fontSize: 15,
                      boxShadow: '0 1px 3px #f0f1f2',
                      border: '1px solid #e6e6e6',
                      transition: 'border 0.2s, box-shadow 0.2s'
                    }}
                  />
                  )}
                </Form.Item>
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_app_name' })}>
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                    rules: getK8sComponentNameRules()
                  })(<Input
                    placeholder={formatMessage({ id: 'placeholder.appEngName' })}
                    style={{
                      borderRadius: 6,
                      height: 40,
                      fontSize: 15,
                      boxShadow: '0 1px 3px #f0f1f2',
                      border: '1px solid #e6e6e6',
                      transition: 'border 0.2s, box-shadow 0.2s'
                    }}
                  />
                  )}
                </Form.Item>
              </div>
            )}
          </>}

          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: { span: 24, offset: 0 }
              }}
              label=""
            >
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {isService && ButtonGroupState
                  ? handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                    </Button>,
                    false
                  )
                  : !handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({ id: 'teamAdd.create.btn.create' })}
                    </Button>
                  )}
              </div>
            </Form.Item>
          ) : null}
        </Form>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        {visibleKey && isSSH && (
          <ShowRegionKey
            onCancel={this.hideShowKey}
            onOk={this.handleVisibleKey}
          />
        )}
      </Fragment>
    );
  }
}

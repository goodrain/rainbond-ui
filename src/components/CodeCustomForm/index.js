/* eslint-disable react/jsx-indent */
/* eslint-disable no-void */
/* eslint-disable no-nested-ternary */
import { Button, Checkbox, Col, Form, Input, Row, Select, Radio, Divider, Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import ShowRegionKey from '../../components/ShowRegionKey';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
import oauthUtil from '../../utils/oauth';
import handleAPIError from '../../utils/error';
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
      creatComPermission: {}
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

    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
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
      }
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
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: getServiceNameRules()
            })(<Input placeholder={formatMessage({ id: 'placeholder.service_cname' })} />)}
          </Form.Item>
          {/* 集群内组件名称 */}
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
              rules: getK8sComponentNameRules()
            })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.address' })}>
            {getFieldDecorator('git_url', {
              initialValue: data.git_url || '',
              force: true,
              rules: getGitUrlRules(createUrlValidator(serverType))
            })(
              <Input
                addonBefore={prefixSelector}
                placeholder={formatMessage({ id: 'placeholder.git_url' })}
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
                initialValue: data.code_version || this.getDefaultBranchName(),
                rules: getCodeVersionRules()
              })(
                <Input
                  addonBefore={versionSelector}
                  placeholder={formatMessage({ id: 'placeholder.code_version' })}
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
            <Divider />
            <div className="advanced-btn" style={{ marginBottom: 16 }}>
              <Button
                type="link"
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  // color: '#1890ff'
                }}
                onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
              >
                <Icon type={this.state.showAdvanced ? "up" : "down"} style={{ marginRight: 6 }} />
                {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
              </Button>
            </div>

            {this.state.showAdvanced && (
              <div
                className="userpass-card"
                style={{
                  margin: '24px 0',
                  background: '#fafbfc',
                  border: '1px solid #e6e6e6',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px #f0f1f2',
                  padding: 24,
                }}>
                <div className="advanced-divider" style={{ margin: '0 0 16px 0' }} />
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
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                    rules: getK8sComponentNameRules()
                  })(<Input
                    placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
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

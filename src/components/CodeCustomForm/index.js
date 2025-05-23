/* eslint-disable react/jsx-indent */
/* eslint-disable no-void */
/* eslint-disable no-nested-ternary */
import { Button, Checkbox, Col, Form, Input, Row, Select, Radio, Tooltip, Divider } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import ShowRegionKey from '../../components/ShowRegionKey';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 15
  }
};
const en_formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 15
  }
};

@connect(
  ({ user, global, loading, teamControl }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    createAppByCodeLoading: loading.effects['createApp/createAppByCode'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
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
    const group_id = globalUtil.getGroupID()
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
    if (this.state.serverType == 'svn') {
      return 'trunk';
    }
    return 'master';
  };

  getUrlCheck() {
    if (this.state.serverType == 'svn') {
      return /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }
    return /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
  }
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  checkURL = (rule, value, callback) => {
    const urlCheck = this.getUrlCheck();
    if (urlCheck.test(value)) {
      callback();
    } else {
      callback(formatMessage({ id: 'componentOverview.body.ChangeBuildSource.Illegal' }));
    }
  };

  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    role.refreshPermissionsInfo(groupId, false, this.callbcak)
    this.cancelAddGroup();
  };
  callbcak = (val) => {
    this.setState({ creatComPermission: val })
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
    const group_id = globalUtil.getGroupID()
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      if (fieldsValue.version_type === 'tag') {
        // eslint-disable-next-line no-param-reassign
        fieldsValue.code_version = `tag:${fieldsValue.code_version}`;
      }
      if (fieldsValue.subdirectories && fieldsValue.server_type !== 'svg') {
        // eslint-disable-next-line no-param-reassign
        fieldsValue.git_url = `${fieldsValue.git_url}?dir=${fieldsValue.subdirectories}`;
      }
      if (group_id) {
        fieldsValue.group_id = group_id
      }
      if (!fieldsValue.k8s_app || !fieldsValue.group_name) {
        fieldsValue.group_name = fieldsValue.service_cname
        fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname)
      }
      if (onSubmit) {
        if (archInfo && archInfo.length != 2 && archInfo.length != 0) {
          fieldsValue.arch = archInfo[0]
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
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({ id: 'placeholder.nameSpaceReg' }))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
    }
  };
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
    })
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
          })
        }
      }
    });
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if (name != undefined) {
      const { comNames } = this.state;
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (comNames && comNames.length > 0) {
        const isExist = comNames.some(item => item === cleanedPinyinName);
        if (isExist) {
          const random = Math.floor(Math.random() * 10000);
          return `${cleanedPinyinName}${random}`;
        }
        return cleanedPinyinName;
      }
      return cleanedPinyinName;
    }
    return ''
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
      archInfo
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
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if (archLegnth == 2) {
      arch = 'amd64'
    } else if (archInfo.length == 1) {
      arch = archInfo && archInfo[0]
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
    const group_id = globalUtil.getGroupID()
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                { required: true, message: formatMessage({ id: 'placeholder.service_cname' }) },
                {
                  max: 24,
                  message: formatMessage({ id: 'placeholder.max24' })
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.service_cname' })} />)}
          </Form.Item>
          {/* 集群内组件名称 */}
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.address' })}>
            {getFieldDecorator('git_url', {
              initialValue: data.git_url || '',
              force: true,
              rules: [
                { required: true, message: formatMessage({ id: 'placeholder.git_url' }) },
                { validator: this.checkURL, message: formatMessage({ id: 'placeholder.notGit_url' }) }
              ]
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
                rules: [{ required: false, message: formatMessage({ id: 'placeholder.username_1' }) }]
              })(<Input autoComplete="off" placeholder={formatMessage({ id: 'placeholder.username_1' })} />)}
            </Form.Item>
          )}
          {showUsernameAndPass && isHttp && (
            <Form.Item {...is_language} label={formatMessage({ id: "teamAdd.create.form.password" })}>
              {getFieldDecorator('password_1', {
                initialValue: data.password || '',
                rules: [{ required: false, message: formatMessage({ id: 'placeholder.password_1' }) }]
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
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.subdirectories' }) }]
              })(<Input placeholder={formatMessage({ id: 'placeholder.subdirectories' })} />)}
            </Form.Item>
          )}
          {serverType !== 'oss' && (
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.versions' })}>
              {getFieldDecorator('code_version', {
                initialValue: data.code_version || this.getDefaultBranchName(),
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
              })(
                <Input
                  addonBefore={versionSelector}
                  placeholder={formatMessage({ id: 'placeholder.code_version' })}
                />
              )}
            </Form.Item>
          )}

          {archLegnth == 2 &&
            <Form.Item {...is_language} label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
              {getFieldDecorator('arch', {
                initialValue: arch,
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
              })(
                <Radio.Group>
                  <Radio value='amd64'>amd64</Radio>
                  <Radio value='arm64'>arm64</Radio>
                </Radio.Group>
              )}
            </Form.Item>}
          {!group_id && <>
            <Divider />
            <div className="advanced-btn" style={{ justifyContent: 'flex-start', marginLeft: 2 }}>
              <Button type="link" style={{ fontWeight: 500, fontSize: 18, padding: 0 }} onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}>
                高级选项 {this.state.showAdvanced ? <span style={{ fontSize: 16 }}>&#94;</span> : <span style={{ fontSize: 16 }}>&#8964;</span>}
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
                    rules: [
                      { required: true, message: formatMessage({ id: 'popover.newApp.appName.placeholder' }) },
                      {
                        max: 24,
                        message: formatMessage({ id: 'placeholder.max24' })
                      }
                    ]
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
                    rules: [
                      { required: true, message: formatMessage({ id: 'placeholder.k8s_component_name' }) },
                      { validator: this.handleValiateNameSpace }
                    ]
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
                sm: {
                  span: is_language.wrapperCol.span,
                  offset: is_language.labelCol.span
                }
              }}
              label=""
            >
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

/* eslint-disable react/jsx-indent */
/* eslint-disable no-void */
/* eslint-disable no-nested-ternary */
import { Button, Checkbox, Col, Form, Input, Row, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import ShowRegionKey from '../../components/ShowRegionKey';

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
    createAppByCodeLoading: loading.effects['createApp/createAppByCode']
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
      visibleKey: false
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
      callback('非法仓库地址');
    }
  };

  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
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
    const { form, onSubmit } = this.props;
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
      if (onSubmit) {
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
                配置授权Key
              </Checkbox>
            )}
            {type === 'showUsernameAndPass' && (
              <Checkbox value="showUsernameAndPass">填写仓库账号密码</Checkbox>
            )}
          </Col>
          {isSubdirectories && (
            <Col span={8} style={{ textAlign: 'right' }}>
              <Checkbox value="subdirectories">填写子目录路径</Checkbox>
            </Col>
          )}
        </Row>
      </Checkbox.Group>
    );
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.k8s_component_name'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({id: 'placeholder.nameSpaceReg'}))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id: 'placeholder.max32'})));
    }
  };
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
      showCreateGroup
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;

    const {
      showUsernameAndPass,
      subdirectories,
      serverType,
      visibleKey,
      addGroup
    } = this.state;

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
        <Option value="branch">{formatMessage({id: 'teamAdd.create.code.branch'})}</Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    // const serverType = getFieldValue("server_type");
    const isService = handleType && handleType === 'Service';
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [{ required: true, message: formatMessage({id: 'placeholder.appName'}) }]
            })(
              <Select
                placeholder={formatMessage({id: 'placeholder.appName'})}
                style={{
                  display: 'inline-block',
                  width: isService ? '' : 292,
                  marginRight: 15
                }}
                disabled={!!isService}
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            {handleType &&
            handleType === 'Service' ? null : showCreateGroups ? (
              <Button onClick={this.onAddGroup}>{formatMessage({id: 'teamOverview.createApp'})}</Button>
            ) : null}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.service_cname'})}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                { required: true, message: formatMessage({id: 'placeholder.service_cname'}) },
                {
                  max: 24,
                  message: '最大长度24位'
                }
              ]
            })(<Input placeholder={formatMessage({id: 'placeholder.service_cname'})} />)}
          </Form.Item>
          {/* 集群内组件名称 */}
          <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.k8s_component_name'})}>
            {getFieldDecorator('k8s_component_name', {
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({id: 'placeholder.k8s_component_name'})} />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.code.address'})}>
            {getFieldDecorator('git_url', {
              initialValue: data.git_url || '',
              force: true,
              rules: [
                { required: true, message: formatMessage({id: 'placeholder.git_url'}) },
                { validator: this.checkURL, message: formatMessage({id: 'placeholder.notGit_url'}) }
              ]
            })(
              <Input
                addonBefore={prefixSelector}
                placeholder={formatMessage({id: 'placeholder.git_url'})}
              />
            )}
          </Form.Item>
          {gitUrl && isSSH && this.fetchCheckboxGroup('showKey', serverType)}
          {gitUrl &&
            isHttp &&
            this.fetchCheckboxGroup('showUsernameAndPass', serverType)}

          {showUsernameAndPass && isHttp && (
            <Form.Item {...formItemLayout} label={formatMessage({id: "teamAdd.create.form.user"})}>
              {getFieldDecorator('username_1', {
                initialValue: data.username || '',
                rules: [{ required: false, message: formatMessage({id: 'placeholder.username_1'}) }]
              })(<Input autoComplete="off" placeholder={formatMessage({id: 'placeholder.username_1'})} />)}
            </Form.Item>
          )}
          {showUsernameAndPass && isHttp && (
            <Form.Item {...formItemLayout} label={formatMessage({id: "teamAdd.create.form.password"})}>
              {getFieldDecorator('password_1', {
                initialValue: data.password || '',
                rules: [{ required: false, message: formatMessage({id: 'placeholder.password_1'}) }]
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  placeholder={formatMessage({id: 'placeholder.password_1'})}
                />
              )}
            </Form.Item>
          )}

          {subdirectories && serverType === 'git' && (
            <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.code.path'})}>
              {getFieldDecorator('subdirectories', {
                initialValue: '',
                rules: [{ required: true, message: formatMessage({id: 'placeholder.subdirectories'}) }]
              })(<Input placeholder={formatMessage({id: 'placeholder.subdirectories'})} />)}
            </Form.Item>
          )}
          {serverType !== 'oss' && (
            <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.code.versions'})}>
              {getFieldDecorator('code_version', {
                initialValue: data.code_version || this.getDefaultBranchName(),
                rules: [{ required: true, message: formatMessage({id: 'placeholder.code_version'}) }]
              })(
                <Input
                  addonBefore={versionSelector}
                  placeholder={formatMessage({id: 'placeholder.code_version'})}
                />
              )}
            </Form.Item>
          )}

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
              {isService && ButtonGroupState
                ? handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({id: 'teamAdd.create.btn.createComponent'})}
                    </Button>,
                    false
                  )
                : !handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({id: 'teamAdd.create.btn.create'})}
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

/* eslint-disable react/jsx-indent */
/* eslint-disable no-void */
/* eslint-disable no-nested-ternary */
import { Button, Checkbox, Col, Form, Input, Row, Select, Radio, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import ShowRegionKey from '../../components/ShowRegionKey';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import cookie from '../../utils/cookie';

const { Option } = Select;
const { TextArea } = Input;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 16
  }
};
const en_formItemLayout = {
  labelCol: {
    span: 8
  },
  wrapperCol: {
    span: 16
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
      creatComPermission: {}
    };
  }
  componentDidMount(){
    const group_id = globalUtil.getAppID()
    if(group_id){
      this.handleChange(group_id)
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
  callbcak=(val)=>{
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
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
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
    if (value.length > 16) {
      return callback(new Error(formatMessage({ id: 'placeholder.max16' })));
    }
  };
  handleChange = (values) => {
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${values}`)
    })
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
    const showCreateGroups = showCreateGroup === void 0 ? true : showCreateGroup;
    const isService = handleType && handleType === 'Service';
    const group_id = globalUtil.getAppID()
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id || Number(group_id),
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.appName' }) }]
            })(
              <Select
                placeholder={formatMessage({ id: 'placeholder.appName' })}
                disabled={!!isService || group_id}
                onChange={this.handleChange}
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
            {getFieldDecorator('command', {
              initialValue: data.docker_cmd || '',
              rules: [{ required: true, message: formatMessage({ id: 'versionUpdata_6_1.command' })}]
            })(
              <TextArea style={{ minHeight: '200px' }} placeholder={formatMessage({ id: 'versionUpdata_6_1.command' })} />
            )}
          </Form.Item>

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
                  <Tooltip title={!isCreate && formatMessage({ id: 'versionUpdata_6_1.noApp' })}>
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                      disabled={!isCreate}
                    >
                      {formatMessage({ id: 'teamAdd.create.btn.create' })}
                    </Button>
                  </Tooltip>
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

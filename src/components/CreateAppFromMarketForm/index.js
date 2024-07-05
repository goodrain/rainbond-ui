/* eslint-disable no-nested-ternary */
import { Button, Form, Modal, Radio, Select, Tag, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import role from '../../utils/newRole'
import styles from '../CreateTeam/index.less';

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 17
  }
};

@connect(({ global, teamControl }) => ({ groups: global.groups, currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo, }), null, null, {
  withRef: true
})
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      is_deploy: true,
      creatAppPermisson: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_app_create'),
      creatComPermission: {}
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    const info = role.refreshPermissionsInfo(groupId, false)
    this.setState({ creatComPermission: info })
    this.cancelAddGroup();
  };

  handleChangeVersion = () => { };

  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { is_deploy } = this.state;
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue, is_deploy);
        this.setState({ is_deploy: true });
      }
    });
  };

  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };
  handleChangeGroup = (appid) => {
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${appid}`)
    })
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      onCancel,
      showCreate,
      addAppLoading,
      disabled
    } = this.props;
    const { creatComPermission: { isCreate }, creatAppPermisson: { isAccess } } = this.state
    const data = this.props.data || {};
    const versionsInfo =
      showCreate &&
      showCreate.versions_info &&
      showCreate.versions_info.length > 0 &&
      showCreate.versions_info;

    const appVersions =
      showCreate &&
      showCreate.versions &&
      showCreate.versions.length > 0 &&
      showCreate.versions;

    return (
      <Modal
        className={styles.TelescopicModal}
        visible={showCreate}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        title={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.title' })}
        footer={[
          <Button onClick={onCancel}>{formatMessage({ id: "button.cancel" })}</Button>,
          <Tooltip title={!isCreate && '您没有选择应用或选中的应用没有组件创建权限'}>
            <Button
              onClick={this.handleSubmit}
              type="primary"
              style={{ marginRight: '5px' }}
              loading={addAppLoading || disabled}
              disabled={!isCreate}
            >
              {formatMessage({ id: 'button.install' })}
            </Button>
          </Tooltip>
          ,
          <Radio
            size="small"
            onClick={this.renderSuccessOnChange}
            checked={this.state.is_deploy}
          >
            {formatMessage({ id: 'button.build_start' })}
          </Radio>
        ]}
      >
        <Form onSubmit={this.handleOk} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.install' })}>
            {getFieldDecorator('group_version', {
              initialValue: versionsInfo
                ? versionsInfo[0].version
                : appVersions
                  ? appVersions[0].app_version
                  : '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'teamOther.CreateAppFromMarketForm.setect' })
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                onChange={this.handleChangeVersion}
                style={{ width: '220px' }}
              >
                {versionsInfo
                  ? versionsInfo.map((item, index) => {
                    return (
                      <Option key={index} value={item.version}>
                        {item.version}
                        {item.arch &&
                          <Tag
                            color="blue"
                            style={{ marginLeft: '8px', lineHeight: '18px' }}
                          >
                            {item.arch}
                          </Tag>}
                      </Option>
                    );
                  })
                  : appVersions &&
                  appVersions.map((item, index) => {
                    return (
                      <Option key={index} value={item.app_version}>
                        {item.app_version}
                        {item.arch &&
                          <Tag
                            color="blue"
                            style={{ marginLeft: '8px', lineHeight: '18px' }}
                          >
                            {item.arch}
                          </Tag>}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.app' })}>
            {getFieldDecorator('group_id', {
              initialValue: data.groupd_id,
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'teamOther.CreateAppFromMarketForm.setect_app' })
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.setect_app' })}
                style={{
                  display: 'inline-block',
                  width: 220,
                  marginRight: 15
                }}
                onChange={this.handleChangeGroup}
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            {isAccess &&
              <Button onClick={this.onAddGroup}>
                {formatMessage({ id: 'popover.newApp.title' })}
              </Button>
            }
          </Form.Item>
          {this.state.addGroup && (
            <AddGroup
              group_name={showCreate.app_name || ''}
              onCancel={this.cancelAddGroup}
              onOk={this.handleAddGroup}
            />
          )}
        </Form>
      </Modal>
    );
  }
}

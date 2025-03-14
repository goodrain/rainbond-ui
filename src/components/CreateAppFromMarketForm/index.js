/* eslint-disable no-nested-ternary */
import { Button, Form, Modal, Radio, Select, Tag, Tooltip, Row, Col, Card } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import PluginUtil from '../../utils/pulginUtils';
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

@connect(({ global, teamControl }) => ({
  groups: global.groups,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  pluginsList: teamControl.pluginsList
}), null, null, {
  withRef: true
})
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { showCreate } = props;
    const versions = showCreate?.versions || [];
    const initialVersion = versions.length > 0 ? versions[0].app_version : '';
    this.state = {
      addGroup: false,
      is_deploy: true,
      creatAppPermisson: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'team_app_create'),
      creatComPermission: {},
      selectedVersion: initialVersion,
      currentVersionInfo: versions.length > 0 ? versions[0] : {},
      cpuPrice: 0,
      memoryPrice: 0
    };
  }
  componentDidMount() {
    const { pluginsList } = this.props
    const group_id = globalUtil.getGroupID()
    if(PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill')){
      this.fetchPrices()
    }
    if (group_id) {
      this.setState({
        creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${globalUtil.getAppID() || group_id}`)
      })
    }
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
    role.refreshPermissionsInfo(groupId, false, this.callbcak)
    this.cancelAddGroup();
  };
  callbcak = (val) => {
    this.setState({ creatComPermission: val })
  }
  handleChangeVersion = (value) => {
    const { showCreate } = this.props;
    const versions = showCreate?.versions || [];
    const currentVersionInfo = versions.find(v => v.app_version === value) || {};
    this.setState({
      selectedVersion: value,
      currentVersionInfo
    });
  };

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
  fetchPrices = () => {
    // 假设从API获取数据
    const { dispatch } = this.props
    dispatch({
      type: 'global/getPricingConfig',
      payload: {
        region_name: globalUtil.getCurrRegionName() || ''
      },
      callback: (res) => {
        if (res.status_code == 200) {
          // 保存原始的每小时价格
          this.setState({
            cpuPrice: res.response_data?.cpu_price_per_core / 1000000 || 0,
            memoryPrice: res.response_data?.memory_price_per_gb / 1000000 || 0
          });
        }
      }
    });

  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      onCancel,
      showCreate,
      addAppLoading,
      disabled,
      pluginsList
    } = this.props;
    const { 
      creatComPermission: { isCreate }, 
      creatAppPermisson: { isAccess },
      cpuPrice,
      memoryPrice
    } = this.state
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
    const group_id = globalUtil.getGroupID()
    const showSaaSPrice = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');

    return (
      <Modal
        className={styles.TelescopicModal}
        visible={showCreate}
        onCancel={onCancel}
        width={500}
        onOk={this.handleSubmit}
        title={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.title' })}
        footer={
          showSaaSPrice ?
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Radio
                  size="small"
                  onClick={this.renderSuccessOnChange}
                  checked={this.state.is_deploy}
                  style={{ marginRight: '8px' }}
                >
                  {formatMessage({ id: 'button.build_start' })}
                </Radio>
                <span style={{ color: '#8C8C8C', fontSize: '14px' }}>
                  预估(每天)
                  <span style={{ color: '#F5A623', fontSize: '16px', fontWeight: 500, marginLeft: '4px' }}>
                    ¥{(
                      // CPU费用：毫核转核心 * 每小时价格 * 24小时
                      ((this.state.currentVersionInfo?.cpu || 0) / 1000 * cpuPrice * 24) + 
                      // 内存费用：MB转换为GB * 每小时价格 * 24小时
                      ((this.state.currentVersionInfo?.memory || 0) / 1024 * memoryPrice * 24)
                    ).toFixed(2)}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={onCancel}>{formatMessage({ id: "button.cancel" })}</Button>
                <Tooltip title={!isCreate && formatMessage({ id: 'versionUpdata_6_1.noApp' })}>
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={addAppLoading || disabled}
                    disabled={!isCreate}
                  >
                    {formatMessage({ id: 'button.install' })}
                  </Button>
                </Tooltip>
              </div>
            </div>
            :
            [
              <Button onClick={onCancel}>{formatMessage({ id: "button.cancel" })}</Button>,
              <Tooltip title={!isCreate && formatMessage({ id: 'versionUpdata_6_1.noApp' })}>
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
            ]
        }
      >
        <Form onSubmit={this.handleOk} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.install' })}>
            <Row>
              <Col span={24}>
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
                    style={{ width: '280px' }}
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
              </Col>
            </Row>
            <div style={{ marginBottom: '-18px', fontSize: '14px', color: '#8C8C8C' }}>
              {`资源占用:  CPU ${this.state.currentVersionInfo?.cpu}m / 内存 ${this.state.currentVersionInfo?.memory}MB`}
            </div>
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamOther.CreateAppFromMarketForm.app' })}>
            {getFieldDecorator('group_id', {
              initialValue: data.groupd_id || Number(group_id),
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
                disabled={group_id}
                style={{
                  display: 'inline-block',
                  width: 280,
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

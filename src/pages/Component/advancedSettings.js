import React, { Component } from 'react'
import { connect } from 'dva'
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Menu, Row } from 'antd';
import mnt from './mnt'
import port from './port'
import plugin from './plugin'
import resource from './resource'
import setting from './setting'

@connect(
  ({ user, appControl, global, teamControl, enterprise, loading }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    pods: appControl.pods,
    groups: global.groups,
    build_upgrade: appControl.build_upgrade,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    deleteAppLoading: loading.effects['appControl/deleteApp'],
    reStartLoading: loading.effects['appControl/putReStart'],
    startLoading: loading.effects['appControl/putStart'],
    stopLoading: loading.effects['appControl/putStop'],
    moveGroupLoading: loading.effects['appControl/moveGroup'],
    editNameLoading: loading.effects['appControl/editName'],
    updateRollingLoading: loading.effects['appControl/putUpdateRolling'],
    deployLoading:
      loading.effects[('appControl/putDeploy', 'appControl/putUpgrade')],
    buildInformationLoading: loading.effects['appControl/getBuildInformation'],
    pluginList: teamControl.pluginsList
  }),
  null,
  null,
  { withRef: true }
)

export default class advancedSettings extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeTab: ['mnt']
    }
  }
  changeMenu = (key) => {    
    this.setState({
      activeTab: key?.selectedKeys
    })
  }
  render() {
    const {
      appDetail,
      permissions,
      permissions: {
        isRely,
        isStorage,
        isPort,
        isPlugin,
        isSource,
        isOtherSetting
      }
    } = this.props;
    const { activeTab } = this.state;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    const tabs = [];
    const getExtendTabs = (method) => [
      {
        key: 'mnt',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.mnt' }),
        auth: ['isStorage']
      },
      {
        key: 'port',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.port' }),
        auth: ['isPort']
      },
      {
        key: 'plugin',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.plugin' }),
        auth: ['isPlugin'],
        condition: () => method !== 'vm'
      },
      {
        key: 'resource',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.resource' }),
        auth: ['isSource'],
        condition: () => method !== 'vm'
      },
      {
        key: 'setting',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.setting' }),
        auth: ['isOtherSetting']
      }
    ];
    const extendTabs = getExtendTabs(method);
    extendTabs.forEach(tab => {
      const hasPermission = !tab.auth || tab.auth.some(perm => permissions[perm]);
      if (
        hasPermission &&
        (!tab.condition || tab.condition(appDetail))
      ) {
        tabs.push(tab);
      }
    });
    const map = {
      mnt: mnt,
      port: port,
      plugin: plugin,
      resource: resource,
      setting: setting
    };
    const Com = map[activeTab[0]];
    return (
      <div>
        <Row>
          <Menu
            onSelect={this.changeMenu}
            selectedKeys={activeTab}
            style={{ paddingBottom: 10, border: 0 }}
            mode="horizontal"
          >
            {tabs.map(tab => (
              <Menu.Item key={tab.key}>
                {tab.tab}
              </Menu.Item>
            ))}
          </Menu>
        </Row>
        {Com && (
          <Com
            {...this.props}
          />
        )}
      </div>
    )
  }
}

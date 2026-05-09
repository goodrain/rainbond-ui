import React, { Component } from 'react'
import { connect } from 'dva'
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import { Menu, Row } from 'antd';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import mnt from './mnt'
import port from './port'
import plugin from './plugin'
import resource from './resource'
import setting from './setting'
import parameter from './parameter'
import globalUtil from '../../utils/global';

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
    const method = props?.method || (props?.appDetail && props.appDetail.service && props.appDetail.service.extend_method)
    const routeSubTab = globalUtil.getSlidePanelSubTab();
    this.state = {
      activeTab: [routeSubTab || (method === 'kubeblocks_component' ? 'port' : 'mnt')]
    }
  }
  buildSubTabRoute = (subTab) => {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const appId = globalUtil.getAppID();
    const componentID = globalUtil.getSlidePanelComponentID();
    const refresh = globalUtil.getRefresh();
    if (!teamName || !regionName || !appId || !componentID || !subTab) {
      return '';
    }
    const query = [
      'type=components',
      `componentID=${encodeURIComponent(componentID)}`,
      'tab=advancedSettings',
      `subTab=${encodeURIComponent(subTab)}`
    ];
    if (refresh) {
      query.push(`refresh=${encodeURIComponent(refresh)}`);
    }
    return `/team/${teamName}/region/${regionName}/apps/${appId}/overview?${query.join('&')}`;
  }
  changeMenu = (key) => {    
    const nextSubTab = key && key.selectedKeys && key.selectedKeys[0];
    this.setState({
      activeTab: key?.selectedKeys
    });
    const route = this.buildSubTabRoute(nextSubTab);
    if (route && this.props.dispatch) {
      this.props.dispatch(routerRedux.push(route));
    }
  }
  componentDidUpdate() {
    const routeSubTab = globalUtil.getSlidePanelSubTab();
    if (routeSubTab && this.state.activeTab[0] !== routeSubTab) {
      this.setState({ activeTab: [routeSubTab] });
    }
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
        auth: ['isStorage'],
        condition: () => method !== 'kubeblocks_component'
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
        condition: () => method !== 'vm' && method !== 'kubeblocks_component'
      },
      {
        key: 'resource',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.resource' }),
        auth: ['isSource'],
        condition: () => method !== 'vm' && method !== 'kubeblocks_component'
      },
      {
        key: 'setting',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.setting' }),
        auth: ['isOtherSetting'],
        condition: () => method !== 'kubeblocks_component'
      },
      {
        key: 'parameter',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.parameter' }),
        auth: ['isOtherSetting'],
        condition: () => method === 'kubeblocks_component'
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
      setting: setting,
      parameter: parameter
    };
    const Com = map[activeTab[0]];
    const refreshKey = globalUtil.getRefresh() || 'steady';
    const advancedRenderKey = `${activeTab[0]}-${refreshKey}`;
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
        <TransitionGroup
          style={{
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {Com && (
            <CSSTransition
              key={advancedRenderKey}
              timeout={700}
              classNames="page-zoom"
              unmountOnExit
            >
              <div>
                <Com {...this.props} />
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    )
  }
}

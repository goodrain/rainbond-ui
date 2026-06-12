import { Menu, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import NoPermTip from '../../components/NoPermTip';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import ResourceShow from './component/monitor/resourceshow';
import TraceShow from './component/monitor/trace';
import { FormattedMessage } from 'umi';

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user }) => ({ currUser: user.currentUser }),
  null,
  null,
  {
    withRef: true,
  }
)
export default class Index extends PureComponent {
  state = {
    showMenu: 'resource'
  };

  componentDidMount() {
    if (!this.canView()) return;
    this.fetchBaseInfo();
  }

  fetchBaseInfo = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 是否可以浏览当前界面
  canView() {
    return appUtil.canManageAppMonitor(this.props.appDetail);
  }

  changeMenu = param => {
    this.setState({ showMenu: param.key });
  };

  getMonitorTabs = () => {
    const { appDetail, method } = this.props;
    const tabs = [
      {
        key: 'resource',
        tab: <FormattedMessage id='componentOverview.body.tab.monitor.monitoring' />
      }
    ];
    const isStandardComponent =
      method !== 'vm' && method !== 'kubeblocks_component';
    const enableTrace =
      isStandardComponent &&
      appDetail &&
      appDetail.service &&
      appDetail.service.language &&
      appDetail.service.language.toLowerCase().indexOf('java') > -1;

    if (enableTrace) {
      tabs.push({
        key: 'trace',
        tab: <FormattedMessage id='componentOverview.body.tab.monitor.tracking' />
      });
    }

    return tabs;
  };

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { showMenu } = this.state;
    const tabs = this.getMonitorTabs();
    const currentMenu = tabs.some(item => item.key === showMenu)
      ? showMenu
      : tabs[0].key;

    return (
      <>
        {tabs.length > 1 && (
          <Row>
            <Menu
              onSelect={this.changeMenu}
              selectedKeys={[currentMenu]}
              style={{ paddingBottom: 10, border: 0 }}
              mode="horizontal"
            >
              {tabs.map(item => (
                <Menu.Item key={item.key}>{item.tab}</Menu.Item>
              ))}
            </Menu>
          </Row>
        )}
        <Row>
          {currentMenu === 'trace' ? <TraceShow /> : <ResourceShow />}
        </Row>
      </>
    );
  }
}

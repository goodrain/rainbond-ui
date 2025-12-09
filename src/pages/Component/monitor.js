import { Button, Card, Menu, Row } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import NoPermTip from '../../components/NoPermTip';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import CustomMonitor from './component/monitor/customMonitor';
import MonitorHistory from './component/monitor/pahistoryshow';
import MonitorNow from './component/monitor/pashow';
import ResourceShow from './component/monitor/resourceshow';
import TraceShow from './component/monitor/trace';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

const ButtonGroup = Button.Group;

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
  constructor(arg) {
    super(arg);
    const { method } = arg;
    this.state = {
      type: 'now',
      showMenu: method === 'vm' ? 'resource' : 'resource',
      anaPlugins: null,
    };
  }

  componentDidMount() {
    if (!this.canView()) return;
    this.fetchBaseInfo();
    this.getAnalyzePlugins();
  }

  getAnalyzePlugins() {
    this.props.dispatch({
      type: 'appControl/getAnalyzePlugins',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
      },
      callback: data => {
        const relist = (data && data.list) || [];
        this.setState({ anaPlugins: relist });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
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
  changeType = type => {
    if (type !== this.state.type) {
      this.setState({ type });
    }
  };

  changeMenu = param => {
    this.setState({ showMenu: param.key });
  };

  renderPM() {
    const { type, anaPlugins } = this.state;
    const showPerformance = anaPlugins && anaPlugins.length > 0;

    const containerStyle = {
      padding: '10px',
      border: '1px solid #e8e8e8',
      borderRadius: '5px',
    };

    const headerStyle = {
      textAlign: 'left',
      marginBottom: 25,
    };

    const emptyStateStyle = {
      textAlign: 'center',
      fontSize: 18,
      padding: '30px 0',
    };

    const descriptionStyle = {
      paddingTop: 8,
    };

    if (showPerformance) {
      return (
        <Fragment>
          <div style={containerStyle}>
            <div style={headerStyle}>
              <Button.Group>
                <Button
                  onClick={() => this.changeType('now')}
                  type={type === 'now' ? 'primary' : ''}
                >
                  <FormattedMessage id='componentOverview.body.tab.monitor.now' />
                </Button>
                <Button
                  onClick={() => this.changeType('history')}
                  type={type === 'history' ? 'primary' : ''}
                >
                  <FormattedMessage id='componentOverview.body.tab.monitor.history' />
                </Button>
              </Button.Group>
            </div>
            {type === 'now' ? (
              <MonitorNow {...this.props} />
            ) : (
              <MonitorHistory {...this.props} />
            )}
          </div>
        </Fragment>
      );
    }
    return (
      <Card>
        <div style={emptyStateStyle}>
          <FormattedMessage id='componentOverview.body.tab.monitor.analysis' />
          <p style={descriptionStyle}>
            {formatMessage({ id: 'componentOverview.body.tab.monitor.analysis_desc' })}
          </p>
        </div>
      </Card>
    );
  }

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { showMenu } = this.state;
    const {
      appDetail,
      componentPermissions: { isServiceMonitor },
      method
    } = this.props;

    const defaultShow = ['resource'];
    const isStandardComponent = method !== 'vm' && method !== 'kubeblocks_component';
    const enablePM =
      appDetail &&
      appDetail.service &&
      appDetail.service.language &&
      appDetail.service.language.toLowerCase().indexOf('java') > -1;

    const menuStyle = {
      paddingBottom: 10,
      border: 0
    };

    return (
      <>
        <Row>
          <Menu
            onSelect={this.changeMenu}
            defaultSelectedKeys={defaultShow}
            style={menuStyle}
            mode="horizontal"
          >
            <Menu.Item key="resource">
              <FormattedMessage id='componentOverview.body.tab.monitor.monitoring' />
            </Menu.Item>
            {isStandardComponent && (
              <Menu.Item key="pm">
                <FormattedMessage id='componentOverview.body.tab.monitor.performanceAnalysis' />
              </Menu.Item>
            )}
            {enablePM && isStandardComponent && (
              <Menu.Item key="trace">
                <FormattedMessage id='componentOverview.body.tab.monitor.tracking' />
              </Menu.Item>
            )}
            {isServiceMonitor && isStandardComponent && (
              <Menu.Item key="custom">
                <FormattedMessage id='componentOverview.body.tab.monitor.business' />
              </Menu.Item>
            )}
          </Menu>
        </Row>
        <Row>
          {showMenu === 'pm' && this.renderPM()}
          {showMenu === 'trace' && <TraceShow />}
          {showMenu === 'resource' && <ResourceShow />}
          {showMenu === 'custom' && <CustomMonitor appDetail={appDetail} />}
        </Row>
      </>
    );
  }
}

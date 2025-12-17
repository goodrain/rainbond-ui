import { Card, Form, notification, Button } from 'antd';
import { connect } from 'dva';
import React from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import appProbeUtil from '../../utils/appProbe-util';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';
import EditHealthCheck from './setting/edit-health-check';

// 样式常量
const BUTTON_STYLE = {
  marginRight: '5px',
  fontSize: '14px',
  fontWeight: 400
};

const SECTION_WIDTH_STYLE = {
  width: '33%',
  textAlign: 'center'
};

const FLEX_CONTAINER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between'
};

const FLEX_DISPLAY_STYLE = {
  display: 'flex'
};

const HEALTH_STATUS_COLORS = {
  healthy: 'green',
  unhealthy: 'red'
};

// 健康状态常量
const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    innerEnvs: appControl.innerEnvs,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    appDetail: appControl.appDetail,
    teamControl,
    appControl
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      showHealth: false,
      loading: true,
      list: []
    };
  }
  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.fetchStartProbe();
    this.fetchPorts();
    this.fetchBaseInfo();
    this.fetchTags();
    this.handleGetList();
  }
  handleParameter = () => {
    return {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias
    };
  };

  handleGetList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getInstanceList',
      payload: this.handleParameter(),
      callback: res => {
        this.setState({
          list: (res && res.list) || [],
          loading: false
        });
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ loading: false });
      }
    });
  };
  fetchInterface = type => {
    const { dispatch } = this.props;
    dispatch({
      type,
      payload: this.handleParameter(),
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  fetchBaseInfo = () => {
    this.fetchInterface('appControl/fetchBaseInfo');
  };
  fetchPorts = () => {
    this.fetchInterface('appControl/fetchPorts');
  };
  fetchTags = () => {
    this.fetchInterface('appControl/fetchTags');
  };

  fetchStartProbe() {
    this.fetchInterface('appControl/fetchStartProbe');
  }

  handleSubmitEdit = vals => {
    this.setState({
      healthCheckLoading: true
    });
    const { startProbe, dispatch } = this.props;
    dispatch({
      type: 'appControl/editStartProbe',
      payload: {
        ...this.handleParameter(),
        ...vals,
        old_mode: startProbe.mode
      },
      callback: res => {
        this.handleCancel();
        this.fetchStartProbe();
        if (res && res.status_code && res.status_code === 200) {
          notification.info({ message: formatMessage({id:'notification.hint.need_updata'})});
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ healthCheckLoading: false });
      }
    });
  };

  handleCancel = () => {
    this.setState({ showHealth: false, healthCheckLoading: false });
  };
  openCancel = () => {
    this.setState({ showHealth: true });
  };

  handleState = () => {
    const arr = this.state.list || [{ status: '-' }];
    let healthy = 0;
    let unhealthy = 0;
    let unknown = 0;
    let hasNoStatus = false;

    arr.forEach(item => {
      const { status } = item;
      const lowerStatus = status?.toLowerCase();

      if (lowerStatus === HEALTH_STATUS.HEALTHY) {
        healthy += 1;
      } else if (lowerStatus === HEALTH_STATUS.UNHEALTHY) {
        unhealthy += 1;
      } else if (lowerStatus === HEALTH_STATUS.UNKNOWN) {
        unknown += 1;
      } else {
        hasNoStatus = true;
      }
    });

    // 全部健康
    if (healthy > 0 && unhealthy === 0 && unknown === 0 && !hasNoStatus) {
      return (
        <span>
          (<span style={{ color: HEALTH_STATUS_COLORS.healthy }}>
            <FormattedMessage id='componentOverview.body.Members.health'/>
          </span>)
        </span>
      );
    }

    // 部分健康
    if (healthy > 0 && (unhealthy > 0 || unknown > 0)) {
      return (
        <span>
          (<span style={{ color: HEALTH_STATUS_COLORS.healthy }}>
            <FormattedMessage id='componentOverview.body.Members.partial_health'/>
          </span>)
        </span>
      );
    }

    // 全部不健康
    if (healthy === 0 && unhealthy > 0 && unknown === 0 && !hasNoStatus) {
      return (
        <span>
          (<span style={{ color: HEALTH_STATUS_COLORS.unhealthy }}>
            <FormattedMessage id='componentOverview.body.Members.unhealth'/>
          </span>)
        </span>
      );
    }

    // 全部未知
    if (healthy === 0 && unhealthy === 0 && unknown > 0 && !hasNoStatus) {
      return <FormattedMessage id='componentOverview.body.Members.unknown'/>;
    }

    return '(-)';
  };

  handleStartProbeStart = isUsed => {
    const { startProbe, dispatch } = this.props;
    dispatch({
      type: 'appControl/editStartProbe',
      payload: {
        ...this.handleParameter(),
        ...startProbe,
        is_used: isUsed
      },
      callback: res => {
        if (res && res.status_code && res.status_code === 200) {
          notification.info({ message: formatMessage({id:'notification.hint.need_updata'})});
        }
        this.fetchStartProbe();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  render() {
    const { baseInfo, startProbe, ports } = this.props;
    if (typeof baseInfo.build_upgrade !== 'boolean') {
      return null;
    }
    const { showHealth, loading, healthCheckLoading } = this.state;
    const probeMap = {
      readiness: formatMessage({id:'componentOverview.body.Members.offline'}),
      liveness: formatMessage({id:'componentOverview.body.Members.restart'})
    };
    const isStartProbe = startProbe && Object.keys(startProbe).length > 0;
    return (
      <div>
        {startProbe && (
          <Card
            loading={loading}
            title={
              <div style={FLEX_CONTAINER_STYLE}>
                <FormattedMessage id='componentOverview.body.setting.health'/>
                <div>
                  {startProbe && (
                    <Button
                      style={BUTTON_STYLE}
                      onClick={this.openCancel}
                      icon='form'
                    >
                      {isStartProbe ? <FormattedMessage id='componentOverview.body.setting.edit'/> : <FormattedMessage id='componentOverview.body.setting.set'/>}
                    </Button>
                  )}
                  {isStartProbe &&
                  appProbeUtil.isStartProbeStart(startProbe) ? (
                    <a
                      onClick={() => this.handleStartProbeStart(false)}
                      style={BUTTON_STYLE}
                    >
                      <FormattedMessage id='componentOverview.body.setting.Disable'/>
                    </a>
                  ) : (
                    isStartProbe && (
                      <a
                        onClick={() => this.handleStartProbeStart(true)}
                        style={BUTTON_STYLE}
                      >
                        <FormattedMessage id='componentOverview.body.setting.Enable'/>
                      </a>
                    )
                  )}
                </div>
              </div>
            }
          >
            {startProbe && (
              <div style={FLEX_DISPLAY_STYLE}>
                <div style={SECTION_WIDTH_STYLE}>
                  <FormattedMessage id='componentOverview.body.setting.state'/>{this.handleState()}
                </div>
                <div style={SECTION_WIDTH_STYLE}>
                  <FormattedMessage id='componentOverview.body.setting.method'/>
                  {startProbe.scheme || <FormattedMessage id='componentOverview.body.setting.Not_set'/>}
                </div>
                <div style={SECTION_WIDTH_STYLE}>
                  <FormattedMessage id='componentOverview.body.setting.unhealth'/>
                  {probeMap[startProbe.mode] || <FormattedMessage id='componentOverview.body.setting.Not_set'/>}
                </div>
              </div>
            )}
          </Card>
        )}
        {showHealth && (
          <EditHealthCheck
            title={<FormattedMessage id='componentOverview.body.setting.health'/>}
            types="third"
            ports={ports}
            loading={healthCheckLoading}
            data={startProbe}
            onOk={this.handleSubmitEdit}
            onCancel={this.handleCancel}
          />
        )}
      </div>
    );
  }
}

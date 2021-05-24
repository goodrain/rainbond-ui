/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Card, Form } from 'antd';
import { connect } from 'dva';
import React from 'react';
import appProbeUtil from '../../utils/appProbe-util';
import globalUtil from '../../utils/global';
import EditHealthCheck from './setting/edit-health-check';

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
      }
    });
  };
  fetchInterface = type => {
    const { dispatch } = this.props;
    dispatch({
      type,
      payload: this.handleParameter()
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
      callback: () => {
        this.handleCancel();
        this.fetchStartProbe();
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
    let Unknown = 0;
    let nos = '';
    arr.map(item => {
      const { status } = item;
      if (status == 'healthy') {
        healthy++;
      } else if (status == 'unhealthy') {
        unhealthy++;
      } else if (status == 'Unknown' || status == 'unknown') {
        Unknown++;
      } else {
        nos = '-';
      }
      return item;
    });
    if (
      healthy != 0 &&
      unhealthy == 0 &&
      Unknown === 0 &&
      Unknown === 0 &&
      nos == ''
    ) {
      return (
        <span>
          (<span style={{ color: 'green' }}>健康</span>)
        </span>
      );
    } else if (healthy != 0 && (unhealthy != 0 || Unknown != 0)) {
      return (
        <span>
          (<span style={{ color: 'green' }}>部分健康</span>)
        </span>
      );
    } else if (healthy == 0 && unhealthy != 0 && Unknown == 0 && nos == '') {
      return (
        <span>
          (<span style={{ color: 'red' }}>不健康</span>)
        </span>
      );
    } else if (healthy == 0 && unhealthy == 0 && Unknown != 0 && nos == '') {
      return '(未知)';
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
      callback: () => {
        this.fetchStartProbe();
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
      readiness: '下线',
      liveness: '重启',
      ignore: '忽略'
    };
    const isStartProbe = JSON.stringify(startProbe) != '{}';
    const setWidth = { width: '33%', textAlign: 'center' };
    return (
      <div>
        {startProbe && (
          <Card
            loading={loading}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                健康检测
                <div>
                  {startProbe && (
                    <a
                      style={{
                        marginRight: '5px',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                      onClick={() => {
                        this.openCancel();
                      }}
                    >
                      {isStartProbe ? '编辑' : '设置'}
                    </a>
                  )}
                  {isStartProbe &&
                  appProbeUtil.isStartProbeStart(startProbe) ? (
                    <a
                      onClick={() => {
                        this.handleStartProbeStart(false);
                      }}
                      style={{
                        marginRight: '5px',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                      href="javascript:;"
                    >
                      禁用
                    </a>
                  ) : (
                    isStartProbe && (
                      <a
                        onClick={() => {
                          this.handleStartProbeStart(true);
                        }}
                        style={{
                          marginRight: '5px',
                          fontSize: '14px',
                          fontWeight: 400
                        }}
                        href="javascript:;"
                      >
                        启用
                      </a>
                    )
                  )}
                </div>
              </div>
            }
          >
            {startProbe && (
              <div style={{ display: 'flex' }}>
                <div style={setWidth}>当前状态:{this.handleState()}</div>
                <div style={setWidth}>
                  检测方式:{startProbe.scheme || '未设置'}
                </div>
                <div style={setWidth}>
                  不健康处理方式:
                  {probeMap[startProbe.mode] || '未设置'}
                </div>
              </div>
            )}
          </Card>
        )}
        {showHealth && (
          <EditHealthCheck
            title="健康检测"
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

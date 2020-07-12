import { Button, Card, Col, Icon, Row, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import numeral from 'numeral';
import React, { Fragment, PureComponent } from 'react';
import {
  ChartCard,
  Field,
  MiniArea,
  MiniBar,
  TimelineChart
} from '../../components/Charts';
import NoPermTip from '../../components/NoPermTip';
import ScrollerX from '../../components/ScrollerX';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import monitorDataUtil from '../../utils/monitorDataUtil';
import regionUtil from '../../utils/region';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import styles from './Index.less';

const ButtonGroup = Button.Group;

class Empty extends PureComponent {
  render() {
    return (
      <div
        style={{
          height: '300px',
          lineHeight: '300px',
          textAlign: ' center',
          fontSize: 26,
        }}
      >
        暂无数据
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  onlineNumberRange: appControl.onlineNumberRange,
  appRequestRange: appControl.appRequestRange,
  requestTimeRange: appControl.requestTimeRange,
}))
class MonitorHistory extends PureComponent {
  state = {
    houer: 1,
  };
  componentDidMount() {
    this.mounted = true;
    this.inerval = 10000;
    this.fetchRequestTimeRange();
    this.fetchRequestRange();
    this.fetchOnlineNumberRange();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  getStartTime() {
    return new Date().getTime() / 1000 - 60 * 60 * this.state.houer;
  }
  getStep() {
    const { houer } = this.state;
    return `${(60 * 60 * houer) / 20}s`;
  }

  fetchRequestTimeRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchRequestTimeRange',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep(),
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestTimeRange();
          }, this.inerval);
        }
      },
    });
  }
  fetchRequestRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchRequestRange',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep(),
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestRange();
          }, this.inerval);
        }
      },
    });
  }
  fetchOnlineNumberRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchOnlineNumberRange',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep(),
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchOnlineNumberRange();
          }, this.inerval);
        }
      },
    });
  }

  selectDate = houer => {
    this.setState({ houer });
  };
  isActive = houer => {
    if (houer === this.state.houer) {
      return styles.currentDate;
    }
  };
  render() {
    const salesExtra = (
      <div className={styles.salesExtraWrap}>
        <div className={styles.salesExtra}>
          <a className={this.isActive(1)} onClick={() => this.selectDate(1)}>
            1小时
          </a>
          <a className={this.isActive(8)} onClick={() => this.selectDate(8)}>
            8小时
          </a>
          <a className={this.isActive(24)} onClick={() => this.selectDate(24)}>
            24小时
          </a>
          <a
            className={this.isActive(24 * 7)}
            onClick={() => this.selectDate(24 * 7)}
          >
            7天
          </a>
        </div>
      </div>
    );

    const requiestTime = monitorDataUtil.queryRangeTog2F(
      this.props.requestTimeRange
    );
    const appRequest = monitorDataUtil.queryRangeTog2F(
      this.props.appRequestRange
    );
    const online = monitorDataUtil.queryRangeTog2F(
      this.props.onlineNumberRange,
      true
    );

    return (
      <div>
        <Card
          title="响应时间"
          style={{
            marginBottom: 20,
          }}
          extra={salesExtra}
        >
          {requiestTime.length ? (
            <TimelineChart height={200} data={requiestTime} />
          ) : (
            <Empty />
          )}
        </Card>
        <Card
          extra={salesExtra}
          title="吞吐率"
          style={{
            marginBottom: 20,
          }}
        >
          {appRequest.length ? (
            <TimelineChart height={200} data={appRequest} />
          ) : (
            <Empty />
          )}
        </Card>
        <Card extra={salesExtra} title="在线人数">
          {online.length ? (
            <TimelineChart height={200} data={online} />
          ) : (
            <Empty />
          )}
        </Card>
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  onlineNumber: appControl.onlineNumber,
  onlineNumberRange: appControl.onlineNumberRange,
  appRequest: appControl.appRequest,
  appRequestRange: appControl.appRequestRange,
  requestTime: appControl.requestTime,
  requestTimeRange: appControl.requestTimeRange,
}))
class MonitorNow extends PureComponent {
  constructor(props) {
    super(props);
    this.inerval = 5000;
    this.state = {
      logs: [],
    };
  }

  componentDidMount() {
    this.mounted = true;
    this.fetchRequestTime();
    this.fetchRequestTimeRange();
    this.fetchRequest();
    this.fetchRequestRange();
    this.fetchOnlineNumber();
    this.fetchOnlineNumberRange();
    this.createSocket();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.props.dispatch({ type: 'appControl/clearOnlineNumberRange' });
    this.props.dispatch({ type: 'appControl/clearRequestTime' });
    this.props.dispatch({ type: 'appControl/clearRequestTimeRange' });
    this.props.dispatch({ type: 'appControl/clearRequest' });
    this.props.dispatch({ type: 'appControl/clearRequestRange' });
    this.props.dispatch({ type: 'appControl/clearOnlineNumber' });
    const { socket } = this.props;
    if (socket) {
      socket.closeMonitorMessage()
    }
  }
  // eslint-disable-next-line class-methods-use-this
  getStartTime() {
    return new Date().getTime() / 1000 - 60 * 60;
  }
  // eslint-disable-next-line class-methods-use-this
  getStep() {
    return 60;
  }
  getSocketUrl = () => {
    const currTeam = userUtil.getTeamByTeamName(
      this.props.currUser,
      globalUtil.getCurrTeamName()
    );
    const currRegionName = globalUtil.getCurrRegionName();

    if (currTeam) {
      const region = teamUtil.getRegionByName(currTeam, currRegionName);

      if (region) {
        return regionUtil.getMonitorWebSocketUrl(region);
      }
    }
    return '';
  };
  fetchRequestTime() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchRequestTime',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        serviceId: this.props.appDetail.service.service_id,
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestTime();
          }, this.inerval);
        }
      },
    });
  }
  fetchRequestTimeRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchRequestTimeRange',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep(),
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestTimeRange();
          }, this.inerval);
        }
      },
    });
  }
  fetchRequest() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchRequest',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        serviceId: this.props.appDetail.service.service_id,
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequest();
          }, this.inerval);
        }
      },
    });
  }
  fetchRequestRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchRequestRange',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep(),
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestRange();
          }, this.inerval);
        }
      },
    });
  }
  fetchOnlineNumber() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchOnlineNumber',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        serviceId: this.props.appDetail.service.service_id,
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchOnlineNumber();
          }, this.inerval);
        }
      },
    });
  }
  fetchOnlineNumberRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: 'appControl/fetchOnlineNumberRange',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep(),
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchOnlineNumberRange();
          }, this.inerval);
        }
      },
    });
  }
  createSocket() {
    const { socket } = this.props;
    if (socket) {
      socket.setOnMonitorMessage(messages => {
        this.updateTable(messages);
      });
    }
  }
  updateTable(event) {
    try {
      event = JSON.parse(event);
    } catch (e) {}
    this.setState({ logs: event });
  }
  render() {
    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 8,
      style: {
        marginBottom: 24,
      },
    };
    return (
      <Fragment>
        <Row gutter={24}>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="平均响应时间（ms）"
              action={
                <Tooltip title="平均响应时间，单位毫秒">
                  {' '}
                  <Icon type="info-circle-o" />{' '}
                </Tooltip>
              }
              total={numeral(
                monitorDataUtil.queryTog2(this.props.requestTime)
              ).format('0,0')}
              footer={<Field label="" value="" />}
              contentHeight={46}
            >
              <MiniArea
                color="#975FE4"
                data={monitorDataUtil.queryRangeTog2(
                  this.props.requestTimeRange
                )}
              />
            </ChartCard>
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="吞吐率（dps）"
              action={
                <Tooltip title="过去一分钟平均每5s的请求次数">
                  {' '}
                  <Icon type="info-circle-o" />{' '}
                </Tooltip>
              }
              total={numeral(
                monitorDataUtil.queryTog2(this.props.appRequest)
              ).format('0,0')}
              footer={<Field label="" value="" />}
              contentHeight={46}
            >
              <MiniArea
                color="#4593fc"
                data={monitorDataUtil.queryRangeTog2(
                  this.props.appRequestRange
                )}
              />
            </ChartCard>
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="在线人数"
              action={
                <Tooltip title="过去5分钟的独立IP数量">
                  {' '}
                  <Icon type="info-circle-o" />{' '}
                </Tooltip>
              }
              total={numeral(
                monitorDataUtil.queryTog2(this.props.onlineNumber)
              ).format('0,0')}
              footer={<Field label="" value="" />}
              contentHeight={46}
            >
              <MiniBar
                data={monitorDataUtil.queryRangeTog2(
                  this.props.onlineNumberRange
                )}
              />
            </ChartCard>
          </Col>
        </Row>
        <Card title="过去5分钟耗时最多的URL排行">
          <ScrollerX sm={700}>
            <Table
              columns={[
                {
                  title: 'Url',
                  dataIndex: 'Key',
                },
                {
                  title: '累计时间(ms)',
                  dataIndex: 'CumulativeTime',
                  width: 150,
                },
                {
                  title: '平均时间(ms)',
                  dataIndex: 'AverageTime',
                  width: 150,
                },
                {
                  title: '请求次数',
                  dataIndex: 'Count',
                  width: 100,
                },
                {
                  title: '异常次数',
                  dataIndex: 'AbnormalCount',
                  width: 100,
                },
              ]}
              pagination={false}
              dataSource={this.state.logs}
            />
          </ScrollerX>
        </Card>
      </Fragment>
    );
  }
}

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
    this.state = {
      type: 'now',
      anaPlugins: null,
    };
  }

  componentDidMount() {
    if (!this.canView()) return;
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
        const list = (data && data.list) || [];
        this.setState({ anaPlugins: list });
      },
    });
  }
  // 是否可以浏览当前界面
  canView() {
    return appUtil.canManageAppMonitor(this.props.appDetail);
  }
  changeType = type => {
    if (type !== this.state.type) {
      this.setState({ type });
    }
  };
  render() {
    if (!this.canView()) return <NoPermTip />;
    const { type, anaPlugins } = this.state;
    const { appDetail } = this.props;

    if (!appDetail || !anaPlugins) {
      return null;
    }

    // 判断是否有安装性能分析插件
    if (!anaPlugins.length) {
      return (
        <Card>
          <div
            style={{
              textAlign: 'center',
              fontSize: 18,
              padding: '30px 0',
            }}
          >
            尚未开通性能分析插件
            <p
              style={{
                paddingTop: 8,
              }}
            >
              <Link
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                  appDetail.service.service_alias
                }/plugin`}
              >
                去开通
              </Link>
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Fragment>
        <div
          style={{
            textAlign: 'right',
            marginBottom: 25,
          }}
        >
          <ButtonGroup>
            <Button
              onClick={() => {
                this.changeType('now');
              }}
              type={type === 'now' ? 'primary' : ''}
            >
              实时
            </Button>
            <Button
              onClick={() => {
                this.changeType('history');
              }}
              type={type === 'history' ? 'primary' : ''}
            >
              历史
            </Button>
          </ButtonGroup>
        </div>
        {type === 'now' ? (
          <MonitorNow {...this.props} />
        ) : (
          <MonitorHistory {...this.props} />
        )}
      </Fragment>
    );
  }
}

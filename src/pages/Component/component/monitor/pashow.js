import { ChartCard, Field, MiniArea, MiniBar } from "@/components/Charts";
import ScrollerX from "@/components/ScrollerX";
import globalUtil from "@/utils/global";
import monitorDataUtil from "@/utils/monitorDataUtil";
import regionUtil from "@/utils/region";
import teamUtil from "@/utils/team";
import userUtil from "@/utils/user";
import handleAPIError from "@/utils/error";
import { Card, Col, Icon, Row, Table, Tooltip } from "antd";
import { connect } from "dva";
import numeral from "numeral";
import React, { Fragment, PureComponent } from "react";
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';


// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  onlineNumber: appControl.onlineNumber,
  onlineNumberRange: appControl.onlineNumberRange,
  appRequest: appControl.appRequest,
  appRequestRange: appControl.appRequestRange,
  requestTime: appControl.requestTime,
  requestTimeRange: appControl.requestTimeRange
}))
export default class MonitorNow extends PureComponent {
  constructor(props) {
    super(props);
    this.inerval = 5000;
    this.state = {
      logs: []
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
    const clearActions = [
      'clearOnlineNumberRange',
      'clearRequestTime',
      'clearRequestTimeRange',
      'clearRequest',
      'clearRequestRange',
      'clearOnlineNumber'
    ];

    clearActions.forEach(action => {
      this.props.dispatch({ type: `appControl/${action}` });
    });

    const { socket } = this.props;
    if (socket) {
      socket.closeMonitorMessage();
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
    return "";
  };

  // 通用的 fetch 方法，减少代码重复
  fetchData = (actionType, payload, callback) => {
    if (!this.mounted) return;

    this.props.dispatch({
      type: actionType,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        serviceId: this.props.appDetail.service.service_id,
        ...payload
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            callback();
          }, this.inerval);
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  fetchRequestTime() {
    this.fetchData(
      "appControl/fetchRequestTime",
      {},
      () => this.fetchRequestTime()
    );
  }

  fetchRequestTimeRange() {
    this.fetchData(
      "appControl/fetchRequestTimeRange",
      {
        start: this.getStartTime(),
        step: this.getStep()
      },
      () => this.fetchRequestTimeRange()
    );
  }

  fetchRequest() {
    this.fetchData(
      "appControl/fetchRequest",
      {},
      () => this.fetchRequest()
    );
  }

  fetchRequestRange() {
    this.fetchData(
      "appControl/fetchRequestRange",
      {
        start: this.getStartTime(),
        step: this.getStep()
      },
      () => this.fetchRequestRange()
    );
  }

  fetchOnlineNumber() {
    this.fetchData(
      "appControl/fetchOnlineNumber",
      {},
      () => this.fetchOnlineNumber()
    );
  }

  fetchOnlineNumberRange() {
    this.fetchData(
      "appControl/fetchOnlineNumberRange",
      {
        start: this.getStartTime(),
        step: this.getStep()
      },
      () => this.fetchOnlineNumberRange()
    );
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
      const parsedEvent = JSON.parse(event);
      this.setState({ logs: parsedEvent });
    } catch (e) {
      // 如果解析失败，尝试直接使用原始数据
      if (Array.isArray(event)) {
        this.setState({ logs: event });
      } else {
        console.error('Failed to parse monitor data:', e);
        this.setState({ logs: [] });
      }
    }
  }

  // 渲染图表卡片
  renderChartCard = (title, tooltip, data, rangeData, color, chartType = 'area') => {
    const Chart = chartType === 'area' ? MiniArea : MiniBar;
    return (
      <ChartCard
        title={<FormattedMessage id={title} />}
        action={
          <Tooltip title={<FormattedMessage id={tooltip} />}>
            <Icon type="info-circle-o" />
          </Tooltip>
        }
        total={numeral(monitorDataUtil.queryTog2(data)).format("0,0")}
        footer={<Field label="" value="" />}
        contentHeight={46}
      >
        <Chart
          color={color}
          data={monitorDataUtil.queryRangeTog2(rangeData)}
        />
      </ChartCard>
    );
  };

  // 获取表格列配置
  getTableColumns = () => [
    {
      title: "Url",
      dataIndex: "Key"
    },
    {
      title: formatMessage({ id: 'componentOverview.body.tab.monitor.now.cumulativeTime' }),
      dataIndex: "CumulativeTime",
      width: 150
    },
    {
      title: formatMessage({ id: 'componentOverview.body.tab.monitor.now.AverageTime' }),
      dataIndex: "AverageTime",
      width: 150
    },
    {
      title: formatMessage({ id: 'componentOverview.body.tab.monitor.now.requests' }),
      dataIndex: "Count",
      width: 100
    },
    {
      title: formatMessage({ id: 'componentOverview.body.tab.monitor.now.abnormalTimes' }),
      dataIndex: "AbnormalCount",
      width: 100
    }
  ];

  render() {
    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 8,
      style: {
        marginBottom: 24
      }
    };

    const { requestTime, requestTimeRange, appRequest, appRequestRange, onlineNumber, onlineNumberRange } = this.props;

    return (
      <Fragment>
        <Row gutter={24}>
          <Col {...topColResponsiveProps}>
            {this.renderChartCard(
              "componentOverview.body.tab.monitor.now.time",
              "componentOverview.body.tab.monitor.now.averageTime",
              requestTime,
              requestTimeRange,
              "#975FE4",
              'area'
            )}
          </Col>
          <Col {...topColResponsiveProps}>
            {this.renderChartCard(
              "componentOverview.body.tab.monitor.now.throughput",
              "componentOverview.body.tab.monitor.now.NumberOfRequests",
              appRequest,
              appRequestRange,
              "#4593fc",
              'area'
            )}
          </Col>
          <Col {...topColResponsiveProps}>
            {this.renderChartCard(
              "componentOverview.body.tab.monitor.now.onlineNumber",
              "componentOverview.body.tab.monitor.now.independent",
              onlineNumber,
              onlineNumberRange,
              "#4593fc",
              'bar'
            )}
          </Col>
        </Row>
        <Card title={<FormattedMessage id="componentOverview.body.tab.monitor.now.ranking" />}>
          <ScrollerX sm={700}>
            <Table
              rowKey={(record, index) => index}
              columns={this.getTableColumns()}
              pagination={false}
              dataSource={this.state.logs}
            />
          </ScrollerX>
        </Card>
      </Fragment>
    );
  }
}

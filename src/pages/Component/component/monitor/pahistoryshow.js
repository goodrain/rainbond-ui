import { Button, Card, Empty } from "antd";
import { connect } from "dva";
import React, { PureComponent } from "react";
import { TimelineChart } from "../../../../components/Charts";
import globalUtil from "../../../../utils/global";
import monitorDataUtil from "../../../../utils/monitorDataUtil";
import styles from "../../Index.less";

const ButtonGroup = Button.Group;

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  onlineNumberRange: appControl.onlineNumberRange,
  appRequestRange: appControl.appRequestRange,
  requestTimeRange: appControl.requestTimeRange
}))
export default class MonitorHistory extends PureComponent {
  state = {
    houer: 1
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
      type: "appControl/fetchRequestTimeRange",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep()
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestTimeRange();
          }, this.inerval);
        }
      }
    });
  }
  fetchRequestRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: "appControl/fetchRequestRange",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep()
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestRange();
          }, this.inerval);
        }
      }
    });
  }
  fetchOnlineNumberRange() {
    if (!this.mounted) return;
    this.props.dispatch({
      type: "appControl/fetchOnlineNumberRange",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        start: this.getStartTime(),
        serviceId: this.props.appDetail.service.service_id,
        step: this.getStep()
      },
      complete: () => {
        if (this.mounted) {
          setTimeout(() => {
            this.fetchOnlineNumberRange();
          }, this.inerval);
        }
      }
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
            marginBottom: 20
          }}
          extra={salesExtra}
        >
          {requiestTime.length ? (
            <TimelineChart height={200} data={requiestTime} />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
        <Card
          extra={salesExtra}
          title="吞吐率"
          style={{
            marginBottom: 20
          }}
        >
          {appRequest.length ? (
            <TimelineChart height={200} data={appRequest} />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
        <Card extra={salesExtra} title="在线人数">
          {online.length ? (
            <TimelineChart height={200} data={online} />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    );
  }
}

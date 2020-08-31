import React, { PureComponent } from "react";
import { connect } from "dva";
import { Button, Card, Empty, Form, Row, Col, DatePicker, Spin } from "antd";
import moment from "moment";
import { Axis, Chart, Geom, Legend, Tooltip } from "bizcharts";
import { TimelineChart } from "../../../../components/Charts";
import globalUtil from "../../../../utils/global";
import monitorDataUtil from "../../../../utils/monitorDataUtil";
import styles from "../../Index.less";

const ButtonGroup = Button.Group;
const FormItem = Form.Item;

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  onlineNumberRange: appControl.onlineNumberRange,
  appRequestRange: appControl.appRequestRange,
  requestTimeRange: appControl.requestTimeRange
}))
@Form.create()
export default class MonitorHistory extends PureComponent {
  constructor(props) {
    super(props);
    const start = new Date().getTime() / 1000 - 60 * 60;
    const end = new Date().getTime() / 1000;
    const seconds = moment(end * 1000).diff(moment(start * 1000), "seconds");
    this.state = {
      houer: 1,
      responseTimeLoading: true,
      throughputLoading: true,
      numberOnlineLoading: true,
      start,
      end,
      step: `${seconds / 20}s`
    };
  }

  componentDidMount() {
    this.mounted = true;
    this.inerval = 10000;
    this.fetchData();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  fetchData() {
    this.fetchRequestTimeRange();
    this.fetchRequestRange();
    this.fetchOnlineNumberRange();
  }
  getStep = () => {
    const { start, end } = this.state;
    // const seconds = moment(end * 1000).diff(moment(start * 1000), "seconds");
    return Math.ceil((end - start) / 100) || 15;
    // return `${seconds / 20}s`;
  };
  fetchRequestTimeRange = () => {
    const { dispatch, appAlias, appDetail } = this.props;
    const { start, end } = this.state;
    if (!this.mounted) return;
    dispatch({
      type: "appControl/fetchRequestTimeRange",
      payload: {
        start,
        end,
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        serviceId: appDetail.service.service_id,
        step: this.getStep()
      },
      complete: () => {
        this.setState({ responseTimeLoading: false });
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestTimeRange();
          }, this.inerval);
        }
      }
    });
  };
  fetchRequestRange = () => {
    const { dispatch, appAlias, appDetail } = this.props;
    const { start, end } = this.state;
    if (!this.mounted) return;
    dispatch({
      type: "appControl/fetchRequestRange",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        start,
        end,
        serviceId: appDetail.service.service_id,
        step: this.getStep()
      },
      complete: () => {
        this.setState({ throughputLoading: false });
        if (this.mounted) {
          setTimeout(() => {
            this.fetchRequestRange();
          }, this.inerval);
        }
      }
    });
  };
  fetchOnlineNumberRange = () => {
    const { dispatch, appAlias, appDetail } = this.props;
    const { start, end } = this.state;
    if (!this.mounted) return;
    dispatch({
      type: "appControl/fetchOnlineNumberRange",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        start,
        end,
        serviceId: appDetail.service.service_id,
        step: this.getStep()
      },
      complete: () => {
        this.setState({ numberOnlineLoading: false });
        if (this.mounted) {
          setTimeout(() => {
            this.fetchOnlineNumberRange();
          }, this.inerval);
        }
      }
    });
  };
  selectDate = houer => {
    this.setState({ houer });
  };

  range = (start, end) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };
  disabledDate = current => {
    // Can not select days before today and today
    return (
      current &&
      (current > moment().endOf("day") ||
        current <
          moment(new Date(new Date().getTime() - 7 * 24 * 1 * 60 * 60 * 1000)))
    );
  };
  disabledDateTime = () => {
    return {
      disabledHours: () => this.range(0, 24).splice(4, 20),
      disabledMinutes: () => this.range(30, 60),
      disabledSeconds: () => [55, 56]
    };
  };

  queryAll = (keys = false) => {
    const { form } = this.props;
    form.validateFields((err, values) => {
      const { start, end } = values;
      const seconds = moment(end.valueOf() / 1000).diff(
        moment(start.valueOf() / 1000),
        "seconds"
      );
      if (!err) {
        this.setState(
          {
            start: start.valueOf() / 1000,
            end: end.valueOf() / 1000,
            responseTimeLoading: keys ? keys === "responseTimeLoading" : true,
            throughputLoading: keys ? keys === "throughputLoading" : true,
            numberOnlineLoading: keys ? keys === "numberOnlineLoading" : true
          },
          () => {
            if (keys) {
              keys === "responseTimeLoading" && this.fetchRequestTimeRange();
              keys === "throughputLoading" && this.fetchRequestRange();
              keys === "numberOnlineLoading" && this.fetchOnlineNumberRange();
            } else {
              this.fetchData();
            }
          }
        );
      }
    });
  };

  handleSalesExtra = keys => {
    return (
      <div className={styles.salesExtraWrap} loading={!this.state[keys]}>
        <div className={styles.salesExtra}>
          <a
            className={styles.currentDate}
            onClick={() =>
              this.setState({ [keys]: true }, () => {
                this.queryAll(keys);
              })
            }
          >
            刷新
          </a>
        </div>
      </div>
    );
  };

  handleChart = (loading, data, cols) => {
    return (
      <Spin spinning={loading}>
        <Chart height={400} data={data} scale={cols} forceFit>
          <Legend />
          <Axis
            name="value"
            label={{
              formatter: val => `${val}ms`
            }}
          />
          <Axis name="time" />
          <Tooltip
            crosshairs={{
              type: "y"
            }}
          />
          <Geom
            type="line"
            position="time*value"
            color="cid"
            shape="smooth"
            size={2}
          />
        </Chart>
      </Spin>
    );
  };
  render() {
    const {
      dispatch,
      form,
      requestTimeRange,
      appRequestRange,
      onlineNumberRange
    } = this.props;

    const requiestTime = monitorDataUtil.queryRangeTog2F(
      requestTimeRange,
      "响应时间"
    );
    const appRequest = monitorDataUtil.queryRangeTog2F(
      appRequestRange,
      "吞吐率"
    );
    const online = monitorDataUtil.queryRangeTog2F(
      onlineNumberRange,
      "在线人数"
    );

    const { getFieldDecorator } = form;
    const {
      start,
      end,
      responseTimeLoading,
      throughputLoading,
      numberOnlineLoading
    } = this.state;

    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 10
        }
      }
    };
    const cols = {
      time: {
        alias: "时间",
        tickCount: 10,
        type: "time",
        formatter: v =>
          moment(new Date(v))
            .locale("zh-cn")
            .format("HH:mm")
      },
      value: {
        alias: { label: "响应时间" },
        tickCount: 5
      },
      cid: {
        type: "cat"
      }
    };

    const noData = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    return (
      <div>
        <Row>
          <Col span={6}>
            <FormItem {...formItemLayout} label="开始时间">
              {getFieldDecorator("start", {
                rules: [{ required: false, message: "请选择开始时间" }],
                initialValue: moment(
                  new Date(new Date().getTime() - 1 * 60 * 60 * 1000)
                )
              })(
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={this.disabledDate}
                  disabledTime={this.disabledDateTime}
                  showTime={{ defaultValue: moment("00:00:00", "HH:mm:ss") }}
                />
              )}
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem {...formItemLayout} label="结束时间">
              {getFieldDecorator("end", {
                rules: [{ required: false, message: "请选择结束时间" }],
                initialValue: moment(new Date())
              })(
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={this.disabledDate}
                  disabledTime={this.disabledDateTime}
                  showTime={{ defaultValue: moment("00:00:00", "HH:mm:ss") }}
                />
              )}
            </FormItem>
          </Col>
          <Col span={6} style={{ lineHeight: "39.99px" }}>
            <Button
              loading={
                responseTimeLoading || throughputLoading || numberOnlineLoading
              }
              onClick={() => {
                this.queryAll(false);
              }}
            >
              查询
            </Button>
          </Col>
        </Row>

        <Card
          title="响应时间"
          style={{
            marginBottom: 20,
            height: 506
          }}
          extra={this.handleSalesExtra("responseTimeLoading")}
        >
          {requiestTime.length
            ? this.handleChart(responseTimeLoading, requiestTime, cols)
            : noData}
        </Card>
        <Card
          extra={this.handleSalesExtra("throughputLoading")}
          title="吞吐率"
          style={{
            marginBottom: 20,
            height: 506
          }}
        >
          {appRequest.length
            ? this.handleChart(throughputLoading, appRequest, cols)
            : noData}
        </Card>
        <Card
          style={{
            height: 506
          }}
          extra={this.handleSalesExtra("numberOnlineLoading")}
          title="在线人数"
        >
          {online.length
            ? this.handleChart(numberOnlineLoading, online, cols)
            : noData}
        </Card>
      </div>
    );
  }
}

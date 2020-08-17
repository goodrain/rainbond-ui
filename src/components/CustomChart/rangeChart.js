/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
// eslint-disable-next-line react/no-multi-comp
import globalUtil from "@/utils/global";
import { Card } from "antd";
import { Axis, Chart, Geom, Legend, Tooltip } from "bizcharts";
import moment from 'moment';
import React, { Fragment, PureComponent } from "react";

export default class RangeChart extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      memoryRange: []
    };
  }

  componentDidMount() {
    this.loadRangeData();
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.start !== nextProps.start || this.props.end !== nextProps.end || this.props.step !== nextProps.step){
      this.loadRangeData(nextProps);
    }
  }
  loadRangeData(props) {
    this.setState({loading: true})
    let prop = this.props
    if (props) {
      prop = props
    }
    const { appDetail, dispatch, type, start, end } = prop;
    dispatch({
      type: "monitor/getMonitorRangeData",
      payload: {
        query: this.getQueryByType(type),
        start: start || new Date().getTime() / 1000 - 60 * 60,
        end: end || new Date().getTime() / 1000,
        step: Math.ceil((end - start) / 100) || 15,
        teamName: globalUtil.getCurrTeamName(),
        componentAlias: appDetail.service.service_alias
      },
      callback: re => {
        this.setState({loading: false})
        if (re.bean) {
          this.setState({ memoryRange: re.bean.result });
        }
      }
    });
  }
  getQueryByType = T => {
    const { appDetail } = this.props;
    switch (T) {
      case "containerMem":
        return `container_memory_rss{name=~"k8s_${
          appDetail.service.service_id
        }.*"}/1024/1024`;
      case "containerCpu":
        return `sum(rate(container_cpu_usage_seconds_total{name=~"k8s_${
          appDetail.service.service_id
        }.*"}[1m])) by (pod, namespace) / (sum(container_spec_cpu_quota{name=~"k8s_${
          appDetail.service.service_id
        }.*"}/container_spec_cpu_period{name=~"k8s_${
          appDetail.service.service_id
        }.*"}) by (pod, namespace)) * 100`;
      case "containerNetR":
        return `rate(container_network_receive_bytes_total{name=~"k8s_POD_${
          appDetail.service.service_id
        }.*"}[1m])/1024`;
      case "containerNetT":
        return `rate(container_network_transmit_bytes_total{name=~"k8s_POD_${
          appDetail.service.service_id
        }.*"}[1m])/1024`;
      default:
        return ``;
    }
  };
  getMeta = () => {
    const { type } = this.props;
    switch (type) {
      case "containerMem":
        return {title: "内存使用量",label: "内存（MB）",unit: " MB"};
      case "containerCpu":
        return {title: "CPU使用率",label: "CPU使用率（%）",unit: "%"};
      case "containerNetR":
        return {title: "传入流量",label: "流量（KB/s）",unit: " KB/s"};
      case "containerNetT":
        return {title: "传出流量",label: "流量（KB/s）",unit: " KB/s"};
      default:
        return {title: "",label: "",unit: ""};
    }
  }
  converData = dataRange => {
    const rangedata = [];
    if (dataRange){
      dataRange.map(item => {
        const cid = item.metric.pod;
        if (item.values) {
          item.values.map(v => {
            rangedata.push({
              cid,
              time: v[0] * 1000,
              value: Math.floor(Number(v[1]) * 100) / 100
            });
          });
        }
      });
    }
    return rangedata;
  };
  componentWillUnmount() {}

  render() {
    const { title, label, unit } = this.getMeta();
    const { memoryRange, loading } = this.state;
    const data = this.converData(memoryRange);
    const cols = {
      time: {
        alias: "时间",
        tickCount: 10,
        type: 'time',
        formatter: (v) => moment(new Date(v)).locale('zh-cn').format('HH:mm')
      },
      value: {
        alias: { label },
        tickCount: 5
      },
      cid: {
        type: "cat"
      }
    };
    return (
      <Fragment>
        <Card
          title={title}
          extra={<a onClick={() => this.loadRangeData()}>刷新</a>}
        >
          <Chart loading={loading} height={400} data={data} scale={cols} forceFit>
            <Legend />
            <Axis
              name="value"
              label={{
                formatter: val => `${val}${unit}`
              }}
            />
            <Axis
              name="time"
            />
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
        </Card>
      </Fragment>
    );
  }
}

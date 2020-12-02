/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
// eslint-disable-next-line react/no-multi-comp
import React, { Fragment, PureComponent } from 'react';
import moment from 'moment';
import { Card, Spin } from 'antd';
import { Axis, Chart, Geom, Legend, Tooltip } from 'bizcharts';
import globalUtil from '@/utils/global';
import monitorDataUtil from '@/utils/monitorDataUtil';
import { start } from '@/services/app';

export default class RangeChart extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      memoryRange: [],
      performanceObj: {}
    };
  }

  componentDidMount() {
    const { moduleName } = this.props;
    if (moduleName === 'PerformanceAnalysis') {
      this.loadPerformanceAnalysis(this.props);
    } else {
      this.loadRangeData(this.props);
    }
  }
  componentWillReceiveProps(nextProps) {
    const { start, end, step, moduleName } = this.props;
    const { start: newStart, end: newEnd, step: newStep } = nextProps;
    const isUpData = start !== newStart || end !== newEnd || step !== newStep;
    if (moduleName === 'PerformanceAnalysis' && isUpData) {
      this.loadPerformanceAnalysis(nextProps);
    } else if (isUpData) {
      this.loadRangeData(nextProps);
    }
  }

  loadPerformanceAnalysis = props => {
    this.setState({ loading: true });
    const { dispatch, appAlias } = props;
    dispatch({
      type: 'appControl/fetchPerformanceAnalysis',
      payload: Object.assign({}, this.handleParameter(props), {
        app_alias: appAlias
      }),
      callback: re => {
        this.setState({ loading: false });
        if (re.bean) {
          this.setState({ performanceObj: re.bean });
        }
      }
    });
  };
  loadRangeData = props => {
    this.setState({ loading: true });
    const { appDetail, dispatch } = props;
    dispatch({
      type: 'monitor/getMonitorRangeData',
      payload: Object.assign({}, this.handleParameter(props), {
        componentAlias: appDetail.service.service_alias
      }),
      callback: re => {
        this.setState({ loading: false });
        if (re.bean) {
          this.setState({ memoryRange: re.bean.result });
        }
      }
    });
  };
  handleParameter = props => {
    const { type, start, end } = props;
    return {
      query: this.getQueryByType(type),
      start: start || new Date().getTime() / 1000 - 60 * 60,
      end: end || new Date().getTime() / 1000,
      step: Math.ceil((end - start) / 100) || 15,
      teamName: globalUtil.getCurrTeamName()
    };
  };

  getQueryByType = T => {
    const { appDetail, baseInfo } = this.props;
    if (appDetail && appDetail.service) {
      const {
        service_id: serviceId,
        service_alias: serviceAlias
      } = appDetail.service;

      const isState = globalUtil.isStateComponent(
        baseInfo && baseInfo.extend_method
      );
      const parameter = isState ? serviceAlias : serviceId;
      switch (T) {
        case 'containerMem':
          return `container_memory_rss{name=~"k8s_${serviceId}.*"}/1024/1024`;
        case 'containerCpu':
          return `sum(rate(container_cpu_usage_seconds_total{name=~"k8s_${serviceId}.*"}[1m])) by (pod, namespace) / (sum(container_spec_cpu_quota{name=~"k8s_${serviceId}.*"}/container_spec_cpu_period{name=~"k8s_${serviceId}.*"}) by (pod, namespace)) * 100`;
        case 'containerNetR':
          return `rate(container_network_receive_bytes_total{name=~"k8s_POD_${parameter}.*"}[1m])/1024`;
        case 'containerNetT':
          return `rate(container_network_transmit_bytes_total{name=~"k8s_POD_${parameter}.*"}[1m])/1024`;
        case 'responseTime':
          return `ceil(avg(app_requesttime{mode="avg",service_id="${serviceId}"}))`;
        case 'throughput':
          return `sum(ceil(increase(app_request{service_id="${serviceId}",method="total"}[1m])/12))`;
        case 'numberOnline':
          return `max(app_requestclient{service_id="${serviceId}"})`;
        default:
          return ``;
      }
    }
    return ``;
  };
  getMeta = () => {
    const { type } = this.props;
    switch (type) {
      case 'containerMem':
        return { title: '内存使用量', label: '内存（MB）', unit: ' MB' };
      case 'containerCpu':
        return { title: 'CPU使用率', label: 'CPU使用率（%）', unit: '%' };
      case 'containerNetR':
        return { title: '传入流量', label: '流量（KB/s）', unit: ' KB/s' };
      case 'containerNetT':
        return { title: '传出流量', label: '流量（KB/s）', unit: ' KB/s' };
      case 'responseTime':
        return { title: '响应时间', label: '响应时间（ms）', unit: ' ms' };
      case 'throughput':
        return { title: '吞吐率', label: '吞吐率（dps）', unit: ' dps' };
      case 'numberOnline':
        return { title: '在线人数', label: '在线人数', unit: '' };
      default:
        return { title: '', label: '', unit: '' };
    }
  };
  converData = dataRange => {
    const rangedata = [];
    if (dataRange) {
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

  loadRefresh = () => {
    const { moduleName } = this.props;
    if (moduleName === 'PerformanceAnalysis') {
      this.loadPerformanceAnalysis(this.props);
    } else {
      this.loadRangeData(this.props);
    }
  };

  render() {
    const { moduleName } = this.props;
    const { memoryRange, performanceObj, loading } = this.state;
    const { title, label, unit } = this.getMeta();
    const data =
      moduleName === 'PerformanceAnalysis'
        ? monitorDataUtil.queryRangeTog2F(performanceObj, title)
        : this.converData(memoryRange);
    const cols = {
      time: {
        alias: '时间',
        tickCount: 10,
        type: 'time',
        formatter: v =>
          moment(new Date(v))
            .locale('zh-cn')
            .format('HH:mm')
      },
      value: {
        alias: { label },
        tickCount: 5
      },
      cid: {
        type: 'cat'
      }
    };
    return (
      <Fragment>
        <Spin spinning={loading}>
          <Card
            title={title}
            extra={<a onClick={() => this.loadRefresh()}>刷新</a>}
          >
            <Chart height={400} data={data} scale={cols} forceFit>
              <Legend />
              <Axis
                name="value"
                label={{
                  formatter: val => `${val}${unit}`
                }}
              />
              <Axis name="time" />
              <Tooltip
                crosshairs={{
                  type: 'y'
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
        </Spin>
      </Fragment>
    );
  }
}

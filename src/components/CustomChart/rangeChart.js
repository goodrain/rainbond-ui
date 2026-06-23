/* eslint-disable no-underscore-dangle */
/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
// eslint-disable-next-line react/no-multi-comp
import globalUtil from '@/utils/global';
import monitorDataUtil from '@/utils/monitorDataUtil';
import { Card, notification, Spin } from 'antd';
import { Axis, Chart, Geom, Legend, Tooltip } from 'bizcharts';
import { connect } from 'dva';
import * as echarts from 'echarts';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import styless from './index.less';

@connect(({ application }) => ({ curAppDetail: application.groupDetail }))
export default class RangeChart extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      memoryRange: [],
      performanceObj: {}
    };
    this.resourceChart = null;
    this.resourceChartDom = null;
  }

  componentWillMount() {
    const { moduleName } = this.props;
    if (
      moduleName === 'PerformanceAnalysis' ||
      moduleName === 'CustomMonitor'
    ) {
      this.loadPerformanceAnalysis(this.props);
    } else {
      this.loadRangeData(this.props);
    }
  }

  componentDidMount() {
    this.initResourceChart();
    this.updateResourceChart();
    window.addEventListener('resize', this.resizeResourceChart);
  }

  componentWillReceiveProps(nextProps) {
    const { start: oldStart, end, step, moduleName } = this.props;
    const {
      start: newStart,
      end: newEnd,
      step: newStep,
      isRender: newIsRender
    } = nextProps;

    const isUpData =
      oldStart !== newStart || end !== newEnd || step !== newStep;
    if (moduleName === 'CustomMonitor' && isUpData && newIsRender) {
      this.loadPerformanceAnalysis(nextProps);
    }
    if (moduleName === 'PerformanceAnalysis' && isUpData) {
      this.loadPerformanceAnalysis(nextProps);
    } else if (isUpData && moduleName !== 'CustomMonitor') {
      this.loadRangeData(nextProps);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { moduleName, type } = this.props;
    if (
      moduleName === 'ResourceMonitoring' &&
      (prevState.memoryRange !== this.state.memoryRange ||
        prevState.loading !== this.state.loading ||
        prevProps.type !== type)
    ) {
      this.updateResourceChart();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeResourceChart);
    if (this.resourceChart) {
      this.resourceChart.dispose();
      this.resourceChart = null;
    }
  }

  setResourceChartRef = node => {
    this.resourceChartDom = node;
    this.initResourceChart();
    this.updateResourceChart();
  };

  initResourceChart = () => {
    const { moduleName } = this.props;
    if (
      moduleName === 'ResourceMonitoring' &&
      this.resourceChartDom &&
      !this.resourceChart
    ) {
      this.resourceChart = echarts.init(this.resourceChartDom);
    }
  };

  resizeResourceChart = () => {
    if (this.resourceChart) {
      this.resourceChart.resize();
    }
  };

  loadPerformanceAnalysis = (props, updateTime = false) => {
    this.setState({ loading: true });
    const { dispatch, appAlias } = props;
    dispatch({
      type: 'appControl/fetchPerformanceAnalysis',
      payload: Object.assign({}, this.handleParameter(props, updateTime), {
        app_alias: appAlias
      }),
      callback: re => {
        this.setState({ loading: false });
        if (re.bean && re.bean.result && re.bean.result.length > 0) {
          this.setState({
            memoryRange: re.bean.result,
            performanceObj: re.bean
          });
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
        if (re.bean && re.bean.result && re.bean.result.length > 0) {
          this.setState({ memoryRange: re.bean.result });
        } else {
          this.setState({ memoryRange: [] });
        }
      }
    });
  };
  handleParameter = (props, updateTime = false) => {
    const { moduleName, type, start, end } = props;
    return {
      query: moduleName === 'CustomMonitor' ? type : this.getQueryByType(type),
      start: updateTime ? new Date().getTime() / 1000 - 60 * 60 : start,
      end: updateTime ? new Date().getTime() / 1000 : end,
      step: Math.ceil((end - start) / 100) || 15,
      teamName: globalUtil.getCurrTeamName(),
      disable_auto_label: true
      // disable_auto_label: !!(
      //   type === 'containerNetR' || type === 'containerNetT'
      // )
    };
  };

  getQueryByType = T => {
    const { appDetail, baseInfo } = this.props;

    if (appDetail && appDetail.service) {
      const {
        service_id: serviceId,
        service_alias: serviceAlias,
        k8s_component_name: serviceCname,
        namespace: namespace
      } = appDetail.service;
      const { k8s_app: groupName } = this.props.curAppDetail;
      const isState = globalUtil.isStateComponent(
        baseInfo && baseInfo.extend_method
      );
      const parameter = isState ? serviceAlias : serviceId;
      const isKB = appDetail.service.extend_method === 'kubeblocks_component'
      switch (T) {
        case 'containerMem':
          if (isKB) return `sum(container_memory_rss{namespace="${namespace}", pod=~"^${serviceCname}-.*", container!=""}) by (pod, namespace) / 1024 / 1024`;
          return `sum(container_memory_rss{pod=~".*${groupName}-${serviceCname}.*",container="${serviceCname}",namespace="${namespace}"}) by (pod, namespace) / 1024 / 1024`;
        case 'containerCpu':
          if (isKB) return `sum(irate(container_cpu_usage_seconds_total{namespace="${namespace}", pod=~"^${serviceCname}-.*", container!=""}[5m])) by (pod, namespace) * 1000`;
          return `sum(irate(container_cpu_usage_seconds_total{pod=~".*${groupName}-${serviceCname}.*",container="${serviceCname}",namespace="${namespace}"}[5m])) by (pod,namespace) * 1000`;
        case 'containerNetR':
          if (isKB) return `sum(rate(container_network_receive_bytes_total{namespace="${namespace}", pod=~"^${serviceCname}-.*"}[1m])) by (pod, namespace) / 1024`;
          return `sum(rate(container_network_receive_bytes_total{pod=~".*${groupName}-${serviceCname}.*",namespace="${namespace}"}[1m])) by (pod, namespace) / 1024`;
        case 'containerNetT':
          if (isKB) return `sum(rate(container_network_transmit_bytes_total{namespace="${namespace}", pod=~"^${serviceCname}-.*"}[1m])) by (pod, namespace) / 1024`;
          return `sum(rate(container_network_transmit_bytes_total{pod=~".*${groupName}-${serviceCname}.*",namespace="${namespace}"}[1m]) by (pod, namespace) / 1024`;
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
    const { type, title, moduleName } = this.props;
    if (moduleName === 'CustomMonitor') {
      return { title, label: title, unit: '' };
    }
    switch (type) {
      case 'containerMem':
        // return { title: '内存使用量', label: '内存（MB）', unit: ' MB' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.containerMem.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.containerMem.label'}),
          unit: ' MB'
      }
      case 'containerCpu':
        // return { title: 'CPU使用量', label: 'CPU使用量（m）', unit: 'm' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.containerCpu.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.containerCpu.label'}),
          unit: 'm'
      }
      case 'containerNetR':
        // return { title: '传入流量', label: '流量（KB/s）', unit: ' KB/s' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.containerNetR.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.containerNetR.label'}),
          unit: ' KB/s'
      }
      case 'containerNetT':
        // return { title: '传出流量', label: '流量（KB/s）', unit: ' KB/s' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.containerNetT.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.containerNetT.label'}),
          unit: ' KB/s'
      }
      case 'responseTime':
        // return { title: '响应时间', label: '响应时间（ms）', unit: ' ms' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.responseTime.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.responseTime.label'}),
          unit: ' ms'
      }
      case 'throughput':
        // return { title: '吞吐率', label: '吞吐率（dps）', unit: ' dps' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.throughput.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.throughput.label'}),
          unit: ' dps'
      }
      case 'numberOnline':
        // return { title: '在线人数', label: '在线人数', unit: '' };
        return { 
          title: formatMessage({id:'componentOverview.body.tab.monitor.history.numberOnline.title'}),
          label: formatMessage({id:'componentOverview.body.tab.monitor.history.numberOnline.label'}),
          unit: ''
      }
      default:
        return { title: '', label: '', unit: '' };
    }
  };
  converData = dataRange => {
    const rangedata = [];
    if (dataRange) {
      dataRange.map(item => {
        const setObj = Object.assign({}, item.metric);
        let cid = '';
        if (setObj && setObj.__name__) {
          delete setObj.__name__;
          cid = item.metric.__name__ + JSON.stringify(setObj);
        }
        if (setObj && setObj.pod) {
          cid = item.metric.pod + JSON.stringify(setObj);
        }
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

  getChartData = () => {
    const { moduleName } = this.props;
    const { memoryRange, performanceObj } = this.state;
    const { title } = this.getMeta();
    return moduleName === 'PerformanceAnalysis'
      ? monitorDataUtil.queryRangeTog2F(performanceObj, title)
      : this.converData(memoryRange);
  };

  getResourceLineOption = () => {
    const { label, unit } = this.getMeta();
    const data = this.getChartData();
    const seriesMap = {};
    data.forEach(item => {
      const seriesName = item.cid || label;
      if (!seriesMap[seriesName]) {
        seriesMap[seriesName] = [];
      }
      seriesMap[seriesName].push([item.time, item.value]);
    });
    const seriesNames = Object.keys(seriesMap);
    const chartColors = [
      globalUtil.getPublicColor(),
      globalUtil.getPublicColor('rbd-success-status'),
      globalUtil.getPublicColor('rbd-warning-status'),
      globalUtil.getPublicColor('rbd-error-status'),
      globalUtil.getPublicColor('rbd-processing-status')
    ];
    const series = seriesNames.map((name, index) => {
      const color = chartColors[index % chartColors.length];
      return {
      name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbolSize: 6,
      lineStyle: {
        width: 1.5
      },
      areaStyle: {
        opacity: 1,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: echarts.color.modifyAlpha(color, 0.18)
          },
          {
            offset: 1,
            color: echarts.color.modifyAlpha(color, 0)
          }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: seriesMap[name]
      };
    });

    return {
      color: chartColors,
      grid: {
        top: 32,
        right: 28,
        bottom: seriesNames.length > 0 ? 76 : 42,
        left: 64
      },
      legend: {
        type: 'scroll',
        bottom: 8,
        left: 24,
        right: 24,
        icon: 'circle',
        itemWidth: 6,
        itemHeight: 6,
        itemGap: 10,
        textStyle: {
          color: globalUtil.getPublicColor('rbd-content-color-secondary'),
          fontSize: 10
        },
        data: seriesNames
      },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        confine: true,
        axisPointer: {
          type: 'line'
        },
        formatter: params => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0];
          const timeText =
            first && first.value
              ? moment(first.value[0]).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')
              : '';
          const rows = list
            .map(item => {
              const value = item && item.value ? item.value[1] : '-';
              return `${item.marker}${item.seriesName}: ${value}${unit}`;
            })
            .join('<br/>');
          return `${timeText}<br/>${rows}`;
        }
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: globalUtil.getPublicColor('border-color-base')
          }
        },
        axisLabel: {
          color: globalUtil.getPublicColor('rbd-content-color-secondary'),
          hideOverlap: true,
          interval: 'auto',
          rotate: 30,
          margin: 12,
          formatter: value => moment(value).locale('zh-cn').format('HH:mm')
        }
      },
      yAxis: {
        type: 'value',
        name: label,
        nameTextStyle: {
          color: globalUtil.getPublicColor('rbd-content-color-secondary')
        },
        axisLabel: {
          color: globalUtil.getPublicColor('rbd-content-color-secondary'),
          formatter: value => `${value}${unit}`
        },
        splitLine: {
          lineStyle: {
            color: globalUtil.getPublicColor('border-color-base')
          }
        }
      },
      series,
      graphic:
        series.length === 0
          ? [
              {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: formatMessage({ id: 'teamAdd.create.null_data' }),
                  fill: globalUtil.getPublicColor('rbd-content-color-secondary'),
                  fontSize: 14
                }
              }
            ]
          : []
    };
  };

  updateResourceChart = () => {
    const { moduleName } = this.props;
    if (moduleName !== 'ResourceMonitoring' || !this.resourceChart) {
      return;
    }
    this.resourceChart.setOption(this.getResourceLineOption(), true);
  };

  loadRefresh = () => {
    const { moduleName } = this.props;
    if (
      moduleName === 'PerformanceAnalysis' ||
      moduleName === 'CustomMonitor'
    ) {
      this.loadPerformanceAnalysis(this.props, true);
    } else {
      this.loadRangeData(this.props);
    }
  };

  handleSubmit = vals => {
    const { dispatch, appAlias, CustomMonitorInfo, upData } = this.props;
    if (CustomMonitorInfo && CustomMonitorInfo.graph_id && upData) {
      dispatch({
        type: 'monitor/editServiceMonitorFigure',
        payload: {
          app_alias: appAlias,
          team_name: globalUtil.getCurrTeamName(),
          ...vals,
          graph_id: CustomMonitorInfo.graph_id,
          sequence: CustomMonitorInfo.sequence
        },
        callback: res => {
          if (res && res.status_code === 200) {
            notification.success({
              message: formatMessage({id:'notification.success.save'})
            });
            upData();
            this.onCancelCustomMonitoring();
          }
        }
      });
    }
  };

  render() {
    const {
      moduleName,
      onDelete,
      onEdit,
      CustomMonitorInfo,
      isEdit = true
    } = this.props;
    const { loading } = this.state;
    const isCustomMonitor = moduleName === 'CustomMonitor';
    const { title, label, unit } = this.getMeta();
    const data = this.getChartData();
    const cols = {
      time: {
        alias:  formatMessage({id:'componentOverview.body.tab.monitor.history.time'}),
        tickCount: 10,
        type: 'time',
        formatter: v =>
          moment(new Date(v))
            .locale('zh-cn')
            .format('HH:mm')
      },
      value: {
        alias: { label },
        tickCount: 5,
        formatter: val => {
          return val;
        }
      },
      cid: {
        type: 'cat'
      }
    };
    return (
      <Fragment>
        <Spin spinning={loading}>
          <Card
            className={isCustomMonitor && styless.rangeChart}
            title={title}
            extra={
              isEdit && (
                <div>
                  {isCustomMonitor && (
                    <span>
                      <a
                        onClick={e => {
                          e.preventDefault();
                          onEdit(e, CustomMonitorInfo);
                        }}
                        style={{ marginRight: '10px' }}
                      >
                        {/* 编辑 */}
                        <FormattedMessage id='componentOverview.body.tab.monitor.history.edit'/>
                      </a>
                      <a
                        onClick={e => {
                          e.preventDefault();
                          onDelete(CustomMonitorInfo);
                        }}
                        style={{ marginRight: '10px' }}
                      >
                        {/* 删除 */}
                        <FormattedMessage id='componentOverview.body.tab.monitor.history.delete'/>
                      </a>
                    </span>
                  )}
                  <a onClick={this.loadRefresh}>
                    {/* 刷新 */}
                    <FormattedMessage id='componentOverview.body.tab.monitor.history.refresh'/>
                  </a>
                </div>
              )
            }
          >
            {moduleName === 'ResourceMonitoring' ? (
              <div
                className={styless.resourceLineChart}
                ref={this.setResourceChartRef}
              />
            ) : (
              <Chart
                height={isCustomMonitor ? 222 : 400}
                data={data}
                scale={cols}
                forceFit
              >
                <Legend
                  useHtml
                  containerTpl={`<div class="g2-legend" style="position:absolute;top:20px;right:60px;width:100%;margin-top:-2px;">
                      <h4 class="g2-legend-title"></h4>
                      <div class=${styless.ov}><ul class="g2-legend-list" style="list-style-type:none;margin:0;padding:0;"></ul></div>
                    </div>
               `}
                  itemTpl={`
                  <li class="g2-legend-list-item item-{index} {checked}" data-color="{originColor}" data-value="{originValue}" style="cursor: pointer;font-size: 14px;">
                  <i class="g2-legend-marker" style="width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:10px;background-color: {color};"></i>
                  <span title={value} class="g2-legend-text" style="display:inline-block;max-width:94%;white-space:nowrap;font-size:80%;">{value}</span>
                  </li>`}
                  g2-legend={{
                    overflow: 'hidden',
                    marginTop: '-2px'
                  }}
                  g2-legend-list={{
                    marginTop: '-5px',
                    border: 'none',
                    height: '50px'
                  }}
                  g2-legend-list-item={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginRight: 0
                  }}
                />
                <Axis
                  name="value"
                  label={{
                    offset: 75,
                    htmlTemplate: text => {
                      const customWidth = unit ? '50px' : '75px';
                      return `<div 
                                title=${text}
                                style="width:75px;display: flex;align-items: center;"
                            >
                              <div style="width:${customWidth};text-align: right;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${text}</div>
                              <div>${unit}</div>
                            </div>`;
                    }
                  }}
                />
                <Axis name="time" />
                <Tooltip
                  shared
                  follow
                  g2-tooltip={{
                    zIndex: 99,
                    width: '80%',
                    overflow: 'hidden'
                  }}
                  crosshairs={{
                    type: 'y'
                  }}
                  containerTpl='<div class="g2-tooltip">
                                <p class="g2-tooltip-title"></p>
                              <table class="g2-tooltip-list" style="display: block;width: 400px;"></table></div>'
                  itemTpl={`<tr class="g2-tooltip-list-item" style="display: flex;justify-content: space-between;">
                    <td style="font-size:80%;color:{color};width:90%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">{name}</td>
                    <td style="margin-left: 5px;">{value}</td>
                  </tr>`}
                />
                <Geom
                  type="line"
                  position="time*value"
                  color="cid"
                  shape="smooth"
                  size={1}
                />
              </Chart>
            )}
          </Card>
        </Spin>
      </Fragment>
    );
  }
}

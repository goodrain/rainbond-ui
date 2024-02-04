import React, { Component } from 'react'
import { connect } from 'dva';
import { Table, Card, Button, Row, Col, Form, Input, DatePicker, Select } from 'antd';
import RouteDrawer from '../../../components/RouteDrawer';
import globalUtil from '../../../utils/global';
import GatewayMonitorChart from '../../../components/GatewayMonitorChart'
import styles from './index.less';

const { RangePicker } = DatePicker;
const { Option } = Select;
@Form.create()
@connect(({ user, loading, global, teamControl }) => ({
    currUser: user.currentUser,
    enterprise: global.enterprise,
    currentTeam: teamControl.currentTeam,
    addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
    editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy'],
    groups: global.groups,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        const namespace = this.props.currentTeam.namespace || ''
        this.state = {
            nameSpace: namespace,
            routeDrawer: false,
            color: [
                '#FF4500',
                '#00CED1',
                '#8A2BE2',
                '#FFD700',
                '#2E8B57',
                '#9932CC',
                '#FF6347',
                '#40E0D0',
                '#8B4513',
                '#00FFFF',
                '#8B008B',
                '#FFA500',
                '#32CD32',
                '#9370DB',
                '#FF8C00',
                '#008080',
                '#FF1493',
                '#00FA9A',
                '#800000',
                '#48D1CC',
                '#9400D3',
                '#FF4500',
                '#4169E1',
                '#FFD700',
                '#FF6347',
                '#008080',
                '#FF69B4',
                '#2F4F4F',
                '#FF8C00',
                '#20B2AA',
            ],
            qpsRate: null,
            flowRate: null,
            errorRate: null,
            qpsRateSum: 0, 
            flowRateSum: 0, 
            delayRateSum: 0, 
            errorRateSum: 0,
            appID: this.props.appID || null,
            pollingInterval: 10000,
        };
    }

    componentDidMount() {
        this.fetchQpsRate()
    }

    componentWillUnmount() {
        clearInterval(this.pollingTimer);
    }

    fetchData = () => {
        const end = Date.now() / 1000;
        const start = end - (30 * 60);
        console.log(end, start)
        this.fetchQpsRateSum(start, end);
        this.fetchFlowRateSum(start, end);
        this.fetchDelayRateSum(start, end);
        this.fetchErrorRateSum(start, end);
        this.fetchQpsRate(start, end);
        this.fetchFlowRate(start, end);
        this.fetchDelayRate(start, end);
        this.fetchErrorRate(start, end);
    };

    startPolling = () => {
        this.fetchData();
        this.pollingTimer = setInterval(this.fetchData, this.state.pollingInterval);
    };

    stopPolling = () => {
        clearInterval(this.pollingTimer);
    };

    // 修改路由label格式
    handleRouteLabel = (route) => {
        // 截取第一个 '_' 和最后一个 '_' 之间的值
        let labelRoute = route.substring(route.indexOf('_') + 1, route.lastIndexOf('_'));
        // 检测并替换 'p-p' 为 '/'
        labelRoute = labelRoute.replace('p-p', '/');
        // 检测并替换 's-s' 为 '*'
        labelRoute = labelRoute.replace('s-s', '*');

        return labelRoute.replace(/^\d+/,'')
    }

    handlePollingIntervalChange = (value) => {
        this.setState({ pollingInterval: value * 1000 }, () => {
            this.stopPolling();
            this.startPolling();
        });
    }
    handleHistoryTime = (value) => {
        this.stopPolling();
        const end = Date.now() / 1000;
        const start = end - (value * 60);
        this.fetchQpsRateSum(start, end);
        this.fetchFlowRateSum(start, end);
        this.fetchDelayRateSum(start, end);
        this.fetchErrorRateSum(start, end);
        this.fetchQpsRate(start, end);
        this.fetchFlowRate(start, end);
        this.fetchDelayRate(start, end);
        this.fetchErrorRate(start, end);
    }
    disabledDate = current => {
        // 禁止选择当前时间之后的日期
        return current && current > moment().endOf('day');
    };
    handleDateRangeChange = (dates, dateStrings) => {
        const [start, end] = dates;
        const startTime = start ? start.valueOf() / 1000 : null;
        const endTime = end ? end.valueOf() / 1000 : null
        this.stopPolling()
        this.fetchQpsRateSum(startTime, endTime);
        this.fetchFlowRateSum(startTime, endTime);
        this.fetchDelayRateSum(startTime, endTime);
        this.fetchErrorRateSum(startTime, endTime);
        this.fetchQpsRate(startTime, endTime);
        this.fetchFlowRate(startTime, endTime);
        this.fetchDelayRate(startTime, endTime);
        this.fetchErrorRate(startTime, endTime);
    }
    // 获取请求速率分组数据
    fetchQpsRate = (ago, time) => {
        const { dispatch } = this.props
        const regionName = globalUtil.getCurrRegionName()
        dispatch({
            type: 'gateWay/getQpsRate',
            payload: {
                query: 'sum(rate(apisix_http_status{route=~"rbd-system.*"}[1m])) by (route)',
                regionName,
                start: '1701829894.312',
                end: '1701833494.312',
                step: 14,
            },
            callback: res => {
                if (res && res.list) {
                    console.log(res,'res')
                }
            }
        })
    }

    // 获取总请求速率数据
    fetchQpsRateSum = (ago, time) => {
        const { dispatch } = this.props
        const { nameSpace, appID } = this.state
        const regionName = globalUtil.getCurrRegionName()
        const query = appID ? `sum(rate(apisix_http_status{route=~"${nameSpace}_${appID}.*"}[1m]))` : `sum(rate(apisix_http_status{route=~"${nameSpace}.*"}[1m]))`;
        dispatch({
            type: 'gateWay/getTeamGatewayData',
            payload: {
                query,
                regionName,
                start: ago,
                end: time,
                step: 14,
            },
            callback: res => {
                if (res && res.result.length > 0) {
                    const length = res.result[0].values.length
                    const qpsRateSum = Math.round(res.result[0].values[length - 1][1])
                    this.setState({
                        qpsRateSum
                    })
                }
            }
        })
    }
    // 获取总流量大小分组数据
    fetchFlowRateSum = (ago, time) => {
        const { dispatch } = this.props
        const { color, nameSpace, appID } = this.state
        const regionName = globalUtil.getCurrRegionName()
        const query = appID ? `sum(rate(apisix_bandwidth{route=~"${nameSpace}_${appID}.*",type="egress"}[1m]))` : `sum(rate(apisix_bandwidth{route=~"${nameSpace}.*",type="egress"}[1m]))`
        dispatch({
            type: 'gateWay/getTeamGatewayData',
            payload: {
                query,
                regionName,
                start: ago,
                end: time,
                step: 14,
            },
            callback: res => {
                if (res && res.result.length > 0) {
                    const length = res.result[0].values.length
                    const flowRateSum = Math.round(res.result[0].values[length - 1][1])
                    this.setState({
                        flowRateSum
                    })
                }
            }
        })
    }
    // 获取总延迟大小分组数据
    fetchDelayRateSum = (ago, time) => {
        const { dispatch } = this.props
        const { color, nameSpace, appID } = this.state
        const regionName = globalUtil.getCurrRegionName()
        const query = appID ? `sum(rate(apisix_http_latency_sum{type="upstream",  route=~"${nameSpace}_${appID}.*"}[30s]))/  sum(rate(apisix_http_latency_count{type="upstream",  route=~"${nameSpace}_${appID}.*"}[30s]))` 
                            : `sum(rate(apisix_http_latency_sum{type="upstream",  route=~"${nameSpace}.*"}[30s]))/  sum(rate(apisix_http_latency_count{type="upstream",  route=~"${nameSpace}.*"}[30s]))`; 
        dispatch({
            type: 'gateWay/getTeamGatewayData',
            payload: {
                query,
                regionName,
                start: ago,
                end: time,
                step: 14,
            },
            callback: res => {
                if (res && res.result.length > 0) {
                    const length = res.result[0].values.length
                    const delayRateSum = Math.round(res.result[0].values[length - 1][1])
                    this.setState({
                        delayRateSum
                    })
                }
            }
        })
    }
    // 获取总错误率分组数据
    fetchErrorRateSum = (ago, time) => {
        const { dispatch } = this.props
        const { nameSpace, appID } = this.state
        const regionName = globalUtil.getCurrRegionName()
        const query = appID ? `sum(rate(apisix_http_status{route=~"${nameSpace}_${appID}.*",code=~"4..|5.."}[1m]))` : `sum(rate(apisix_http_status{route=~"${nameSpace}.*",code=~"4..|5.."}[1m]))`;
        dispatch({
            type: 'gateWay/getTeamGatewayData',
            payload: {
                query,
                regionName,
                start: ago,
                end: time,
                step: 14,
            },
            callback: res => {
                if (res && res.result.length > 0) {
                    const length = res.result[0].values.length
                    const errorRateSum = Math.round(res.result[0].values[length - 1][1])
                    this.setState({
                        errorRateSum
                    })
                }
            }
        })
    }
    
    render() {
        const { qpsRate, flowRate, delayRate, errorRate, qpsRateSum, flowRateSum, delayRateSum, errorRateSum, pollingInterval } = this.state
        return (
            <div>
                <Card bordered={false}>
                    <div className={styles.time_change}>
                        <div>刷新：</div>
                        <div>
                        <Select
                            style={{ width: 80 }}
                            placeholder="选择刷新时间"
                            defaultValue="10"
                            onChange={this.handlePollingIntervalChange}
                        >
                            <Option value="10">10秒</Option>
                            <Option value="20">20秒</Option>
                            <Option value="30">30秒</Option>
                            <Option value="60">60秒</Option>
                        </Select>
                        </div>
                        <div style={{ marginLeft: '24px' }}>历史记录：</div>
                        <div>
                            <Select
                                style={{ width: 140 }}
                                placeholder="选择时间范围"
                                onChange={this.handleHistoryTime}
                            >
                                <Option value="5">5分钟</Option>
                                <Option value="15">15分钟</Option>
                                <Option value="30">30分钟</Option>
                                <Option value="60">1小时</Option>
                                <Option value="180">3小时</Option>
                                <Option value="360">6小时</Option>
                                <Option value="720">12小时</Option>
                                <Option value="1440">24小时</Option>
                            </Select>
                            
                        </div>
                    </div>
                    <Row type="flex">
                        <Col span={6} className={styles.box_col}>
                            <div className={styles.title_col}>
                                <p>Qps</p>

                                <div>
                                    30次/s
                                </div>
                            </div>
                        </Col>
                        <Col span={6} className={styles.box_col}>
                            <div className={styles.title_col}>
                                <p>流量速率(MB/s)</p>
                                <div>
                                    {flowRateSum != 'NaN' ? Math.round(flowRateSum / 1024) : 0}
                                </div>
                            </div>
                        </Col>
                        <Col span={6} className={styles.box_col}>
                            <div className={styles.title_col}>
                                <p>平均延迟(s)</p>
                                <div>
                                    {delayRateSum != 'NaN' ? (delayRateSum / 1000).toFixed(1) : 0}
                                </div>
                            </div>
                        </Col>
                        <Col span={6} className={styles.box_col}>
                            <div className={styles.title_col}>
                                <p>错误率</p>
                                <div>
                                    12%
                                </div>
                            </div>
                        </Col>
                    </Row>
                    {/* QPS速率 */}
                    {qpsRate &&
                        <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                            <GatewayMonitorChart
                                keys='qps'
                                swidth='100%'
                                sheight='460px'
                                chartTitle='Qps速率'
                                data={qpsRate}
                                changeTwoDecimal={this.changeTwoDecimal}
                            />
                        </Row>}
                    {/* 流量大小 */}
                    {flowRate &&
                        <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                            <GatewayMonitorChart
                                keys='flow'
                                swidth='100%'
                                sheight='460px'
                                chartTitle='流量大小'
                                data={flowRate}
                                changeTwoDecimal={this.changeTwoDecimal}
                            />
                        </Row>}
                    {/* 错误率 */}
                    {errorRate &&
                        <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                            <GatewayMonitorChart
                                keys='error_rate'
                                swidth='100%'
                                sheight='460px'
                                chartTitle='错误率'
                                data={errorRate}
                                changeTwoDecimal={this.changeTwoDecimal}
                            />
                        </Row>}
                    {/* 延迟大小 */}
                    {delayRate &&
                        <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                            <GatewayMonitorChart
                                keys='delay'
                                swidth='100%'
                                sheight='460px'
                                chartTitle='延迟大小'
                                data={delayRate}
                                changeTwoDecimal={this.changeTwoDecimal}
                            />
                        </Row>}
                </Card>
            </div>
        )
    }
}

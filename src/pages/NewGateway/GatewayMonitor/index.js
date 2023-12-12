import React, { Component } from 'react'
import { connect } from 'dva';
import { Table, Card, Button, Row, Col, Form, Input } from 'antd';
import RouteDrawer from '../../../components/RouteDrawer';
import globalUtil from '../../../utils/global';
import GatewayMonitorChart from '../../../components/GatewayMonitorChart'
import styles from './index.less';

@Form.create()
@connect(({ user, loading, global }) => ({
    currUser: user.currentUser,
    enterprise: global.enterprise,
    addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
    editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy'],
    groups: global.groups,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nameSpace: '',
            routeDrawer: false,

        };
    }

    componentDidMount() {
        this.fetchQpsRate()
    }
    fetchQpsRate = () => {
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

    render() {
        const color = [
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
            ]
        return (
            <div>
                <Card bordered={false}>

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
                                <p>流量速率</p>
                                <div>
                                    <p>进  2000kb/s</p>
                                    <p>出  1000kb/s</p>
                                </div>
                            </div>
                        </Col>
                        <Col span={6} className={styles.box_col}>
                            <div className={styles.title_col}>
                                <p>平均延迟</p>
                                <div>
                                    300ms
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
                    <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                        <GatewayMonitorChart keys='qps' swidth='100%' sheight='400px' chartTitle='Qps速率' />
                    </Row>
                    {/* 流量大小 */}
                    <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                        <GatewayMonitorChart keys='flow' swidth='100%' sheight='400px' chartTitle='流量大小' />
                    </Row>
                    {/* 错误率 */}
                    <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                        <GatewayMonitorChart keys='error_rate' swidth='100%' sheight='400px' chartTitle='错误率' />
                    </Row>
                    {/* 延迟大小 */}
                    <Row className={`${styles.margin_top_12} ${styles.margin_top_border}`}>
                        <GatewayMonitorChart keys='delay' swidth='100%' sheight='400px' chartTitle='延迟大小' />
                    </Row>
                </Card>
            </div>
        )
    }
}

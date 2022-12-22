import React, { Component } from 'react';
import {
    Card,
    Button,
    Table,
    Badge,
    Skeleton,
    Collapse,
    Row,
    Col,
    Empty,
    Descriptions,
    Modal
} from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import SVG from '../../utils/pageHeaderSvg'
import globalUtil from '../../utils/global'
import styles from "./index.less"
import Item from 'antd/lib/list/Item';
import { loadRegionConfig } from '@/services/cloud';

const { Panel } = Collapse;
@connect()

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeKey: null,
            activePod: [],

        }
    }
    getStatus = (status) => {
        switch (status) {
            case 'Pending':
                return (
                    <div style={{ color: '#1890ff' }}>
                        <Badge color="#1890ff" />
                        Pending
                    </div>
                );
                break;
            case 'Running':
                return (
                    <div style={{ color: '#52c41a' }}>
                        <Badge color="#52c41a" />
                        Running
                    </div>
                );

                break;
            case 'Succeeded':
                return (
                    <div style={{ color: '#52c41a' }}>
                        <Badge color="#52c41a" />
                        Succeeded
                    </div>
                );

                break;
            case 'Failed':
                return (
                    <div style={{ color: 'red' }}>
                        <Badge color="red" />
                        Failed
                    </div>
                );

                break;
            case 'Unkonwn':
                return (
                    <div style={{ color: '#b7b7b7' }}>
                        <Badge color="#b7b7b7" />
                        Unkonwn
                    </div>
                );

                break;
        }
    }
    getComStatus = (status) => {
        switch (status) {
            case 'Running':
                return (
                    <div style={{ color: '#52c41a' }}>
                        <Badge color="#52c41a" />
                        {formatMessage({id:'status.component.health'})}
                    </div>
                );

                break;
            default:
                return (
                    <div style={{ color: 'red' }}>
                        <Badge color="re d" />
                        {formatMessage({id:'status.component.not_health'})}
                    </div>
                );
                break;
        }
    }
    showActivePod = (val) => {
        const { pods, app } = val
        this.setState({
            showPodSwitch: true,
            activePod: pods,
            modalTitle: app

        })

    }
    handleCancel = () => {
        this.setState({
            showPodSwitch: false,
        })
    }
    render() {
        const { dashboardList, dashboardShow } = this.props
        const { activeKey, activePod, showPodSwitch, modalTitle } = this.state
        const columns = [
            {
                title: formatMessage({ id: 'enterpriseColony.mgt.cluster.server' }),
                dataIndex: 'pod_name',
                key: 'pod_name',
                width: '30%',
            },
            {
                title: formatMessage({ id: 'enterpriseColony.mgt.cluster.ip' }),
                dataIndex: 'pod_ip',
                key: 'pod_ip',
                width: '15%',
            },
            {
                title: formatMessage({ id: 'enterpriseColony.mgt.cluster.statues' }),
                dataIndex: 'status',
                key: 'status',
                width: '15%',
                render: val => {
                    return this.getStatus(val)
                }
            },
            {
                title: 'READY',
                dataIndex: 'number',
                key: 'number',
                width: '10%',
                render: (item, row) => {
                    const { all_container, run_container } = row
                    return <span className={styles.dsahboard}>{run_container}<span>/{all_container}</span></span>
                }
            },
            {
                title: formatMessage({ id: 'enterpriseColony.mgt.cluster.restart' }),
                dataIndex: 'restart_count',
                key: 'restart_count',
                width: '15%',
                render: (item) => {
                    return <span>{item}<span>次</span></span>
                }
            },
            {
                title: formatMessage({ id: 'enterpriseColony.mgt.cluster.runTime' }),
                dataIndex: 'create_time',
                key: 'create_time',
                width: '15%',
                render: item => {
                    return globalUtil.fetchdayTime(item)
                }
            },
        ]

        const column = [
            {
                dataIndex: 'app',
                key: 'app',
                className: styles.columnMoney,
                width: '25%',
                render: val => {
                    return <span className={styles.svgStyle}>{SVG.getSvg('chipSvg', 40)}<span>{val}</span></span>
                }
            },
            {
                dataIndex: 'status',
                key: 'status',
                className: styles.columnMoney,
                width: '25%',
                render: val => {
                    return this.getComStatus(val)
                }
            },
            {
                dataIndex: 'number',
                key: 'number',
                className: styles.columnMoney,
                width: '25%',
                render: (item, row) => {
                    const { all_pods, run_pods } = row
                    return <span className={styles.dsahboard}>{run_pods}<span>/{all_pods}</span></span>
                }
            },
            {
                dataIndex: 'edit',
                key: 'edit',
                className: styles.columnMoney,
                width: '25%',
                render: (item, row) => {
                    return <div style={{ color: '#4d73b1', cursor: 'pointer' }} onClick={() => this.showActivePod(row)}>
                        {formatMessage({ id: 'enterpriseColony.mgt.cluster.pod' })}
                    </div>
                }
            },
        ]

        return (
            <>
                <Card
                    style={
                        { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px', marginBottom: 40 }
                    }
                    className={styles.collapseStyle}
                >
                    
                    {dashboardShow ?
                        (
                            <div>
                                <Row>
                                    <Col span={6}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.comName' })}</Col>
                                    <Col span={6}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.statues' })}</Col>
                                    <Col span={6}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.num' })}</Col>
                                    <Col span={6}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.edit' })}</Col>

                                </Row>
                                <Table columns={column} dataSource={dashboardList} pagination={false} />
                            </div>
                        ) : (
                            <Skeleton active />
                        )
                    }
                </Card>
                <Modal
                    title={modalTitle}
                    visible={showPodSwitch}
                    width={900}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" onClick={this.handleCancel}>
                            {formatMessage({id:'popover.cancel'})}
                        </Button>,
                    ]}
                >
                    <Table columns={columns} dataSource={activePod} pagination={false} />
                </Modal>
            </>
        );
    }
}

export default Index;

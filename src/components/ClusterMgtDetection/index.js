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
import { Link } from 'umi';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import SVG from '../../utils/pageHeaderSvg'
import globalUtil from '../../utils/global'
import styles from "./index.less"
import Item from 'antd/lib/list/Item';
import { loadRegionConfig } from '@/services/cloud';

const { Panel } = Collapse;
@connect(({ user }) => ({
    user: user.currentUser
  }))

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
                        {formatMessage({ id: 'status.component.health' })}
                    </div>
                );

                break;
            case 'Completed':
                return (
                    <div style={{ color: '#52c41a' }}>
                        <Badge color="#52c41a" />
                        {formatMessage({ id: 'componentOverview.body.tab.overview.instance.completed' })}
                    </div>
                );

                break;
            default:
                return (
                    <div style={{ color: 'red' }}>
                        <Badge color="red" />
                        {formatMessage({ id: 'status.component.not_health' })}
                    </div>
                );
                break;
        }
    }
    showActivePod = (val) => {
        const { pods, name } = val
        this.setState({
            showPodSwitch: true,
            activePod: pods,
            modalTitle: name

        })

    }
    handleCancel = () => {
        this.setState({
            showPodSwitch: false,
        })
    }
    renderPodlog = (pod_name) => {
        const eid = globalUtil.getCurrEnterpriseId();
        const { region } = this.props
        
        // 判断podname
        switch (pod_name) {
            case 'rbd-app-ui':
                return <div>
                    <Link to={`/enterprise/${eid}/logs?type=consoleLog`}>
                        {formatMessage({ id: 'LogEnterprise.title' })}
                    </Link>
                </div>;
            case 'rbd-api':
            case 'rbd-gateway':
            case 'rbd-worker':
            case 'rbd-chaos':
                return <div>
                    <Link to={`/enterprise/${eid}/logs?type=clusterLog&region=${region}&action=${pod_name}`}>
                        {formatMessage({ id: 'LogEnterprise.title' })}
                    </Link>
                </div>;
            default:
                return null;
        }
    }
    render() {
        const { dashboardList, dashboardShow } = this.props
        const { activeKey, activePod, showPodSwitch, modalTitle } = this.state
        const columns = [
            {
                dataIndex: 'pod_name',
                key: 'pod_name',
                width: '17%',
            },
            {
                dataIndex: 'pod_ip',
                key: 'pod_ip',
                width: '17%',
            },
            {
                dataIndex: 'status',
                key: 'status',
                width: '17%',
                render: val => {
                    return this.getStatus(val)
                }
            },
            {
                dataIndex: 'number',
                key: 'number',
                width: '17%',
                render: (item, row) => {
                    const { all_container, run_container } = row
                    return <span className={styles.dsahboard}>{run_container}<span>/{all_container}</span></span>
                }
            },
            {
                dataIndex: 'restart_count',
                key: 'restart_count',
                width: '17%',
                render: (item) => {
                    return <span>{item}<span>次</span></span>
                }
            },
            {
                dataIndex: 'create_time',
                key: 'create_time',
                width: '17%',
                render: item => {
                    return globalUtil.fetchdayTime(item)
                }
            },
        ]

        const column = [
            {
                dataIndex: 'name',
                key: 'name',
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
                    const { name } = row                   
                    return <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {this.renderPodlog(name)}
                    <div style={{ color: globalUtil.getPublicColor(), cursor: 'pointer' }} onClick={() => this.showActivePod(row)}>
                        {formatMessage({ id: 'enterpriseColony.mgt.cluster.pod' })}
                    </div>
                    </div>
                }
            },
        ]

        return (
            <>
                <Card
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
                                <Table rowKey={(record,index) => index} columns={column} dataSource={dashboardList} pagination={false} />
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
                            {formatMessage({ id: 'popover.cancel' })}
                        </Button>,
                    ]}
                    className={styles.modalStyle}
                >
                    <Row>
                        <Col span={4}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.server' })}</Col>
                        <Col span={4}>{formatMessage({ id: 'enterpriseColony.mgt.node.ip' })}</Col>
                        <Col span={4}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.statues' })}</Col>
                        <Col span={4}>READY</Col>
                        <Col span={4}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.restart' })}</Col>
                        <Col span={4}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.runTime' })}</Col>
                    </Row>
                    <Table rowKey={(record,index) => index} columns={columns} dataSource={activePod} pagination={false} />
                </Modal>
            </>
        );
    }
}

export default Index;

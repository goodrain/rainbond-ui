import { Col, Row, Tooltip, Modal, Table, message } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import cookie from '../../../../utils/cookie';
import styles from '../../Index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import moment from 'moment';

// KubeBlocks Component 定制组件, source: ./src/pages/Component/component/Instance/index.js

@connect()
class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            language: cookie.get('language') === 'zh-CN' ? true : false,
            visible: false,
            instanceInfo: null,
        };
    }

    showModal = podName => {
        this.fetchInstanceDetails(podName);
    };

    fetchInstanceDetails = podName => {
        const { dispatch, appAlias } = this.props;
        dispatch({
            type: 'appControl/fetchInstanceDetails',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: appAlias,
                pod_name: podName
            },
            callback: res => {
                if (res) {
                    const bean = res.bean || {};
                    const isVisible = JSON.stringify(bean) === '{}';
                    this.setState({
                        instanceInfo: bean,
                        visible: !isVisible
                    });
                    message.destroy();
                    if (isVisible) {
                        message.warning(<FormattedMessage id='notification.warn.notYet' />);
                    }
                }
            }
        });
    };

    handleOk = () => {
        this.setState({ visible: false });
    };

    handleCancel = () => {
        this.setState({ visible: false });
    };

    handleMore = () => {
        const { handleMore } = this.props;
        if (handleMore) {
            handleMore(false);
        }
    };

    schedulingBox = (list, isupdate) => {
        const wd = isupdate ? 3 : 2;
        return (
            <div>
                <Row>
                    {list &&
                        list.length > 0 &&
                        list.map(item => {
                            // 适配 ClusterDetail 数据结构：{ name, status, ready } 而不是 { pod_name, pod_status }
                            const podStatus = item.status;
                            const podName = item.name;

                            // 状态映射：确保状态格式正确
                            let normalizedStatus = podStatus;
                            if (podStatus === 'Running' || podStatus === 'RUNNING') {
                                normalizedStatus = 'running';
                            } else if (podStatus === 'Pending' || podStatus === 'PENDING') {
                                normalizedStatus = 'starting';
                            } else if (podStatus === 'Failed' || podStatus === 'FAILED') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'Unknown' || podStatus === 'UNKNOWN') {
                                normalizedStatus = 'unKnow';
                            } else if (podStatus === 'Succeeded' || podStatus === 'SUCCEEDED') {
                                normalizedStatus = 'succeeded';
                            } else if (podStatus === 'Terminating' || podStatus === 'TEMINATING') {
                                normalizedStatus = 'stopping';
                            } else if (podStatus === 'Creating' || podStatus === 'CREATING') {
                                normalizedStatus = 'creating';
                            } else if (podStatus === 'CrashLoopBackOff' || podStatus === 'CRASHLOOPBACKOFF') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'ImagePullBackOff' || podStatus === 'IMAGEPULLBACKOFF') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'ErrImagePull' || podStatus === 'ERRIMAGEPULL') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'ContainerCreating' || podStatus === 'CONTAINERCREATING') {
                                normalizedStatus = 'creating';
                            } else if (podStatus === 'PodInitializing' || podStatus === 'PODINITIALIZING') {
                                normalizedStatus = 'starting';
                            } else if (podStatus === 'Completed' || podStatus === 'COMPLETED') {
                                normalizedStatus = 'succeeded';
                            } else if (podStatus === 'Error' || podStatus === 'ERROR') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'OOMKilled' || podStatus === 'OOMKILLED') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'Evicted' || podStatus === 'EVICTED') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'NodeLost' || podStatus === 'NODELOST') {
                                normalizedStatus = 'unusual';
                            } else if (podStatus === 'Preempting' || podStatus === 'PREEMPTING') {
                                normalizedStatus = 'starting';
                            } else if (podStatus === 'Scheduling' || podStatus === 'SCHEDULING') {
                                normalizedStatus = 'starting'; // 使用 starting，因为 SCHEDULING 在 fetchStateText 中映射为 starting
                            } else if (podStatus === 'NotReady' || podStatus === 'NOTREADY') {
                                normalizedStatus = 'unusual'; // 使用 unusual，因为 NOTREADY 在 fetchStateText 中映射为 unusual
                            } else if (podStatus === 'Unhealthy' || podStatus === 'UNHEALTHY') {
                                normalizedStatus = 'unusual'; // 使用 unusual，因为 UNHEALTHY 在 fetchStateText 中映射为 unusual
                            } else {
                                // 如果状态不在预定义列表中，尝试转换为小写
                                normalizedStatus = podStatus.toLowerCase();
                            }

                            return (
                                <Col
                                    xs={wd}
                                    xm={wd}
                                    md={wd}
                                    lg={wd}
                                    xl={wd}
                                    key={podName}
                                    className={styles.boxImg}
                                >
                                    <Tooltip title={globalUtil.fetchStateText(normalizedStatus)}>
                                        <div
                                            className={styles.nodeBox}
                                            style={{
                                                cursor: 'pointer',
                                                background: globalUtil.fetchStateColor(normalizedStatus)
                                            }}
                                            onClick={() => this.showModal(podName)}
                                        />
                                    </Tooltip>
                                    <p>{globalUtil.fetchStateText(normalizedStatus)}</p>
                                </Col>
                            );
                        })}
                </Row>
            </div>
        );
    };

    render() {
        // 适配 ClusterDetail 数据结构
        const { clusterDetail, loading } = this.props;
        const { language, visible, instanceInfo } = this.state;

        // 从 clusterDetail 中提取 replicas 数据，模拟 new_pods 结构
        const replicas = clusterDetail?.basic?.replicas || [];
        const newPods = replicas; // 直接使用 replicas 作为 newPods
        const oldPods = null;
        const isOldPods = oldPods && oldPods.length > 0;

        // 数据验证：确保 replicas 是数组且包含有效数据
        const validReplicas = Array.isArray(replicas) ? replicas.filter(item =>
            item && typeof item === 'object' && item.name && item.status
        ) : [];

        // 加载状态处理
        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ marginTop: '16px' }}>
                        <FormattedMessage id='kubeblocks.database.instance.loading' />
                    </div>
                </div>
            );
        }

        // 如果没有数据，显示调试信息
        if (!clusterDetail) {
            return (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ marginTop: '16px', color: '#999' }}>
                        No data
                    </div>
                </div>
            );
        }

        return (
            <div>
                <Modal
                    title={instanceInfo && instanceInfo.name}
                    width="1000px"
                    visible={visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    bodyStyle={{ height: '500px', overflow: 'auto' }}
                    footer={null}
                >
                    <div>
                        {instanceInfo && JSON.stringify(instanceInfo) !== '{}' && (
                            <div className={styles.instanceBox}>
                                <div>
                                    <ul className={language ? styles.instanceInfo : styles.en_instanceInfo}>
                                        <li>
                                            <span><FormattedMessage id='componentOverview.body.tab.overview.instance.node' /></span>
                                            <Tooltip title={instanceInfo.node_ip}>
                                                <span>{instanceInfo.node_ip || '-'}</span>
                                            </Tooltip>
                                        </li>
                                        <li>
                                            <span><FormattedMessage id='componentOverview.body.tab.overview.instance.time' /></span>
                                            <span>
                                                {moment(instanceInfo.start_time).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')}
                                            </span>
                                        </li>
                                        <li>
                                            <span><FormattedMessage id='componentOverview.body.tab.overview.instance.ip' /></span>
                                            <Tooltip title={instanceInfo.ip}>
                                                <span>{instanceInfo.ip || '-'}</span>
                                            </Tooltip>
                                        </li>
                                        <li>
                                            <span>{instanceInfo.version ? <FormattedMessage id='componentOverview.body.tab.overview.instance.edition' /> : ''}</span>
                                            <span>{instanceInfo.version || ''}</span>
                                        </li>
                                        <li>
                                            <span><FormattedMessage id='componentOverview.body.tab.overview.instance.state' /></span>
                                            <span style={{ color: globalUtil.fetchStateColor(instanceInfo.status?.type_str) }}>
                                                {globalUtil.fetchStateText(instanceInfo.status?.type_str)}
                                            </span>
                                        </li>
                                        <li>
                                            <span><FormattedMessage id='componentOverview.body.tab.overview.instance.namespace' /></span>
                                            <span>{instanceInfo.namespace || ''}</span>
                                        </li>
                                        {instanceInfo.status?.reason && (
                                            <li style={{ width: '100%' }}>
                                                <span><FormattedMessage id='componentOverview.body.tab.overview.instance.reason' /></span>
                                                <Tooltip title={instanceInfo.status.reason}>
                                                    <span>{globalUtil.fetchInstanceReasons(instanceInfo.status.reason)}</span>
                                                </Tooltip>
                                            </li>
                                        )}
                                        {instanceInfo.status?.message && (
                                            <li style={{ width: '100%' }}>
                                                <span><FormattedMessage id='componentOverview.body.tab.overview.instance.explain' /></span>
                                                <Tooltip title={instanceInfo.status.message}>
                                                    <span>{instanceInfo.status.message}</span>
                                                </Tooltip>
                                            </li>
                                        )}
                                        {instanceInfo.status?.advice && (
                                            <li style={{ width: '100%' }}>
                                                <span><FormattedMessage id='componentOverview.body.tab.overview.instance.proposal' /></span>
                                                <Tooltip title={instanceInfo.status.advice}>
                                                    <span>{globalUtil.fetchInstanceAdvice(instanceInfo.status.advice)}</span>
                                                </Tooltip>
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <div>
                                    <div className={styles.logpassed} style={{ padding: '10px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px' }}>
                                        <FormattedMessage id='componentOverview.body.tab.overview.instance.container' />
                                    </div>
                                    <div style={{ height: '15px', background: '#fff' }} />
                                    <Table
                                        rowKey={(record, index) => index}
                                        dataSource={instanceInfo.containers}
                                        columns={[
                                            {
                                                title: 'ComponentDef',
                                                dataIndex: 'component_def',
                                                key: 'component_def',
                                                width: '40%',
                                                render: val => (
                                                    <Tooltip title={val}>
                                                        <span className={styles.wordText}>{val}</span>
                                                    </Tooltip>
                                                )
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.memory' }),
                                                dataIndex: 'limit_memory',
                                                key: 'limit_memory',
                                                width: '10%',
                                                render: val => (
                                                    <Tooltip title={val || <FormattedMessage id='componentOverview.body.tab.overview.instance.Unlimited' />}>
                                                        <span className={styles.wordText}>{val || <FormattedMessage id='componentOverview.body.tab.overview.instance.Unlimited' />}</span>
                                                    </Tooltip>
                                                )
                                            },
                                            {
                                                title: 'CPU',
                                                dataIndex: 'limit_cpu',
                                                key: 'limit_cpu',
                                                width: '10%',
                                                render: val => (
                                                    <span className={styles.wordText}>{val || <FormattedMessage id='componentOverview.body.tab.overview.instance.Unlimited' />}</span>
                                                )
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.creation' }),
                                                dataIndex: 'started',
                                                key: 'started',
                                                width: '20%',
                                                render: started => moment(started).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.Staue' }),
                                                dataIndex: 'state',
                                                key: 'state',
                                                align: 'center',
                                                width: '10%',
                                                render: state => (
                                                    <span className={styles.wordText}>{(state && state) || '-'}</span>
                                                )
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.Explain' }),
                                                dataIndex: 'reason',
                                                key: 'reason',
                                                width: '10%',
                                                render: reason => (
                                                    <span className={styles.wordText}>{reason || '-'}</span>
                                                )
                                            }
                                        ]}
                                        pagination={{ hideOnSinglePage: true, pageSize: 999, current: 1 }}
                                    />
                                </div>

                                <div>
                                    <div style={{ height: '15px', background: '#fff' }} />
                                    <div className={styles.logpassed} style={{ padding: '10px', color: 'rgba(0, 0, 0, 0.85)', fontSize: '14px' }}>
                                        <FormattedMessage id='componentOverview.body.tab.overview.instance.event' />
                                    </div>
                                    <div style={{ height: '15px', background: '#fff' }} />
                                    <Table
                                        dataSource={instanceInfo.events}
                                        rowKey={(record, index) => index}
                                        columns={[
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.type' }),
                                                dataIndex: 'type',
                                                key: 'type',
                                                width: '10%',
                                                render: type => <span className={styles.wordText}>{type}</span>
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.Reason' }),
                                                dataIndex: 'reason',
                                                key: 'reason',
                                                width: '15%',
                                                render: reason => (
                                                    <Tooltip title={reason}>
                                                        <span className={styles.wordText}>{reason}</span>
                                                    </Tooltip>
                                                )
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.Time' }),
                                                dataIndex: 'age',
                                                key: 'age',
                                                width: '25%',
                                                render: age => <span className={styles.wordText}>{age}</span>
                                            },
                                            {
                                                title: formatMessage({ id: 'componentOverview.body.tab.overview.instance.Explain' }),
                                                dataIndex: 'message',
                                                key: 'message',
                                                width: '50%',
                                                render: messages => (
                                                    <Tooltip title={messages}>
                                                        <span className={styles.wordText}>{messages}</span>
                                                    </Tooltip>
                                                )
                                            }
                                        ]}
                                        pagination={{ hideOnSinglePage: true, pageSize: 999, current: 1 }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
                <Row
                    gutter={24}
                    style={{
                        margin: isOldPods ? '10px 0' : '0'
                    }}
                >
                    <Col
                        xs={24}
                        xm={24}
                        md={24}
                        lg={24}
                        xl={24}
                        style={{ background: '#fff', padding: '15px 0' }}
                    >
                        {validReplicas && validReplicas.length > 0 && this.schedulingBox(validReplicas, false)}
                    </Col>
                </Row>
                {(!validReplicas || validReplicas.length === 0) && (
                    <div
                        style={{
                            background: '#fff',
                            paddingBottom: '30px',
                            textAlign: 'center'
                        }}
                    >
                        <FormattedMessage id='componentOverview.body.tab.overview.instance.noRun' />
                    </div>
                )}
            </div>
        );
    }
}

export default Index;

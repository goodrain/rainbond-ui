import { Col, Row, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import cookie from '../../../../utils/cookie';
import styles from '../../Index.less';
import { FormattedMessage } from 'umi-plugin-locale';

// KubeBlocks Component 定制组件, source: ./src/pages/Component/component/Instance/index.js

@connect()
class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            language: cookie.get('language') === 'zh-CN' ? true : false,
        };
    }

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
                                                cursor: 'default',
                                                background: globalUtil.fetchStateColor(normalizedStatus)
                                            }}
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
        const { language } = this.state;

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
                        调试信息：clusterDetail 为空
                    </div>
                </div>
            );
        }

        return (
            <div>
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

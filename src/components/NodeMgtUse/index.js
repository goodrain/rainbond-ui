import React, { Component } from 'react';
import {
    Row,
    Col,
    Skeleton
} from 'antd';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import Echarts from './Echarts';
import styles from "./index.less";


@connect()

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    render() {
        const allocation = formatMessage({ id: 'enterpriseColony.mgt.cluster.assigned' })
        const use = formatMessage({ id: 'enterpriseColony.mgt.node.used' })
        const { nodeDetail, showInfo, titleIcon, titleText } = this.props;
        const
            {
                cap_cpu,
                req_cpu,
                cap_memory,
                req_memory,
                cap_docker_partition,
                req_docker_partition,
                cap_root_partition,
                req_root_partition
            }
                = nodeDetail;
        // CPU使用率
        const cpuUsed = cap_cpu == 0 ? 0 : ((req_cpu / cap_cpu) * 100).toFixed(2);
        // 内存使用率
        const memoryUsed = cap_memory == 0 ? 0 : ((req_memory / cap_memory) * 100).toFixed(2);
        // docker使用量
        const dockerUsed = cap_docker_partition == 0 ? 0 : ((req_docker_partition / cap_docker_partition) * 100).toFixed(2);
        // 根分区
        const rootUsed = cap_root_partition == 0 ? 0 : ((req_root_partition / cap_root_partition) * 100).toFixed(2);
        // CPU总量
        const cpuTotal = (cap_cpu && parseInt(cap_cpu)) || 0;
        // 内存总量
        const memoryTotal = (cap_memory && parseInt(cap_memory)) || 0;
        // root总量
        const rootTotal = (cap_root_partition && parseInt(cap_root_partition)) || 0;
        // docker总量
        const dockerTotal = (cap_docker_partition && parseInt(cap_docker_partition)) || 0;
        
        return (
            <>
                <div className={styles.cardContainer}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitleStyle}>
                            <span>{titleIcon}</span>
                            <span>{titleText}</span>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        {nodeDetail && Object.keys(nodeDetail).length > 0 && showInfo ?
                            <Row className={styles.resourceRow} gutter={24}>
                                <Col span={6}>
                                    <div className={styles.resourceItem}>
                                        <div className={styles.resourceTitle}>CPU</div>
                                        <div className={styles.resourceChart}>
                                            <Echarts keys={'upcpu' + `${1}`} cname={allocation} svalue={cpuUsed} uvalue={`${String(parseInt(cpuUsed))}%`} swidth='200px' sheight='150px' />
                                        </div>
                                        <div className={styles.resourceBottom}>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.allocated' })}<span>{req_cpu.toFixed(2)}</span>Core</p>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.assigned' })}<span>{cap_cpu.toFixed(2)}</span>Core</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div className={styles.resourceItem}>
                                        <div className={styles.resourceTitle}>{formatMessage({ id: 'enterpriseColony.mgt.node.memory' })}</div>
                                        <div className={styles.resourceChart}>
                                            <Echarts keys={'upcpu' + `${0}`} cname={allocation} svalue={memoryUsed} uvalue={`${String(parseInt(memoryUsed))}%`} swidth='200px' sheight='150px' />
                                        </div>
                                        <div className={styles.resourceBottom}>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.allocated' })}<span>{req_memory.toFixed(2)}</span>GB</p>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.totalMemory' })}<span>{cap_memory.toFixed(2)}</span>GB</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div className={styles.resourceItem}>
                                        <div className={styles.resourceTitle}>{formatMessage({ id: 'enterpriseColony.mgt.node.root' })}</div>
                                        <div className={styles.resourceChart}>
                                            <Echarts keys={'upcpu' + `${2}`} cname={use} svalue={rootUsed} uvalue={`${String(parseInt(rootUsed))}%`} swidth='200px' sheight='150px' />
                                        </div>
                                        <div className={styles.resourceBottom}>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.use' })}<span>{req_root_partition.toFixed(2)}</span>GB</p>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.totalRoot' })}<span>{cap_root_partition.toFixed(2)}</span>GB</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div className={styles.resourceItem}>
                                        <div className={styles.resourceTitle}>{formatMessage({ id: 'enterpriseColony.mgt.node.vessel' })}</div>
                                        <div className={styles.resourceChart}>
                                            <Echarts keys={'upcpu' + `${3}`} cname={use} svalue={dockerUsed} uvalue={`${String(parseInt(dockerUsed))}%`} swidth='200px' sheight='150px' />
                                        </div>
                                        <div className={styles.resourceBottom}>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.use' })}<span>{req_docker_partition.toFixed(2)}</span>GB</p>
                                            <p>{formatMessage({ id: 'enterpriseColony.mgt.node.totalvessel' })}<span>{cap_docker_partition.toFixed(2)}</span>GB</p>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            :
                            <Skeleton active />
                        }
                    </div>
                </div>
            </>
        );
    }
}

export default Index;
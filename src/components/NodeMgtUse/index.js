import React, { Component } from 'react';
import {
    Skeleton
} from 'antd';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import Charts from '../ClusterEcharts/Echarts'
import styles from "./index.less";


@connect()

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    render() {
        const { nodeDetail, showInfo, titleIcon, titleText } = this.props;
        const
            {
                cap_cpu,
                req_cpu,
                cap_memory,
                req_memory,
                cap_docker_partition,
                req_docker_partition
            }
                = nodeDetail;
        const cpuCapacity = Number(cap_cpu || 0);
        const cpuRequest = Number(req_cpu || 0);
        const memoryCapacity = Number(cap_memory || 0);
        const memoryRequest = Number(req_memory || 0);
        const dockerCapacity = Number(cap_docker_partition || 0);
        const dockerRequest = Number(req_docker_partition || 0);
        // CPU使用率
        const cpuUsed = cpuCapacity == 0 ? 0 : ((cpuRequest / cpuCapacity) * 100).toFixed(2);
        // 内存使用率
        const memoryUsed = memoryCapacity == 0 ? 0 : ((memoryRequest / memoryCapacity) * 100).toFixed(2);
        // docker使用量
        const dockerUsed = dockerCapacity == 0 ? 0 : ((dockerRequest / dockerCapacity) * 100).toFixed(2);
        const cpuRemaining = Math.max(cpuCapacity - cpuRequest, 0).toFixed(2) / 1;
        const memoryRemaining = Math.max(memoryCapacity - memoryRequest, 0).toFixed(2) / 1;
        const dockerRemaining = Math.max(dockerCapacity - dockerRequest, 0).toFixed(2) / 1;
        
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
                            <div className={styles.nodeMetrics}>
                                <div className={styles.nodeMetricItem}>
                                    <div className={styles.nodeMetricTitle}>CPU</div>
                                    <div className={styles.nodeMetricValue}>
                                        <span>{cpuRequest.toFixed(2) / 1}</span>
                                        <em>/{cpuCapacity.toFixed(2) / 1} Core</em>
                                    </div>
                                    <div className={styles.nodeMetricDesc}>
                                        {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                                        <span>{cpuRemaining}</span>
                                        Core
                                    </div>
                                    <div className={styles.nodeGaugeFloat}>
                                        <Charts chartType="progressGauge" keys={'nodeCpuGauge'} unit="%" svalue={cpuUsed} usedValue={cpuUsed} swidth='140px' sheight='140px' />
                                    </div>
                                </div>
                                <div className={styles.nodeMetricItem}>
                                    <div className={styles.nodeMetricTitle}>{formatMessage({ id: 'enterpriseColony.mgt.node.memory' })}</div>
                                    <div className={styles.nodeMetricValue}>
                                        <span>{memoryRequest.toFixed(2) / 1}</span>
                                        <em>/{memoryCapacity.toFixed(2) / 1} GB</em>
                                    </div>
                                    <div className={styles.nodeMetricDesc}>
                                        {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                                        <span>{memoryRemaining}</span>
                                        GB
                                    </div>
                                    <div className={styles.nodeGaugeFloat}>
                                        <Charts chartType="progressGauge" keys={'nodeMemoryGauge'} unit="%" svalue={memoryUsed} usedValue={memoryUsed} swidth='140px' sheight='140px' />
                                    </div>
                                </div>
                                <div className={styles.nodeMetricItem}>
                                    <div className={styles.nodeMetricTitle}>{formatMessage({ id: 'enterpriseColony.mgt.node.vessel' })}</div>
                                    <div className={styles.nodeMetricValue}>
                                        <span>{dockerRequest.toFixed(2) / 1}</span>
                                        <em>/{dockerCapacity.toFixed(2) / 1} GB</em>
                                    </div>
                                    <div className={styles.nodeMetricDesc}>
                                        {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                                        <span>{dockerRemaining}</span>
                                        GB
                                    </div>
                                    <div className={styles.nodeGaugeFloat}>
                                        <Charts chartType="progressGauge" keys={'nodeDockerGauge'} unit="%" svalue={dockerUsed} usedValue={dockerUsed} swidth='140px' sheight='140px' />
                                    </div>
                                </div>
                            </div>
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

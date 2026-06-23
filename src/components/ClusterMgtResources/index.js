import React, { Component } from 'react';
import { Skeleton } from 'antd';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import Charts from '../ClusterEcharts/Echarts'
import styles from './index.less'

@connect()

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    handlUnit = (num, unit) => {
        if (num) {
            let nums = num;
            let units = unit;
            if (nums >= 1024) {
                nums = num / 1024;
                units = 'GB';
            }
            return unit ? units : nums.toFixed(2) / 1;
        }
        return null;
    };
    render() {
        const { rowClusterInfo, showInfo, titleIcon, titleText } = this.props;
        const {
            all_nodes,
            node_ready,
            total_cpu,
            total_memory,
            used_cpu,
            used_memory,
            run_pod_number
        } = rowClusterInfo
        // CPU使用率
        const cpuUsed = total_cpu == 0 ? 0 : ((used_cpu / total_cpu) * 100).toFixed(2);
        // 内存使用率
        const memoryUsed = total_memory == 0 ? 0 : ((used_memory / total_memory) * 100).toFixed(2);
        // CPU总量
        const cpuTotal = (total_cpu && parseInt(total_cpu)) || 0;
        // 内存总量
        const memoryTotal = (total_memory && this.handlUnit(total_memory)) || 0;
        const cpuRemaining = total_cpu ? Math.max(Number(total_cpu) - Number(used_cpu || 0), 0).toFixed(2) / 1 : 0;
        const memoryUsedValue = used_memory ? (used_memory / 1024).toFixed(2) / 1 : 0;
        const memoryRemaining = total_memory ? Math.max((Number(total_memory) - Number(used_memory || 0)) / 1024, 0).toFixed(2) / 1 : 0;
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
                        {rowClusterInfo && Object.keys(rowClusterInfo).length > 0 && showInfo ?
                            <div className={styles.clusterMetrics}>
                                <div className={styles.clusterMetricItem}>
                                    <div className={styles.clusterMetricTitle}>{formatMessage({id:'enterpriseColony.mgt.cluster.assignedCpu'})}</div>
                                    <div className={styles.clusterMetricValue}>
                                        <span>{used_cpu || 0}</span>
                                        <em>/{cpuTotal} Core</em>
                                    </div>
                                    <div className={styles.clusterMetricDesc}>
                                        {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                                        <span>{cpuRemaining}</span>
                                        Core
                                    </div>
                                    <div className={styles.clusterGaugeFloat}>
                                        <Charts chartType="progressGauge" keys={'mgtCpuGauge'} unit="%" svalue={cpuUsed} usedValue={cpuUsed} swidth='140px' sheight='140px' />
                                    </div>
                                </div>
                                <div className={styles.clusterMetricItem}>
                                    <div className={styles.clusterMetricTitle}>{formatMessage({id:'enterpriseColony.mgt.cluster.assignedMemory'})}</div>
                                    <div className={styles.clusterMetricValue}>
                                        <span>{memoryUsedValue}</span>
                                        <em>/{memoryTotal} GB</em>
                                    </div>
                                    <div className={styles.clusterMetricDesc}>
                                        {formatMessage({ id: 'enterpriseOverview.overview.remaining' })}
                                        <span>{memoryRemaining}</span>
                                        GB
                                    </div>
                                    <div className={styles.clusterGaugeFloat}>
                                        <Charts chartType="progressGauge" keys={'mgtMemoryGauge'} unit="%" svalue={Number(memoryUsed) == 0 ? 0 : Number(memoryUsed)} usedValue={Number(memoryUsed) == 0 ? 0 : Number(memoryUsed)} swidth='140px' sheight='140px' />
                                    </div>
                                </div>
                                <div className={styles.clusterMetricItem}>
                                    <div className={styles.clusterMetricTitle}>{formatMessage({id:'enterpriseColony.mgt.cluster.node'})}</div>
                                    <div className={styles.clusterMetricValue}>
                                        <span>{node_ready == {} ? 0 : node_ready || 0}</span>
                                        <em>/{all_nodes || 0}</em>
                                    </div>
                                    <div className={styles.clusterMetricDesc}>Node</div>
                                </div>
                                <div className={styles.clusterMetricItem}>
                                    <div className={styles.clusterMetricTitle}>{formatMessage({id:'enterpriseColony.mgt.cluster.pods'})}</div>
                                    <div className={styles.clusterMetricValue}>
                                        <span>{run_pod_number || 0}</span>
                                    </div>
                                    <div className={styles.clusterMetricDesc}>Pod</div>
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

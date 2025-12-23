import React, { Component } from 'react';
import {
Button,
Table,
Row,
Col,
Skeleton
} from 'antd';
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
            total_disk,
            total_memory,
            used_cpu,
            used_disk,
            used_memory,
            services_status,
            run_pod_number
        } = rowClusterInfo
        // CPU使用率
        const cpuUsed = total_cpu == 0 ? 0 : ((used_cpu / total_cpu) * 100).toFixed(2);
        // 内存使用率
        const memoryUsed = total_memory == 0 ? 0 : ((used_memory / total_memory) * 100).toFixed(2);
        // 存储使用量
        const diskUsed = total_disk == 0 ? 0 : ((used_disk / total_disk) * 100).toFixed(2);
        // CPU总量
        const cpuTotal = (total_cpu && parseInt(total_cpu)) || 0;
        // 内存总量
        const memoryTotal = (total_memory && this.handlUnit(total_memory)) || 0;
        // 存储总量
        const diskTotal = (total_disk && parseInt(total_disk)) || 0;
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
                            <div className={styles.resourceRow}>
                                <div className={styles.resourceItem}>
                                    <div className={styles.resourceTitle}>
                                        <p>
                                            {formatMessage({id:'enterpriseColony.mgt.cluster.totalCpu'})}
                                            <span>{cpuTotal}</span>
                                            Core
                                        </p>
                                    </div>
                                    <div className={styles.resourceChart}>
                                        <Charts keys={'upcpu' + `${1}`} unit={'Core'} svalue={cpuUsed} usedValue={used_cpu} cname="CPU" swidth='200px' sheight='120px' />
                                    </div>
                                </div>
                                <div className={styles.resourceItem}>
                                    <div className={styles.resourceTitle}>
                                        <p>
                                            {formatMessage({id:'enterpriseColony.mgt.cluster.totalMemory'})}
                                            <span>{memoryTotal}</span>
                                            GB
                                        </p>
                                    </div>
                                    <div className={styles.resourceChart}>
                                        <Charts keys={'upcpu' + `${2}`} unit={'GB'} svalue={Number(memoryUsed) == 0 ? 0 : Number(memoryUsed)} usedValue={(used_memory / 1024).toFixed(2)} cname={formatMessage({id:'enterpriseColony.mgt.cluster.memory'})} swidth='200px' sheight='120px' />
                                    </div>
                                </div>
                                <div className={styles.resourceItem}>
                                    <div className={styles.resourceTitle}>
                                        <p>
                                            {formatMessage({id:'enterpriseColony.mgt.cluster.node'})}
                                        </p>
                                    </div>
                                    <div className={styles.resourceValue}>
                                        <p>
                                            {node_ready == {} ? 0 : node_ready || 0}
                                            <span>/{all_nodes || 0}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.resourceItem}>
                                    <div className={styles.resourceTitle}>
                                        <p>
                                            {formatMessage({id:'enterpriseColony.mgt.cluster.pods'})}
                                        </p>
                                    </div>
                                    <div className={styles.resourceValue}>
                                        <p>
                                            {run_pod_number || 0}
                                        </p>
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

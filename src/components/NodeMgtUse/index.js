import React, { Component } from 'react';
import { 
    Card, 
    Row, 
    Col, 
    Button, 
    Skeleton 
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
        const { nodeDetail, showInfo } = this.props;
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
                <Card
                    style={
                        { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px' ,
                          position:'relative'
                        }
                    }
                    bodyStyle={
                        { padding: '12px 0px 12px'
                        }
                    }
                >
                    {nodeDetail && Object.keys(nodeDetail).length > 0 && showInfo ?
                        <>
                            <Row className={styles.titleStyle}>
                                <Col span={6}>内存</Col>
                                <Col span={6}>CPU</Col>
                                <Col span={6}>根分区</Col>
                                <Col span={6}>容器分区</Col>
                            </Row>

                            <Row className={styles.EchartsStyle}>
                                <Col span={6}>
                                    <Echarts keys={'upcpu' + `${1}`} cname={"已分配"} svalue={memoryUsed} uvalue={`${String(parseInt(memoryUsed))}%`} swidth='250px' sheight='200px' />
                                </Col>
                                <Col span={6}>
                                    <Echarts keys={'upcpu' + `${0}`} cname={"已分配"} svalue={cpuUsed} uvalue={`${String(parseInt(cpuUsed))}%`} swidth='250px' sheight='200px' />
                                </Col>
                                <Col span={6}>
                                    <Echarts keys={'upcpu' + `${2}`} cname={"已分配"} svalue={rootUsed} uvalue={`${String(parseInt(rootUsed))}%`} swidth='250px' sheight='200px' />

                                </Col>
                                <Col span={6}>
                                    <Echarts keys={'upcpu' + `${3}`} cname={"已分配"} svalue={dockerUsed} uvalue={`${String(parseInt(dockerUsed))}%`} swidth='250px' sheight='200px' />
                                </Col>
                            </Row>

                            <Row className={styles.bottomStyle}>
                                <Col span={6}>
                                    <p>已分配：<span>{req_memory.toFixed(2)}</span>Core</p>
                                    <p>CPU总量:<span>{cap_memory.toFixed(2)}</span>Core</p>
                                </Col>
                                <Col span={6}>
                                    <p>已分配：<span>{req_cpu.toFixed(2)}</span>GB</p>
                                    <p>内存总量：<span>{cap_cpu.toFixed(2)}</span>GB</p>

                                </Col>
                                <Col span={6}>
                                    <p>已分配：<span>{req_root_partition.toFixed(2)}</span>GB</p>
                                    <p>根分区总量：<span>{cap_root_partition.toFixed(2)}</span>GB</p>
                                </Col>
                                <Col span={6}>
                                    <p>已分配：<span>{req_docker_partition.toFixed(2)}</span>GB</p>
                                    <p>容器分区总量：<span>{cap_docker_partition.toFixed(2)}</span>GB</p>
                                </Col>
                            </Row>
                        </>
                        :
                        <Skeleton active />
                    }
                </Card>

            </>
        );
    }
}

export default Index;
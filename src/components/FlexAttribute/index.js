import { Table, Card, Empty, Row, Col, Switch } from 'antd';
import React, { PureComponent, Fragment } from 'react'
import styles from "./index.less"
export default class FlexAttribute extends PureComponent {
    constructor(props){
        super(props)
    }
    render() {
        // const { value } = this.props
        console.log(value);
        const value = {
            enable: true,
            max_replicas: 100,
            min_replicas: 1,
            cpu_or_memory:[
                {ID: 0,
                    MetricTargetType: "utilization",
                    MetricTargetValue: 50,
                    MetricsName: "cpu",
                    MetricsType: "resource_metrics",
                    RuleID: "",
                    create_time: "0001-01-01T00:00:00Z"
                },
                {ID: 2,
                    MetricTargetType: "average_value",
                    MetricTargetValue: 60,
                    MetricsName: "gpu",
                    MetricsType: "resource_metrics",
                    RuleID: "",
                    create_time: "0001-01-01T00:00:00Z"
                }
            ]
        }
        return (
            <Card
                title="自动伸缩"
                style={{
                    marginBottom: 16,
                }}>
                <>
                <div className={styles.titlestyle}>
                <span>功能开关</span>
                <span>最小实例</span>
                <span>最大实例</span>
                {
                value.enable && 
                value.cpu_or_memory && 
                value.cpu_or_memory.length > 0 && 
                value.cpu_or_memory.map((item, index) =>{
                    return <span key={index}>
                    {
                    item.MetricTargetType === "utilization" ? (
                        <>
                            {item.MetricsName === "cpu" ? ('cpu使用率') : ('内存使用率')}
                        </>
                    ):(
                        <>
                            {item.MetricsName === "cpu" ? ('cpu使用量') : ('内存使用量')}
                        </>
                    )
                    }
                    </span>
                })
                }
                </div>
                <div className={styles.valuestyle}>
                {value && Object.keys(value).length > 0 ? (
                    <>
                    <span><Switch disabled={true} defaultChecked={value.enable} /></span> 
                    <span>{value.min_replicas ? value.min_replicas : "-"}</span>
                    <span>{value.max_replicas ? value.max_replicas : "-"}</span>
                    {
                    value.enable && 
                    value.cpu_or_memory && 
                    value.cpu_or_memory.length > 0 && 
                    value.cpu_or_memory.map((item, index) =>{
                        return <span key={index}>
                                {item.MetricTargetValue}
                               </span>
                    })
                    }</>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
                
                }
                </div>
                </>

            </Card>
        )
    }
}

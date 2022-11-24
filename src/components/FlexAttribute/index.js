import { Table, Card, Empty, Row, Col, Switch } from 'antd';
import React, { PureComponent, Fragment } from 'react'
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from "./index.less"
export default class FlexAttribute extends PureComponent {
    constructor(props){
        super(props)
    }
    render() {
        const { value } = this.props
        return (
            <Card
                title={formatMessage({id:'enterpriseColony.import.recognition.tabs.flex'})}
                style={{
                    marginBottom: 16,
                    borderRadius: 5,
                    boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
                    overflow:'hidden'
                }}>
                <>
                <div className={styles.titlestyle}>
                <span>{formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.switch'})}</span>
                <span>{formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.minSize'})}</span>
                <span>{formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.maxSize'})}</span>
                {
                value.enable && 
                value.cpu_or_memory && 
                value.cpu_or_memory.length > 0 && 
                value.cpu_or_memory.map((item, index) =>{
                    return <span key={index}>
                    {
                    item.MetricTargetType === "utilization" ? (
                        <>
                            {item.MetricsName === "cpu" ? (formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.cpuUsage'})) : (formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.memoryUsage'}))}
                        </>
                    ):(
                        <>
                            {item.MetricsName === "cpu" ? (formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.memoryAmount'})) : (formatMessage({id:'enterpriseColony.import.recognition.tabs.flex.memoryAmount'}))}
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
                    <span><Switch disabled={true} checked={value.enable} /></span> 
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

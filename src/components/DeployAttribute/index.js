import React, { Component } from 'react'
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { Card, Row, Col, Empty  } from 'antd';
import styles from './index.less'

export default class DeployAttribute extends Component {
    constructor(props){
        super(props)
    }
  render() {
    const {value} = this.props
    return (
        <Card
        title={formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy'})}
        className={styles.deployCard}
        style={{
            marginBottom: 16,
            borderRadius: 5,
            boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
            overflow:'hidden'
        }}>

        {value && Object.keys(value).length > 0  ? (
            <>
                <Row>
                    <h3>{formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy.type'})}<span>{value.resource_type ? value.resource_type : '-' }</span></h3>
                </Row>
                <Row>
                    <h3 className={styles.deploydatanum}>{formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy.instance'})}<span>{value.replicas ? value.replicas : 0}</span></h3>
                </Row>
                <Row>
                    <div className={styles.ram}>
                        <h3 >{formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy.memory'})}<span>{( value.memory != null && value.memory === 0 ) ? formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy.unlimited'}) : value.memory}</span>M</h3> 
                    </div>
                </Row>
                <Row>
                    <div className={styles.cpu}>
                        <h3>{formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy.cpu'})}<span>{(value.cpu != null && value.cpu === 0) ?  formatMessage({id:'enterpriseColony.import.recognition.tabs.deploy.unlimited'}) : value.cpu >= 1000 ? ((value.cpu/1000).toFixed(2)):(value.cpu) }</span>{value.cpu >= 1000 ?'c' : 'm' }</h3>
                    </div>
                </Row>
            </>
        ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) }
       
    </Card>
    )
  }
}
import React, { Component } from 'react'
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
        title="部署属性"
        className={styles.deployCard}
        style={{
            marginBottom: 16,
        }}>

        {value && Object.keys(value).length > 0  ? (
            <>
                <Row>
                    <h3>组件类型:<span>{value.resource_type ? value.resource_type : '-' }</span></h3>
                </Row>
                <Row>
                    <h3 className={styles.deploydatanum}>实例数:<span>{value.replicas ? value.replicas : 0}</span></h3>
                </Row>
                <Row>
                    <div className={styles.ram}>
                        <h3 >内存:<span>{( value.memory != null && value.memory === 0 ) ? "无限制" : value.memory}</span>MB</h3>
                    </div>
                </Row>
                <Row>
                    <div className={styles.cpu}>
                        <h3>CPU:<span>{(value.cpu != null && value.cpu === 0) ?  "无限制" : value.cpu}</span>MB</h3>
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
import React, { Component } from 'react'
import { Card, Row, Col, } from 'antd';
import styles from '../index.less'

export default class bushu extends Component {
    constructor(props){
        super(props)
    }
  render() {
    const {appvalue} = this.props
    console.log(appvalue);
    return (
        <Card
        title="部署属性"
        className={styles.cardstyle}
        style={{
            marginBottom: 16,
        }}>
        <Row>
            <h3>组件类型:<span>{appvalue.resource_type ? appvalue.resource_type : '-' }</span></h3>
        </Row>
        <Row>
            <h3 className={styles.deploydatanum}>实例数:<span>{appvalue.resource_type ? appvalue.replicas : 0}</span></h3>
        </Row>
        <Row >
            <div className={styles.ramstyle}>
                <h3 >内存:<span>{appvalue.resource_type ? appvalue.memory : 0}</span>MB</h3>
            </div>
        </Row>
        <Row>
            <div className={styles.cpustyle}>
                <h3>CPU:<span>{appvalue.resource_type ? appvalue.cpu : 0}</span>MB</h3>
            </div>
        </Row>
    </Card>
    )
  }
}
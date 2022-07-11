import { Table, Card } from 'antd';
import React, { PureComponent, Fragment } from 'react'
export default class shensuo extends PureComponent {
  render() {
    const {telescopic_management} = this.props
    const arr = []
    arr.push(telescopic_management)
    const column = [
        {
            title: '最小实例',
            dataIndex: 'min_replicas',
            key: 'min_replicas',
        },
        {
            title: '最大实例',
            dataIndex: 'max_replicas',
            key: 'max_replicas',
        },
        {
            title: 'CPU使用',
            dataIndex: 'cpu_use',
            key: 'cpu_use',
        },
        {
            title: '内存使用',
            dataIndex: 'memory_use',
            key: 'memory_use',
        },
    ]
    return (
        <Card
        title="自动伸缩"
        style={{
            marginBottom: 16,
        }}>
        <Table
            columns={column}
            dataSource={arr}
        />
    </Card>
    )
  }
}

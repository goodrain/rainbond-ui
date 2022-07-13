import { Table, Card, Empty  } from 'antd';
import React, { PureComponent, Fragment } from 'react'
export default class FlexAttribute extends PureComponent {
  render() {
    const {value} = this.props
    const arr = []
    if(value && Object.keys(value).length > 0 ){
        arr.push(value)
    }
    const column = [
        {
            title: '最小实例',
            dataIndex: 'min_replicas',
            key: 'min_replicas',
            render: (text) => {
                return  <span>
                          {text && text != 0 ?  "-":text}
                        </span>
              }
        },
        {
            title: '最大实例',
            dataIndex: 'max_replicas',
            key: 'max_replicas',
            render: (text) => {
                return  <span>
                          {text && text != 0 ?  "-":text}
                        </span>
              }
        },
        {
            title: 'CPU使用',
            dataIndex: 'cpu_use',
            key: 'cpu_use',
            render: (text) => {
                return  <span>
                          {text  ? text :"-"}
                        </span>
              }
        },
        {
            title: '内存使用',
            dataIndex: 'memory_use',
            key: 'memory_use',
            render: (text) => {
                return  <span>
                          {text ? text :"-"}
                        </span>
              }
        },
    ]
    return (
        <Card
        title="自动伸缩"
        style={{
            marginBottom: 16,
        }}>
        {arr && arr.length > 0 ?(
            <Table
            columns={column}
            dataSource={arr}
        />
        ):(
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
    </Card>
    )
  }
}

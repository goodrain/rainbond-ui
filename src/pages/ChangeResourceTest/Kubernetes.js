import React, { PureComponent } from 'react'
import { Card, Table } from 'antd';
export default class kbsziyuan extends PureComponent {
    constructor(porps){
        super(porps)
    }
  render() {
    const data = [{
        name:'xxx',
        type:'lll',
    }]
    return (
        <Card
        title="k8s资源"
        style={{
            marginBottom: 16,
        }}>
            <Table
                        columns={[
                            {
                                title: '名称',
                                dataIndex: 'name',
                                // key: 'minexample',
                            },
                            {
                                title: '类型',
                                dataIndex: 'type',
                                // key: 'maxexample',
                            },
                            {
                                title: 'yaml格式化',
                                dataIndex: 'yaml',
                                // key: 'cupuse',
                            },
                            
                        ]}
                        dataSource={data}
                        pagination={false}
            
            >
            </Table>
        </Card>
    )
  }
}

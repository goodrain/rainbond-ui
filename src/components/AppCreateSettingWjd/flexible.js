import { Button, Card, Form, Select, Switch, Table } from 'antd';
import React, { PureComponent } from 'react';
import ScrollerX from '../ScrollerX';

const EditableContext = React.createContext();

@Form.create()
class Index extends PureComponent {
    constructor(arge) {
        super(arge);
        this.state = {
            memoryData: [],
        };
    }
    handleSwitchOnChange = () => { };
    render() {
        const column = [
            {
                title: '最小实例',
                dataIndex: 'min_Moudel',
                key: '1',
                width: '25%',
            },
            {
                title: '最大实例',
                dataIndex: 'max_Moudel',
                key: '2',
                width: '25%',
            },
            {
                title: 'CPU使用',
                dataIndex: 'cpu_Use',
                key: '3',
                width: '25%',
            }, {
                title: '内存使用',
                dataIndex: 'memory_Use',
                key: '4',
                width: '25%',
            }
        ];
        // const { memoryData } = this.props;
        // console.log(this.props.flexData);
        // console.log(memoryData.flexData);
        const columns = column.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
            };
        });
        return (
            <Card title="自动伸缩" style={{ marginBottom: '24px' }}>
                <ScrollerX sm={600}>
                    <EditableContext.Provider>
                        <Table
                            style={{ width: '100%', overflowX: 'auto', textAlign: 'center' }}
                            columns={columns}
                            dataSource={this.props.flexData}
                        />
                    </EditableContext.Provider>
                </ScrollerX>
            </Card>
        );
    }
}

export default Index;

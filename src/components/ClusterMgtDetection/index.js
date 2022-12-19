import React, { Component } from 'react';
import {
    Card,
    Button,
    Table,
    Badge,
    Skeleton,
    Collapse
} from 'antd';
import { connect } from 'dva';
import SVG from '../../utils/pageHeaderSvg'
import globalUtil from '../../utils/global'
import styles from "./index.less"
import Item from 'antd/lib/list/Item';

const { Panel } = Collapse;
@connect()

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    getStatus = (status) => {
        switch (status) {
            case 'Pending':
                return (
                    <div style={{ color: '#1890ff' }}>
                        <Badge color="#1890ff" />
                        {/* 等待中 */}
                        Pending
                    </div>
                );
                break;
            case 'Running':
                return (
                    <div style={{ color: '#52c41a' }}>
                        <Badge color="#52c41a" />
                        {/* 运行中 */}
                        Running
                    </div>
                );

                break;
            case 'Succeeded':
                return (
                    <div style={{ color: '#52c41a' }}>
                        <Badge color="#52c41a" />
                        {/* 正常终止 */}
                        Succeeded
                    </div>
                );

                break;
            case 'Failed':
                return (
                    <div style={{ color: 'red' }}>
                        <Badge color="red" />
                        {/* 异常终止 */}
                        Failed
                    </div>
                );

                break;
            case 'Unkonwn':
                return (
                    <div style={{ color: '#b7b7b7' }}>
                        <Badge color="#b7b7b7" />
                        {/* 未知 */}
                        Unkonwn
                    </div>
                );

                break;
        }
    }
    callback = (key) => {
        console.log(key);
    }
    render() {
        const { dashboardList, dashboardShow } = this.props

        const columns = [
            {
                title: '平台服务',
                dataIndex: 'pod_name',
                key: 'pod_name',
                width: '40%',
                render: val => {
                    return <span className={styles.svgStyle}>{SVG.getSvg('chipSvg', 40)}<span>{val}</span></span>
                }
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: '20%',
                render: val => {
                    return this.getStatus(val)
                }
            },
            {
                title: '副本数量',
                dataIndex: 'number',
                key: 'number',
                width: '20%',
                render: (item, row) => {
                    const { all_pods, run_pods } = row
                    return <span className={styles.dsahboard}>{run_pods}<span>/{all_pods}</span></span>
                }
            },
            {
                title: '运行时间',
                dataIndex: 'create_time',
                key: 'create_time',
                width: '20%',
                render: item => {
                    return globalUtil.fetchdayTime(item)
                }
            },
        ]
        const text = `
                        A dog is a type of domesticated animal.
                        Known for its loyalty and faithfulness,
                        it can be found as a welcome guest in many households across the world.
                        `;
        const header = (
            <div className={styles.headerStyle}>
                <div>
                名字
                </div>
                <div>
                状态
                </div>
                <div>
                操作
                </div>
            </div>


        );
        return (
            <>
                <Card
                    style={
                        { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px', marginBottom: 40 }
                    }
                >
                    {/* {dashboardShow ?
                        
                        :
                        <Skeleton active />
                } */}

                    <Collapse 
                        onChange={this.callback}
                        
                         >
                        <Panel header={header} key="1" showArrow={false}>
                            <Table columns={columns} dataSource={dashboardList} />
                        </Panel>
                        <Panel header={header} key="2" showArrow={false}>
                            <Table columns={columns} dataSource={dashboardList} />
                        </Panel>
                        <Panel header={header} key="3" showArrow={false}>
                            <Table columns={columns} dataSource={dashboardList} />
                        </Panel>
                        <Panel header={header} key="4" showArrow={false}>
                            <Table columns={columns} dataSource={dashboardList} />
                        </Panel>
                        <Panel header={header} key="5" showArrow={false}>
                            <Table columns={columns} dataSource={dashboardList} />
                        </Panel>
                    </Collapse>
                </Card>
            </>
        );
    }
}

export default Index;

import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link, Switch, Route } from "dva/router";
import {
    Row,
    Col,
    Card,
    Form,
    Button,
    Icon,
    Menu,
    Dropdown,
    Tooltip,
    Table,
    Input
} from "antd";

@connect(({ user, appControl }) => ({
    currUser: user.currentUser,
    appRequest: appControl.appRequest,
    appRequestRange: appControl.appRequestRange,
    requestTime: appControl.requestTime,
    requestTimeRange: appControl.requestTimeRange,
    appDisk: appControl.appDisk,
    appMemory: appControl.appMemory,
}), null, null, { withRef: true })
export default class Index extends PureComponent {
    constructor(arg) {
        super(arg);
        this.state = {
        };
    }

    componentDidMount() {
    }


    render() {
        const { logList, hasNext, anaPlugins } = this.state;
        const { appDetail } = this.props;
        const dataSource = [{
            key: '1',
            name: '胡彦斌',
            age: 32,
            address: '西湖区湖底公园1号'
        }, {
            key: '2',
            name: '胡彦祖',
            age: 42,
            address: '西湖区湖底公园1号'
        }];

        const columns = [{
            title: '实例地址',
            dataIndex: 'name',
            key: 'name',
        }, {
            title: '健康状态',
            dataIndex: 'age',
            key: 'age',
        }, {
            title: '是否上线',
            dataIndex: 'address',
            key: 'address',
        }, {
            title: '操作',
            dataIndex: 'caozuo',
            key: 'caozuo',
            render: (data, index) => (
               <a>删除</a>
              )
        }];
        return (
            <Fragment>
                <Row gutter={24}>
                    <Card
                        title="服务实例"
                        extra=""
                    >
                        <p>注册方式： API</p>
                        <p>API地址： http://asd.com.cpm/asdasd/asdasd/asdasd/asdasd
                          <span style={{marginLeft:"100px"}}> 密钥：    <Input.Password placeholder="input password"  style={{width:"200px"}}/> </span>  <Button>重置密钥</Button>
                        </p>
                        <p>当前实例数: 3</p>
                    </Card>
                </Row>
                <Row>
                    <Table dataSource={dataSource} columns={columns} style={{background:"#fff",margin:"12px -12px 0 -12px"}} />
                </Row>
            </Fragment>
        );
    }
}

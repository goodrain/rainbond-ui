import React, { Component } from 'react'
import { connect } from 'dva';
import { Table, Card, Button, Row, Col, Form, Input } from 'antd';
import RouteDrawer from '../../../components/RouteDrawer';
import globalUtil from '../../../utils/global';
import styles from './index.less';

@Form.create()
@connect(({ user, loading, global }) => ({
    currUser: user.currentUser,
    enterprise: global.enterprise,
    addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
    editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy'],
    groups: global.groups,
  }))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nameSpace: '',
            routeDrawer: false,

        };
    }
    // handleGateWayAPI = (appID) => {
    //     const { dispatch } = this.props
    //     const teamName = globalUtil.getCurrTeamName()
    //     dispatch({
    //       type: 'gateWay/getGateWayApiList',
    //       payload: {
    //         team_name: teamName,
    //         app_id: appID || ''
    //       },
    //       callback: res => {
    //         this.setState({
    //           gateWayAPIList: res.list,
    //           loading:false
    //         })
    //       }
    //     })
    //   }
    componentDidMount() {
        
        this.fetchServiceID();
    }
      // 获取 gateway 下拉列表
  fetchServiceID = () => {
    const { dispatch } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'teamControl/fetchServiceID',
      payload: {
        team_name: teamName
      },
      callback: res => {
        console.log(res,"res");
        this.setState({
          nameSpace: res.bean.namespace || '',
        },()=>{
            this.getTableData();
        })

      }
    })
  }
    // 获取表格信息
    getTableData = (appID) => {
        const { dispatch } = this.props
        const { nameSpace } = this.state;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
          type: 'gateWay/getApiGatewayList',
          payload: {
            namespace: 'rbd-system',
            app_id: appID || ''
          },
          callback: res => {
            console.log(res,"res");
          }
        })
    }
    // 查询表格信息
    handleSearch = () => {

    }
    // 修改表格信息
    routeDrawerShow = () => {
        // addApiGateway
        // editApiGateway
        this.setState({
            routeDrawer: !this.state.routeDrawer,
        });
    }
    // 删除表格信息
    handleDelete = () => {
        // deleteApiGateway
    }
    // 启用某项配置
    handleEnable = () => {
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const columns = [
            {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
                align: 'center',
            },
            {
                title: '域名',
                dataIndex: 'domain',
                key: 'domain',
                align: 'center',
            },
            {
                title: '路径',
                dataIndex: 'path',
                key: 'path',
                align: 'center',
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
            },
            {
                title: '目标服务',
                dataIndex: 'service',
                key: 'service',
                align: 'center',
            },
            {
                title: '更新时间',
                dataIndex: 'updataTime',
                key: 'updataTime',
                align: 'center',
            },
            {
                title: '高级',
                dataIndex: 'advanced',
                key: 'advanced',
                align: 'center',
            },
            {
                title: '操作',
                dataIndex: 'address',
                key: 'address',
                align: 'center',
                render: (text, record) => (
                    <span>
                        <a onClick={() => this.handleEnable(record)}>启用</a>
                        <a onClick={() => this.routeDrawerShow(record)}>编辑</a>
                        <a onClick={() => this.handleDelete(record)}>删除</a>
                    </span>
                ),
            },
        ];
        const dataSource = [
            {
                key: '1',
                name: 'api接口1',
                domain: "qq.com",
                path: '/api/*',
                status: '已启用',
                service: 'service',
                updataTime: '2020-01-01 00:00:00',
                advanced: '高级',
            },
            {
                key: '2',
                name: 'api接口2',
                domain: "xu.com",
                path: '/api/x',
                status: '已启用',
                service: 'service',
                updataTime: '2020-01-01 00:00:00',
                advanced: '高级',
            },
            {
                key: '3',
                name: 'api接口3',
                domain: "qq.com",
                path: '/api/*',
                status: '已启用',
                service: 'service',
                updataTime: '2020-01-01 00:00:00',
                advanced: '高级',
            },
            {
                key: '4',
                name: 'api接口4',
                domain: "qq.com",
                path: '/api/*',
                status: '已启用',
                service: 'service',
                updataTime: '2020-01-01 00:00:00',
                advanced: '高级',
            },
        ];
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 5 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 12 },
            },
        };
        const { routeDrawer } = this.state;
        const { appID } = this.props;
        return (
            <div>
                <Card className={styles.SearchBox}>
                    <Form onSubmit={this.handleSubmit} layout="inline">
                        <Row justify="space-between">
                            <Col span={5}>
                                <Form.Item label="名称">
                                    {getFieldDecorator('name', {
                                    })(<Input placeholder="请输入名称" />)}
                                </Form.Item>
                            </Col>
                            <Col span={5}>
                                <Form.Item label="状态">
                                    {getFieldDecorator('name', {
                                    })(<Input placeholder="请输入状态" />)}
                                </Form.Item>
                            </Col>
                            <Col span={5}>
                                <Form.Item label="路径">
                                    {getFieldDecorator('name', {
                                    })(<Input placeholder="请输入路径" />)}
                                </Form.Item>
                            </Col>
                            <Col span={5}>
                                <Form.Item label="域名">
                                    {getFieldDecorator('name', {
                                    })(<Input placeholder="请输入域名" />)}
                                </Form.Item>
                            </Col>
                            <Col span={4} style={{marginRight:0, display:'flex',justifyContent:'end'}}>
                                <Form.Item>
                                    <Button icon='search' htmlType="submit" type="primary">
                                        查询
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <Card
                    extra={<Button icon="form" type="primary" onClick={this.routeDrawerShow}>新增路由</Button>}
                    bodyStyle={{ padding: '0' }} s
                >
                    <Table dataSource={dataSource} columns={columns} />
                </Card>
                {routeDrawer && <RouteDrawer visible={routeDrawer} onClose={this.routeDrawerShow} appID={appID} />}
            </div>
        )
    }
}

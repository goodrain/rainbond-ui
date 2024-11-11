import React, { Component } from 'react'
import { connect } from 'dva';
import { routerRedux } from 'dva/router';

import {
    Table,
    Card,
    Button,
    Row,
    Col,
    Form,
    Input,
    notification,
    Popconfirm,
    Tag,
    Tooltip
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import RouteDrawerTcp from '../RouteDrawerTcp';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';

@Form.create()
@connect(({ global }) => ({
    groups: global.groups,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            routeDrawer: false,
            dataSource: [],
            type: 'add',
            tableLoading: true,
            comList:[]
        };
    }
    componentWillMount(){
        this.fetchInfo()
    }
    componentDidMount() {
        this.getTableData();
    }
    fetchInfo = () => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'teamControl/fetchToken',
            payload: {
                team_name: teamName,
                tokenNode: 'spring'
            },
            callback: res => {
                if (res && res.status_code == 200) {
                    this.setState({
                        token: res.bean.access_key || false
                    }, () => {
                        this.fetchGetServiceAddress(res.bean.access_key)
                    })
                }
            }
        })
    }
    // 获取当前团队的命名空间
    fetchGetServiceAddress = (token) => {
        const { dispatch, appID } = this.props
        const teamName = globalUtil.getCurrTeamName()
        const regionName = globalUtil.getCurrRegionName()
        dispatch({
            type: 'gateWay/fetchGetServiceAddress',
            payload: {
                team_name: teamName,
                region_name: regionName,
                token: token,
                appID
            },
            callback: res => {
                this.setState({
                    comList: res.bean.ports,
                })
            }
        })
    }
    // 获取表格信息
    getTableData = () => {
        this.setState({ tableLoading: true })
        const { dispatch, nameSpace, appID, type } = this.props
        const teamName = globalUtil.getCurrTeamName()

        dispatch({
            type: 'gateWay/fetchGetTcpService',
            payload: {
                teamName: teamName,
                appID: appID || '',
                region_name: globalUtil.getCurrRegionName(),
            },
            callback: res => {
                if (res && res.list) {
                    this.setState({
                        dataSource: res.list,
                    })
                } else {
                    this.setState({
                        dataSource: [],
                    })
                }
                this.setState({ tableLoading: false })
            },
            handleError: () => {
                this.setState({
                    dataSource: [],
                    tableLoading: false
                })
            }
        })
    }
    // 修改表格信息
    routeDrawerShow = (obj, bool) => {
        this.setState({
            routeDrawer: !this.state.routeDrawer,
            type: bool,
            editInfo: Object.keys(obj).length > 0 ? obj : {}
        });
    }
    // 新增或修改
    addOrEditApiGateway = (values) => {
        const { dispatch, appID, type } = this.props
        const { editInfo } = this.state;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/fetchEditTcpService',
            payload: {
                teamName: teamName,
                values: values,
                appID: appID || '',
                region_name: globalUtil.getCurrRegionName(),
            },
            callback: res => {
                if(res && res.status_code === 200)
                this.setState({
                    routeDrawer: false
                }, () => {
                    notification.success({
                        message: formatMessage({ id: 'notification.success.succeeded' }),
                    });
                    this.getTableData()
                })
            },
            handleError: (err) => {
                notification.error({
                    message: formatMessage({ id: 'componentOverview.body.safety.SafetyCodeScan.Controlserror' }),
                });
            }
        })
    }
    // 删除表格信息
    handleDelete = (data) => {
        const { dispatch, nameSpace, type } = this.props
        const { appID } = this.props;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/fetchDeleteTcpService',
            payload: {
                teamName: teamName,
                name: data.name,
                appID: appID || '',
                region_name: globalUtil.getCurrRegionName(),
            },
            callback: res => {
                notification.success({
                    message: formatMessage({ id: 'notification.success.succeeded' }),
                });
                this.getTableData()
            },
            handleError: (err) => {
                notification.error({
                    message: formatMessage({ id: 'componentOverview.body.safety.SafetyCodeScan.Controlserror' }),
                });
            }
        })

    }
    handlename = ( val )=>{
        const { comList } = this.state
        const id = val.split('-')[0];
        let arr = []
        if(comList && comList.length >0 ){
            arr = (comList||[]).filter(item => item.service_name == id)
        }
        return  (arr && arr.length>0 && arr[0].component_name) || ''
    }
    jump = (val) =>{
    const { dispatch } = this.props;
    const componentsID = val.split('-')[0];
    dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${componentsID}/overview`
        )
      );
    }
    render() {
        const {
            routeDrawer,
            dataSource,
            editInfo,
            tableLoading
        } = this.state;
        const {
            appID,
            permission: {
                isCreate,
                isDelete,
                isEdit
            }
        } = this.props;
        const { getFieldDecorator } = this.props.form;
        const columns = [
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.TCP.service' }),
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                    <span>
                        {(record.name && record.port) &&
                            <Row style={{ marginBottom: 4 }} onClick={()=>this.jump(record.name)}>
                                <Tag key={index} color="green" style={{cursor:'pointer'}}>
                                    {record.name}:{record.port} <span style={{ color: '#a8a8a8' }}>({this.handlename(record.name)})</span>
                                </Tag>
                            </Row>
                        }
                    </span>
                ),
            },
            {
                title: '开放端口',
                dataIndex: 'nodePort',
                key: 'nodePort',
                render: (text, record) => (
                    <div>
                        <Tag key={index} color="blue">
                            {record.nodePort}
                        </Tag>
                    </div>
                ),
            },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.TCP.type' }),
                dataIndex: 'protocol',
                key: 'protocol',
            },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.TCP.handle' }),
                dataIndex: 'address',
                key: 'address',
                render: (text, record) => (
                    <span>
                        {isEdit &&
                            <a onClick={() => this.routeDrawerShow(record, 'edit')}>
                                {formatMessage({ id: 'teamGateway.certificate.table.edit' })}
                            </a>
                        }
                        {isDelete &&
                            <Popconfirm
                                title={formatMessage({ id: 'teamGateway.strategy.table.type.detele' })}
                                onConfirm={() => {
                                    this.handleDelete(record);
                                }}
                            >
                                <a>{formatMessage({ id: 'teamGateway.certificate.table.delete' })}</a>
                            </Popconfirm>
                        }
                    </span>
                ),
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
        return (
            <div>
                <Card
                    extra={
                        isCreate &&
                        <Button
                            icon="plus"
                            type="primary"
                            onClick={() => this.routeDrawerShow({}, 'add')}
                        >
                            {formatMessage({ id: 'teamNewGateway.NewGateway.TCP.add' })}
                        </Button>
                    }
                >
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        loading={tableLoading}
                    />
                </Card>
                {routeDrawer &&
                    <RouteDrawerTcp
                        visible={routeDrawer}
                        onClose={this.routeDrawerShow}
                        appID={appID}
                        onOk={this.addOrEditApiGateway}
                        editInfo={editInfo}
                    />
                }
            </div>
        )
    }
}

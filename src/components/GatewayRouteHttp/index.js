import React, { Component } from 'react'
import { connect } from 'dva';
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
import RouteDrawerHttp from '../RouteDrawerHttp';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import GatewayPluginsFrom from '../GatewayPluginsFrom'
import styles from './index.less';

@Form.create()
@connect()

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            routeDrawer: false,
            dataSource: [],
            type: 'add',
            tableLoading: true
        };
    }
    componentDidMount() {
        this.getTableData();
    }
    // 获取表格信息
    getTableData = () => {
        this.setState({ tableLoading: true })
        const { dispatch, nameSpace, appID, type } = this.props
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/getApiGatewayList',
            payload: {
                teamName: teamName,
                appID: appID || '',
                type: type

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
    addOrEditApiGateway = (values, app_id) => {
        const { dispatch, appID, type } = this.props
        const { editInfo } = this.state;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/handleApiGateway',
            payload: {
                teamName: teamName,
                values: values,
                appID: app_id || appID || '',
                type: type,
                service_alias: values.backends && values.backends.length > 0 ? values.backends.map(item => { return item.serviceName }).join(',') : '',
                name: values.name || '',
                port: values.backends && values.backends.length > 0 ? values.backends[0].servicePort : '',
            },
            callback: res => {
                if (res) {
                    this.setState({
                        routeDrawer: false
                    }, () => {
                        notification.success({
                            message: formatMessage({ id: 'notification.success.succeeded' }),
                        });
                        this.getTableData()
                    })
                }
            },
            handleError: (err) => {
                notification.error({
                    message: err?.data?.msg || formatMessage({ id: 'componentOverview.body.safety.SafetyCodeScan.Controlserror' }),
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
            type: 'gateWay/deleteApiGateway',
            payload: {
                teamName: teamName,
                name: data.name.split("|")[0] || '',
                appID: appID || '',
                type: type
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
    splitString = (inputString, delimiter, type = 'comid') => {
        const regex = new RegExp(`(.+?)\\${delimiter}(.+)`);
        const result = inputString.match(regex);
        if (result) {
            const part1 = result[1];
            const part2 = result[2];
            return type == 'name' ? part1 : part2;
        } else {
            return null;
        }
    }
    componentsRouter = (serviceName) => {
        const { dispatch } = this.props;
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        const ComponentID = this.splitString(serviceName, '|', 'comid');
        dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/components/${ComponentID}/overview`));
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
                title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.host' }),
                dataIndex: 'host',
                key: 'host',
                render: (text, record) => (
                    <span>
                        {record.match.hosts &&
                            record.match.hosts.length > 0 ?
                            record.match.hosts.map((item, index) => {
                                return (
                                    <Row style={{ marginBottom: 4 }} key={index}>
                                            <a href={`http://${item}`} target="_blank">
                                                {item}
                                            </a>
                                    </Row>
                                )
                            })
                            : '-'}
                    </span>
                ),
            },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.path' }),
                dataIndex: 'path',
                key: 'path',
                render: (text, record) => (
                    <span>
                        {record.match.paths &&
                            record.match.paths.length > 0 ?
                            record.match.paths.map((item, index) => {
                                return (
                                    <Row style={{ marginBottom: 4 }} key={index}>
                                        <Tag key={index} color="green">
                                            {item}
                                        </Tag>
                                    </Row>
                                )
                            })
                            : '-'}
                    </span>
                ),
            },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.service' }),
                dataIndex: 'serviceName',
                key: 'serviceName',
                render: (text, record) => (
                    <div>
                        {record.backends && record.backends.length > 0 && record.backends.map((item, index) => {
                            return (
                                <Row style={{ marginBottom: 4 }} key={index}>
                                    <Tag key={index} color="blue" onClick={() => this.componentsRouter(record.name)} style={{ cursor: 'pointer' }}>
                                        {item.serviceName}:{item.servicePort}
                                    </Tag>
                                </Row>
                            )
                        })}
                        {record.upstreams && record.upstreams.length > 0 && record.upstreams.map((item, index) => {
                            return (
                                <Row style={{ marginBottom: 4 }} key={index}>
                                    <Tag key={index}>
                                        {item.name}
                                    </Tag>
                                </Row>
                            )
                        }
                        )}
                    </div>
                ),
            },
            // {
            //     title:  formatMessage({id:'teamNewGateway.NewGateway.GatewayRoute.senior'}),
            //     dataIndex: 'advanced',
            //     key: 'advanced',
            // },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.handle' }),
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
                            {formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.add' })}
                        </Button>
                    }
                    bodyStyle={{ padding: '0' }}
                >
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        loading={tableLoading}
                        rowKey={record => record.name || record.serviceName}
                    />
                </Card>
                {routeDrawer &&
                    <RouteDrawerHttp
                        visible={routeDrawer}
                        onClose={this.routeDrawerShow}
                        appID={appID}
                        onOk={this.addOrEditApiGateway}
                        editInfo={editInfo}
                        onTabChange={this.props.onTabChange}
                    />
                }
            </div>
        )
    }
}

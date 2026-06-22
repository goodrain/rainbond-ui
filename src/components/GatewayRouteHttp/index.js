import React, { Component } from 'react'
import { connect } from 'dva';
import {
    Table,
    Button,
    Row,
    Col,
    Form,
    Input,
    notification,
    Popconfirm,
    Tag,
    Tooltip,
    Switch
} from 'antd';
import { formatMessage } from '@/utils/intl';
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
            automaticIssuanceCertList: [],
            type: 'add',
            tableLoading: true,
            pageSize: 10,
            page: 1, 
            searchKey: '', // 添加搜索关键词状态
        };
    }
    componentDidMount() {
        this.getTableData();
    }
    componentDidUpdate(prevProps) {
        if (!prevProps.existsAutomaticIssuanceCert && this.props.existsAutomaticIssuanceCert) {
            this.refreshAutomaticIssuanceCertList();
        }
    }
    // 获取表格信息
    getTableData = () => {
        this.setState({ tableLoading: true })
        const { dispatch, nameSpace, appID, type } = this.props
        const { searchKey } = this.state;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/getApiGatewayList',
            payload: {
                teamName: teamName,
                appID: appID || '',
                type: type,
                query: searchKey || ''
            },
            callback: res => {
                if (res && res.list) {
                    this.setState({
                        dataSource: res.list,
                    })
                    this.refreshAutomaticIssuanceCertList(res.list);
                } else {
                    this.setState({
                        dataSource: [],
                        automaticIssuanceCertList: [],
                    })
                }
                this.setState({ tableLoading: false })

            },
            handleError: () => {
                this.setState({
                    dataSource: [],
                    automaticIssuanceCertList: [],
                    tableLoading: false
                })
            }
        })
    }
    refreshAutomaticIssuanceCertList = (dataSource) => {
        if (!this.props.existsAutomaticIssuanceCert) {
            this.setState({ automaticIssuanceCertList: [] });
            return;
        }
        const routeList = dataSource || this.state.dataSource || [];
        const regionAppId = routeList.find(item => item && item.region_app_id)?.region_app_id;
        if (!regionAppId) {
            this.setState({ automaticIssuanceCertList: [] });
            return;
        }
        this.props.dispatch({
            type: 'gateWay/getAutomaticIssuanceCertList',
            payload: {
                teamName: globalUtil.getCurrTeamName(),
                region_app_id: regionAppId
            },
            callback: res => {
                this.setState({
                    automaticIssuanceCertList: (res && res.list) || []
                });
            },
            handleError: () => {
                this.setState({ automaticIssuanceCertList: [] });
            }
        })
    }
    getAutomaticIssuanceErrorMessage = (err) => {
        const responseData = err?.response?.data || err?.data || {};
        const rawMessage = responseData.msg || '';
        const showMessage = responseData.msg_show || rawMessage;
        if ((rawMessage && rawMessage.indexOf('domain conflict:') > -1) || (showMessage && showMessage.indexOf('证书配置冲突') > -1)) {
            return formatMessage({ id: 'teamGateway.strategy.table.autoIssue.existsCert' });
        }
        return showMessage || formatMessage({ id: 'notification.error.edit' });
    }
    isAutomaticIssuanceEnabled = (record) => {
        const hosts = record?.match?.hosts || [];
        const { automaticIssuanceCertList } = this.state;
        if (!hosts.length || !automaticIssuanceCertList.length) {
            return false;
        }
        return automaticIssuanceCertList.some(cert => {
            const domains = cert?.domains || [];
            return hosts.some(host => domains.includes(host));
        });
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
    addOrEditApiGateway = (values, app_id, serviceAliasArr) => {
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
                service_alias: serviceAliasArr && serviceAliasArr.length > 0 ? serviceAliasArr.join(',') : '',
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
        const ComponentID = serviceName.slice(-8);
        dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${ComponentID}&tab=overview`));
    }
    onPageChange = (page_num, page_size) => {
        this.setState({
            page: page_num,
            pageSize: page_size
        })
    }

    handleSearch = (value) => {
        this.setState({
            searchKey: value
        }, () => {
            this.getTableData();
        })
    }
    handleAutomaticIssuance = (record) => {
        const { dispatch } = this.props;
        if (this.isAutomaticIssuanceEnabled(record)) {
            dispatch({
                type: 'gateWay/closeAutomaticIssuance',
                payload: {
                    teamName: globalUtil.getCurrTeamName(),
                    route_name: record.name,
                    region_app_id: record.region_app_id,
                    domains: record.match.hosts,
                },
                callback: res => {
                if(res && res.status_code == 200) {
                        notification.success({
                            message: formatMessage({ id: 'notification.success.succeeded' }),
                        });
                        this.getTableData()
                    }
                },
                handleError: (err) => {
                    notification.error({
                        message: this.getAutomaticIssuanceErrorMessage(err),
                    });
                }
            })
        } else {
            dispatch({
                type: 'gateWay/openAutomaticIssuance',
                payload: {
                teamName: globalUtil.getCurrTeamName(),
                region_app_id: record.region_app_id,
                route_name: record.name,
                domains: record.match.hosts,
            },
            callback: res => {
                if(res && res.status_code == 200) {
                    notification.success({
                        message: formatMessage({ id: 'notification.success.succeeded' }),
                    });
                    this.getTableData()
                }
            },
            handleError: (err) => {
                notification.error({
                    message: this.getAutomaticIssuanceErrorMessage(err),
                });
            }
        })
    }
    }
    isStartWithStar = (arr) => {
        return arr.some(item => item.startsWith('*'));
    }
    render() {
        const {
            routeDrawer,
            dataSource,
            editInfo,
            tableLoading,
            page,
            pageSize
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
                title: formatMessage({ id: 'teamAdd.create.form.service_cname' }),
                dataIndex: 'serviceName',
                key: 'serviceName',
                render: (text, record) => (
                    <a onClick={() => this.componentsRouter(record.name)} style={{ cursor: 'pointer' }}>
                        {record.component_name || '-'}
                    </a>
                )
            },
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
        if(this.props.existsAutomaticIssuanceCert) {
            columns.push(
                {
                    title: formatMessage({ id: 'teamGateway.strategy.table.autoIssue' }),
                    dataIndex: 'enabled',
                    key: 'enabled',
                    render: (text, record) => (
                        <Tooltip title={this.isStartWithStar(record.match.hosts) ? formatMessage({ id: 'teamGateway.strategy.table.autoIssue.tips' }) : ''}>
                          <span>
                            <Switch checked={this.isAutomaticIssuanceEnabled(record)} onChange={() => this.handleAutomaticIssuance(record)} disabled={this.isStartWithStar(record.match.hosts)}/>
                          </span>
                        </Tooltip>
                    )
                }
            )
        }
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
            <div className={styles.gatewayContainer}>
                <div className={styles.gatewayHeader}>
                    <Input.Search
                        placeholder={formatMessage({ id: 'teamGateway.strategy.table.searchTips' })}
                        onSearch={this.handleSearch}
                        style={{ width: 300 }}
                        allowClear
                    />
                    {isCreate && (
                        <Button
                            data-testid="rbd-gw-route-add-btn"
                            icon="plus"
                            type="primary"
                            onClick={() => this.routeDrawerShow({}, 'add')}
                        >
                            {formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.add' })}
                        </Button>
                    )}
                </div>
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    loading={tableLoading}
                    rowKey={record => record.name || record.serviceName}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: dataSource.length,
                        onChange: this.onPageChange,
                        showQuickJumper: true,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                        onShowSizeChange: this.onPageChange,
                        hideOnSinglePage: dataSource.length <= 10
                    }}
                />
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

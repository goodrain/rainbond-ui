import React, { Component } from 'react'
import { connect } from 'dva';
import { routerRedux } from 'dva/router';

import {
    Table,
    Button,
    Row,
    Form,
    notification,
    Popconfirm,
    Tag,
    Alert
} from 'antd';
import { formatMessage } from '@/utils/intl';
import RouteDrawerTcp from '../RouteDrawerTcp';
import globalUtil from '../../utils/global';
import { protocolLabel, routeMatchesPort } from '../../utils/streamProtocols';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';

@Form.create()
@connect(({ global }) => ({
    groups: global.groups,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            routeDrawer: false,
            saving: false,
            deleting: null,
            dataSource: [],
            type: 'add',
            tableLoading: true,
            loadFailed: false,
            comList:[],
            outer_url:'',
            pageSize: 10,
            page: 1 
        };
    }
    getRequestErrorMessage = (err) => {
        return (
            err?.data?.msg_show ||
            err?.response?.data?.msg_show ||
            formatMessage({ id: 'componentOverview.body.safety.SafetyCodeScan.Controlserror' })
        );
    }
    componentWillMount(){
        this.fetchInfo()
    }
    componentDidMount() {
        this.getTableData();
    }
    fetchInfo = () => this.fetchGetServiceAddress();
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
                    outer_url: res.bean.outer_url||''
                })
            }
        })
    }
    // 获取表格信息
    getTableData = () => {
        this.setState({ tableLoading: true, loadFailed: false })
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
                        dataSource: res.list.filter(rule => routeMatchesPort(rule, this.props.componentPort)),
                    })
                } else {
                    this.setState({
                        loadFailed: true,
                    })
                }
                this.setState({ tableLoading: false })
            },
            handleError: () => {
                this.setState({
                    loadFailed: true,
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
    addOrEditApiGateway = (values, app_id, target) => {
        if (this.state.saving) return;
        this.setState({ saving: true });
        const { dispatch, appID, type } = this.props
        const { editInfo } = this.state;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/fetchEditTcpService',
            payload: {
                teamName: teamName,
                values: values,
                service_id: target.service_id,
                service_type: target.service_type,
                route_name: editInfo?.service_name || editInfo?.name || '',
                appID: app_id || appID || '',
                region_name: globalUtil.getCurrRegionName(),
            },
            callback: res => {
                this.setState({ saving: false });
                if(res && (res.status_code === 200 || res.code === 200))
                this.setState({
                    routeDrawer: false
                }, () => {
                    notification.success({
                        message: formatMessage({ id: 'notification.success.succeeded' }),
                    });
                    this.getTableData();
                    this.props.onChange && this.props.onChange();
                })
            },
            handleError: (err) => {
                this.setState({ saving: false });
                this.getTableData();
                this.props.onChange && this.props.onChange();
                notification.error({
                    message: this.getRequestErrorMessage(err),
                });
            }
        })
    }
    // 删除表格信息
    handleDelete = (data) => {
        if (this.state.deleting) return;
        this.setState({ deleting: data.service_name || data.name });
        const { dispatch, nameSpace, type } = this.props
        const { appID } = this.props;
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/fetchDeleteTcpService',
            payload: {
                teamName: teamName,
                name: data.service_name || data.name,
                service_id: data.service_id,
                port: data.container_port || data.port,
                appID: appID || '',
                region_name: globalUtil.getCurrRegionName(),
            },
            callback: res => {
                this.setState({ deleting: null });
                if (!res || (res.status_code !== 200 && res.code !== 200)) return;
                this.props.onChange && this.props.onChange();
                notification.success({
                    message: formatMessage({ id: 'notification.success.succeeded' }),
                });
                this.getTableData()
            },
            handleError: (err) => {
                this.setState({ deleting: null });
                this.getTableData();
                this.props.onChange && this.props.onChange();
                notification.error({
                    message: this.getRequestErrorMessage(err),
                });
            }
        })

    }
    findRouteComponent = (record = {}) => {
        const { comList } = this.state
        const routeName = record.name || '';
        const legacyName = routeName.split('-')[0];
        if (!comList || comList.length === 0) {
            return null;
        }
        return comList.find(item => {
            if (Number(item.port) !== Number(record.container_port || record.port)) return false;
            return (
                (record.service_id && item.service_id === record.service_id) ||
                (record.service_alias && item.service_alias === record.service_alias) ||
                (record.service_name && item.service_name === record.service_name) ||
                item.service_name === legacyName ||
                item.service_alias === legacyName
            );
        });
    }
    handlename = (record) => {
        const service = this.findRouteComponent(record);
        return (service && service.component_name) || '';
    }
    jump = (record) => {
        const { dispatch } = this.props;
        const service = this.findRouteComponent(record);
        const componentsID = (service && service.service_alias) || record.service_alias || (record.name || '').split('-')[0];
        if (!componentsID) {
            return;
        }
        dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${componentsID}&tab=overview`));
    }
    onPageChange = (page_num, page_size) => {
        this.setState({
            page: page_num,
            pageSize: page_size
        })
    }
    render() {
        const {
            routeDrawer,
            dataSource,
            editInfo,
            tableLoading,
            outer_url,
            pageSize,
            page
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
                            <Row style={{ marginBottom: 4 }} onClick={() => this.jump(record)}>
                                <Tag key={record.name} color="green" style={{cursor:'pointer'}}>
                                    {record.backend_service_name || this.findRouteComponent(record)?.service_name || record.service_alias}:{record.container_port || record.port} <span style={{ color: '#a8a8a8' }}>({this.handlename(record)})</span>
                                </Tag>
                            </Row>
                        }
                    </span>
                ),
            },
            {
                title: formatMessage({ id: 'teamGateway.strategy.table.accessAddress' }),
                dataIndex: 'address',
                key: 'address',
                render: (text, record) => (
                    <CopyToClipboard text={`${outer_url}:${record.nodePort}`}>
                        <Button type="link" title={formatMessage({ id: 'streamRules.copy' })}>
                            {outer_url}:{record.nodePort}
                        </Button>
                    </CopyToClipboard>
                ),
            },
            {
                title: formatMessage({ id: 'teamGateway.strategy.table.openPort' }),
                dataIndex: 'nodePort',
                key: 'nodePort',
                render: (text, record) => (
                    <div>
                        <Tag key={`${record.name}-nodeport`} color="blue">
                            {record.nodePort}
                        </Tag>
                    </div>
                ),
            },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.TCP.type' }),
                dataIndex: 'protocol',
                key: 'protocol',
                render: protocol => protocolLabel(protocol),
            },
            {
                title: formatMessage({ id: 'teamNewGateway.NewGateway.TCP.handle' }),
                dataIndex: 'address',
                key: 'address',
                render: (text, record) => (
                    <span>
                        {isEdit &&
                            <a style={{ marginRight: 12 }} onClick={() => this.routeDrawerShow(record, 'edit')}>
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
            <div className={styles.gatewayContainer}>
                <div className={styles.gatewayHeader}>
                    {isCreate && (
                        <Button
                            icon="plus"
                            type="primary"
                            onClick={() => this.routeDrawerShow({}, 'add')}
                        >
                            {formatMessage({ id: 'streamRules.add' })}
                        </Button>
                    )}
                </div>
                {this.state.loadFailed && <Alert type="error" showIcon message={formatMessage({ id: 'streamRules.loadFailed' })}
                    description={<Button onClick={this.getTableData}>{formatMessage({ id: 'streamRules.retry' })}</Button>} />}
                <Table
                    rowKey={record => record.service_name || record.name}
                    dataSource={dataSource}
                    columns={columns}
                    loading={tableLoading || Boolean(this.state.deleting)}
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
                    <RouteDrawerTcp
                        visible={routeDrawer}
                        onClose={this.routeDrawerShow}
                        appID={appID}
                        onOk={this.addOrEditApiGateway}
                        editInfo={editInfo}
                        componentPort={this.props.componentPort}
                        saving={this.state.saving}
                    />
                }
            </div>
        )
    }
}

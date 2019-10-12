import React, { PureComponent } from 'react';
import { Link, routerRedux } from 'dva/router';
import Search from '../Search';
import DrawerForm from '../DrawerForm';
import ParameterForm from '../ParameterForm';
import InfoConnectModal from '../InfoConnectModal';
import { connect } from 'dva';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    notification,
    Tooltip,
    Modal
} from 'antd';
import globalUtil from '../../utils/global';
import styles from './index.less'

@connect(
    ({ user, global, loading }) => ({
        currUser: user.currentUser,
        groups: global.groups,
        addHttpLoading: loading.effects["appControl/fetchCertificates"]
    }),
)
export default class HttpTable extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            drawerVisible: this.props.open ? this.props.open : false,
            information_connect: false,
            outerEnvs: [],
            dataList: [],
            loading: true,
            page_num: 1,
            page_size: 10,
            total: '',
            http_search: '',
            editInfo: "",
            highRouteInfo: '',
            whether_open_form: false,
            service_id: '',
            values: '',
            group_name: '',
            appStatusVisable: false,
            record: '',
            parameterVisible: false,
            parameterList: null
        }
    }
    componentWillMount() {
        this.load();
    }

    load = () => {
        const { dispatch } = this.props;
        const { page_num, page_size } = this.state;
        dispatch({
            type: "gateWay/queryHttpData",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                page_num,
                page_size
            },
            callback: (data) => {
                if (data) {
                    this.setState({
                        dataList: data.list,
                        loading: false,
                        total: data.bean.total
                    })
                }
            }
        })
    }
    reload() {
        this.setState({
            page_num: 1,
        }, () => {
            this.load();
        })
    }
    onPageChange = (page_num) => {
        const { http_search } = this.state;
        // this.setState({ loading: true })
        if (http_search) {
            this.setState({ page_num }, () => {
                this.handleSearch(http_search, page_num);
            })
        } else {
            this.setState({ page_num, loading: true }, () => {
                this.load();
            })
        }
    }
    handleParameterVisibleClick = (values) => {

        const { dispatch } = this.props;
        dispatch({
            type: "gateWay/getParameter",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                rule_id: values.http_rule_id,
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    let arr = []
                    if (res.bean && res.bean.value) {
                        if (res.bean.value.set_headers && res.bean.value.set_headers.length > 1) {
                            var haveUpgrade, haveConnection = false
                            res.bean.value.set_headers.map((item) => {
                                if (item.key != "Connection" && item.key != "Upgrade") {
                                    arr.push(item)
                                }
                                if (item.key == "Connection") {
                                    haveUpgrade = true
                                }
                                if (item.key == "Upgrade") {
                                    haveConnection = true
                                }
                            })
                            res.bean.value.set_headers = arr
                            res.bean.value.WebSocket = haveUpgrade && haveConnection
                            this.setState({ parameterVisible: values, parameterList: res.bean && res.bean.value })
                        } else {
                            res.bean.value.WebSocket = false
                            this.setState({ parameterVisible: values, parameterList: res.bean && res.bean.value })
                        }

                    } else {
                        this.setState({ parameterVisible: values, parameterList: null })

                    }


                }
            }
        })
    }






    handleClick = () => {
        this.setState({ drawerVisible: true })
    }
    handleClose = () => {
        this.setState({ drawerVisible: false, editInfo: '' })
    }
    handleOk = (values, group_name, obj) => {
        const { dispatch, groups } = this.props;
        const { editInfo } = this.state;
        if (obj && obj.whether_open) {
            values.whether_open = true;
        }
        if (!editInfo) {
            dispatch({
                type: "gateWay/addHttpStrategy",
                payload: {
                    values,
                    group_name,
                    team_name: globalUtil.getCurrTeamName()
                },
                callback: (data) => {
                    if (data && data.bean.is_outer_service == false) {
                        this.setState({
                            values, group_name
                        })
                        this.whether_open(values, group_name);
                        return;
                    }
                    if (data) {
                        notification.success({ message: data.msg_show || '添加成功' })
                        this.setState({
                            drawerVisible: false,
                            editInfo: ''
                        })
                        this.reload()
                    }

                }
            })
        } else {
            dispatch({
                type: "gateWay/editHttpStrategy",
                payload: {
                    values,
                    group_name: group_name || editInfo.group_name,
                    team_name: globalUtil.getCurrTeamName(),
                    http_rule_id: editInfo.http_rule_id
                },
                callback: (data) => {
                    if (data) {
                        notification.success({ message: data.msg_show || '编辑成功' })
                        this.setState({
                            drawerVisible: false,
                            editInfo: ''
                        })
                        this.load()
                    }
                }
            })
        }
    }
    whether_open = () => {
        this.setState({
            whether_open_form: true
        })
        // const { values, group_name } = this.state
        // this.handleOk(values, group_name, { whether_open: true })
    }
    resolveOk = () => {
        this.setState({
            whether_open_form: false
        }, () => {
            const { values, group_name } = this.state
            this.handleOk(values, group_name, { whether_open: true })
        })
    }


    handleOkParameter = (values) => {
        const { dispatch } = this.props;
        const arr = [{ key: "Connection", value: "\"Upgrade\"" }, { key: "Upgrade", value: "$http_upgrade" }]
        let value = {
            proxy_body_size: Number(values.proxy_body_size),
            proxy_connect_timeout: Number(values.proxy_connect_timeout),
            proxy_read_timeout: Number(values.proxy_read_timeout),
            proxy_send_timeout: Number(values.proxy_send_timeout),
            proxy_buffering: values.proxy_buffering ? "on" : "off",
            set_headers: (values.set_headers && values.WebSocket) ?
                values.set_headers.length == 1 && values.set_headers[0].key == "" ? arr :
                    values.set_headers.concat(arr) :
                values.set_headers ? values.set_headers :
                    values.WebSocket ? arr :
                        [],
        }
        dispatch({
            type: "gateWay/editParameter",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                rule_id: this.state.parameterVisible.http_rule_id,
                value
            },
            callback: (data) => {
                if (data) {
                    this.handleCloseParameter()
                }
            }
        })
    }


    /**获取连接信息 */
    handleConectInfo = (record) => {
        const { dispatch } = this.props;
        dispatch({
            type: "gateWay/fetchEnvs",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: record.service_alias
            },
            callback: (data) => {
                if (data) {
                    this.setState({
                        outerEnvs: data.list || [],
                        information_connect: true
                    })
                }
            }
        })
        this.setState({ InfoConnectModal: true })
    }

    handleParameterInfo = () => {

    }

    handleCancel = () => {
        this.setState({ information_connect: false })
    }
    handleEdit = (values) => {
        const { dispatch } = this.props;
        dispatch({
            type: "gateWay/queryDetail_http",
            payload: {
                http_rule_id: values.http_rule_id,
                team_name: globalUtil.getCurrTeamName(),
                service_alias: values.service_alias
            },
            callback: (data) => {
                if (data) {
                    this.setState({
                        editInfo: data.bean,
                        drawerVisible: true
                    })
                }
            }
        })
    }

    handleDelete = (values) => {
        const { dispatch } = this.props;
        dispatch({
            type: "gateWay/deleteHttp",
            payload: {
                container_port: values.container_port,
                domain_name: values.domain_name,
                service_id: values.service_id,
                http_rule_id: values.http_rule_id,
                team_name: globalUtil.getCurrTeamName(),
            },
            callback: (data) => {
                if (data) {
                    notification.success({ message: data ? data.msg_show : '删除成功' })
                    this.reload()
                }
            }
        })
    }
    saveForm = (form) => {
        this.form = form;
        const { editInfo } = this.state;
        if (editInfo) {
            if (editInfo.certificate_id == 0) {
                editInfo.certificate_id = undefined
            }
        }
    }
    handleSearch = (search_conditions, page) => {
        this.setState({ loading: true })
        const { dispatch } = this.props;
        this.setState({ page_num: page ? page : 1 })
        dispatch({
            type: "gateWay/searchHttp",
            payload: {
                search_conditions,
                team_name: globalUtil.getCurrTeamName(),
                page,
            },
            callback: (data) => {
                if (data) {
                    this.setState({
                        total: data.bean.total,
                        dataList: data.list,
                        http_search: search_conditions,
                        loading: false
                    })
                }
            }
        })
    }
    seeHighRoute = (values) => {
        let title = (
            <ul style={{ padding: "0", margin: "0" }}>
                <li style={{ whiteSpace: "nowrap" }}><span >请求头：</span><span>{values.domain_heander}</span></li>
                <li style={{ whiteSpace: "nowrap" }}><span>Cookie：</span><span>{values.domain_cookie}</span></li>
                <li style={{ whiteSpace: "nowrap" }}><span >Path：</span><span>{values.domain_path}</span></li>
                <li style={{ whiteSpace: "nowrap" }}><span >权重：</span><span>{values.the_weight}</span></li>
            </ul>
        )
        return (
            <Tooltip
                placement="topLeft"
                title={title}
                trigger="click"
                style={{ maxWidth: "500px" }}
            >
                <a>查看详情</a>
            </Tooltip>
        )
    }

    rowKey = (record, index) => index;

    openService = (record) => {
        this.props.dispatch({
            type: 'appControl/openPortOuter',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: record.service_alias,
                port: record.container_port
            },
            callback: () => {
                this.load()
            }
        })
    }
    justify_appStatus = (record) => {
        let winHandler = window.open('', '_blank');
        const that = this;
        this.props.dispatch({
            type: 'gateWay/query_app_status',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: record.service_alias,
            },
            callback: (data) => {
                if (data && data.bean.status == "closed") {
                    this.setState({ appStatusVisable: true, record })
                    winHandler.close()
                } else if (data && data.bean.status == "undeploy") {
                    notification.warning({ message: "当前组件属于未部署状态", duration: 5 });
                    that.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${record.service_alias}`))
                }
                else {
                    winHandler.location.href = record.domain_name;
                }
            }
        })
    }

    handleAppStatus = () => {
        const { record } = this.state
        this.setState({ loading: true })
        this.props.dispatch({
            type: 'gateWay/startApp',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: record.service_alias,
            },
            callback: (data) => {
                if (data) {
                    notification.success({ message: "启动应用成功", duration: 5 })
                    this.setState({ loading: false, appStatusVisable: false }, () => {
                        this.load();
                    })
                }
            }
        })
    }
    handleAppStatus_closed = () => {
        this.setState({
            appStatusVisable: false
        })
    }

    handleCloseParameter = () => {
        this.setState({
            parameterVisible: false,
            parameterList: null
        })
    }
    render() {
        const { dataList, loading, drawerVisible, parameterVisible, information_connect, outerEnvs, total, page_num, page_size, whether_open_form, appStatusVisable, parameterList } = this.state;
        const { addHttpLoading } = this.props;
        const columns = [{
            title: '域名',
            dataIndex: 'domain_name',
            key: 'domain_name',
            align: "left",
            width: "18%",
            render: (text, record) => {
                return (
                    record.is_outer_service == 1 ? <a onClick={this.justify_appStatus.bind(this, record)}>{text}</a> : <a href={text} disabled target="blank">{text}</a>
                )
            }
        }, {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            align: "center",
            width: "8%",
            render: (text, record, index) => {
                return (text == "0" ? (<span>默认</span>) : (<span>自定义</span>))
            }
        }, {
            title: '高级路由',
            dataIndex: 'is_senior',
            key: 'is_senior',
            align: "center",
            width: "15%",
            render: (text, record) => {
                return text == "0" ? <span>无</span> : this.seeHighRoute(record)
            }
        }, {
            title: '证书',
            dataIndex: 'certificate_alias',
            key: 'certificate_alias',
            align: "center",
            width: "8%",
            render: (text, record, index) => {
                return (text ? (<span>{text}</span>) : (<span>无</span>))
            }
        }, {
            title: '应用',
            dataIndex: 'group_name',
            key: 'group_name',
            align: "center",
            width: "10%",
            render: (text, record) => {
                return (record.is_outer_service == 0 ? <a href="" disabled>{text}</a> : <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${record.group_id}/`}>{text}</Link>)

            }
        }, {
            title: '组件(端口)',
            dataIndex: 'service_cname',
            key: 'service_cname',
            align: "center",
            width: "15%",
            render: (text, record) => {
                return (record.is_outer_service == 0 ? <a href="" disabled>{text}</a> : <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${record.service_alias}/port`}>{text}({record.container_port})</Link>)
            }
        }, {
            title: '操作',
            dataIndex: 'action',
            key: 'action',
            align: "center",
            width: "26%",
            render: (data, record, index) => {
                return (
                    record.is_outer_service == 1 ? <div style={{ display: "flex", justifyContent: "space-around" }}>
                        <a onClick={this.handleParameterVisibleClick.bind(this, record)}>参数配置</a>
                        {/* <a onClick={this.handleConectInfo.bind(this, record)}>连接信息</a> */}
                        <a onClick={this.handleEdit.bind(this, record)}>编辑</a>
                        <a onClick={this.handleDelete.bind(this, record)}>删除</a>
                    </div> : <Tooltip placement="topLeft" title="请开启对外服务方可操作" arrowPointAtCenter>
                            <div style={{ display: "flex", justifyContent: "space-around" }}>
                                <a onClick={this.handleDelete.bind(this, record)}>删除</a>
                                <a onClick={this.openService.bind(this, record)}>开启</a>
                            </div>
                        </Tooltip>
                )
            }
        }];
        return (
            <div className={styles.tdPadding}>
                <Row style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: "20px" }}>
                    <Search onSearch={this.handleSearch} />
                    <Button type="primary" icon="plus" style={{ position: "absolute", right: "0" }} onClick={this.handleClick} loading={addHttpLoading}>
                        添加策略
                    </Button>
                </Row>
                <Card
                    bodyStyle={{ padding: "0" }}
                >

                    <Table
                        dataSource={dataList}
                        columns={columns}
                        loading={loading}
                        rowKey={this.rowKey}
                        pagination={{ total: total, page_num: page_num, pageSize: page_size, onChange: this.onPageChange, current: page_num, }}
                    />
                </Card>
                {drawerVisible && <DrawerForm
                    groups={this.props.groups}
                    visible={drawerVisible}
                    onClose={this.handleClose}
                    onOk={this.handleOk}
                    ref={this.saveForm}
                    editInfo={this.state.editInfo}
                />}
                {parameterVisible &&
                    <ParameterForm onOk={this.handleOkParameter} onClose={this.handleCloseParameter} visible={parameterVisible} editInfo={parameterList} />
                }
                {information_connect && <InfoConnectModal visible={information_connect} dataSource={outerEnvs} onCancel={this.handleCancel} />}
                {whether_open_form && <Modal
                    title="确认要添加吗？"
                    visible={this.state.whether_open_form}
                    onOk={this.handleOk}
                    footer={[<Button type="primary" size="small" onClick={this.resolveOk}>确定</Button>]}
                    zIndex={9999}
                >
                    <p>您选择的应用未开启外部访问，是否自动打开并添加此访问策略？</p>
                </Modal>}
                {appStatusVisable && <Modal
                    title="友情提示"
                    visible={appStatusVisable}
                    onOk={this.handleAppStatus}
                    onCancel={this.handleAppStatus_closed}
                >
                    <p>当前应用处于关闭状态，启动后方可访问，是否启动应用？</p>
                </Modal>}
            </div>
        )
    }
}

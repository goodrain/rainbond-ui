import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { Link } from "dva/router";
import { Row, Col, Card, List,Modal, Form, Input, Select,Button, Badge, Pagination, Icon, Tooltip, Table, notification } from "antd";

import { MiniArea, ChartCard } from '../../components/Charts';

import NumberInfo from '../../components/NumberInfo';
import numeral from 'numeral';
import IndexTable from "../../components/IndexTable";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import EditableLinkGroup from "../../components/EditableLinkGroup";
import ScrollerX from "../../components/ScrollerX";
import EditGroupName from "../../components/AddOrEditGroup"
import styles from "./index.less";
import globalUtil from "../../utils/global";
import userUtil from "../../utils/user";
import sourceUtil from "../../utils/source-unit";
import { link } from "fs";

const FormItem = Form.Item;
const Option = Select.Option;

@connect(({
    user, index, loading, global,
}) => ({
    currUser: user.currentUser,
    index,
    events: index.events,
    pagination: index.pagination,
    rainbondInfo: global.rainbondInfo,
    projectLoading: loading.effects["project/fetchNotice"],
    activitiesLoading: loading.effects["activities/fetchList"],
    loading,
}))
@Form.create()
export default class Index extends PureComponent {
    constructor(arg) {
        super(arg);
        this.state = {
            disk: {},
            memory: {},
            companyInfo: {},
            addApplication: false,
            teamList: [],
            page: 1,
            page_size: 5,
            total: 0,
            domainList: [],
            domainPage: 1,
            domainPage_size: 5,
            domainTotal: 0,
            serviceList: [],
            servicePage: 1,
            servicePage_size: 5,
            serviceTotal: 0,
            num:""
        };
    }
    componentDidMount() {
        this.getTeam();
        this.getDomainName();
        // this.getDomainTime();
        this.getDomain();
        this.getService();
        this.loadOverview();
        this.loadApps();
        this.loadEvents();
        this.timer = setInterval(() => {
            this.loadApps();
            this.loadOverview();
        }, 10000);

        if (this.isPublicRegion()) {
            this.getCompanyInfo();
            this.getRegionResource();
        }
    }


    getTeam = () => {
        const { page, page_size } = this.state;

        this.props.dispatch({
            type: "global/getTeamList",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                region: globalUtil.getCurrRegionName(),
                page,
                page_size,
            },
            callback: (res) => {
                if (res._code == 200) {
                    this.setState({
                        teamList: res.list,
                        total: res.bean && res.bean.total
                    })
                }
            },
        });
    }

    onPageChange = (page) => {
        this.setState({ page }, () => {
            this.getTeam();
        });
    };

    getDomainTime = () => {
        const {
            currUser,
        } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        const team = userUtil.getTeamByTeamName(currUser, team_name);
        this.props.dispatch({
            type: "global/getDomainTime",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                region_name: globalUtil.getCurrRegionName(),
                // serviceId: this.props.appDetail&&this.props.appDetail.service.service_id,
                tenant_id:team.tenant_id
            },
            callback: (res) => {
                if (res._code == 200) {
                    console.log("res",res)
                }
            },
        });
    }




    getDomainName = () => {
        const { domainPage, domainPage_size, } = this.state;
        this.props.dispatch({
            type: "global/getDomainName",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                region_name: globalUtil.getCurrRegionName(),
                page: domainPage,
                page_size: domainPage_size,
                id:1
            },
            callback: (res) => {
                if (res._code == 200) {
                    this.setState({
                        domainTotal: res.bean && res.bean.total,
                        domainList: res.list
                    })
                }
            },
        });
    }


    getDomain = () => {
        const { domainPage, domainPage_size, } = this.state;
        this.props.dispatch({
            type: "global/getDomainName",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                region_name: globalUtil.getCurrRegionName(),
                page: domainPage,
                page_size: domainPage_size,
                id:0
            },
            callback: (res) => {
                if (res._code == 200) {
                    this.setState({
                        num:res.bean&&res.bean.data&&res.bean.data.result&&res.bean.data.result.length>0&&res.bean.data.result[0].value&&res.bean.data.result[0].value.length>1&&res.bean.data.result[0].value[1]
                    })
                }
            },
        });
    }



    onDomainPageChange = (domainPage) => {
        this.setState({ domainPage }, () => {
            this.getDomainName();
        });
    };

    getService = () => {
        const { servicePage, servicePage_size, } = this.state;
        this.props.dispatch({
            type: "global/getService",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                region_name: globalUtil.getCurrRegionName(),
                page: servicePage,
                page_size: servicePage_size
            },
            callback: (res) => {
                if (res._code == 200) {
                    this.setState({
                        serviceTotal: res.bean && res.bean.total,
                        serviceList: res.list
                    })
                }
            },
        });
    }
    onServicePageChange = (servicePage) => {
        this.setState({ servicePage }, () => {
            this.getService();
        });
    };
    isPublicRegion() {
        const region_name = globalUtil.getCurrRegionName();
        const team_name = globalUtil.getCurrTeamName();
        const region = userUtil.hasTeamAndRegion(this.props.currUser, team_name, region_name);
        if (region) {
            return region.region_scope === "public";
        }
        return false;
    }
    getRegionResource() {
        this.props.dispatch({
            type: "global/getRegionSource",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                enterprise_id: this.props.currUser.enterprise_id,
                region: globalUtil.getCurrRegionName(),
            },
            callback: (data) => {
                this.setState({ memory: data.bean.memory || {}, disk: data.bean.disk });
            },
        });
    }
    getCompanyInfo = () => {
        this.props.dispatch({
            type: "global/getCompanyInfo",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                enterprise_id: this.props.currUser.enterprise_id,
            },
            callback: (data) => {
                this.setState({ companyInfo: data.bean });
            },
        });
    };
    loadOverview = () => {
        const { dispatch, index } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        const region_name = globalUtil.getCurrRegionName();
        dispatch({
            type: "index/fetchOverview",
            payload: {
                team_name,
                region_name,
            },
        });
    };
    loadEvents = () => {
        const team_name = globalUtil.getCurrTeamName();
        this.props.dispatch({
            type: "index/fetchEvents",
            payload: {
                team_name,
                page: 1,
                page_size: 6,
            },
        });
    };
    loadApps = () => {
        const { dispatch, form, index } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        const region_name = globalUtil.getCurrRegionName();

        const pagination = index.pagination;
        let searchKey = {
            searchKey: "",
            service_status: "",
        };
        // 获取搜索信息
        form.validateFields((err, fieldsValue) => {
            searchKey = fieldsValue;
        });

        const payload = {
            team_name,
            region_name,
            page: index.pagination.currentPage,
            page_size: index.pagination.pageSize,
            order: (index.pagination.order || "").replace("end", ""),
            fields: index.pagination.fields,
            ...searchKey,
        };

        dispatch({ type: "index/fetchApps", payload });
    };
    componentWillUnmount() {
        clearInterval(this.timer);
    }


    handleSearch = (e) => {
        e.preventDefault();
        this.loadApps();
        const { dispatch } = this.props;
        dispatch({
            type: "index/savePage",
            payload: {
                currentPage: 1,
            },
        });
        setTimeout(() => {
            this.loadApps();
        });
    };
    handleListChange = (pagination, filtersArg, sorter) => {
        const { dispatch } = this.props;
        dispatch({
            type: "index/savePage",
            payload: {
                currentPage: pagination.current,
                pageSize: pagination.pageSize,
                order: sorter.field ? sorter.order : "",
                fields: sorter.field ? sorter.field : "",
            },
        });
        setTimeout(() => {
            this.loadApps();
        });
    };
    renderActivities() {
        const list = this.props.events || [];

        if (!list.length) {
            return (
                <p
                    style={{
                        textAlign: "center",
                        color: "ccc",
                        paddingTop: 20,
                    }}
                >
                    暂无动态
        </p>
            );
        }

        const statusCNMap = {
            "": "进行中",
            complete: "完成",
            failure: "失败",
            timeout: "超时",
        };

        return list.map((item) => {
            const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                item.service_alias
                }/overview`;
            return (
                <List.Item key={item.ID}>
                    <List.Item.Meta
                        title={
                            <span>
                                <a className={styles.username}>{item.nick_name}</a>
                                <span className={styles.event}>{item.type_cn}</span>
                                <Link to={linkTo} className={styles.event}>
                                    {item.service_cname}
                                </Link>
                                <span className={styles.datetime}>
                                    应用{statusCNMap[item.final_status] ? `${statusCNMap[item.final_status]}` : ""}
                                </span>
                            </span>
                        }
                        description={
                            <span className={styles.datatime_float} title={item.updatedAt}>
                                {" "}
                                {moment(item.start_time).fromNow()}{" "}
                            </span>
                        }
                    />
                </List.Item>
            );
        });
    }



    handleOkApplication = (vals) => {
        const { dispatch } = this.props;
        dispatch({
            type: "groupControl/addGroup",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_name: vals.group_name,
            },
            callback: () => {
                notification.success({ message: "添加成功" });
                this.handleCancelApplication();
                dispatch({
                    type: "global/fetchGroups",
                    payload: {
                        team_name: globalUtil.getCurrTeamName(),
                    },
                });
            },
        });
    }

    handleCancelApplication = () => [
        this.setState({
            addApplication: false
        })
    ]

    render() {
        const handleHost = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control`
        const columns = [
            {
                title: (
                    "域名"
                ),
                dataIndex: 'metric',
                key: 'metric',
                width: "70%",
                render: (text, record) => <Tooltip title={record.metric.host}>
                    <Link to={handleHost} style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                    }}>
                        {record.metric.host}
                    </Link>

                </Tooltip>,
            },
            {
                title: "请求数/时",
                dataIndex: 'value',
                key: 'value',
                width: "30%",
                sorter: (a, b) => a.range - b.range,
                render: (text, record) => (
                    // <Trend flag={record.status === 1 ? 'down' : 'up'}>
                    <span style={{ marginRight: 4 }}>{record.value[1]}</span>
                    // </Trend>
                ),
                align: 'right',
            },
        ];

        const columnTwo = [
            {
                title: (
                    "服务名称"
                ),
                dataIndex: 'metric',
                key: 'metric',
                width: "70%",
                render: (text, record) => <Tooltip title={record.metric.service_cname}>
                    <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${record.metric.service_alias}`} style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                    }}>
                        {record.metric.service_cname}
                    </Link>

                </Tooltip>,
            },
            {
                title: "请求数/时",
                dataIndex: 'value',
                key: 'value',
                width: "30%",
                sorter: (a, b) => a.range - b.range,
                render: (text, record) => (
                    // <Trend flag={record.status === 1 ? 'down' : 'up'}>
                    <span style={{ marginRight: 4 }}>{record.value[1]}</span>
                    // </Trend>
                ),
                align: 'right',
            },
        ];

        const visitData = [];
        const beginDay = new Date().getTime();
        for (let i = 0; i < 20; i += 1) {
            visitData.push({
                x: moment(new Date(beginDay + (1000 * 60 * 60 * 24 * i))).format('YYYY-MM-DD'),
                y: Math.floor(Math.random() * 100) + 10,
            });
        }

        const {
            index, projectLoading, activitiesLoading, currUser, pagination,
        } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        const team = userUtil.getTeamByTeamName(currUser, team_name);
        const extraContent = (
            <div className={styles.extraContent}>
                <div className={styles.statItem}>
                    <p><Badge status="success" />应用数量</p>
                    <div>
                        <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/1`} style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word",
                            color: "rgba(0,0,0,.85)"
                        }}>
                            {index.overviewInfo.team_app_num || 0}
                        </Link>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <p><Badge status="processing" />服务数量</p>
                    <div style={{ color: "rgba(0,0,0,.85)" }}>
                        {index.overviewInfo.team_service_num || 0}
                    </div>
                </div>
                <div className={styles.statItem}>
                    <p><Badge status="error" />网关策略</p>
                    <div>
                        <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control`} style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word",
                            color: "rgba(0,0,0,.85)"
                        }}>
                            {index.overviewInfo.total_http_domain + index.overviewInfo.total_tcp_domain || 0}
                        </Link>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <p><Badge status="warning" />使用内存</p>
                    <div>
                        <Tooltip style={{ color: "rgba(0,0,0,.85)" }}    title={`${sourceUtil.unit(index.overviewInfo.team_service_memory_count || 0, "MB")}`}>
                        {`${sourceUtil.unit(index.overviewInfo.team_service_memory_count || 0, "MB")}`}
                        </Tooltip>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <p><Badge status="warning" />使用磁盘</p>
                    <div>
                    <Tooltip style={{ color: "rgba(0,0,0,.85)" }} title={`${sourceUtil.unit(index.overviewInfo.team_service_total_disk || 0, "MB")}`}>
                    {`${sourceUtil.unit(index.overviewInfo.team_service_total_disk || 0, "MB")}`}
                        </Tooltip>
                    
                    </div>
                </div>
                <div className={styles.statItem}>
                    <p><Badge status="default" />分享应用</p>
                    <div>
                        <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`} style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word",
                            color: "rgba(0,0,0,.85)"
                        }}>
                            {index.overviewInfo.share_app_num || 0}
                        </Link>
                    </div>
                </div>
            </div>
        );
        const { getFieldDecorator, getFieldValue } = this.props.form;

        const formItemLayout = {
            labelCol: {
                span: 5,
            },
            wrapperCol: {
                span: 19,
            },
        };


        const { teamList, total, domainList, serviceList } = this.state;
        return (

            <div style={{ margin: '-24px -24px 0' }} >
                <div className={styles.pageHeaderContent}>
                    <div className={styles.content}>
                        <div className={styles.contentTitle}>{team.team_alias}</div>
                    </div>
                </div>
                <div className={styles.contents}>
                    <Row>
                        <Col xs={14} sm={14} md={14} lg={14} xl={14} style={{ paddingRight: "10px" }}>
                            {extraContent}
                            <Card
                                style={{
                                    marginBottom: 10,
                                }}
                                title={
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>团队应用</span>
                                        <a style={{ fontSize: "14px", fontWeight: 400 }} onClick={() => { this.setState({ addApplication: true }) }}>增加应用</a>
                                    </div>
                                }
                                bordered={false}
                                bodyStyle={{
                                    padding: 0,
                                }}
                            >
                                {teamList && teamList.length > 0 &&
                                    teamList.map((item, index) => {
                                        const { backup_record_num, group_name, run_service_num, services_num, share_record_num } = item;
                                        return <div key={index} style={{ borderBottom: "1px solid #e8e8e8" }}>
                                            <div style={{ padding: "10px 20px" }}>
                                                <a style={{fontSize:"16px"}}>{group_name}</a>
                                                <div className={styles.teamListStyle}>
                                                    <div>
                                                        <span>服务：</span>
                                                        <a>{run_service_num ? run_service_num + "/" : ""}{services_num}</a>
                                                    </div>
                                                    <div>
                                                        <span>备份记录：</span>
                                                        <a>{backup_record_num}</a>
                                                    </div>
                                                    <div>
                                                        <span>分享记录：</span>
                                                        <a>{share_record_num}</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    })
                                }
                               
                                 {teamList && teamList.length > 0 ?<div style={{ textAlign: "right", margin: "15px" }}>
                                    <Pagination size="small"
                                        current={this.state.page}
                                        pageSize={this.state.total>this.state.pageSize?this.state.pageSize:this.state.total}
                                        total={this.state.total}
                                        onChange={this.onPageChange}
                                    />
                                </div>: <List/>}
                            </Card>

                            <Card
                                bodyStyle={{
                                    padding: 0,
                                }}
                                bordered={false}
                                className={styles.activeCard}
                                title="团队动态"
                                loading={activitiesLoading}
                            >
                                <List loading={activitiesLoading} size="large">
                                    <div className={styles.activitiesList}>{this.renderActivities()}</div>
                                </List>
                            </Card>
                        </Col>
                        <Col xs={10} sm={10} md={10} lg={10} xl={10}>
                            <Card
                                style={{
                                    marginBottom: 10,
                                    border: "none",
                                }}
                                title="热门域名访问"
                                bordered={false}
                                bodyStyle={{
                                    padding: 0,
                                }}
                                border={false}
                            >
                                <ChartCard style={{
                                    marginTop: "-20px",
                                    border: "none"
                                }}>
                                    <NumberInfo
                                        subTitle={
                                            <span>
                                                整体请求量
                                                    <Tooltip
                                                    title={"整体请求量"}
                                                >
                                                    <Icon style={{ marginLeft: 8 }} type="info-circle-o" />
                                                </Tooltip>
                                            </span>
                                        }
                                        gap={8}
                                        total={numeral(this.state.num).format('0,0')}
                                        status="up"
                                        subTotal={17.1}
                                    />
                                    <MiniArea
                                        line
                                        height={45}
                                        data={visitData}
                                    />
                                    <Table
                                        rowKey={record => record.index}
                                        size="small"
                                        style={{ marginTop: "10px" }}
                                        columns={columns}
                                        dataSource={domainList}
                                        pagination={{
                                            style: { marginBottom: 0 },
                                            current: this.state.servicePage,
                                            pageSize: this.state.servicePage_size,
                                            total: this.state.serviceTotal,
                                            onChange: this.onDomainPageChange
                                        }}
                                    />
                                </ChartCard>
                            </Card>
                            <Card
                                style={{
                                    marginBottom: 10,
                                }}
                                title="热门服务访问"
                                bordered={false}
                                bodyStyle={{
                                    padding: 0,
                                }}
                            >
                                <Col span={24}>
                                    <ChartCard
                                        style={{
                                            marginTop: "-20px",
                                            border: "none"
                                        }}
                                    >
                                        <NumberInfo
                                            subTitle={
                                                <span>
                                                    运行服务数量
                                                    <Tooltip
                                                        title={"运行服务数量"}
                                                    >
                                                        <Icon style={{ marginLeft: 8 }} type="info-circle-o" />
                                                    </Tooltip>
                                                </span>
                                            }
                                            gap={8}
                                            total={numeral(12321).format('0,0')}
                                            status="up"
                                            subTotal={17.1}
                                        />
                                        <Table
                                            style={{ marginTop: "10px" }}
                                            rowKey={record => record.index}
                                            size="small"
                                            columns={columnTwo}
                                            dataSource={serviceList}
                                            // pagination={{
                                            //     style: { marginBottom: 0 },
                                            //     current: this.state.domainPage,
                                            //     pageSize: this.state.domainPage_size,
                                            //     total: this.state.domainTotal,
                                            //     onChange: this.onServicePageChange
                                            // }}
                                        />
                                    </ChartCard>

                                </Col>
                            </Card>
                        </Col>
                    </Row>
                    {this.state.addApplication && <EditGroupName title="添加应用" onCancel={this.handleCancelApplication} onOk={this.handleOkApplication} />}
                </div>
            </div>
        );
    }
}

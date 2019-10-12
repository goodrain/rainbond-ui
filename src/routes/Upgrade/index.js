import React, { PureComponent, Fragment } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { Card, Button, List, Table, Radio, Input, Tag, Avatar, Tabs } from 'antd';
import pageHeaderLayoutStyle from '../../layouts/PageHeaderLayout.less';
import globalUtil from '../../utils/global';
import infoUtil from './info-util';
import styles from "./index.less";

import MarketAppDetailShow from "../../components/MarketAppDetailShow";

import Info from './info';


import sourceUtil from '../../utils/source-unit';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';


const TabPane = Tabs.TabPane;


@connect(({ user, global, groupControl }) => ({ groupDetail: groupControl.groupDetail || {}, currUser: user.pageUser, groups: global.groups || [] }))
export default class AppList extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            showApp: {},
            showMarketAppDetail: false,
            infoShow: false,
            infoData: null,
            list: [],
            activeKey: "1",
            page: 1,
            pageSize: 5,
            total: 0,
            page: 1,
            dataList: []
        }
    }
    componentDidMount() {
        this.fetchGroup();
        this.getApplication();
    }

    // 查询当前组下的云市应用
    getApplication = () => {
        const group_id = this.getGroupId();
        this.props.dispatch({
            type: 'global/application',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    this.setState({
                        list: res.list
                    })
                }
            }
        });
    }



    getGroupId = () => {
        const params = this.props.match.params;
        return params.groupId;
    }
    getGroupName = () => {
        const group_id = this.getGroupId();
        const groups = this.props.groups;
        var group_name = '';
        groups.map((order) => {
            if (order.group_id == group_id) {
                group_name = order.group_name;
            }
        })
        this.setState({ groupName: group_name })
    }

    fetchGroup = () => {
        this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
            },
            callback: () => {
                this.getGroupName();
            }
        });
    };


    showMarketAppDetail = app => {
        this.setState({
            showApp: app,
            showMarketAppDetail: true
        });
    };
    hideMarketAppDetail = () => {
        this.setState({
            showApp: {},
            showMarketAppDetail: false
        });
    };

    callback = (key) => {
        this.setState({
            activeKey: key
        }, () => {
            key == "2" ? this.getUpgradeRecordsList() : this.getApplication()
        })
    }


    // 查询某应用的更新记录列表
    getUpgradeRecordsList = () => {
        const group_id = this.getGroupId();
        const { page, pageSize } = this.state;
        this.props.dispatch({
            type: 'global/CloudAppUpdateRecordsList',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                page,
                pageSize,
                status__gt:1,
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    const { indexs } = this.state;
                    if (res.list && res.list.length > 0) {
                        this.setState({
                            dataList: res.list
                        })
                    }
                }
            }
        });
    }
    handleTableChange = (page, pageSize) => {
        this.setState(
            {
                page,
                pageSize: pageSize
            },
            () => {
                this.getUpgradeRecordsList();
            }
        );
    };

    shouldComponentUpdate = () => {
        return true
    }
    render() {
        const { groupName, loading, list, showMarketAppDetail, showApp, infoShow, infoData, activeKey, page, total, pageSize, dataList } = this.state;

        const paginationProps = {
            onChange: this.handleTableChange,
            pageSize,
            total,
            page
        };

        const ListContent = ({ data: { upgrade_versions,current_version, min_memory } }) => (
            <div className={styles.listContent}>
                <div className={styles.listContentItem}>
                    <span>当前版本</span>
                    <p>{
                         <Tag style={{ height: "17px", lineHeight: "16px", marginBottom: "3px" }} color="green" size="small" > {current_version}</Tag>
                    }</p>
                </div>
                <div className={styles.listContentItem}>
                    <span>可升级版本</span>
                    <p>{
                        upgrade_versions &&upgrade_versions.length>0?upgrade_versions.map((item, index) => {
                            return <Tag style={{ height: "17px", lineHeight: "16px", marginBottom: "3px" }} color="green" size="small" key={index}> {item}</Tag>
                        }):"暂无升级"
                    }</p>
                </div>
                <div className={styles.listContentItem}>
                    <span>内存</span>
                    <p>{sourceUtil.unit(min_memory || 128, "MB")}</p>
                </div>
            </div>
        );


        const columns = [{
            title: '创建时间',
            dataIndex: 'create_time',
            key: '1',
            width: "20%",
            render: text => <span >{text}</span>,
        }, {
            title: '名字',
            dataIndex: 'group_name',
            key: '2',
            width: "20%",
            render: text => <span >{text}</span>,
        }, {
            title: '版本',
            dataIndex: 'version',
            key: '3',
            width: "30%",
            render: (text, data) => <span>
                {data.old_version && data.version ?
                    <span>
                        <a href="javascript:;">{data.old_version}</a>升级到<a href="javascript:;">{data.version}</a>
                    </span>
                    :"-"
                }
            </span>,
        }, {
            title: '状态',
            dataIndex: 'status',
            key: '4',
            width: "15%",
            render: status => <span >{infoUtil.getStatusCN(status)}</span>,
        }, {
            title: '组件详情',
            dataIndex: 'tenant_id',
            key: '5',
            width: "15%",
            render: (text, item) =>
                <a
                    onClick={e => {
                        e.preventDefault();
                        item.status != 1 && this.setState({
                            infoData: item,
                            infoShow: true
                        })
                    }}
                    style={{ color: item.status == 1 ? "#000" : "#1890ff" }}
                    href="javascript:;">{item.status == 1 ? "-" : "详情"}
                </a>,
        },
        ]

        return (
            <PageHeaderLayout
                title=''
                breadcrumbList={[{
                    title: "首页",
                    href: `/`
                }, {
                    title: "我的应用",
                    href: ``
                }, {
                    title: groupName,
                    href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${this.getGroupId()}`
                }, {
                    title: "云市应用升级",
                    href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/upgrade/${this.getGroupId()}`
                }]}
                content={null}
                extraContent={null}
            >

                {!infoShow && <Tabs defaultActiveKey={activeKey} onChange={this.callback} className={styles.tabss}>
                    <TabPane tab="云市应用列表" key="1">
                        <div className={styles.cardList}>
                            <List
                                rowKey="id"
                                size="large"
                                loading={loading}
                                dataSource={[...list]}
                                // pagination={paginationProps}
                                renderItem={item =>
                                    <List.Item
                                        actions={[
                                            <a onClick={e => {
                                                e.preventDefault();
                                                if (item.can_upgrade) {
                                                    this.setState({
                                                        infoData: item
                                                    }, () => {
                                                        this.setState({
                                                            infoShow: item.not_upgrade_record_id ? true : !item.can_upgrade ? false : true,
                                                        })
                                                    })
                                                }
                                            }}

                                                style={{ display: "block", marginTop: "15px", color: item.can_upgrade ? "#1890ff" : "#bfbfbf" }}
                                            >
                                                {item.not_upgrade_record_status != 1 ? infoUtil.getStatusCN(item.not_upgrade_record_status) :
                                                    item.can_upgrade ? "升级" : "无可升级的变更"}</a>]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.pic || require("../../../public/images/app_icon.jpg")} shape="square" size="large" />}
                                            title={<a onClick={() => {
                                                this.showMarketAppDetail(item);
                                            }}>{item.group_name}</a>}
                                            description={item.describe}
                                        />
                                        <ListContent data={item} />
                                    </List.Item>
                                }
                            />
                        </div>
                    </TabPane>
                    <TabPane tab="云市应用升级记录" key="2">
                        <Table columns={columns} dataSource={dataList} pagination={paginationProps} />
                    </TabPane>
                </Tabs>
                }

                {showMarketAppDetail && (
                    <MarketAppDetailShow
                        onOk={this.hideMarketAppDetail}
                        onCancel={this.hideMarketAppDetail}
                        app={showApp}
                    />
                )}


                {infoShow && <Info data={infoData} activeKey={this.state.activeKey} group_id={this.getGroupId()}
                    setInfoShow={() => {
                        this.setState({ infoShow: false }, () => {
                            this.state.activeKey == "2" ? this.getUpgradeRecordsList() : this.getApplication()
                        });
                    }} />}
            </PageHeaderLayout>
        );
    }
}

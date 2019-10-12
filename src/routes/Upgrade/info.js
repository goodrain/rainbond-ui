import React, { PureComponent, Fragment } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { Row, Col, Card, Button, List, Checkbox, Select, Form, Tooltip, Icon, Spin } from 'antd';
import globalUtil from '../../utils/global';
import infoUtil from './info-util';
import styles from "./index.less";


const Option = Select.Option;

@Form.create()
@connect(({ user, global, groupControl }) => ({ groupDetail: groupControl.groupDetail || {}, currUser: user.currentUser, groups: global.groups || [] }))
export default class AppList extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            type: '',
            indexs: 0,
            infoObj: props.data ? props.data : "",
            upgradeVersions: [],
            upgradeInfo: [],
            upgrade_info: "",
            upgrade_info_two: [],
            upgradeRecords: [],
            text: this.props.activeKey == 2 ? "回滚" : "升级",
            upgradeText: "升级",
            textState: 1,
            service_id: [],
            conshow: true
        }
    }
    componentDidMount() {
        this.generateUpdateOrder()
        this.getUpdatedVersion()
    }

    shouldComponentUpdate() {
        return true
    }

    // 生成升级订单
    generateUpdateOrder = () => {
        const { group_id } = this.props;
        const { infoObj } = this.state;
        this.props.dispatch({
            type: 'global/CloudAppUpdateOrder',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                group_key: infoObj.group_key
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    if (this.props.activeKey != 2) {
                        this.setState({
                            infoObj: res.bean ? res.bean : this.props.data
                        })
                    } else {
                        this.setState({
                            textState: this.props.data.status
                        })
                    }
                    if (this.props.activeKey == 2 && (infoObj.status == 4)) {
                        this.setState({
                            record_id: infoObj.ID
                        }, () => {
                            this.getUpgradeRecordsInfo("Rollback")
                        })
                    } else if (this.props.activeKey == 2 && (infoObj.status == 2)) {
                        this.setState({
                            record_id: infoObj.ID
                        }, () => {
                            this.getUpgradeRecordsInfo()
                        })
                    } else if (this.props.activeKey == 2) {
                        this.setState({
                            text: infoUtil.getStatusCNS(infoObj.status)
                        })
                    }

                    if (infoObj.not_upgrade_record_id) {
                        if (infoObj.not_upgrade_record_status && infoObj.not_upgrade_record_status == 2) {
                            this.setState({
                                record_id: infoObj.not_upgrade_record_id
                            }, () => {
                                this.getUpgradeRecordsInfo()
                            })
                        }
                    }
                }
            }
        });
    }

    //  查询某云市应用的更新版本

    getUpdatedVersion = (Rollback) => {
        const { group_id } = this.props;
        const { infoObj } = this.state;
        this.props.dispatch({
            type: 'global/CloudAppUpdatedVersion',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                group_key: infoObj.group_key
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    this.setState({
                        upgradeVersions: res.list
                    }, () => {
                        if (!Rollback && this.props.activeKey == 2) {
                            const { service_record } = infoObj;
                            const { indexs } = this.state;
                            if (service_record && service_record.length > 0) {
                                let service_ids = [];

                                for (let i = 0; i < service_record.length; i++) {
                                    service_ids.push(service_record[i].service_id)
                                }
                                let type = service_record[indexs > service_record.length - 1 ? 0 : indexs].service_id



                                let upgrade_info = service_record[indexs]
                                this.setState({
                                    upgradeInfo: service_record,
                                    type,
                                    upgrade_info,
                                    service_id: service_ids,
                                    conshow: null
                                })
                            }
                        } else {
                            this.getUpdatedInfo(res.list.length > 0 && res.list[0])
                        }
                    })
                }
            }
        });
    }


    // 查询某云市应用下组件的更新信息
    getUpdatedInfo = (versions) => {
        const version = this.props.form.getFieldValue('upgradeVersions');
        const { group_id } = this.props;
        const { infoObj } = this.state;
        this.props.dispatch({
            type: 'global/CloudAppUpdatedInfo',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                group_key: infoObj.group_key,
                version: versions ? versions : version
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    const { indexs } = this.state;
                    const { list } = res;
                    if (list && list.length > 0) {

                        let service_id = [];
                        for (let i = 0; i < list.length; i++) {
                           if(list[i].upgrade_info&& JSON.stringify(list[i].upgrade_info) != "{}"){
                            service_id.push(list[i].service.service_id)
                           }
                        }
                        let type = list[indexs > list.length - 1 ? 0 : indexs].service.service_id
                        let upgrade_info = list[indexs]
                        this.setState({
                            upgradeInfo: list,
                            type,
                            upgrade_info,
                            conshow: null,
                            service_id
                        })
                    }
                }
            }
        });
    }

    handleChangeVersions = (value) => {
        this.props.form.setFieldsValue({ upgradeVersions: value });
        this.getUpdatedInfo(value)
    }

    onChange = (checkedValues) => {
        // console.log('checked = ', checkedValues);
    }
    handleType = (type, index) => {
        if (this.state.type !== type.service_id) {
            const { upgradeInfo } = this.state;
            this.setState({ type: type.service_id, indexs: index, upgrade_info: upgradeInfo[index] });
            // this.setState({ type: type.service_id, indexs: index, upgrade_info: service.type=="upgrade"? upgradeInfo[index]:{type:"add"} });
        }
    }
    handleSubmit = (e) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.createUpgradeTasks(values)
            }
        });
    };
    // 创建升级任务
    createUpgradeTasks = (values) => {
        const { group_id } = this.props;
        const { infoObj, upgradeInfo } = this.state;
        const version = this.props.form.getFieldValue('upgradeVersions');
        let arr = [];
        let indexc = [];

        for (let i = 0; i < upgradeInfo.length; i++) {
            for (let k = 0; k < values.services.length; k++) {
                if (upgradeInfo[i].service.service_id == values.services[k]) {
                    arr.push(upgradeInfo[i]);
                    indexc.push(i)
                }
            }
        }

        this.props.dispatch({
            type: 'global/CloudAppUpdatedTasks',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                group_key: infoObj.group_key,
                version,
                services: arr,
                upgrade_record_id: infoObj.ID
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    this.setState({
                        record_id: res.bean.ID
                    }, () => {
                        this.getUpgradeRecordsInfo()
                    })
                }
            }
        });
    }

    // // 查询某应用的更新记录列表
    // getUpgradeRecordsList = () => {
    //     const { group_id } = this.props;
    //     this.props.dispatch({
    //         type: 'global/CloudAppUpdateRecordsList',
    //         payload: {
    //             team_name: globalUtil.getCurrTeamName(),
    //             group_id
    //         },
    //         callback: (res) => {
    //             if (res && res._code == 200) {
    //                 const { indexs } = this.state;
    //                 if (res.list && res.list.length > 0) {
    //                     this.setState({
    //                         upgradeRecords: res.list,
    //                     }, () => {
    //                         res.list.map((item) => {
    //                             const { status } = item;
    //                             if (status != (3 || 5 || 8 || 9)) {
    //                                 setTimeout(() => {
    //                                     this.getUpgradeRecordsList();
    //                                 }, 3000)
    //                             }
    //                         })
    //                     })
    //                 }
    //             }
    //         }
    //     });
    // }



    // 查询某应用的更新记录详情
    getUpgradeRecordsInfo = (Rollback) => {
        const { group_id } = this.props;
        const { record_id } = this.state;
        this.props.dispatch({
            type: 'global/CloudAppUpdateRecordsInfo',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                record_id
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    this.setState({
                        upgradeRecords: res.bean.service_record,
                        textState: res.bean.status,
                        text: infoUtil.getStatusCNS(res.bean.status),
                        upgradeText: Rollback ? this.state.upgradeText :
                            res.bean.status == 1 ? "未升级" :
                                res.bean.status == 2 ? "升级中" :
                                    res.bean.status == 3 ? "升级完成" :
                                        res.bean.status == 6 ? "部分升级" :
                                            res.bean.status == 8 ? "升级失败" : "升级",
                    }, () => {
                        if ((res.bean.status != 3 && res.bean.status != 5 && res.bean.status != 6 && res.bean.status != 7 && res.bean.status != 8 && res.bean.status != 9)) {
                            setTimeout(() => {
                                this.getUpgradeRecordsInfo(Rollback);
                            }, 3000)
                        }
                    })
                }
            }
        });
    }


    getData = () => {
        if (this.state.upgrade_info && JSON.stringify(this.state.upgrade_info) != "{}") {
            const { upgrade_info, update, service } = this.state.upgrade_info;

            if (service && service.type == "add") {
                return [
                    {
                        title: '',
                        description: (<div style={{ textAlign: "center", lineHeight: "300px", fontSize: "25px" }}>新增组件</div>
                        )
                    }
                ]
            } else if (upgrade_info&&JSON.stringify(upgrade_info) != "{}") {
                return this.setData(upgrade_info)
            } else if (update&&JSON.stringify(update) != "{}") {
                return this.setData(update)
            } else {
                return [
                    {
                        title: '',
                        description: (<div style={{ textAlign: "center", lineHeight: "300px", fontSize: "25px" }}>组件无变更，无需升级</div>
                        )
                    }
                ]
            }

            // if (service.type == "add") {
            //     let images = deploy_version ? {
            //         title: '运行环境版本',
            //         description: (<div>新增版本号：{deploy_version}</div>),
            //         // actions: [<a>删除</a>],
            //     } : ""
            //     let app_versions = service_env_map_list && service_env_map_list.length > 0 ? {
            //         title: '环境变量',
            //         description: (<div>新增变量：{service_env_map_list.map((item, index) => {
            //             return <span key={index}>{item.name}</span>
            //         })}</div>),
            //         // actions: [<a>删除</a>],
            //     } : ""
            //     let deploy_versions = port_map_list && port_map_list.length > 0 ? {
            //         title: '端口',
            //         description: (<div>新增端口：{port_map_list.map((item, index) => {
            //             return <span key={index}>{item.container_port}</span>
            //         })}</div>),
            //         // actions: [<a>删除</a>],
            //     } : ""
            //     let volumess = mnt_relation_list && mnt_relation_list.length > 0 ? {
            //         title: '存储',
            //         description: (<div>新增存储挂载：{mnt_relation_list.map((item, index) => {
            //             return <span key={index}>{item.mnt_dir}</span>
            //         })}</div>),
            //         // actions: [<a>删除</a>],
            //     } : ""
            //     let yl = dep_service_map_list && dep_service_map_list.length > 0 ? {
            //         title: '依赖组件',
            //         description: (<div>
            //                 <p>新增对 {dep_service_map_list.map((item, index) => {
            //                     return <span key={index}>{item.dep_service_key}</span>
            //                 })} 组件的依赖</p>
            //             </div>
            //         ),
            //         // actions: [<a>删除</a>],
            //     } : ""

            //     let arr = [
            //         images,
            //         app_versions,
            //         volumess,
            //         yl,
            //         deploy_versions,
            //         // pluginss,
            //     ]
            //     for (var i = 0; i < arr.length; i++) {
            //         if (arr[i] == "" || typeof (arr[i]) == "undefined") {
            //             arr.splice(i, 1);
            //             i = i - 1;
            //         }
            //     }
            //     return arr


            // } else {


            // let deploy_versions = deploy_version && deploy_version.is_change ? {
            //     title: '运行环境版本',
            //     description: (<div>从{deploy_version.old}变更为{deploy_version.new}</div>),
            // } : ""


        } else {
            return [
                {
                    title: '',
                    description: (<div style={{ textAlign: "center", lineHeight: "300px", fontSize: "25px" }}>组件无变更，无需升级</div>
                    )
                }
            ]
        }
    }




    setData = (data) => {
        const {
            deploy_version,
            image,
            ports,
            volumes,
            dep_services,
            dep_volumes,
            plugins,
            envs
        } = data

        let images = {
            title: '镜像',
            description: (<div>
                {image && image.is_change ?
                    <div className={styles.textzt}>
                        从 <span>{image.old}</span> 变更为 <span>{image.new}</span>
                    </div>
                    : <div>暂无变化</div>
                }
            </div>),
            // actions: [<a>删除</a>],
        }
        let envss = {
            title: '环境变量',
            description: (<div>
                {envs && envs.add && envs.add.length > 0 ?
                    <div className={styles.textzt}>
                        新增变量：{envs.add.map((item, index) => {
                            return <span key={index}>{item.attr_name}</span>
                        }
                        )}
                    </div>
                    : <div>暂无变化</div>
                }
            </div>
            ),
        }
        let portss = {
            title: '端口',
            description: (<div>
                {ports && ports.add && ports.add.length > 0 ?
                    <div className={styles.textzt}>
                        新增端口：{ports.add.map((item, index) => {
                            return <span key={index}>{item.container_port}</span>
                        })}
                    </div>
                    : <div>暂无变化</div>
                }
            </div>),
        }

        let volumess = {
            title: '存储',
            description: (<div>
                {volumes ?
                    <div>
                        {volumes.add && volumes.add.length > 0 &&
                            <div className={styles.textzt}>
                                新增存储挂载：{volumes.add.map((item, index) => {
                                    return <span key={index}>{item.volume_name}</span>
                                }
                                )}
                            </div>}
                        {volumes.upd && volumes.upd.length > 0 &&
                            <div className={styles.textzt}>
                                更新存储挂载：{volumes.upd.map((item, index) => {
                                    return <span key={index}>{item.volume_name}</span>
                                }
                                )}
                            </div>
                        }
                    </div>
                    : <div>暂无变化</div>
                }
            </div>),
        }


        let yl = {
            title: '依赖组件',
            description: (<div>
                {dep_services ?
                    <div>
                        {dep_services.add && dep_services.add.length > 0 &&
                            <div className={styles.textzt}>
                                新增对
                                        {dep_services.add.map((item, index) => {
                                    return <span key={index}>{item.service_cname}</span>
                                })}
                                组件的依赖
                                    </div>}
                        {dep_services.del && dep_services.del.length > 0 &&
                            <div className={styles.textzt}>
                                移除对{dep_services.del.map((item, index) => {
                                    return <span key={index}>{item.service_cname}</span>
                                }
                                )}组件的依赖
                                    </div>
                        }
                    </div>
                    : <div>暂无变化</div>
                }
            </div>
            ),
        }

        let dep_volumess = {
            title: '依赖的存储',
            description: (<div>
                {dep_volumes && dep_volumes.add && dep_volumes.add.length > 0 ?
                    <div className={styles.textzt}>
                        新增存储挂载：{dep_volumes.add.map((item, index) => {
                            return <span key={index}>{item.mnt_name}</span>
                        })}
                    </div>
                    : <div>暂无变化</div>
                }
            </div>
            )
        }

        let pluginss = {
            title: '插件',
            description: (<div>
                {plugins && plugins.add && plugins.add.length > 0 ?
                    <div className={styles.textzt}>
                        新增插件：{plugins.add.map((item, index) => {
                            return <span key={index}>{item.plugin_alias}</span>
                        })}
                    </div>
                    : <div>暂无变化</div>
                }
            </div>
            )
        }

        let arr = [
            volumess,
            dep_volumess,
            envss,
            images,
            yl,
            portss,
            pluginss,
        ]
        // for (var i = 0; i < arr.length; i++) {
        //     if (arr[i] == "" || typeof (arr[i]) == "undefined") {
        //         arr.splice(i, 1);
        //         i = i - 1;
        //     }
        // }
        return arr
    }

    //  回滚某次更新Rollback
    getUpgradeRollback = () => {
        const services = this.props.form.getFieldValue('services');
        const { group_id } = this.props;
        this.props.dispatch({
            type: 'global/CloudAppUpdateRollback',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                record_id: this.state.infoObj.ID,
                service_ids: services
            },
            callback: (res) => {
                if (res && res._code == 200) {
                    this.setState({
                        record_id: res.bean.ID
                    }, () => {
                        this.getUpgradeRecordsInfo("Rollback")
                    })
                }
            }
        });
    }


    render() {
        const { getFieldDecorator } = this.props.form;
        const { type, infoObj, upgradeVersions, upgradeInfo, upgradeRecords, text, upgradeText, textState, service_id, conshow } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 6 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 16 },
                sm: { span: 16 },
            },
        };
        const arr = this.getData()

        return (
            <div style={{ padding: "10px", background: "#fff", }}>
                <Row gutter={24} style={{ margin: "0px" }}>
                    <Col
                        xs={{ span: 6, offset: 0 }} lg={{ span: 6, offset: 0 }}
                        style={{
                            background: "#fff",
                            borderRight: "1px solid #E8E8E8",

                        }}
                        className={styles.zslbor}
                    >
                        <Form onSubmit={this.handleSubmit}>
                            <div className={styles.zsldis}>
                                <Form.Item  {...formItemLayout} label="升级到" style={{ width: "100%" }}>
                                    {getFieldDecorator("upgradeVersions", {
                                        initialValue: (infoObj && infoObj.version) ? infoObj.version : upgradeVersions && upgradeVersions.length > 0 && upgradeVersions[0],
                                        rules: [
                                            { required: false, message: "请选择" },
                                        ],
                                    })(
                                        <Select disabled={textState == 1 ? false : true}
                                            size="small" style={{ width: 80 }}
                                            onChange={this.handleChangeVersions}
                                        >
                                            {upgradeVersions && upgradeVersions.length > 0 && upgradeVersions.map((item, index) => {
                                                return <Option value={item} key={index}>{item}</Option>
                                            })}
                                        </Select>
                                    )}
                                    <span>&nbsp;&nbsp;版本</span>
                                </Form.Item>
                            </div>
                            <div className={styles.zslcheck}>
                                <Form.Item label="" style={{ width: "100%" }}>
                                    {getFieldDecorator("services", {
                                        initialValue: service_id,
                                        force: true,
                                        rules: [
                                            { required: true, message: "请选择需要升级的云市应用" },
                                        ],
                                    })(
                                        <Checkbox.Group onChange={this.onChange} className={styles.zslGroup} >
                                            <Row gutter={24} style={{ height: "400px", overflow: "auto" }}>
                                                {upgradeInfo && upgradeInfo.length > 0 && upgradeInfo.map((item, index) => {

                                                    const { service, upgrade_info, update } = item;
                                                    return <Col span={24} className={styles.zslMt + ' ' + (type === (service ? service.service_id : item.service_id) ? styles.active : '')}
                                                        onClick={() => {
                                                            this.handleType(service ? service : item, index)
                                                        }}>


                                                        <div style={{ width: "100%" }}>
                                                            <Checkbox
                                                                disabled={(JSON.stringify(upgrade_info ? upgrade_info : update) == "{}"|| (upgrade_info?upgrade_info==null:update==null)) ? true : false}
                                                                value={service ? service.service_id : item.service_id}
                                                                style={{ width: "30px" }}
                                                            >
                                                            </Checkbox>
                                                            {service ? service.service_cname : item.service_cname}
                                                        </div>

                                                        <div>
                                                            {
                                                                upgradeRecords && upgradeRecords.length > 0 &&(upgrade_info!=null || update!=null) && (JSON.stringify(upgrade_info ? upgrade_info : update) != "{}") ?
                                                                    <div>
                                                                        {
                                                                            (
                                                                                upgradeRecords[index] && upgradeRecords[index].status == 1 ||
                                                                                upgradeRecords[index] && upgradeRecords[index].status == 2 ||
                                                                                upgradeRecords[index] && upgradeRecords[index].status == 4) ?


                                                                                <Icon type="sync" style={{ color: "#1890ff" }} spin /> :
                                                                                (upgradeRecords[index] && upgradeRecords[index].status == 3 ||
                                                                                    upgradeRecords[index] && upgradeRecords[index].status == 6 ||
                                                                                    upgradeRecords[index] && upgradeRecords[index].status == 5 ||
                                                                                    upgradeRecords[index] && upgradeRecords[index].status == 7
                                                                                ) ?
                                                                                    <Tooltip title="成功">
                                                                                        <Icon type="check" style={{ color: "#239B24" }} />
                                                                                    </Tooltip>
                                                                                    : upgradeRecords[index] && upgradeRecords[index].status == 8 ?
                                                                                        <Tooltip title="失败">
                                                                                            <Icon type="close" style={{ color: "red" }} />
                                                                                        </Tooltip>
                                                                                        :
                                                                                        <Tooltip title="成功">
                                                                                            <Icon type="check" style={{ color: "#239B24" }} />
                                                                                        </Tooltip>
                                                                        }
                                                                    </div> : service && service.type &&
                                                                    <div>
                                                                        {
                                                                            service.type == "upgrade" && (upgrade_info!=null || update!=null)&& (JSON.stringify(upgrade_info ? upgrade_info : update) != "{}")?
                                                                                <Tooltip title="可升级">
                                                                                    <Icon type="up" style={{ color: "#239B24" }} />
                                                                                </Tooltip>:
                                                                                (upgrade_info!=null || update!=null)&& (JSON.stringify(upgrade_info ? upgrade_info : update) != "{}")?
                                                                                <Tooltip title="新增组件"><Icon type="plus" style={{ color: "#239B24" }} />
                                                                                </Tooltip>:""
                                                                        }
                                                                    </div>
                                                            }
                                                        </div>
                                                    </Col>
                                                })}
                                            </Row>
                                        </Checkbox.Group>
                                    )}
                                </Form.Item>
                            </div>
                        </Form>

                    </Col>
                    <Col xs={{ span: 18, offset: 0 }} lg={{ span: 18, offset: 0 }} style={{ background: "#fff" }}>
                        <div className={styles.zslbor}>
                            <div className={styles.zslcen}>组件属性变更详情</div>
                            <Row gutter={24} style={{ margin: "10px 20px 20px", height: "400px", overflow: "auto" }}>
                                {conshow ? <Spin size="large" /> :
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={arr}
                                        renderItem={(item, index) => (
                                            // <List.Item actions={item.actions} key={index}>
                                            <List.Item key={index}>
                                                <List.Item.Meta title={item.title} description={item.description} />
                                            </List.Item>
                                        )}
                                    />}
                            </Row>
                        </div>
                    </Col>
                </Row>
                <Row gutter={24} style={{ textAlign: "center", width: "100%", marginTop: "5px" }}>
                    <Button style={{ marginRight: "5px" }} onClick={() => {
                        this.props.setInfoShow()
                    }} >返回</Button>



                    {
                        this.props.activeKey == 1 && <Button type="primary" onClick={
                            () => {
                                (textState != 1 && textState != 2 && textState != 4) ? this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${this.props.group_id}`))
                                    : this.handleSubmit()
                            }
                        }
                            // disabled={textState != 1 ? true : false}
                            loading={textState == 2 ? true : false}
                            style={{ marginRight: "5px" }}
                        >{upgradeText}</Button>
                    }

                    {
                        ((textState != 1 && textState != 2) || this.props.activeKey == 2) &&
                        <Button type="primary"
                            onClick={
                                () => {
                                    (this.props.activeKey == 1 && textState != 3 && textState != 6 && textState != 4 && textState != 8) ? this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${this.props.group_id}`))
                                        :
                                        (this.props.activeKey == 2 && textState != 1 && textState != 2 && textState != 3 && textState != 4) ? this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${this.props.group_id}`))
                                            :
                                            this.getUpgradeRollback()
                                }}
                            style={{ marginRight: "5px" }}
                            loading={(textState == 2 || textState == 4) ? true : false}

                        >{ (textState == 3 || textState == 6 || textState == 8) ? "回滚" :
                        //    (this.props.activeKey == 2 && (textState == 3 || textState == 6 || textState == 8)) ? "回滚" :
                        text}</Button>
                    }



                    {/* {textState != 1 && textState != 2 && textState != 4 &&
                        <Button type="primary" onClick={() => {
                            this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${this.props.group_id}`));
                        }} >完成</Button>
                    } */}


                </Row>
            </div>
        );
    }
}

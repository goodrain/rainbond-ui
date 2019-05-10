import React, { PureComponent, Fragment } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { Row, Col, Card, Button, List, Checkbox, Select,  Form, Tooltip, Icon } from 'antd';
import globalUtil from '../../utils/global';

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
            upgradeRecords: [],
            text: this.props.activeKey == 2 ? "回滚" :"升级",
            textState: 1,
            service_id: []
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

    getUpdatedVersion = () => {
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
                        this.getUpdatedInfo(res.list.length > 0 && res.list[0])
                    })
                }
            }
        });
    }


    // 查询某云市应用下服务的更新信息
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

                        for (let i = 0; i < res.list.length; i++) {
                            service_id.push(res.list[i].service.service_id)
                        }
                        let type = list[indexs].service.service_id
                        let upgrade_info = list[indexs]
                        this.setState({
                            upgradeInfo: list,
                            type,
                            upgrade_info,
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
        if (this.state.type !== type) {
            const { upgradeInfo } = this.state;
            this.setState({ type: type, indexs: index, upgrade_info: upgradeInfo[index] });
        }
    }
    handleSubmit = (e) => {
        e.preventDefault();
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
    getUpgradeRecordsInfo = () => {
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
                        text: res.bean.status == 1 ? "未升级" :
                            res.bean.status == 2 ? "升级中" :
                                res.bean.status == 3 ? "已升级" :
                                    res.bean.status == 4 ? "回滚中" :
                                        res.bean.status == 5 ? "已回滚" :
                                            res.bean.status == 6 ? "部分升级" :
                                                res.bean.status == 7 ? "部分回滚" :
                                                    res.bean.status == 8 ? "升级失败" :
                                                        res.bean.status == 9 ? "回滚失败" : "升级"
                    }, () => {
                        if (res.bean.status != (3 || 5 || 6 || 7 || 8 || 9)) {
                            setTimeout(() => {
                                this.getUpgradeRecordsInfo();
                            }, 3000)
                        } else if (res.bean.status = (1 || 2 || 4)) {
                            this.getUpdatedVersion()
                        }
                    })
                }
            }
        });
    }


    getData = () => {
        if (this.state.upgrade_info && JSON.stringify(this.state.upgrade_info) != "{}") {
            const { upgrade_info, service, } = this.state.upgrade_info;

            const { deploy_version,
                image,
                ports,
                volumes,
                dep_services,
                dep_volumes,
                plugins
            } = upgrade_info


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
            //         title: '依赖服务',
            //         description: (<div>
            //                 <p>新增对 {dep_service_map_list.map((item, index) => {
            //                     return <span key={index}>{item.dep_service_key}</span>
            //                 })} 服务的依赖</p>
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
            let envs = {
                title: '环境变量',
                description: (<div>
                    {envs && envs.add && envs.add.length > 0 ?
                        <div className={styles.textzt}>
                            新增变量：{envs.add.map((item, index) => {
                                return <span key={index}>{item.name}</span>
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
                title: '依赖服务',
                description: (<div>
                    {dep_services ?
                        <div>
                            {dep_services.add && dep_services.add.length > 0 &&
                                <div className={styles.textzt}>
                                    新增对
                                            {dep_services.add.map((item, index) => {
                                        return <span key={index}>{item.service_cname}</span>
                                    })}
                                    服务的依赖
                                        </div>}
                            {dep_services.del && dep_services.del.length > 0 &&
                                <div className={styles.textzt}>
                                    移除对{dep_services.del.map((item, index) => {
                                        return <span key={index}>{item.service_cname}</span>
                                    }
                                    )}服务的依赖
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
                            新增插件版本：{plugins.add.map((item, index) => {
                                return <span key={index}>{item.build_version}</span>
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
                envs,
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

        } else {
            return [
                <div>
                    服务无变更，无需升级
                </div>
            ]
        }
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
                        this.getUpgradeRecordsInfo()
                    })
                }
            }
        });
    }


    render() {
        const { getFieldDecorator } = this.props.form;
        const { type, infoObj, upgradeVersions, upgradeInfo, upgradeRecords, text, textState, service_id } = this.state;

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
                                        <Select disabled={textState== 1 ? false : true}
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
                                                    const { service, upgrade_info } = item;
                                                    return <Col span={24} className={styles.zslMt + ' ' + (type === service.service_id ? styles.active : '')}
                                                        onClick={() => {
                                                            this.handleType(service.service_id, index)
                                                        }}>
                                                        <div style={{ width: "100%" }}>
                                                            <Checkbox
                                                                disabled={JSON.stringify(upgrade_info) == "{}" ? true : false}
                                                                value={service.service_id}
                                                                style={{ width: "30px" }}
                                                            >
                                                            </Checkbox>
                                                            {service.service_cname}
                                                        </div>
                                                        <div>
                                                            {
                                                                upgradeRecords && upgradeRecords.length > 0 &&
                                                                <div>
                                                                    {
                                                                        (
                                                                            upgradeRecords[index].status == 1 ||
                                                                            upgradeRecords[index].status == 2 ||
                                                                            upgradeRecords[index].status == 4 ||
                                                                            upgradeRecords[index].status == 5) ?
                                                                            <Icon type="sync" style={{ color: "#1890ff" }} spin /> :
                                                                            (upgradeRecords[index].status == 3 || upgradeRecords[index].status == 6) ?
                                                                                <Icon type="check" style={{ color: "#239B24" }} />
                                                                                :
                                                                                <Icon type="close" style={{ color: "red" }} />
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
                            <div className={styles.zslcen}>服务属性变更详情</div>

                            <Row gutter={24} style={{ margin: "10px 20px 20px", height: "400px", overflow: "auto" }}>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={arr}
                                    renderItem={(item, index) => (
                                        // <List.Item actions={item.actions} key={index}>
                                        <List.Item key={index}>
                                            <List.Item.Meta title={item.title} description={item.description} />
                                        </List.Item>
                                    )}
                                />
                            </Row>

                        </div>
                    </Col>
                </Row>
                <Row gutter={24} style={{ textAlign: "center", width: "100%", marginTop: "5px" }}>
                    {
                        ((textState != 1 && textState != 2) || this.props.activeKey == 2) &&
                        <Button type="primary"
                            onClick={this.getUpgradeRollback}
                            style={{ marginRight: "5px" }}
                            disabled={(textState != 1 && textState != 2 && textState != 4) ? false : true}
                        >{text}</Button>
                    }
                    {
                        this.props.activeKey == 1 && <Button type="primary" onClick={this.handleSubmit}
                            disabled={textState != 1 ? true : false}
                            style={{ marginRight: "5px" }}
                        >{text}</Button>
                    }



                    <Button type="primary" onClick={() => {
                        this.props.setInfoShow()
                    }} >返回</Button>
                </Row>
            </div>
        );
    }
}
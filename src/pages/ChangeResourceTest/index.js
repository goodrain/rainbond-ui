/* eslint-disable no-unused-expressions */
import {
    Col,
    Card,
    notification,
    Radio,
    Button
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import ConfirmModal from '../../components/ConfirmModal'

//样式
import styles from './Index.less';

//端口协议
import PointView from '../../components/AppCreateSettingWjd/point';

//环境变量
// import EnvironmentView from '../../components/AppCreateSettingWjd/environment';
import EnvironmentVariable from '../../components/EnvironmentVariable';
//特殊属性
import KubernetesView from '../../components/AppCreateSettingWjd/kubernetes';
//健康状态
import HealthView from '../../components/AppCreateSettingWjd/health';
//部署属性
import DeployView from '../../components/AppCreateSettingWjd/deploy';
//自动伸缩
import FlexibleView from '../../components/AppCreateSettingWjd/flexible';




// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl, application, teamControl, enterprise, loading, global }) => ({
    buildShapeLoading: loading.effects['global/buildShape'],
    editGroupLoading: loading.effects['application/editGroup'],
    deleteLoading: loading.effects['application/delete'],
    currUser: user.currentUser,
    apps: application.apps,
    groupDetail: application.groupDetail || {},
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    novices: global.novices,
    ports: appControl.ports,

}))
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            // 应用名称
            appName: "default",
            // 组件类型
            type: "type1",
            nameOne: true,
            nameTwo: false,
            nameThree: false,
            showDelete: false,
            //
            appDetail: {
                event_websocket_url: "ws://47.104.161.96:6060/event_log",
                is_third: false,
                service: {
                    ID: 3,
                    build_upgrade: true,
                    category: "app_publish",
                    check_event_id: "66e2facffda04f479bdffd4a24461191",
                    check_uuid: "d7495f1d-b861-48bb-a08e-62206ce7c58b",
                    cmd: "",
                    code_from: "image_manual",
                    code_version: null,
                    container_gpu: 0,
                    create_status: "checked",
                    create_time: "2022-06-27 16:22:23",
                    creater: 1,
                    deploy_version: "",
                    desc: "docker run application",
                    docker_cmd: "nginx:1.11",
                    env: ",",
                    expired_time: null,
                    extend_method: "stateless_multiple",
                    git_full_name: null,
                    git_project_id: 0,
                    git_url: null,
                    group_id: 1,
                    group_name: "默认应用",
                    host_path: "/grdata/tenant/11b7480ac2054d89bd4ad6852de6d8e6/service/4bc1a895f55a2e24178bfe9e90a718dd",
                    image: "nginx:1.11",
                    inner_port: 0,
                    is_code_upload: false,
                    is_service: false,
                    is_upgrate: false,
                    is_web_service: false,
                    k8s_component_name: "nginx",
                    language: "",
                    min_cpu: 0,
                    min_memory: 512,
                    min_node: 1,
                    namespace: "11b7480ac2054d89bd4ad6852de6d8e6",
                    oauth_service_id: null,
                    open_webhooks: false,
                    port_type: "multi_outer",
                    protocol: "",
                    secret: null,
                    server_type: "git",
                    service_alias: "gr7a0fc9",
                }
            },
            // 伸缩数据
            flexData: [
                {
                    min_Moudel: '1',
                    max_Moudel: '2',
                    cpu_Use: '3',
                    memory_Use: '4'
                }
            ],
            loading: true
        }
    };
    componentDidMount() {
        // this.loading();
        // this.handleWaitLevel();
    }
    handleJump = target => {
        const { dispatch, appID } = this.props;
        dispatch(
            routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/${target}`
            )
        );
    };
    //切换
    changeType = type => {
        // this.setState({ type });
        // dispatch({
        //     type: 'appControl/fetchDetail',
        //     payload: {
        //         type,
        //     },
        //     callback: data => {
        //         this.setState({ appDetail: data });
        //     },
        //     handleError: data => {
        //         const code = httpResponseUtil.getCode(data);
        //         if (code && code === 404) {
        //             // 应用不存在
        //             this.handleJump(`exception/404`);
        //         }
        //     }
        // });
    };


    loadDetail = () => {
        const { dispatch } = this.props;
        const { team_name, app_alias } = this.fetchParameter();
        //获取 端口协议 信息
        dispatch({
            type: 'appControl/fetchDetail',
            payload: {
                team_name,
                app_alias
            },
            callback: data => {
                this.setState({ appDetail: data });
            },
            handleError: data => {
                const code = httpResponseUtil.getCode(data);
                if (code && code === 404) {
                    // 应用不存在
                    this.handleJump(`exception/404`);
                }
            }
        });
    };
    getAppAlias() {
        return this.props.match.params.appAlias;
    }

    handleBuild = () => {
        // const team_name = globalUtil.getCurrTeamName();
        // const params = this.getParams();
        // this
        //     .props
        //     .dispatch({
        //         type: 'application/buildCompose',
        //         payload: {
        //             team_name: globalUtil.getCurrTeamName(),
        //             ...params
        //         },
        //         callback: () => {
        //             this
        //                 .props
        //                 .dispatch({
        //                     type: 'global/fetchGroups',
        //                     payload: {
        //                     team_name: team_name
        //                     }
        //                 });

        //         }
        //     })
        this
            .props
            .dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/38`))
    }
    handleDelete = () => {
        const params = this.getParams();
        this
            .props
            .dispatch({
                type: 'application/deleteCompose',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    ...params
                },
                callback: () => {
                    this
                        .props
                        .dispatch({
                            type: 'global/fetchGroups',
                            payload: {
                                team_name: globalUtil.getCurrTeamName()
                            }
                        });
                    this
                        .props
                        .dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`))
                }
            })
    }
    showDelete = () => {
        this.setState({ showDelete: true })
    }

    render() {
        const {
            type,
            nameOne,
            nameTwo,
            nameThree,
            appDetail,
            //伸缩
            flexData,
        } = this.state;
        const {
            ports,
        } = this.props;
        if (!appDetail.service) {
            return null;
        }
        return (
            <div>
                <Col
                    style={{ paddingleft: '12px', width: "95%", display: "flex" }}
                >
                    <div className={styles.topTittle}>应用名称：{this.state.appName}</div>
                    <div style={{ display: "inline-block", width: "100%" }}>
                        <div style={{ height: "50px" }}></div>
                        <div className={styles.contantMoudel}>
                            <Card style={{ padding: "34px 0 17px 17px" }}>
                                <Radio.Group className={styles.buttonGroup}>
                                    {nameOne ? (
                                        <Radio.Button
                                            className={styles.TitleButtonAct}
                                            style={{ textAlign: 'center' }}
                                            onClick={() => {
                                                this.changeType('type1');
                                                this.setState({
                                                    nameOne: true,
                                                    nameTwo: false,
                                                    nameThree: false
                                                });
                                            }}
                                            disabled
                                        >
                                            组件名称1
                                        </Radio.Button>
                                    ) : (
                                        <Radio.Button
                                            className={styles.TitleButton}
                                            style={{ textAlign: 'center' }}
                                            onClick={() => {
                                                this.changeType('type1');
                                                this.setState({
                                                    nameOne: true,
                                                    nameTwo: false,
                                                    nameThree: false
                                                });
                                            }}
                                        >
                                            组件名称1
                                        </Radio.Button>
                                    )}
                                    {nameTwo ? (
                                        <Radio.Button
                                            className={styles.TitleButtonAct}
                                            style={{ textAlign: 'center' }}
                                            onClick={() => {
                                                this.changeType('type2');
                                                this.setState({
                                                    nameOne: false,
                                                    nameTwo: true,
                                                    nameThree: false
                                                });
                                            }}
                                            disabled
                                        >
                                            组件名称2
                                        </Radio.Button>
                                    ) : (
                                        <Radio.Button
                                            className={styles.TitleButton}
                                            style={{ textAlign: 'center' }}
                                            onClick={() => {
                                                this.changeType('type2');
                                                this.setState({
                                                    nameOne: false,
                                                    nameTwo: true,
                                                    nameThree: false
                                                });
                                            }}
                                        >
                                            组件名称2
                                        </Radio.Button>
                                    )}
                                    {nameThree ? (
                                        <Radio.Button
                                            className={styles.TitleButtonAct}
                                            style={{ textAlign: 'center' }}
                                            onClick={() => {
                                                this.changeType('type3');
                                                this.setState({
                                                    nameOne: false,
                                                    nameTwo: false,
                                                    nameThree: true
                                                });
                                            }}
                                            disabled
                                        >
                                            组件名称3
                                        </Radio.Button>
                                    ) : (
                                        <Radio.Button
                                            className={styles.TitleButton}
                                            style={{ textAlign: 'center' }}
                                            onClick={() => {
                                                this.changeType('type3');
                                                this.setState({
                                                    nameOne: false,
                                                    nameTwo: false,
                                                    nameThree: true
                                                });
                                            }}
                                        >
                                            组件名称3
                                        </Radio.Button>
                                    )}
                                </Radio.Group>
                            </Card>
                        </div>

                        {/* 部署属性 */}
                        <div className={styles.contantMoudel1}>
                            <DeployView
                                appDetail={appDetail}
                            />
                        </div>

                        {/* 端口管理 */}
                        <div className={styles.contantMoudel2}>
                            {/* <Port */}
                            <PointView
                                // updateDetail={this.loadDetail}
                                appDetail={appDetail}
                            // componentPermissions={isEnv, isRely, isStorage, isPort}

                            />
                        </div>
                        {/* 环境变量 */}
                        <div className={styles.contantMoudel3}>
                            <EnvironmentVariable
                                title="环境变量"
                                type="Inner"
                                appAlias={appDetail.service.service_alias}
                            />
                        </div>
                        {/* 伸缩 */}
                        <div className={styles.contantMoudel4}>
                            <FlexibleView
                                flexData={flexData}
                            />
                        </div>
                        {/* 健康 */}
                        <div className={styles.contantMoudel5}>
                            <HealthView />
                        </div>
                        {/* 特殊属性 */}
                        <div className={styles.contantMoudel6}>
                            <KubernetesView />
                        </div>

                    </div>

                </Col >
                <div
                    style={{
                        background: '#fff',
                        padding: '20px',
                        textAlign: 'right',
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 2,
                        borderTop: '1px solid #e8e8e8'
                    }}>
                    <Button
                        style={{
                            marginRight: 8
                        }}
                        onClick={this.handleBuild}
                        type="primary">确认创建</Button>
                    <Button onClick={this.showDelete} type="default">放弃创建</Button>
                </div>
                {this.state.showDelete && <ConfirmModal
                    onOk={this.handleDelete}
                    title="放弃创建"
                    subDesc="此操作不可恢复"
                    desc="确定要放弃创建此组件吗？"
                    onCancel={() => {
                        this.setState({ showDelete: false })
                    }} />}

            </div>
        );
    }
}
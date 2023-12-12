/* eslint-disable no-unused-expressions */
import {
    Tabs,
    Button,
    Spin,
    Empty
} from 'antd';
import { object } from 'prop-types';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent, Fragment } from 'react';
import DeployAttribute from '../../components/DeployAttribute'
import PortAttribute from '../../components/PortAttribute'
import EnvVariable from '../../components/EnvVariable'
import ConfigurationFiles from "../../components/ConfigurationFiles"
import FlexAttribute from '../../components/FlexAttribute'
import HealthAttribute from "../../components/HealthAttribute"
import SpecialAttribute from '../../components/SpecialAttribute'
import Kubernetes from "../../components/KubernetesAttribute"
import CustomFooter from "../../layouts/CustomFooter";
import globalUtil from '../../utils/global'
import styles from './index.less'
const { TabPane } = Tabs;
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            switch: false,
            resourcesVal: {},
            tabKey: '0',
            eventId: '',
            groupId: '',
            deploymentLoading: false,
            helmInfo: {},
            type: '',
            localImageList: [],
        }
    }

    componentDidMount() {
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || ''
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || ''
        const type = this.props.location && this.props.location.query && this.props.location.query.type || ''
        const obj = JSON.parse(window.sessionStorage.getItem('helmInfo'));
        this.setState({
            eventId: event_id,
            groupId: group_id,
            helmInfo: obj,
            type: type
        }, () => {
            if (type == 'helm') {
                this.handleHelmResourcesRequest()
                this.handleGetImageRepositories()
            } else {
                this.resourcesRequest();
            }
        })
    }
    handleGetImageRepositories = () => {
        const { dispatch } = this.props
        dispatch({
            type: 'createApp/getImageRepositories',
            payload: {
                team_name: globalUtil.getCurrTeamName()
            },
            callback: data => {
                if (data) {
                    this.setState({
                        localImageList: data.list
                    });
                }
            }
        })
    }
    callback = (key) => {
        this.setState({
            tabKey: key
        })
    }

    resourcesRequest = () => {
        const { dispatch } = this.props
        const { eventId, groupId } = this.state
        const teamName = globalUtil.getCurrTeamName();
        dispatch({
            type: "teamControl/getAdvancedInformation",
            payload: {
                team_name: teamName,
                event_id: eventId,
                group_id: groupId,
            },
            callback: (data) => {
                this.setState({
                    switch: !this.state.switch,
                    resourcesVal: data.bean,
                }, () => {
                    const { resourcesVal } = this.state
                    if (resourcesVal && resourcesVal.convert_resource && resourcesVal.convert_resource.length > 0) {
                        this.setState({
                            tabKey: '0'
                        })
                    } else {
                        this.setState({
                            tabKey: 'k8s'
                        })
                    }
                })
            },
        });
    }
    handleHelmResourcesRequest = () => {
        const { dispatch } = this.props
        const { helmInfo, eventId, groupId } = this.state
        dispatch({
            type: "teamControl/getHelmAdvancedInfo",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                event_id: eventId,
                group_id: groupId,
                name: helmInfo.info.name,
                version: helmInfo.info.Version,
                overrides: helmInfo.overrides,
            },
            callback: (data) => {
                console.log(data.bean, 'data')
                this.setState({
                    switch: !this.state.switch,
                    resourcesVal: data.bean,
                }, () => {
                    const { resourcesVal } = this.state
                    if (resourcesVal && resourcesVal.convert_resource && resourcesVal.convert_resource.length > 0) {
                        this.setState({
                            tabKey: '0'
                        })
                    } else {
                        this.setState({
                            tabKey: 'k8s'
                        })
                    }
                })
            },
        })
    }
    handerClick = () => {
        const { dispatch } = this.props;
        const { eventId, groupId, type } = this.state
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        if (type == 'helm') {
            dispatch(
                routerRedux.push(
                    `/team/${teamName}/region/${regionName}/apps/${groupId}/helminstall?installPath=upload&event_id=${eventId}`
                )
            );
        } else {
            dispatch(
                routerRedux.push(
                    `/team/${teamName}/region/${regionName}/importMessageYaml?event_id=${eventId}&group_id=${groupId}`
                )
            )
        }

    }
    // 保存子组件修改的数据
    saveChildData = (key, imageName) => {
        const { resourcesVal } = this.state
        resourcesVal.convert_resource.length > 0 &&
            resourcesVal.convert_resource.map((item, index) => {
                if (index == key) {
                    item.basic_management.image = imageName
                }
            })
        this.setState({
            resourcesVal: resourcesVal
        })
    }



    nextStep = () => {
        const { dispatch } = this.props;
        const { eventId, groupId, type, resourcesVal } = this.state
        this.setState({
            deploymentLoading: true,
        })
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        if (type == 'helm') {
            console.log(resourcesVal,'resourcesVal')
            dispatch({
                type: "createApp/installHelmUploadApp",
                payload: {
                    team_name: teamName,
                    group_id: groupId,
                    resource: resourcesVal
                },
                callback: (data) => {
                    console.log(data, 'data')
                    this.setState({
                        deploymentLoading: false,
                    })
                    dispatch(routerRedux.push(
                        `/team/${teamName}/region/${regionName}/apps/${groupId}`
                    ))
                }
            })
        } else {
            dispatch({
                type: "teamControl/confirmTheImport",
                payload: {
                    team_name: teamName,
                    event_id: eventId,
                    group_id: groupId,
                },
                callback: (data) => {
                    if (data && data.response_data && data.response_data.code == 200) {
                        this.setState({
                            deploymentLoading: false,
                        })
                        dispatch(routerRedux.push(
                            `/team/${teamName}/region/${regionName}/apps/${groupId}`
                        ))
                    }

                },
            });
        }
    }


    render() {
        const { resourcesVal, tabKey, deploymentLoading, type, localImageList } = this.state
        const moduleArrs = resourcesVal.convert_resource
        console.log(resourcesVal, 'arr')
        const k8sArr = resourcesVal.kubernetes_resources
        const bool = (moduleArrs || k8sArr) ? false : true
        return (
            <Fragment>
                <Spin tip="Loading..."
                    size='large'
                    spinning={this.state.deploymentLoading}
                    style={{ marginTop: '500px' }}
                >
                    <div className={styles.all_style}>
                        <h3>高级资源</h3>

                        <div className={styles.tabs_value}>
                            {this.state.switch ? (
                                <>
                                    {bool ? (
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: '300px' }} />
                                    ) : (
                                        <Tabs
                                            activeKey={this.state.tabKey}
                                            ref={(e) => { this._Tabs = e }}
                                            onChange={this.callback}
                                        >
                                            {moduleArrs && moduleArrs.length > 0 &&
                                                moduleArrs.map((item, index) => {
                                                    return <TabPane
                                                        tab={item.components_name}
                                                        key={index}
                                                    >
                                                        {/* 部署属性 */}
                                                        <DeployAttribute
                                                            typeHelm={type}
                                                            indexKey={index}
                                                            localImageList={localImageList}
                                                            value={item.basic_management}
                                                            saveChildData={this.saveChildData}
                                                        />
                                                        {/* 端口属性 */}
                                                        <PortAttribute value={item.port_management} />
                                                        {/* 环境变量 */}
                                                        <EnvVariable value={item.env_management} />
                                                        {/* 配置文件 */}
                                                        <ConfigurationFiles value={item.config_management} />
                                                        {/* 自动伸缩 */}
                                                        <FlexAttribute value={item.telescopic_management} />
                                                        {/* 健康检测 */}
                                                        <HealthAttribute value={item.health_check_management} />
                                                        {/* 特殊属性 */}
                                                        <SpecialAttribute value={item.component_k8s_attributes_management} />
                                                    </TabPane>
                                                })
                                            }
                                            <TabPane tab="k8s资源" key="k8s">
                                                <Kubernetes value={k8sArr} />
                                            </TabPane>
                                        </Tabs>
                                    )}
                                </>

                            ) : (
                                <div className={styles.loading}>
                                    <Spin size="large" />
                                </div>
                            )}
                        </div>
                    </div>
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
                            style={{ marginRight: 8 }}
                            onClick={this.handerClick}
                            type="default">
                            上一步
                        </Button>
                        <Button
                            style={{ marginRight: 8 }}
                            onClick={this.nextStep}
                            type="primary">
                            部署
                        </Button>
                    </div>
                </Spin>
                <CustomFooter />
            </Fragment>
        );
    }
}

export default Index;

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
            deploymentLoading:false
        }
    }
    callback = (key) => {
        this.setState({
            tabKey: key
        })
    }
    componentWillMount() {
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || ''
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || ''
        this.setState({
            eventId: event_id,
            groupId: group_id,
        })
    }
    componentDidMount() {
        this.resourcesRequest();
    }
    resourcesRequest = () => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName();
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || ''
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || ''
        dispatch({
            type: "teamControl/getAdvancedInformation",
            payload: {
                team_name: teamName,
                event_id: event_id,
                group_id: group_id,
            },
            callback: (data) => {
                this.setState({
                    switch: !this.state.switch,
                    resourcesVal: data.list,
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
    handerClick = () => {
        const { dispatch } = this.props;
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || '';
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || '';
        dispatch(routerRedux.push(
            `/team/${teamName}/region/${regionName}/importMessageYaml?event_id=${event_id}&group_id=${group_id}`
        ))
    }
    nextStep = () => {
        const {
            dispatch,
        } = this.props;
        this.setState({
            deploymentLoading:true,
        })
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || '';
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || '';
        dispatch({
            type: "teamControl/confirmTheImport",
            payload: {
                team_name: teamName,
                event_id: event_id,
                group_id: group_id,
            },
            callback: (data) => {
                if (data && data.response_data && data.response_data.code == 200) {
                    this.setState({
                        deploymentLoading:false,
                    })
                    dispatch(routerRedux.push(
                        `/team/${teamName}/region/${regionName}/apps/${group_id}`
                    ))
                }

            },
        });

    }

    render() {
        const { resourcesVal, tabKey, deploymentLoading } = this.state
        const moduleArrs = resourcesVal.convert_resource
        const k8sArr = resourcesVal.kubernetes_resources
        const bool = (moduleArrs || k8sArr) ? false : true
        return (
            <Fragment>
                <Spin tip="Loading..." 
                spinning={this.state.deploymentLoading} 
                style={{marginTop:'500px'}}
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
                                                    <DeployAttribute value={item.basic_management} />
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
            </Fragment>
        );
    }
}

export default Index;

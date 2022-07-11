/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { 
    Button,
    Card, 
    Form, 
    Input, 
    Row, 
    Steps, 
    Select, 
    Collapse, 
    Icon, 
    Affix, 
    Table, 
    Col, 
    Radio, 
    Switch, 
    Tabs, 
    ConfigProvider 
 } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import styles from './index.less';
import globalUtil  from "../../../utils/global"
import Jiankang from './component/healthAttributes'
// import HealthAttribute from "../../../components/HealthAttribute"
import Duankou from './component/portAttribute'
// import PortAttribute from '../../../components/PortAttribute'
import Huanjing from "./component/envVariable"
// import EnvVariable from '../../../components/EnvVariable'
import Peizhi from "./component/configurationFiles"
// import ConfigurationFiles from '../../../components/ConfigurationFiles'
import Bushu from "./component/deployAttributes"
// import DeployAttributes from "../../../components/DeployAttribute"
import Shensuo from "./component/flexAttributes"
// import FlexAttributes from '../../../components/FlexAttribute'
import Teshu from "./component/specialAttributes"
// import SpecialAttributes from '../../../components/SpecialAttribute'
import Ziyuan from "./component/kbsziyuan"
import { object } from 'prop-types';
import { log } from 'lodash-decorators/utils';
import kbsziyuan from './component/kbsziyuan';
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;
const FormItem = Form.Item;
@connect(null, null, null, { withRef: true })
export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            module: {},//所有数据
            appnameArr: [],//app名称数组
            moduleArr: [],//组件数组内容
            minmoduleArr: {},//单个组件内容
            type: 0,
            index:'0'
        };
    }
    // 团队按钮点击
    handleType = (item, index) => {
        const { module, minmoduleArr} = this.state
        if(module.[item] != null){
            this.setState({
                moduleArr: module.[item],
                minmoduleArr:module.[item][0],
            })
        }else{
            this.setState({
                moduleArr: [],
                minmoduleArr:[],
            })
        }
        this.setState({
            type: index,
        });
        if(minmoduleArr != null){
            this.setState({
                index:'0',
            })
        }else{
            this.setState({
                index:"hello",
            })
        }
    }
    // tabs切换
    tabSwitch = (key) => {
        const {moduleArr, index} = this.state
        this.setState({
            index:key
        })
        if(key === "hello"){
        }else{
            this.setState({
                minmoduleArr: moduleArr[key],
            });
        }

    }

    componentDidMount() {
        this.first()
    }
    // 进入页面发送请求获取app数据
    first() {
        const {
            dispatch,
            match: {
                params: { eid }
            },
        } = this.props;
        dispatch({
            type: 'region/fetchNameSpaceAdvancedResource',
            payload: {
                eid: this.props.location.query.id,
                region_id: this.props.location.query.region_id,
                namespace: this.props.location.query.namespace
            },
            callback: res => {
                const appname = Object.keys(res.bean)
                const arr = appname.reverse
                this.setState({
                    appnameArr: arr,
                    module: res.bean
                })
            }
        })

    }
    // 确认创建
    handleBuild = () => {
        this
            .props
            .dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`))
    }
    // 取消框显示
    showDelete = () => {
        this.setState({ showDelete: true })
    }
    // 上一步
    nextStep = () => {
        const str = this.props.location.query.id
        const region_id = this.props.location.query.region_id
        // const namespace = this.props.location.query.namespace
        this
            .props
            .dispatch(routerRedux.replace(`/enterprise/${str}/importMessage?region_id=${region_id}`))
    }
    render() {
        const { zujian, type, appvalue, appnameArr, moduleArr, minmoduleArr ,index} = this.state;
        console.log(index,"index");
        // 配置文件
        const volumes = [{
            ID: 42,
            access_mode: "RWX",
            allow_expansion: false,
            backup_policy: "exclusive",
            category: "application",
            file_content: "ajhfdajkshfd",
            host_path: "/grdata/tenant/11acafebd64c4f8292d5a02e9d91e8e0/service/284781606a581bd6ff8e545eafd748b7/ss/ss",
            mode: 777,
            reclaim_policy: "exclusive",
            service_id: "284781606a581bd6ff8e545eafd748b7",
            share_policy: "exclusive",
            status: "not_bound",
            volume_capacity: 0,
            volume_name: "xx",
            volume_path: "/ss/ss",
            volume_provider_name: "",
            volume_type: "config-file",
        }]
        return (
            <div>
                <h2>团队名称：
                    {/* {namespace} */}
                    </h2>
                <h3 className={styles.applist}>应用列表：</h3>
                <div className={styles.typeBtnWrap}>
                    <Affix offsetTop={0}>
                        <div className={styles.fixed}>
                            {
                                appnameArr.map((item, index) => {
                                    if(module.[item] != null){
                                        return <span key={index}
                                        className={`${styles.typeBtn}  ${type === index ? styles.active : ""}`}
                                        onClick={() => {
                                            this.handleType(item, index);
                                        }}
                                    >
                                        {item}
                                        <Icon type="right" />
                                    </span>
                                    }
                                   
                                })
                            }
                        </div>
                    </Affix>
                </div>
                <div id='box'>
                    <div className={styles.alltable}>
                        <Tabs 
                        onChange={this.tabSwitch}  
                        activeKey={this.state.index}
                        // ref={(e) => { this._Tabs = e }}
                         >
                        
                            {moduleArr && moduleArr.length > 0 && moduleArr.map((item, index) => {
                                return <TabPane tab={item.components_name} key={`${index}`}>
                                    {/* ConfigProvider */}
                                    <ConfigProvider>
                                    {/* 部署属性 */}
                                    {
                                        <Bushu
                                            appvalue={minmoduleArr.basic_management}
                                        />
                                    }
                                    {/* 端口管理 */}
                                    {
                                        <Duankou
                                            app={minmoduleArr.port_management}
                                        />
                                    }
                                    {/* 环境变量 */}
                                    {
                                        <Huanjing
                                        env_management = {minmoduleArr.env_management}
                                        />
                                    }
                                    {/* 配置文件 */}

                                    {
                                        <Peizhi
                                            // volumes={volumes}
                                        />
                                    }

                                    {/* 自动伸缩 */}
                                    {
                                        <Shensuo
                                        telescopic_management={minmoduleArr.telescopic_management}
                                        />
                                    }
                                    {/* 健康监测 */}
                                    {
                                        <Jiankang
                                        startProbe={minmoduleArr.health_check_management}
                                        />
                                    }
                                    {/* 特殊属性 */}
                                    {
                                        <Teshu />
                                    }
                                    </ConfigProvider>
                                </TabPane>
                            })}
                            <TabPane tab="k8s资源" key="hello">
                                {/* kbs资源 */}
                                <Ziyuan />
                            </TabPane>
                        </Tabs>
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
                        style={{
                            marginRight: 8
                        }}
                        onClick={this.nextStep} type="default">上一步</Button>
                    <Button
                        style={{
                            marginRight: 8
                        }}
                        onClick={this.handleBuild}
                        type="primary">确认导入</Button>
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

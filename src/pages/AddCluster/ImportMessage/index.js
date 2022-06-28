/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import styles from './index.less';
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
@Form.create()
@connect(({ user, list, loading, global, index, region }) => ({
    user: user.currentUser,
    list,
    loading: loading.models.list,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise,
    isRegist: global.isRegist,
    oauthLongin: loading.effects['global/creatOauth'],
    overviewInfo: index.overviewInfo,
    baseConfiguration: region.base_configuration
}))
export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        const { user } = this.props;
        const adminer = userUtil.isCompanyAdmin(user);
        this.state = {
            adminer,
            text: '这是折叠面板',
            nameSpaceArr: [],
        };
    }
    componentWillMount() {
        const { adminer } = this.state;
        const { dispatch } = this.props;
        if (!adminer) {
            dispatch(routerRedux.push(`/`));
        }
    }
    componentDidMount() { 
        this.handleNameSpace()
    }
    //NameSpace列表
    handleNameSpace = () => {
        const { 
            dispatch, 
            match: {
                params: { eid }
            },
        } = this.props;
        dispatch({
            type:'region/fetchImportMessage',
            payload:{
                eid,
                region_id:this.props.location.query.region_id
            },
            callback:res => {
                console.log(res,'res')
                this.setState({
                    nameSpaceArr:res.bean
                })
                this.handleResource(res.bean[0])
            }
        })
    }
    //资源数据列表
    handleResource = (namespace) => {
        const { 
            dispatch, 
            match: {
                params: { eid }
            },
        } = this.props;
        dispatch({
            type:'region/fetchNameSpaceResource',
            payload:{
                eid,
                region_id:this.props.location.query.region_id,
                namespace
            },
            callback:res => {
                console.log(res,'res')
            }
        })
    }
    handleChange = (value) => {
        console.log(value, 'value')
        this.handleResource(value)
        
    }
    //折叠面板图标
    genExtra = () => (
        <Icon
          onClick={event => {
            // If you don't want click extra trigger collapse, you can prevent this:
            event.stopPropagation();
          }}
        />
    );
    //折叠面板处罚方法
    callback = (key) => {
        console.log(key,'key')
    }
    render() {
        const {
            match: {
                params: { eid }
            },
        } = this.props;
        
        const { text, nameSpaceArr } = this.state
        console.log(nameSpaceArr,'nameSpaceArr')
        const error = (
            <svg 
                t="1656054288307" 
                class="icon" 
                viewBox="0 0 1024 1024" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                p-id="15601" 
                width="20" 
                height="20">
                <path 
                    d="M839 73.9c-1.2-2.4-3.7-9.8-7.4-9.8s-11.1 8.6-13.5 12.3l-13.5 12.3c-7.4-6.1-35.6-23.4-43-23.4-11.1 0-104.6 113.2-118.1 129.1l-60.2 68.8-30.7 38.1-43.1-83.6-50.4-100.8c-4.9-9.8-8.6-22.1-22.1-22.1-7.3 0-9.8 3.6-13.5 9.8-3.7 4.9-3.7 4.9-11.1 8.6-8.6 0-12.3 0-19.7 6.2-6.2-4.9-11.1-11.1-19.7-11.1-3.7 0-6.2 1.2-8.6 3.6l-8.6 7.4c-4.8 6.1-15.9 17.2-15.9 25.8 0 11 9.8 31.9 13.5 41.8l90.9 250.8-14.7 17.3c-66.4 79.8-159.8 190.5-210.2 279l-29.5 50.4c-8.6 14.7-29.5 44.3-29.5 60.2 0 3.7 3.8 6.2 6.2 8.6 8.6 7.3 3.6 14.7 1.2 24.5-2.5 7.4-3.7 12.3-3.7 19.7 0 13.5 11.1 27 18.5 38.1 7.3 12.2 9.9 24.5 25.8 24.5 17.2 0 49.2-3.6 63.9-14.7l243.4-377.5 115.6 178.5c6.1 9.8 30.7 54.1 46.7 54.1 14.8 0 38.1-16.1 40.6-30.8-2.6-4.9-6.2-12.3-6.2-17.2 0-7.5 19.7-14.9 24.6-19.7v-9.9c8.6-3.7 13.5-8.6 17.2-17.2l-95.9-205.3-38.2-76.3 13.6-19.7 174.6-225.9c11-14.8 28.3-38.1 41.8-50.4 4.9-5 13.5-12.3 13.5-19.7 0-8.6-19.7-22.1-24.6-34.4z" 
                    p-id="15602" 
                    fill="#d81e06"
                >
                </path>
            </svg>
        )
        const success = (
            <svg 
                t="1656054402655" 
                class="icon" 
                viewBox="0 0 1024 1024" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                p-id="17312" 
                width="20" 
                height="20">
                <path 
                    d="M60.217477 633.910561c0 0 250.197342 104.557334 374.563838 330.628186 149.378146-279.762705 436.109566-540.713972 521.05012-560.013527 0-115.776863 0-163.394371 0-341.442486-342.237595 226.070852-506.576477 642.342604-506.576477 642.342604l-180.049702-191.614086L60.217477 633.910561z" 
                    p-id="17313" 
                    fill="#1afa29"
                >
                </path>
            </svg>
        )
        return (
            <PageHeaderLayout
                title="导入资源"
                content=""
            >
                {/* NameSpace */}
                <Card style={{ padding: '24px 12px' }}>
                    <Row type="flex" style={{ alignItems: 'center', padding: '24px 0px' }}>
                        <div style={{ width: '120px', textAlign: 'right' }}><h3 style={{marginBottom: '0em'}}>NameSpace：</h3></div>
                        <Select placeholder={nameSpaceArr[0]} style={{ width: 200 }} onChange={this.handleChange}>
                        {nameSpaceArr.length > 0 && nameSpaceArr.map(item=>{
                            return(
                                <Option value={item}>{item}</Option>
                            )
                        })}      
                        </Select>
                    </Row>
                    <Row type="flex" style={{ width:'100%', padding: '24px 0px',minHeight:'400px' }}>
                        <div style={{ width: '120px', textAlign: 'right' }}><h3>资源列表：</h3> </div>
                        <Row className={styles.importCard}>
                            <Collapse
                                defaultActiveKey={[1,2,3]}
                                onChange={this.callback}
                                expandIconPosition='right'
                            >
                                <Panel header="label: app=rainbond-operator" key="1" extra={this.genExtra()}>
                                    <Row type="flex" style={{ width:'100%' }}>
                                        <div className={styles.resource}>
                                            <div className={styles.WorkLoads}>
                                                <h2>WorkLoads:</h2>
                                                <div className={styles.WorkLoads_value}>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>DeployMents：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                        <div className={styles.zhichi}>
                                                            {success}
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>Daemonsets：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>Jobs：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>CronJobs：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}> StatefulSets：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.miscellaneous_assets}>
                                                <h2>其他资源:</h2>
                                                <div className={styles.WorkLoads_value}>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}> Services：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>PersistentVolumeClaims：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>Ingresses：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>NetworkPolicies：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>ConfigMaps：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>secrets：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>ServiceAccounts：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>RoleBindings：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>HorizontalPodAutoscalers：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.box}>
                                                        <div className={styles.leftKey}>Roles：</div>
                                                        <div className={styles.rightValue}>
                                                            <div className={styles.value}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.is_support}>
                                                <h2>是否支持</h2>  
                                                <div>
                                                    {error}
                                                </div>
                                                <div>
                                                    {success}
                                                </div>
                                        </div>
                                    </Row>
                                </Panel>
                                {/* <Panel header="label: app=rainbond-operator" key="2" extra={this.genExtra()}>
                                    <div>{text}</div>
                                </Panel>
                                <Panel header="无label应用" key="3" extra={this.genExtra()}>
                                    <div>{text}</div>
                                </Panel> */}
                            </Collapse>
                        </Row>
                    </Row>
                </Card>
            </PageHeaderLayout>
        );
    }
}


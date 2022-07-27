/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Checkbox, Tooltip, Empty, Spin } from 'antd';
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
            resourceData: {},
            resourceDataIndex:[],
            namespace: '',
            loadingSwitch: true,
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
            type: 'region/fetchImportMessage',
            payload: {
                eid,
                region_id: this.props.location.query.region_id
            },
            callback: res => {
                this.setState({
                    nameSpaceArr: res.bean,
                    namespace: res.bean[0]
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
            type: 'region/fetchNameSpaceResource',
            payload: {
                eid,
                region_id: this.props.location.query.region_id,
                namespace
            },
            callback: res => {
                this.setState({
                    resourceData: res.bean,
                    loadingSwitch: false
                }, () => {
                    const { resourceData,  resourceDataIndex} = this.state
                    const arr = Object.keys(resourceData).map((item) => {
                        return resourceData[item]
                               
                    })
                })
            }
        })
    }
    handleChange = (value) => {
        this.handleResource(value)
        this.setState({
            resourceDataIndex:[],
            namespace: value,
            loadingSwitch: true
        })
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
    //折叠面板触发方法
    callback = (key) => {
    }
    //下一步
    onNext = () => {
        const { dispatch,
            match: {
                params: { eid }
            },
        } = this.props
        const region_id = this.props.location.query && this.props.location.query.region_id
        dispatch(routerRedux.push(`/enterprise/${eid}/ResourceConversion?region_id=${region_id}&namespace=${this.state.namespace}`));
    }
    render() {
        const {
            match: {
                params: { eid }
            },
        } = this.props;
        const { text, nameSpaceArr, resourceData, loadingSwitch, resourceDataIndex } = this.state
        console.log(resourceDataIndex,"resourceDataIndex");
        return (
            <PageHeaderLayout
                title="导入资源"
                content=""
            >
                {/* NameSpace */}
                <Card style={{ padding: '24px 12px' }}>
                    <Row type="flex" style={{ alignItems: 'center', padding: '24px 0px' }}>
                        <div style={{ width: '120px', textAlign: 'right' }}><h3 style={{ marginBottom: '0em' }}>NameSpace：</h3></div>
                        <Select placeholder={nameSpaceArr[0]} style={{ width: 200 }} onChange={this.handleChange}>
                            {nameSpaceArr.length > 0 && nameSpaceArr.map(item => {
                                return (
                                    <Option value={item}>{item}</Option>
                                )
                            })}
                        </Select>
                    </Row>
                    <Row type="flex" style={{ width: '100%', padding: '24px 0px', minHeight: '400px' }}>
                        <div style={{ width: '120px', textAlign: 'right' }}><h3>资源列表：</h3></div>
                        {loadingSwitch ? (
                            <div className={styles.loadingstyle}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <Row className={styles.importCard}>
                                {resourceData && Object.keys(resourceData).length > 0 ? (<Collapse
                                    defaultActiveKey={ resourceDataIndex }
                                    onChange={this.callback}
                                    expandIconPosition='right'
                                >
                                    {resourceData && Object.keys(resourceData).map((item, index) => {
                                        let resourceDataItem = resourceData[item];
                                        resourceDataIndex.push(index)
                                        return (
                                            <Panel
                                                header={
                                                    <div>label: app={item === "unclassified" ? "未分组" : item}</div>
                                                }
                                                key={index}
                                                extra={this.genExtra()}
                                            >
                                                <Row type="flex" style={{ width: '100%' }}>
                                                    <div className={styles.resource}>
                                                        <div className={styles.WorkLoads}>
                                                            <div className={styles.WorkLoads_value}>
                                                                {resourceDataItem.workloads && Object.keys(resourceDataItem.workloads).map((workloadItem, index) => {
                                                                    let workloads = resourceDataItem.workloads[workloadItem]
                                                                    return (
                                                                        <div className={styles.box}>
                                                                            <div className={styles.leftKey}>{workloadItem}：</div>
                                                                            <div className={styles.rightValue}>
                                                                                {workloads.length > 0 && workloads.map((itemValue) => {
                                                                                    return (
                                                                                        <Tooltip title={itemValue}>
                                                                                            <div className={styles.value}>{itemValue}</div>
                                                                                        </Tooltip>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className={styles.miscellaneous_assets}>
                                                            <div className={styles.WorkLoads_value}>
                                                                {resourceDataItem.others && Object.keys(resourceDataItem.others).map((othersItem) => {
                                                                    let others = resourceDataItem.others[othersItem]
                                                                    return (
                                                                        <div className={styles.box}>
                                                                            <div className={styles.leftKey}>{othersItem}：</div>
                                                                            <div className={styles.rightValue}>
                                                                                {others.length > 0 && others.map((valueItem) => {
                                                                                    return (
                                                                                        <Tooltip title={valueItem}>
                                                                                            <div className={styles.value}>{valueItem}</div>
                                                                                        </Tooltip>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Row>
                                            </Panel>
                                        )
                                    })}
                                </Collapse>) : (<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />)}
                            </Row>

                        )}

                    </Row>
                    <Row style={{ textAlign: 'center' }}>
                        <Button type="primary" onClick={this.onNext} style={{ marginLeft: '120px', padding: '0px 36px' }}>
                            下一步
                        </Button>
                    </Row>
                </Card>
            </PageHeaderLayout>
        );
    }
}


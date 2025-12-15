/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Checkbox, Tooltip, Empty, Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import global from '@/utils/global';
import styles from './index.less';
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
@Form.create()

@connect(({ user, list, loading, global, index, region, enterprise, team }) => ({
    user: user.currentUser,
    list,
    loading: loading.models.list,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise,
    isRegist: global.isRegist,
    oauthLongin: loading.effects['global/creatOauth'],
    overviewInfo: index.overviewInfo,
    baseConfiguration: region.base_configuration,
    team: team
}))

export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        const { user } = this.props;
        const adminer = userUtil.isCompanyAdmin(user);
        this.state = {
            adminer,
            nameSpaceArr: [],
            resourceData: {},
            resourceDataIndex: [],
            namespace: '',
            loadingSwitch: true,
        };
    }

    componentDidMount() {
        this.handleNameSpace()
    }
    //NameSpace列表
    handleNameSpace = () => {
        const {
            dispatch
        } = this.props;
        const regionId = (this.props.region_id
            ? this.props.region_id
            : this.props.overviewInfo.region_id )
        const eid = this.props.eid
            ? this.props.eid
            : this.props.enterprise?.enterprise_id
        dispatch({
            type: 'region/fetchImportMessage',
            payload: {
                eid: eid,
                region_id: regionId
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
        const { dispatch } = this.props
        const regionId = this.props.region_id
            ? this.props.region_id
            : this.props.overviewInfo.region_id
        const eid = this.props.eid
            ? this.props.eid
            : this.props.overviewInfo.eid
        dispatch({
            type: 'region/fetchNameSpaceResource',
            payload: {
                eid: eid,
                region_id: regionId,
                namespace
            },
            callback: res => {
                this.setState({
                    resourceData: res.bean,
                    loadingSwitch: false
                }, () => {
                    const { resourceData, resourceDataIndex } = this.state
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
            resourceDataIndex: [],
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
        const { dispatch } = this.props
        const regionId = this.props.region_id
            ? this.props.region_id
            : this.props.overviewInfo.region_id
        const eid = this.props.eid
            ? this.props.eid
            : this.props.overviewInfo.eid
        dispatch(routerRedux.push(`/enterprise/${eid}/ResourceConversion?region_id=${regionId}&namespace=${this.state.namespace}`));
    }
    render() {
        const { nameSpaceArr, resourceData, loadingSwitch, resourceDataIndex, namespace } = this.state
        return (
            <Card 
                style=
                {{ 
                padding: '24px 12px' ,
                borderRadius: 5,
                }}>
                <Row type="flex" style={{ alignItems: 'center', padding: '24px 0px' }}>
                    <div style={{ width: '120px', textAlign: 'right' }}><h3 className={styles.rbd_sub_title}>NameSpace：</h3></div>
                    <Select 
                        showSearch
                        filterOption={(input, option) => 
                          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        } 
                        placeholder={nameSpaceArr[0]} 
                        style={{ width: 200 }} 
                        onChange={this.handleChange}
                    >
                        {nameSpaceArr.length > 0 && nameSpaceArr.map(item => {
                            return (
                                <Option value={item}>{item}</Option>
                            )
                        })}
                    </Select>
                </Row>
                <Row type="flex" style={{ width: '100%', padding: '24px 0px', minHeight: '400px' }}>
                    <div style={{ width: '120px', textAlign: 'right' }}><h3 className={styles.rbd_sub_title}>{formatMessage({ id: 'enterpriseColony.import.list.title' })}</h3></div>
                    {loadingSwitch ? (
                        <div className={styles.loadingstyle}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row className={styles.importCard}>
                            {namespace &&
                                (namespace.length > 0) &&
                                resourceData &&
                                Object.keys(resourceData).length > 0 ? (
                                <Collapse
                                    defaultActiveKey={resourceDataIndex}
                                    onChange={this.callback}
                                    expandIconPosition='right'
                                >
                                    {resourceData && Object.keys(resourceData).map((item, index) => {
                                        let resourceDataItem = resourceData[item];
                                        resourceDataIndex.push(index)
                                        return (
                                            <Panel
                                                header={
                                                    <div>label: app={item === "unclassified" ? formatMessage({ id: 'enterpriseColony.import.app.title' }) : item}</div>
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
                    <Button type="primary" onClick={this.onNext} style={{ marginLeft: '120px', padding: '0px 36px' }} disabled={!namespace}>
                        {formatMessage({ id: 'button.next_step' })}
                    </Button>
                </Row>
            </Card>
        );
    }
}


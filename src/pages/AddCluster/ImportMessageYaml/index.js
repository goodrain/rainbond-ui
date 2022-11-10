/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Checkbox, Spin, Empty, Tooltip, Alert } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import globalUtil from '../../../utils/global'
import styles from './index.less'
import { object } from 'prop-types';
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
@Form.create()
@connect(({ user, list, loading, global, index, region, groups }) => ({
    user: user.currentUser,
    list,
    loading: loading.models.list,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise,
    isRegist: global.isRegist,
    oauthLongin: loading.effects['global/creatOauth'],
    overviewInfo: index.overviewInfo,
    baseConfiguration: region.base_configuration,
}))
export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        const { user } = this.props;
        const adminer = userUtil.isCompanyAdmin(user);
        this.state = {
            adminer,
            resourceData: {},
            loadingSwitch: true,
        };
    }
    componentWillMount() {
        const { adminer } = this.state;
        const { dispatch, } = this.props;
        if (!adminer) {
            dispatch(routerRedux.push(`/`));
        }
    }
    componentDidMount() {
        this.handleResource();
    }
    handleResource = () => {
        const { dispatch } = this.props;
        const teamName = globalUtil.getCurrTeamName();
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || ''
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || ''
        dispatch({
            type: "teamControl/getUploadInformation",
            payload: {
                team_name: teamName,
                event_id: event_id,
                group_id: group_id,
            },
            callback: (data) => {
                const dataObj = data.list.bean
                this.setState({
                    resourceData: dataObj,
                    loadingSwitch: false,
                }, () => {
                    const { resourceData } = this.state
                    const arr = Object.keys(resourceData).map((item) => {
                        return resourceData[item]
                    })
                })
            },
        });
    }
    handleChange = (value) => {
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
    //下一步
    onNext = () => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        const event_id = this.props.location && this.props.location.query && this.props.location.query.event_id || ''
        const group_id = this.props.location && this.props.location.query && this.props.location.query.group_id || ''
        dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/ChangeResourceTest?event_id=${event_id}&group_id=${group_id}`));
    }
    render() {
        const {
            match: {
                params: { eid }
            },
        } = this.props;
        const { resourceData, loadingSwitch, } = this.state
        const errorArr = resourceData.error_yaml
        const successArr = resourceData.app_resource
        const group_name = this.props.location && this.props.location.query && this.props.location.query.group_name || ''
        return (
            <PageHeaderLayout
                title={formatMessage({id:'enterpriseColony.import.title'})}
                content=""
            >
                {loadingSwitch ? (
                    <div className={styles.loadingstyle}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Card style={{ padding: '24px 12px' }}>
                        {
                            Object.keys(errorArr).map((item, index) => {
                                const errorItem = errorArr[item]
                                return <>
                                    {errorItem.status.length < 0 ? (
                                        <></>
                                    ) : (
                                        <>
                                            <Row type="flex" style={{ width: '100%', padding: '24px 0px', }}>
                                                <div style={{ width: '120px', textAlign: 'right' }}><h3>{formatMessage({id:'enterpriseColony.import.unidentification.list.title'})}</h3></div>
                                                <Alert
                                                    style={{ width: 'calc(100% - 120px)', marginTop: '-6px' }}
                                                    message={`${formatMessage({id:'enterpriseColony.import.unidentification.file'})}${item} ${formatMessage({id:'enterpriseColony.import.unidentification.cause'})}${errorItem.status}`}
                                                    banner
                                                />
                                            </Row>
                                        </>
                                    )}
                                </>
                            })
                        }
                        {resourceData && Object.keys(resourceData).map((item, index) => {
                            let resourceDataItem = resourceData[item];
                            if (index == Object.keys(resourceData).length - 1) {
                                return <></>
                            } else {
                                return <>
                                    {
                                    (Object.keys(resourceDataItem.workloads).length > 0 || 
                                    Object.keys(resourceDataItem.un_support).length > 0 ||
                                    Object.keys(resourceDataItem.others).length > 0 )  &&
                                    <Row type="flex" style={{ width: '100%', padding: '24px 0px', minHeight: '400px' }}>
                                        <div style={{ width: '120px', textAlign: 'right' }}><h3>{formatMessage({id:'enterpriseColony.import.list.title'})}</h3></div>
                                        <Row className={styles.importCard}>
                                            <Collapse
                                                defaultActiveKey={[0]}
                                                expandIconPosition='right'
                                            >
                                                <Panel
                                                    header={
                                                        <div>label: {group_name}={item === "unclassified" ? formatMessage({id:'enterpriseColony.import.app.title'}) : item}</div>
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
                                                            <div className={styles.miscellaneous_assets}>
                                                                <div className={styles.WorkLoads_value}>
                                                                    {resourceDataItem.un_support && Object.keys(resourceDataItem.un_support).map((un_supportvItem) => {
                                                                        let un_support = resourceDataItem.un_support[un_supportvItem]
                                                                        return (
                                                                            <div className={styles.box}>
                                                                                <div className={styles.leftKey}>{un_supportvItem}：</div>
                                                                                <div className={styles.rightValue}>
                                                                                    {un_support.length > 0 && un_support.map((valueItem) => {
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
                                            </Collapse>
                                        </Row>
                                    </Row>
                            }</>
                            }
                        })}

                        <Row style={{ textAlign: 'center' }}>
                            <Button type="primary" onClick={this.onNext} style={{ marginLeft: '120px', padding: '0px 36px' }}>
                            {formatMessage({id:'button.next_step'})}
                            </Button>
                        </Row>
                    </Card>
                )}
            </PageHeaderLayout>
        );
    }
}


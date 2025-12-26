import React, { PureComponent } from 'react';
import {
    Button,
    Tabs
} from 'antd';
import { connect } from 'dva';
import { formatMessage } from '@/utils/intl';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import ConfirmModal from '../../components/ConfirmModal';
import AppCreateSetting from '../../components/AppCreateSetting';
import handleAPIError from '../../utils/error';

const { TabPane } = Tabs;

@connect(
    () => ({}),
    null,
    null,
    { withRef: true }
)
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            apps: [],
            showDelete: false
        }
    }
    componentDidMount() {
        this.loadDetail();
    }
    getParams() {
        return { group_id: this.props.match.params.appID, compose_id: this.props.match.params.composeId }
    }
    loadDetail = () => {
        const params = this.getParams();
        this
            .props
            .dispatch({
                type: 'createApp/getAppsByComposeId',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    compose_id: params.compose_id
                },
                callback: (data) => {
                    this.setState({
                        apps: (data?.list || []).map((item) => {
                            //为了兼容数据结构，需要优化 TODO
                            return { service: item };
                        })
                    })
                },
                handleError: (data) => {
                    const code = httpResponseUtil.getCode(data);
                    if (code === 404) {
                        //应用不存在
                        this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`));
                    } else {
                        handleAPIError(data);
                    }
                }
            })
    }

    handleBuild = () => {
        const team_name = globalUtil.getCurrTeamName();
        const params = this.getParams();
        this.props.dispatch({
            type: 'application/buildCompose',
            payload: {
                team_name,
                ...params
            },
            callback: () => {
                this.props.dispatch({
                    type: 'global/fetchGroups',
                    payload: {
                        team_name
                    },
                    handleError: err => {
                        handleAPIError(err);
                    }
                });
                this.props.dispatch(routerRedux.replace(`/team/${team_name}/region/${globalUtil.getCurrRegionName()}/apps/${params.group_id}/overview`))
            },
            handleError: err => {
                handleAPIError(err);
            }
        })
    }
    handleDelete = () => {
        const team_name = globalUtil.getCurrTeamName();
        const params = this.getParams();
        this.props.dispatch({
            type: 'application/deleteCompose',
            payload: {
                team_name,
                ...params
            },
            callback: () => {
                this.props.dispatch({
                    type: 'global/fetchGroups',
                    payload: {
                        team_name
                    },
                    handleError: err => {
                        handleAPIError(err);
                    }
                });
                this.props.dispatch(routerRedux.replace(`/team/${team_name}/region/${globalUtil.getCurrRegionName()}/index`))
            },
            handleError: err => {
                handleAPIError(err);
            }
        })
    }
    showDelete = () => {
        this.setState({ showDelete: true })
    }
    render() {
        const { apps, showDelete } = this.state;

        if (!apps.length) {
            return null;
        }

        return (
            <>
                <PageHeaderLayout
                    titleSvg={pageheaderSvg.getPageHeaderSvg("advanced", 18)}
                    title={formatMessage({ id: 'componentCheck.advanced.setup' })}
                    content={formatMessage({ id: 'versionUpdata_6_1.content2' })}
                >
                    <div style={{
                        overflow: 'hidden'
                    }}>
                        <Tabs defaultActiveKey="0">
                            {apps.map((app, index) => {
                                return <TabPane tab={app.service.service_cname} key={index}>
                                    <AppCreateSetting updateDetail={this.loadDetail} appDetail={app} /></TabPane>
                            })
                            }
                        </Tabs>
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
                                type="primary">
                                {formatMessage({ id: 'button.confirm_create' })}
                            </Button>
                            <Button onClick={this.showDelete} type="default">
                                {formatMessage({ id: 'button.abandon_create' })}
                            </Button>
                        </div>
                        {showDelete && <ConfirmModal
                            onOk={this.handleDelete}
                            title={formatMessage({ id: 'confirmModal.abandon_create.create_check.title' })}
                            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
                            desc={formatMessage({ id: 'confirmModal.delete.create_check.desc' })}
                            onCancel={() => {
                                this.setState({ showDelete: false })
                            }} />}
                    </div>
                </PageHeaderLayout>
            </>
        )
    }
}

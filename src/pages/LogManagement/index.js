import { Tabs, Card } from 'antd';
import AppPubSubSocket from '../../utils/appPubSubSocket';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import ReactDOM from "react-dom"
import React, { PureComponent } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ClusterLog from './secondaryLogs'
import userUtil from '../../utils/user';
import dateUtil from '../../utils/date-util';
import global from '../../utils/global';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import LogInfo from '../../components/EnterpriseLog'
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage'
import styles from './index.less'
const { TabPane } = Tabs;

@connect(({ user, list, loading, global, index }) => ({
    user: user.currentUser,
    list,
    loading: loading.models.list,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise,
    isRegist: global.isRegist,
    oauthLongin: loading.effects['global/creatOauth'],
    certificateLongin: loading.effects['global/putCertificateType'],
    overviewInfo: index.overviewInfo
}))
export default class EnterpriseSetting extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            activeKey: 'consoleLog',
            ClustersList: [],
            regionActiveKey: '0',
            showEnterprisePlugin: !(window.localStorage.getItem('showEnterprisePlugin') === 'false')
        };
        this.socket = null;
    }
    componentDidMount() {
        this.handleLoadEnterpriseClusters()
        const { location } = this.props;
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        const region = params.get('region');
        const action = params.get('action');
        if (type == 'consoleLog') {
            this.setState({ activeKey: 'consoleLog' });
        } else if (type !== 'consoleLog' && region) {
            this.setState({ activeKey: region });
        }
        if (action) {
            this.setState({ regionActiveKey: action });
        }
    }

    onChange = key => {
        const { dispatch } = this.props;
        const { ClustersList } = this.state;
        this.setState({ activeKey: key });
        if (key == 'Operation' || key == 'login') {
            dispatch(routerRedux.push(`/enterprise/${global.getCurrEnterpriseId()}/logs?regionName=${ClustersList[0].region_name}`));
        }

    };
    // 获取企业的集群信息
    handleLoadEnterpriseClusters = () => {
        const { dispatch } = this.props;
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'region/fetchEnterpriseClusters',
            payload: {
                enterprise_id: eid
            },
            callback: res => {
                if (res.status_code == 200) {
                    this.setState({
                        ClustersList: res.list,
                    })
                }
            }
        });
    };

    renderContent = () => {
        const { activeKey, ClustersList, regionActiveKey, showEnterprisePlugin } = this.state;
        const eid = global.getCurrEnterpriseId();

        if (activeKey === 'consoleLog') {
            return <LogInfo type={true} />;
        }
        if (activeKey === 'Operation' && showEnterprisePlugin) {
            return <EnterprisePluginsPage key="Operation" type="Operation" componentData={{ eid: eid }} />;
        }
        if (activeKey === 'login' && showEnterprisePlugin) {
            return <EnterprisePluginsPage key="login" type="login" componentData={{ eid: eid }} />;
        }
        // 集群日志
        const cluster = ClustersList.find(item => item.region_name === activeKey);
        if (cluster) {
            const { region_alias, region_name, region_id } = cluster;
            return (
                <div className={styles.logInfoStyle}>
                    <ClusterLog region={region_name} regionId={region_id} regionAlias={region_alias} eid={eid} regionActiveKey={regionActiveKey} />
                </div>
            );
        }
        return null;
    };

    render() {
        const { activeKey, ClustersList, showEnterprisePlugin } = this.state;
        return (
            <PageHeaderLayout
                title={formatMessage({ id: 'LogEnterprise.title' })}
                content={formatMessage({ id: 'LogEnterprise.desc' })}
                titleSvg={pageheaderSvg.getPageHeaderSvg('logs', 18)}
                isContent={true}
            >
                <Tabs onChange={this.onChange} activeKey={activeKey} className={styles.setTabs} type="card">
                    <TabPane tab={formatMessage({ id: 'LogEnterprise.console' })} key="consoleLog" />
                    {ClustersList.map((item) => {
                        const { region_alias, region_name } = item;
                        return (
                            <TabPane
                                tab={`${region_alias} ${formatMessage({ id: 'LogEnterprise.title' })}`}
                                key={region_name}
                            />
                        );
                    })}
                    {showEnterprisePlugin && <TabPane tab="操作日志" key="Operation" />}
                    {showEnterprisePlugin && <TabPane tab="登录日志" key="login" />}
                </Tabs>
                <TransitionGroup
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 400
                    }}
                >
                    <CSSTransition
                        key={activeKey}
                        timeout={700}
                        classNames="page-zoom"
                        unmountOnExit
                    >
                        <div style={{ width: '100%' }}>
                            {this.renderContent()}
                        </div>
                    </CSSTransition>
                </TransitionGroup>
            </PageHeaderLayout>
        );
    }
}

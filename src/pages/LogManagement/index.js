import { Tabs, Card } from 'antd';
import AppPubSubSocket from '../../utils/appPubSubSocket';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import ReactDOM from "react-dom"
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ClusterLog from './secondaryLogs'
import userUtil from '../../utils/user';
import dateUtil from '../../utils/date-util';
import global from '../../utils/global';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import LogInfo from '../../components/EnterpriseLog'
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
            ClustersList: []
        };
        this.socket = null;
    }
    componentDidMount() {
        this.handleLoadEnterpriseClusters()
    }

    onChange = key => {
        this.setState({ activeKey: key });
    };
    callback = (key) => {

    }
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

    render() {
        const { adminer, activeKey, ClustersList } = this.state;
        const eid = global.getCurrEnterpriseId();
        return (
            <PageHeaderLayout
                title={formatMessage({id:'LogEnterprise.title'})}
                content={formatMessage({ id: 'LogEnterprise.desc' })}
                titleSvg={pageheaderSvg.getPageHeaderSvg('logs',18)}
                isContent={true} 
            >   
                <Tabs onChange={this.onChange} activeKey={activeKey} destroyInactiveTabPane className={styles.setTabs} type="card">
                    <TabPane tab={formatMessage({id:'LogEnterprise.console'})} key="consoleLog">
                        <LogInfo  type={true}/>
                    </TabPane>
                    {ClustersList.map((item, index) => {
                        const { region_alias, region_name, url, region_id } = item
                        return <TabPane tab={`${region_alias} ${formatMessage({id:'LogEnterprise.title'})}`} key={index} className={styles.logInfoStyle}>
                                    <ClusterLog region={region_name} regionId={region_id} regionAlias={region_alias} eid={eid}/>
                                </TabPane>
                    })}

                </Tabs>
            </PageHeaderLayout>
        );
    }
}

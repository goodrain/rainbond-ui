import { Tabs, Card, Spin } from 'antd';
import AppPubSubSocket from '../../utils/appPubSubSocket';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import ReactDOM from "react-dom"
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import userUtil from '../../utils/user';
import dateUtil from '../../utils/date-util';
import global from '../../utils/global';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import PluginCapacity from './pluginCapacity'
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
export default class index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            activeKey: '0',
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
        return (
            <PageHeaderLayout
                title={formatMessage({id: 'extensionEnterprise.title'})}
                content={formatMessage({id: 'extensionEnterprise.desc'})}
                titleSvg={pageheaderSvg.getSvg('extensionSvg',18)}
                isContent={true} 
            >   
                {ClustersList.length > 0 ? (
                    <Tabs onChange={this.onChange} activeKey={activeKey} destroyInactiveTabPane className={styles.setTabs} type="card">
                        {ClustersList.map((item, index) => {
                            const { region_alias, region_name, url } = item
                            return <TabPane tab={region_alias} key={index}>
                                        <PluginCapacity type={true} regionName={region_name} regionAlias={region_alias}/>
                                    </TabPane>
                        })}
                    </Tabs>
                ):(
                    <div className={styles.spin}>
                        <Spin />
                    </div>   
                )}
            </PageHeaderLayout>
        );
    }
}

import { Tabs, Card, Spin, Empty } from 'antd';
import AppPubSubSocket from '../../utils/appPubSubSocket';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import ReactDOM from "react-dom"
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
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
            activeKey: '',
            ClustersList: [],
            clustersLoading: true,  
        };
        this.socket = null;
    }
    componentDidMount() {
        this.handleLoadEnterpriseClusters()
    }

    componentDidUpdate(prevProps, prevState) {
        const prevSearch = (prevProps.location && prevProps.location.search) || '';
        const currentSearch = (this.props.location && this.props.location.search) || '';
        if (prevSearch !== currentSearch && this.state.ClustersList.length > 0) {
            const activeKey = this.getTargetRegionName(this.state.ClustersList);
            if (activeKey && activeKey !== this.state.activeKey) {
                this.setState({ activeKey });
            }
        }
    }

    getTargetRegionName = (clusters = []) => {
        const { location } = this.props;
        const params = new URLSearchParams((location && location.search) || '');
        const regionNameFromQuery = params.get('regionName');
        const currentRegionName = global.getCurrRegionName();

        if (regionNameFromQuery && clusters.some(item => item.region_name === regionNameFromQuery)) {
            return regionNameFromQuery;
        }

        if (currentRegionName && clusters.some(item => item.region_name === currentRegionName)) {
            return currentRegionName;
        }

        return clusters[0]?.region_name || '';
    }

    syncRegionQuery = (regionName, replace = false) => {
        const { dispatch, location, user } = this.props;
        const enterpriseId = user?.enterprise_id || global.getCurrEnterpriseId();
        if (!enterpriseId || !regionName) {
            return;
        }
        const currentSearch = (location && location.search) || '';
        const params = new URLSearchParams(currentSearch);
        if (params.get('regionName') === regionName) {
            return;
        }
        params.set('regionName', regionName);
        dispatch(
            (replace ? routerRedux.replace : routerRedux.push)(
                `/enterprise/${enterpriseId}/extension?${params.toString()}`
            )
        );
    }

    onChange = key => {
        this.setState({ activeKey: key });
        this.syncRegionQuery(key);
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
                    const clusters = res.list || [];
                    const activeKey = this.getTargetRegionName(clusters);
                    this.setState({
                        ClustersList: clusters,
                        activeKey,
                        clustersLoading: false
                    }, () => {
                        if (activeKey) {
                            this.syncRegionQuery(activeKey, true);
                        }
                    })
                }
            },
            handleError: res => {
                this.setState({ clustersLoading: false, ClustersList: [] })
            }
        });
    };

    render() {
        const { activeKey, ClustersList, clustersLoading } = this.state;
        return (
            <PageHeaderLayout
                title={formatMessage({id: 'extensionEnterprise.title'})}
                content={formatMessage({id: 'extensionEnterprise.desc'})}
                titleSvg={pageheaderSvg.getPageHeaderSvg('extension',18)}
                isContent={true} 
            >   
                {!clustersLoading && ClustersList.length > 0 ? (
                    <Tabs onChange={this.onChange} activeKey={activeKey} destroyInactiveTabPane className={styles.setTabs} type="card">
                        {ClustersList.map((item) => {
                            const { region_alias, region_name } = item
                            return <TabPane tab={region_alias} key={region_name}>
                                        <PluginCapacity type={true} regionName={region_name} regionAlias={region_alias}/>
                                    </TabPane>
                        })}
                    </Tabs>
                ):(
                    <div className={styles.spin}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>   
                )}
                {clustersLoading && 
                    <div className={styles.spin}>
                        <Spin />
                    </div>  
                }
            </PageHeaderLayout>
        );
    }
}

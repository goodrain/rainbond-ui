import React, { Component } from 'react';
import {
  Row,
  Col,
  notification
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { getUpdateKubernetesTask } from '../../../services/cloud';
import ClusterDetection from '../../../components/ClusterMgtDetection';
import ScrollerX from '@/components/ScrollerX';
import cloud from '../../../utils/cloud';
import { formatMessage } from '@/utils/intl';
import ClusterList from '../../../components/ClusterMgtList';
import DetectionInfo from '../../../components/ClusterMgtInfo';
import DetectionResources from '../../../components/ClusterMgtResources';
import RKEClusterUpdate from "../../../components/Cluster/RKEClusterAdd";
import SVG from '../../../utils/pageHeaderSvg'
import pageheaderSvg from '@/utils/pageHeaderSvg';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pluginUtils from '../../../utils/pulginUtils';
import global from '@/utils/global';
import { normalizeNodeDiskUsage } from '@/utils/nodeDisk';
import styles from "./index.less";
const { createComponentPollingGuard, getComponentPollingDelay } = require('../../Component/componentPolling');

@connect(({ global }) => ({
  pluginsList: global.pluginsList,

}))
class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rowCluster: [],
      nodeList: [],
      showListInfo: false,
      selectClusterName: '',
      clusterID: '',
      showCreateLog: false,
      isInstallRemind: false,
      installLoading: false,
      isComponents: false,
      showUpdateKubernetes: false,
      dashboardShow: false,
      eventId: '',
      showGpuBtn: false,
      diskAlerts: [],
    }
    this.timer = null
    this.nodePollFailures = 0;
    this.nodeRefreshPending = false;
    this.pageVisible = typeof document === 'undefined' || !document.hidden;
    this.pollingGuard = createComponentPollingGuard(
      () => this.mounted && this.pageVisible,
      () => this.getPollingIdentity()
    );
  }
  componentDidMount() {
    this.mounted = true;
    this.pollingIdentity = this.getPollingIdentity();
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.loadClusters();
    this.setState({
      showGpuBtn: pluginUtils.isInstallPlugin(this.props.pluginsList, 'rainbond-gpu')
    });
  }
  componentWillUnmount() {
    this.mounted = false;
    this.resetNodePolling();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  componentDidUpdate() {
    const identity = this.getPollingIdentity();
    if (identity !== this.pollingIdentity) {
      this.pollingIdentity = identity;
      this.resetNodePolling();
      this.setState({ rowCluster: [], nodeList: [], diskAlerts: [], eventId: '', showInfo: false,
        showListInfo: false, dashboardList: [], dashboardShow: false }, this.loadClusters);
    }
  }
  getPollingIdentity = () => {
    const { eid, regionID } = this.props.match.params;
    return JSON.stringify([eid, regionID]);
  };
  isCurrentRegion = item => item && String(item.region_id) === String(this.props.match.params.regionID);
  resetNodePolling = () => {
    this.pollingGuard.invalidate();
    this.nodeRefreshPending = false;
    this.nodePollFailures = 0;
    clearTimeout(this.timer);
    this.timer = null;
  };
  handleVisibilityChange = () => {
    this.pageVisible = !document.hidden;
    this.resetNodePolling();
    if (this.pageVisible) {
      const { rowCluster } = this.state;
      if (this.isCurrentRegion(rowCluster)) {
        this.fetClusterNodeList(rowCluster, false);
        if (!this.state.dashboardShow) this.fetDashboardList(rowCluster);
      } else {
        this.loadClusters();
      }
    }
  };
  scheduleNodeRefresh = (item, delay = 5000) => {
    clearTimeout(this.timer);
    this.timer = null;
    const isCurrent = this.pollingGuard.checkpoint();
    if (!isCurrent()) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (isCurrent()) {
        if (item) this.fetClusterNodeList(item, false);
        else this.loadClusters();
      }
    }, delay);
  };
  // 获取集群信息
  loadClusters = () => {
    const request = this.pollingGuard.begin('clusters');
    if (!request) return;
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      shouldApply: request.isCurrent,
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (!request.complete()) return;
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
            return item;
          });
          const rowClusterInfo = [];
          clusters.filter(item => {
            if (item.region_id == regionID)
              this.setState({
                rowCluster: item,
                showInfo: true
              }, () => {
                if (!request.isCurrent()) return;
                this.fetClusterNodeList(item);
                this.fetDashboardList(item)
              });
          })
        } else {
          this.setState({
            rowCluster: [],
            showInfo: false
          });
        }
      },
      handleError: () => {
        if (!request.complete()) return;
        this.nodePollFailures += 1;
        this.scheduleNodeRefresh(null, getComponentPollingDelay({ failureCount: this.nodePollFailures }));
      }
    });
  };
  // 编辑节点信息
  updateCluster = clusterID => {
    const {
      match: {
        params: { eid }
      },
    } = this.props;
    getUpdateKubernetesTask(
      {
        clusterID,
        providerName: 'rke',
        enterprise_id: eid
      },
      err => {
        cloud.handleCloudAPIError(err);
      }
    )
      .then(re => {
        if (re.task && re.task.status !== 'complete') {
          this.setState({
            showUpdateKubernetesTasks: true,
            updateTask: re.task
          });
          return;
        }
        this.setState({
          showUpdateKubernetes: true,
          nodeListArr: re.nodeList,
          rkeConfig: re.rkeConfig,
          updateClusterID: clusterID,
          clusterID: clusterID
        });
      })
      .catch(err => {
      });
  };
  // 获取添加节点的参数event_id
  getNodeEventID = (region_name) => {
    if (region_name !== this.state.rowCluster.region_name) return;
    const request = this.pollingGuard.begin('event-id');
    if (!request) return;
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchClusterInfo',
      shouldApply: request.isCurrent,
      payload: {
        cluster_id: region_name
      },
      callback: res => {
        if (!request.complete()) return;
        if (res && res.status_code === 200) {
          this.setState({
            eventId: res?.bean?.event_id || ''
          })
        }
      },
      handleError: () => { request.complete(); }
    });
  };
  // 获取节点列表
  fetClusterNodeList = (item, isLoading = true) => {
    if (!this.mounted || !this.pageVisible || !this.isCurrentRegion(item)) return;
    const request = this.pollingGuard.begin('nodes');
    if (!request) {
      if (isLoading) this.nodeRefreshPending = true;
      return;
    }
    clearTimeout(this.timer);
    this.timer = null;
    const refreshPending = () => {
      if (!this.nodeRefreshPending) return false;
      this.nodeRefreshPending = false;
      this.fetClusterNodeList(this.state.rowCluster);
      return true;
    };
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    this.setState({
      showListInfo: isLoading ? false : true
    })
    if (item.provider == 'rke') {
      this.getNodeEventID(item.region_name)
    }
    dispatch({
      type: 'region/fetClusterNodeList',
      payload: {
        enterprise_id: eid,
        region_name: item && item.region_name,
      },
      callback: res => {
        if (!request.complete() || refreshPending()) return;
        if (res && res.status_code == 200) {
          this.nodePollFailures = 0;
          this.setState({
            nodeList: res.list,
            diskAlerts: normalizeNodeDiskUsage(res.list, item),
            showListInfo: true,
            nodeType: res.bean
          }, () => {
            if (request.isCurrent()) this.scheduleNodeRefresh(item);
          })
        }
      },
      handleError: () => {
        if (!request.complete() || refreshPending()) return;
        this.nodePollFailures += 1;
        this.setState({
          nodeList: [],
          diskAlerts: [],
          showListInfo: true
        }, () => {
          if (!request.isCurrent()) return;
          notification.error({
            message: formatMessage({ id: 'enterpriseColony.mgt.cluster.errorList' })
          });
          this.scheduleNodeRefresh(item, getComponentPollingDelay({ failureCount: this.nodePollFailures }));
        })
      }
    });
  }

  // 节点状态操作 上线调度排空等
  editClusterNodeActive = (editActive, name, region_name) => {
    const isCurrent = this.pollingGuard.checkpoint();
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const { rowCluster } = this.state;
    dispatch({
      type: 'region/editClusterNodeActive',
      payload: {
        enterprise_id: eid,
        region_name: region_name,
        action: editActive,
        node_id: name
      },
      callback: res => {
        if (!isCurrent()) return;
        if (res && res.status_code == 200) {
          notification.success({
            message: formatMessage({ id: 'enterpriseColony.mgt.cluster.editSuccess' })
          });
          this.fetClusterNodeList(rowCluster)
        }
      },
      handleError: () => {
        if (!isCurrent()) return;
        notification.error({
          message: formatMessage({ id: 'enterpriseColony.mgt.cluster.editDefeated' })
        });
        this.fetClusterNodeList(rowCluster)
      }
    });
  }
  // 添加
  editNode = () => {
    this.setState({
      showUpdateKubernetes: true
    })
  }
  cancelShowUpdateKubernetes = () => {
    const { rowCluster } = this.state;
    this.setState({
      showUpdateKubernetesTasks: false,
      updateTask: null
    }, () => {
      this.fetClusterNodeList(rowCluster)
    });
  };
  // 获取 k8s dashboard
  fetDashboardList = (val) => {
    if (!this.isCurrentRegion(val)) return;
    const request = this.pollingGuard.begin('dashboard');
    if (!request) return;
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const { rowCluster } = this.state;
    const clusterID = val.provider_cluster_id;
    const providerName = val.provider;

    dispatch({
      type: 'region/fetDashboardList',
      payload: {
        enterprise_id: eid,
        region_name: val.region_name,
      },
      callback: res => {
        if (!request.complete()) return;
        this.setState({
          dashboardList: res.list,
          dashboardShow: true
        })
      },
      handleError: () => {
        if (!request.complete()) return;
        this.setState({
          dashboardList: [],
          dashboardShow: true
        }, () => {
          if (!request.isCurrent()) return;
          notification.error({
            message: formatMessage({ id: 'enterpriseColony.mgt.cluster.getRainbondList' })
          });
        })
      }
    });

  };
  render() {
    const eid = global.getCurrEnterpriseId()
    const {
      rowCluster,
      showInfo,
      nodeList,
      showListInfo,
      showUpdateKubernetes,
      nodeListArr,
      rkeConfig,
      updateClusterID,
      showUpdateKubernetesTasks,
      updateTask,
      clusterID,
      dashboardList,
      dashboardShow,
      nodeType,
      eventId,
      showGpuBtn,
      diskAlerts
    } = this.state
    return (
      <PageHeaderLayout
        title={<Row className={styles.breadStyle}>
          <span>{pageheaderSvg.getPageHeaderSvg('clusters', 18)}</span>
          <span><Link to={`/enterprise/${eid}/clusters`}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterMgt' })} / </Link></span>
          <span>{rowCluster && rowCluster.region_alias}</span>
        </Row>}
        content={formatMessage({ id: 'enterpriseColony.mgt.cluster.info' })}
      >
        <ScrollerX sm={900}>
          <Row>
            <DetectionInfo
              rowClusterInfo={rowCluster}
              loadClusters={this.loadClusters}
              nodeType={nodeType}
              showInfo={showInfo}
              showGpuBtn={showGpuBtn}
            />
          </Row>
          <Row>
            <ClusterList
              titleIcon={SVG.getSvg("listSvg", 20)}
              titleText={formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterList' })}
              eventId={eventId}
              rowClusterInfo={rowCluster}
              nodeList={nodeList}
              active={this.editClusterNodeActive}
              showInfo={showListInfo}
              updateCluster={this.updateCluster}
              handleLoadClusters={() => { this.loadClusters() }}
              diskAlerts={diskAlerts}
            />
          </Row>
          <Row>
            <DetectionResources
              titleIcon={SVG.getSvg("userSvg", 20)}
              titleText={formatMessage({ id: 'enterpriseColony.mgt.cluster.user' })}
              showInfo={showInfo}
              rowClusterInfo={rowCluster}
            />
          </Row>
          <Row>
            <ClusterDetection
              titleIcon={SVG.getSvg("examineSvg", 20)}
              titleText={formatMessage({ id: 'enterpriseColony.mgt.cluster.rainbondList' })}
              dashboardList={dashboardList}
              dashboardShow={dashboardShow}
              region={rowCluster.region_name}
            />
          </Row>
        </ScrollerX>
      </PageHeaderLayout>
    );
  }
}

export default Index;

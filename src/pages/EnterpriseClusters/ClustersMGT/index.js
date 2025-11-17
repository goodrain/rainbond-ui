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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ClusterList from '../../../components/ClusterMgtList';
import DetectionInfo from '../../../components/ClusterMgtInfo';
import DetectionResources from '../../../components/ClusterMgtResources';
import RKEClusterUpdate from "../../../components/Cluster/RKEClusterAdd";
import SVG from '../../../utils/pageHeaderSvg'
import pageheaderSvg from '@/utils/pageHeaderSvg';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pluginUtils from '../../../utils/pulginUtils';
import global from '@/utils/global';
import styles from "./index.less";

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
    }
    this.timer = null
  }
  componentDidMount() {
    this.loadClusters();
    this.setState({
      showGpuBtn: pluginUtils.isInstallPlugin(this.props.pluginsList, 'rainbond-gpu')
    });
  }
  componentWillUnmount() {
    clearTimeout(this.timer)
  }
  fetchClusterInfoList = () => {
    const { dispatch } = this.props;
    const { eventId, clusterID, rowCluster } = this.state
    dispatch({
      type: 'region/fetchClusterInfoList',
      payload: {
        cluster_id: rowCluster.region_name
      },
    });
  };
  // 获取集群信息
  loadClusters = () => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
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
                this.fetClusterNodeList(item);
                this.fetDashboardList(item)
                if (item.provider == 'rke') {
                  this.fetchClusterInfoList()
                }
              });
          })
        } else {
          this.setState({
            rowCluster: [],
            showInfo: false
          });
        }
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
        console.log(err);
      });
  };
  // 获取添加节点的参数event_id
  getNodeEventID = (region_name) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchClusterInfo',
      payload: {
        cluster_id: region_name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            eventId: res?.bean?.event_id || ''
          })
        }
      }
    });
  };
  // 获取节点列表
  fetClusterNodeList = (item, isLoading = true) => {
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
        if (res && res.status_code == 200) {
          this.setState({
            nodeList: res.list,
            showListInfo: true,
            nodeType: res.bean
          }, () => {
            this.timer = setTimeout(() => {
              this.fetClusterNodeList(item, false)
              if (item.provider == 'rke') {
                this.fetchClusterInfoList()
              }
            }, 5000)
          })
        }
      },
      handleError: () => {
        this.setState({
          nodeList: [],
          showListInfo: true
        }, () => {
          notification.error({
            message: formatMessage({ id: 'enterpriseColony.mgt.cluster.errorList' })
          });
        })
      }
    });
  }

  // 节点状态操作 上线调度排空等
  editClusterNodeActive = (editActive, name, region_name) => {
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
        if (res && res.status_code == 200) {
          notification.success({
            message: formatMessage({ id: 'enterpriseColony.mgt.cluster.editSuccess' })
          });
          this.fetClusterNodeList(rowCluster)
        }
      },
      handleError: () => {
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
        this.setState({
          dashboardList: res.list,
          dashboardShow: true
        })
      },
      handleError: () => {
        this.setState({
          dashboardList: [],
          dashboardShow: true
        }, () => {
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
      showGpuBtn
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
          <Row className={styles.titleStyle} style={{ margin: '0 0 10px' }}>
            <span>{SVG.getSvg("infoSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterInfo' })}</span>
          </Row>
          <Row>
            <DetectionInfo
              rowClusterInfo={rowCluster}
              loadClusters={this.loadClusters}
              nodeType={nodeType}
              showInfo={showInfo}
              showGpuBtn={showGpuBtn}
            />
          </Row>
          <Row className={styles.titleStyle}>
            <span>{SVG.getSvg("listSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterList' })}</span>
          </Row>
          <Row>
            <ClusterList
              eventId={eventId}
              rowClusterInfo={rowCluster}
              nodeList={nodeList}
              active={this.editClusterNodeActive}
              showInfo={showListInfo}
              updateCluster={this.updateCluster}
              handleLoadClusters={() => { this.loadClusters() }}
            />
          </Row>
          <Row className={styles.titleStyle}>
            <span>{SVG.getSvg("userSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.cluster.user' })}</span>
          </Row>
          <Row>
            <DetectionResources
              showInfo={showInfo}
              rowClusterInfo={rowCluster}
            />
          </Row>
          <Row className={styles.titleStyle}>
            <span>{SVG.getSvg("examineSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.cluster.rainbondList' })}</span>
          </Row>
          <Row>
            <ClusterDetection
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

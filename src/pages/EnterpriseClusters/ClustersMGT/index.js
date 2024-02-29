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
import cloud from '../../../utils/cloud';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import ClusterList from '../../../components/ClusterMgtList';
import DetectionInfo from '../../../components/ClusterMgtInfo';
import DetectionResources from '../../../components/ClusterMgtResources';
import RKEClusterUpdate from "../../../components/Cluster/RKEClusterAdd";
import ShowUpdateClusterDetail from '../../../components/Cluster/ShowUpdateClusterDetail';
import SVG from '../../../utils/pageHeaderSvg'
import global from '@/utils/global';
import styles from "./index.less";

@connect()
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
      dashboardShow: false
    }
  }
  componentDidMount() {
    this.loadClusters();
  }
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
  // 获取节点列表
  fetClusterNodeList = (item) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    this.setState({
      showListInfo: false
    })
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
            nodeType : res.bean
          })
        }
      },
      handleError: () => {
        this.setState({
          nodeList: [],
          showListInfo: true
        }, () => {
          notification.error({
            message: formatMessage({id:'enterpriseColony.mgt.cluster.errorList'})
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
            message: formatMessage({id:'enterpriseColony.mgt.cluster.editSuccess'})
          });
          this.fetClusterNodeList(rowCluster)
        }
      },
      handleError: () => {
        notification.error({
          message: formatMessage({id:'enterpriseColony.mgt.cluster.editDefeated'})
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
            message: formatMessage({id:'enterpriseColony.mgt.cluster.getRainbondList'})
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
      nodeType
    } = this.state
    return (
      <>
        <Row className={styles.breadStyle}>
          <span>{SVG.getSvg("ClusterSvg", 18)}</span>
          <span><Link to={`/enterprise/${eid}/clusters`}>{formatMessage({id:'enterpriseColony.mgt.cluster.clusterMgt'})} / </Link></span>
          <span>{rowCluster && rowCluster.region_alias}</span>
        </Row>
        <Row className={styles.titleStyle}>
          <span>{SVG.getSvg("infoSvg", 20)}</span>
          <span>{formatMessage({id:'enterpriseColony.mgt.cluster.clusterInfo'})}</span>
        </Row>
        <Row>
          <DetectionInfo
            rowClusterInfo={rowCluster}
            loadClusters={this.loadClusters}
            nodeType={nodeType}
            showInfo={showInfo}
          />
        </Row>
        <Row className={styles.titleStyle}>
          <span>{SVG.getSvg("listSvg", 20)}</span>
          <span>{formatMessage({id:'enterpriseColony.mgt.cluster.clusterList'})}</span>
        </Row>
        <Row>
          <ClusterList
            rowClusterInfo={rowCluster}
            nodeList={nodeList}
            active={this.editClusterNodeActive}
            showInfo={showListInfo}
            updateCluster={this.updateCluster}
          />
        </Row>
        <Row className={styles.titleStyle}>
          <span>{SVG.getSvg("userSvg", 20)}</span>
          <span>{formatMessage({id:'enterpriseColony.mgt.cluster.user'})}</span>
        </Row>
        <Row>
          <DetectionResources
            showInfo={showInfo}
            rowClusterInfo={rowCluster}
          />
        </Row>
        <Row className={styles.titleStyle}>
          <span>{SVG.getSvg("examineSvg", 20)}</span>
          <span>{formatMessage({id:'enterpriseColony.mgt.cluster.rainbondList'})}</span>
        </Row>
        <Row>
          <ClusterDetection
            dashboardList={dashboardList}
            dashboardShow={dashboardShow}
          />
        </Row>
        {showUpdateKubernetes && (
          <RKEClusterUpdate
            eid={eid}
            onOK={task => {
              this.setState({
                clusterID: task.clusterID,
                showUpdateKubernetes: false,
                updateTask: task,
                showUpdateKubernetesTasks: true
              });
            }}
            onCancel={() => {
              this.setState({ showUpdateKubernetes: false });
            }}
            clusterID={updateClusterID}
            nodeList={nodeListArr}
            rkeConfig={rkeConfig}
          />
        )}
        {showUpdateKubernetesTasks && (
          <ShowUpdateClusterDetail
            eid={eid}
            clusterID={clusterID}
            task={updateTask}
            selectProvider={"rke"}
            onCancel={this.cancelShowUpdateKubernetes}
          />
        )}
      </>
    );
  }
}

export default Index;

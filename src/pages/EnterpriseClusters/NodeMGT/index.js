import React, { Component } from 'react';
import {
  Row,
  Col,
  notification
} from 'antd';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import NodeInfo from '../../../components/NodeMgtInfo'
import NodeUse from '../../../components/NodeMgtUse'
import NodeStain from '../../../components/NodeMgtStain'
import NodeLable from '../../../components/NodeMgtLabel'
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import ScrollerX from '@/components/ScrollerX';
import SVG from "../../../utils/pageHeaderSvg"
import global from '../../../utils/global'
import styles from './index.less'

@connect()

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clusterInfo: [],
      nodeDetail: {},
      showInfo: false,
      labelList: {},
      showLable: false,
      showTaints: false,
      taintsList: []
    }
  }
  componentDidMount() {
    this.loadClusters()
  }
  // 获取对应集群信息
  loadClusters = (bool = false) => {
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
                clusterInfo: item,
              }, () => {
                this.fetClusterNodeDetail(item)
                this.fetClusterNodeLabels(item)
                this.fetClusterNodeTaint(item)
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
  //获取节点详情
  fetClusterNodeDetail = (val) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const name = this.props.location && this.props.location.query && this.props.location.query.name
    dispatch({
      type: 'region/fetClusterNodeDetail',
      payload: {
        enterprise_id: eid,
        region_name: val.region_name,
        node_id: name,
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            nodeDetail: res.bean,
            showInfo: true
          }, () => {
            // 获取Container信息
            // dispatch({
            //   type: 'region/fetClusterNodeContainer',
            //   payload: {
            //     enterprise_id: eid,
            //     region_name: val.region_name,
            //     node_name: name,
            //     container_runtime: res.bean.container_runtime
            //   },
            //   callback: val => {
            //     const info = val.bean;
            //     const obj ={};
            //     obj.cap_docker_partition = info.total;
            //     obj.req_docker_partition = info.used;
            //     this.setState({
            //       nodeDetail:{...this.state.nodeDetail,...obj},
            //       showInfo: true
            //     })
            //   },
            //   handleError: (res) => {
            //     const obj ={};
            //     obj.cap_docker_partition = 0;
            //     obj.req_docker_partition = 0;
            //     this.setState({
            //       nodeDetail:{...this.state.nodeDetail,...obj},
            //       showInfo: true
            //     })
            //   }
            // });
          })
        }
      },
      handleError: (res) => {
        this.setState({
          nodeDetail: {},
          showInfo: false
        }, () => {
          notification.error({
            message: formatMessage({ id: 'enterpriseColony.mgt.node.infoError' })
          });
        })
      }
    });
  }
  //获取标签
  fetClusterNodeLabels = (val) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    this.setState({
      showLable: false
    })
    const name = this.props.location && this.props.location.query && this.props.location.query.name
    dispatch({
      type: 'region/fetClusterNodeLabels',
      payload: {
        enterprise_id: eid,
        region_name: val.region_name,
        node_name: name,
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            labelList: res.bean,
            showLable: true
          })
        }
      },
      handleError: () => {
        this.setState({
          labelList: {},
          showLable: false
        }, () => {
          notification.error({
            message: formatMessage({ id: 'enterpriseColony.mgt.node.listError' })
          });
        })
      }
    });
  }
  //更新标签
  updataClusterNodeLabels = (val) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const { clusterInfo } = this.state
    this.setState({
      showLable: false,
    })
    const name = this.props.location && this.props.location.query && this.props.location.query.name
    dispatch({
      type: 'region/updataClusterNodeLabels',
      payload: {
        enterprise_id: eid,
        region_name: clusterInfo.region_name,
        node_name: name,
        labels: val
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            labelList: res.bean,
            showLable: true
          }, () => {
            notification.success({
              message: formatMessage({ id: 'enterpriseColony.mgt.node.editSuccess' })
            });
          })
        }
      },
      handleError: () => {
        notification.error({
          message: formatMessage({ id: 'enterpriseColony.mgt.node.editDefeated' })
        });
        this.fetClusterNodeLabels(clusterInfo);
      }
    });
  }

  //获取污点
  fetClusterNodeTaint = (val) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const { clusterInfo } = this.state
    this.setState({
      showTaints: false,
      taintsList: []
    })
    const name = this.props.location && this.props.location.query && this.props.location.query.name
    dispatch({
      type: 'region/fetClusterNodeTaint',
      payload: {
        enterprise_id: eid,
        region_name: clusterInfo.region_name,
        node_name: name,
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            taintsList: res.bean,
            showTaints: true
          })
        }
      },
      handleError: () => {
        this.setState({
          taintsList: {},
          showTaints: false,
        }, () => {
          notification.error({
            message: formatMessage({ id: 'enterpriseColony.mgt.node.stainList' })
          });
        })
      }
    });
  }
  // 更新污点
  updataClusterNodeTaint = (val) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const { clusterInfo } = this.state
    this.setState({
      showTaints: false,
    })
    const name = this.props.location && this.props.location.query && this.props.location.query.name

    dispatch({
      type: 'region/updataClusterNodeTaint',
      payload: {
        enterprise_id: eid,
        region_name: clusterInfo.region_name,
        node_name: name,
        taints: val.taints
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            taintsList: res.list,
            showTaints: true
          }, () => {
            notification.success({
              message: formatMessage({ id: 'enterpriseColony.mgt.node.editSuccess' })
            });
          })
        }
      },
      handleError: () => {
        notification.error({
          message: formatMessage({ id: 'enterpriseColony.mgt.node.editDefeated' })
        });
        this.fetClusterNodeTaint(clusterInfo)
      }
    });

  }
  removeTaintsList = () => {
    this.setState({
      taintsList: [],
    })
  }
  // 节点状态操作 上线调度排空等
  editClusterNodeActive = (editActive, name) => {
    const {
      dispatch,
      match: {
        params: { eid, regionID }
      },
    } = this.props;
    const { clusterInfo } = this.state;
    this.setState({
      showInfo: false,
    })
    dispatch({
      type: 'region/editClusterNodeActive',
      payload: {
        enterprise_id: eid,
        region_name: clusterInfo.region_name,
        action: editActive,
        node_id: name
      },
      callback: res => {
        if (res && res.status_code == 200) {
          notification.success({
            message: formatMessage({ id: 'enterpriseColony.mgt.node.editSuccess' })
          });
          this.fetClusterNodeDetail(clusterInfo)
          this.fetClusterNodeTaint(clusterInfo)
          this.fetClusterNodeLabels(clusterInfo)
        }
      },
      handleError: () => {
        notification.error({
          message: formatMessage({ id: 'enterpriseColony.mgt.node.editDefeated' })
        });
        this.fetClusterNodeDetail(clusterInfo)
        this.fetClusterNodeTaint(clusterInfo)
        this.fetClusterNodeLabels(clusterInfo)
      }
    });
  }
  render() {
    const { clusterInfo, nodeDetail, showInfo, labelList, showLable, showTaints, taintsList } = this.state
    const eid = global.getCurrEnterpriseId()
    return (
      <PageHeaderLayout
        title={
          <Row className={styles.breadStyle}>
            <span>{pageheaderSvg.getPageHeaderSvg('clusters', 18)}</span>
            <span><Link to={`/enterprise/${eid}/clusters`}>{formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterMgt' })} / </Link></span>
            <span><Link to={`/enterprise/${eid}/clusters/clustersmgt/${clusterInfo.region_id}`}>{clusterInfo.region_alias} / </Link></span>
            <span>{nodeDetail && nodeDetail.name}</span>
          </Row>
        }
        content={formatMessage({ id: 'enterpriseColony.mgt.cluster.nodeInfo' })}
      >
        <ScrollerX sm={840}>
          <Row className={styles.titleStyle} style={{ margin: '0 0 10px' }}>
            <span>{SVG.getSvg("infoSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.node.nodeDetails' })}</span>
          </Row>
          <Row>
            <NodeInfo
              nodeDetail={nodeDetail}
              showInfo={showInfo}
              active={this.editClusterNodeActive}
            />
          </Row>
          <Row className={styles.titleStyle}>
            <span>{SVG.getSvg("userSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.cluster.user' })}</span>
          </Row>
          <Row >
            <NodeUse
              nodeDetail={nodeDetail}
              showInfo={showInfo}
            />
          </Row>
          <Row className={styles.titleStyle}>
            <span>{SVG.getSvg("labelSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.node.lable' })}</span>
          </Row>
          <Row>
            <NodeLable
              clusterInfo={clusterInfo}
              labelList={labelList}
              showLable={showLable}
              updataLabel={this.updataClusterNodeLabels}
            />
          </Row>
          <Row className={styles.titleStyle}>
            <span>{SVG.getSvg("stainSvg", 20)}</span>
            <span>{formatMessage({ id: 'enterpriseColony.mgt.node.stain' })}</span>
          </Row>
          <Row>
            <NodeStain
              clusterInfo={clusterInfo}
              taintsList={taintsList}
              showTaints={showTaints}
              fetTaints={this.fetClusterNodeTaint}
              updataTaints={this.updataClusterNodeTaint}
              remove={this.removeTaintsList}
            />
          </Row>
        </ScrollerX>
      </PageHeaderLayout>
    );
  }
}

export default Index;

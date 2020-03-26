import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Card, Table, notification, Badge, Row, Col, Button } from "antd";
import userUtil from "../../utils/user";
import EditClusterInfo from "../../components/Cluster/EditClusterInfo";
import BaseAddCluster from "../../components/Cluster/BaseAddCluster";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import ConfirmModal from "../../components/ConfirmModal";

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects["global/creatOauth"],
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      clusters: [],
      editClusterShow: false,
      addClusterShow: false,
      regionInfo: false,
      text: "",
      delVisible: false
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }
  componentDidMount() {
    this.loadClusters();
  }

  editClusterOK = () => {
    this.loadClusters();
    this.cancelCreatClusters();
  };

  addClusterOK = () => {
    this.loadClusters();
    this.cancelAddCluster();
  }

  handleDelete = () => {
    const { regionInfo } = this.state;
    const { dispatch, match: { params: { eid } } } = this.props;
    dispatch({
      type: "region/deleteEnterpriseCluster",
      payload: {
        region_id: regionInfo.region_id,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._condition === 200) {
          this.loadClusters();
          this.cancelClusters();
          notification.success({ message: "删除成功" });
        }
      }
    });
  };

  loadClusters = name => {
    const { dispatch, match: { params: { eid } } } = this.props;
    dispatch({
      type: "region/fetchEnterpriseClusters",
      payload: {
        enterprise_id: eid,
        name
      },
      callback: res => {
        if (res) {
          this.setState({ clusters: res.list });
        }
      }
    });
  };

  // 添加集群
  addClusterShow = () => {
    this.setState({
      addClusterShow: true,
      text: "添加集群"
    });
  };
  cancelAddCluster = () => {
    this.setState({addClusterShow: false})
  }

  cancelEditClusters = () => {
    this.setState({
      editClusterShow: false,
      text: "",
      regionInfo: false
    });
  };

  handleEdit = item => {
    this.loadPutCluster(item.region_id);
  };

  delUser = regionInfo => {
    this.setState({
      delVisible: true,
      regionInfo
    });
  };
  cancelClusters = () => {
    this.setState({
      delVisible: false,
      regionInfo: false
    });
  };

  handlUnit = num => {
    if (num) {
      let nums = num;
      if (nums >= 1024) {
        nums = num / 1024;
        return nums.toFixed(2) / 1;
      }
      return num;
    }
    return 0
  };

  loadPutCluster = regionID => {
    const { dispatch, match: { params: { eid } } } = this.props;
    dispatch({
      type: "region/fetchEnterpriseCluster",
      payload: {
        enterprise_id: eid,
        region_id: regionID
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            regionInfo: res.bean,
            editClusterShow: true,
            text: "编辑集群"
          });
        }
      }
    });
  };

  render() {
    const { clusters, text, regionInfo, delVisible, addClusterShow } = this.state;

    const { match: { params: { eid } } } = this.props;

    const colorbj = (color, bg) => {
      return {
        width: "100px",
        color,
        background: bg,
        borderRadius: "15px",
        padding: "2px 0"
      };
    };
    const columns = [
      {
        title: "名称",
        dataIndex: "region_alias",
        rowKey: "region_alias",
        align: "center",
        width: "30%"
      },
      {
        title: "内存(GB)",
        dataIndex: "total_memory",
        rowKey: "total_memory",
        align: "center",
        width: "20%",
        render: (_, val) => {
          return (
            <span>
              {this.handlUnit(val.used_memory)}/
              {this.handlUnit(val.total_memory)}
            </span>
          );
        }
      },
      {
        title: "版本",
        dataIndex: "rbd_version",
        rowKey: "rbd_version",
        align: "center",
        width: "30%"
      },
      {
        title: "状态",
        dataIndex: "status",
        rowKey: "status",
        align: "center",
        width: "10%",
        render: (val, data) => {
          if (data.health_status === "failure") {
            return <span style={{ color: "red" }}>异常</span>;
          }
          switch (val) {
            case "0":
              return (
                <div style={colorbj("#1890ff", "#e6f7ff")}>
                  <Badge color="#1890ff" />
                  编辑中
                </div>
              );
            case "1":
              return (
                <div style={colorbj("#52c41a", "#e9f8e2")}>
                  <Badge color="#52c41a" />
                  运行中
                </div>
              );
            case "2":
              return (
                <div style={colorbj("#b7b7b7", "#f5f5f5")}>
                  <Badge color="#b7b7b7" />
                  已下线
                </div>
              );

            case "3":
              return (
                <div style={colorbj("#1890ff", "#e6f7ff")}>
                  <Badge color="#1890ff" />
                  维护中
                </div>
              );
            case "5":
              return (
                <div style={colorbj("#fff", "#f54545")}>
                  <Badge color="#fff" />
                  异常
                </div>
              );
            default:
              return (
                <div style={colorbj("#fff", "#ffac38")}>
                  <Badge color="#fff" />
                  未知
                </div>
              );
          }
        }
      },
      {
        title: "操作",
        dataIndex: "user_id",
        align: "center",
        rowKey: "user_id",
        width: "10%",
        render: (_, item) => {
          return [
            <a
              onClick={() => {
                this.delUser(item);
              }}
            >
              删除
            </a>,
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              编辑
            </a>
          ];
        }
      }
    ];

    return (
      <PageHeaderLayout
        title="集群管理"
        content="集群是资源的集合，以Kubernetes集群为基础，部署Rainbond Region服务即可成为Rainbond集群资源。"
      >
        <Row style={{ marginBottom: '20px' }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button onClick={this.addClusterShow} type="primary">
              添加集群
            </Button>
          </Col>
        </Row>
        <Card>

          {delVisible &&
            <ConfirmModal
              onOk={this.handleDelete}
              title="删除集群"
              subDesc="此操作不可恢复"
              desc="确定要删除此集群吗？"
              onCancel={this.cancelClusters}
            />}

          {this.state.editClusterShow &&
            <EditClusterInfo
              regionInfo={regionInfo}
              title={text}
              eid={eid}
              onOk={this.editClusterOK}
              onCancel={this.cancelEditClusters}
            />}
          {addClusterShow && 
          <BaseAddCluster
            eid={eid}
            onOk={this.addClusterOK}
            onCancel={this.cancelAddCluster}
          />
          }
          <Table size="middle" dataSource={clusters} columns={columns} />
        </Card>
      </PageHeaderLayout>
    );
  }
}

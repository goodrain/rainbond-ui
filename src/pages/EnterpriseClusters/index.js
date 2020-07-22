import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Modal,
  notification,
  Row,
  Table
} from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import React, { PureComponent } from "react";
import EditClusterInfo from "../../components/Cluster/EditClusterInfo";
import ConfirmModal from "../../components/ConfirmModal";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import userUtil from "../../utils/user";

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
@Form.create()
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
      regionInfo: false,
      text: "",
      delVisible: false,
      showTenantList: false,
      loadTenants: false,
      tenantTotal: 0,
      tenants: [],
      tenantPage: 1,
      tenantPageSize: 5,
      showTenantListRegion: "",
      setTenantLimitShow: false
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

  handleDelete = () => {
    const { regionInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
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
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: "region/fetchEnterpriseClusters",
      payload: {
        enterprise_id: eid,
        name
      },
      callback: res => {
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
          });
          this.setState({ clusters });
        }
      }
    });
  };

  // 添加集群
  addClusterShow = () => {};

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
      return (num / 1024).toFixed(2) / 1;
    }
    return 0;
  };

  loadPutCluster = regionID => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
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

  showRegions = item => {
    this.setState(
      {
        showTenantList: true,
        regionAlias: item.region_alias,
        regionName: item.region_name,
        showTenantListRegion: item.region_id,
        loadTenants: true
      },
      this.loadRegionTenants
    );
  };

  loadRegionTenants = () => {
    const { tenantPage, tenantPageSize, showTenantListRegion } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: "region/fetchEnterpriseClusterTenants",
      payload: {
        enterprise_id: eid,
        page: tenantPage,
        pageSize: tenantPageSize,
        region_id: showTenantListRegion
      },
      callback: data => {
        if (data && data.bean) {
          this.setState({
            tenants: data.bean.tenants,
            tenantTotal: data.bean.total,
            loadTenants: false
          });
        } else {
          this.setState({ loadTenants: false });
        }
      },
      handleError: err => {
        console.log(err);
        this.setState({ loadTenants: false });
      }
    });
  };

  setTenantLimit = item => {
    this.setState({
      setTenantLimitShow: true,
      limitTenantName: item.tenant_name,
      limitTeamName: item.team_name,
      initLimitValue: item.set_limit_memory
    });
  };

  submitLimit = e => {
    e.preventDefault();
    const {
      match: {
        params: { eid }
      },
      form
    } = this.props;
    const { limitTenantName, showTenantListRegion } = this.state;
    form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          this.setState({ limitSummitLoading: true });
          this.props.dispatch({
            type: "region/setEnterpriseTenantLimit",
            payload: {
              enterprise_id: eid,
              region_id: showTenantListRegion,
              tenant_name: limitTenantName,
              limit_memory: values.limit_memory
            },
            callback: data => {
              notification.success({
                message: "设置成功"
              });
              this.setState({
                limitSummitLoading: false,
                setTenantLimitShow: false
              });
              this.loadRegionTenants();
            },
            handleError: err => {
              console.log(err);
              notification.warning({
                message: "设置失败咯，请稍后重试"
              });
              this.setState({ limitSummitLoading: false });
            }
          });
        }
      }
    );
  };

  hideTenantListShow = () => {
    this.setState({
      showTenantList: false,
      showTenantListRegion: "",
      tenants: []
    });
  };
  handleTenantPageChange = page => {
    this.setState({ tenantPage: page }, this.loadRegionTenants);
  };

  handleJoinTeams = teamName => {
    const { regionName } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: "teamControl/joinTeam",
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res._code === 200) {
          this.onJumpTeam(teamName, regionName);
        }
      }
    });
  };
  onJumpTeam = (team_name, region) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.replace(`/team/${team_name}/region/${region}/index`));
  };

  render() {
    const {
      clusters,
      text,
      regionInfo,
      delVisible,
      showTenantList,
      showTenantListRegion,
      tenants,
      loadTenants,
      regionAlias
    } = this.state;
    const {
      tenantTotal,
      tenantPage,
      tenantPageSize,
      setTenantLimitShow,
      limitTeamName,
      limitSummitLoading,
      initLimitValue
    } = this.state;
    const { getFieldDecorator } = this.props.form;
    const pagination = {
      onChange: this.handleTenantPageChange,
      total: tenantTotal,
      pageSize: tenantPageSize,
      current: tenantPage
    };
    const {
      match: {
        params: { eid }
      }
    } = this.props;

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
        align: "center",
        render: (val, row) => {
          return (
            <Link to={`/enterprise/${eid}/clusters/${row.region_id}/dashboard`}>
              {val}
            </Link>
          );
        }
      },
      {
        title: "类型",
        dataIndex: "region_type",
        align: "center",
        render: (val, _) => {
          return (
            <span>
              {val && val instanceof Array && val.length > 0
                ? val.map(item => {
                    if (item == "development") {
                      return (
                        <span style={{ marginRight: "8px" }} key={item}>
                          开发集群
                        </span>
                      );
                    }
                    if (item == "ack-manage") {
                      return (
                        <span style={{ marginRight: "8px" }} key={item}>
                          阿里云-托管集群
                        </span>
                      );
                    }
                    if (item == "custom") {
                      return (
                        <span style={{ marginRight: "8px" }} key={item}>
                          普通集群
                        </span>
                      );
                    }
                  })
                : "普通集群"}
            </span>
          );
        }
      },
      {
        title: "内存(GB)",
        dataIndex: "total_memory",
        align: "center",
        width: "20%",
        render: (_, item) => {
          return (
            <a
              onClick={() => {
                this.showRegions(item);
              }}
            >
              {this.handlUnit(item.used_memory)}/
              {this.handlUnit(item.total_memory)}
            </a>
          );
        }
      },
      {
        title: "版本",
        dataIndex: "rbd_version",
        align: "center",
        width: "30%"
      },
      {
        title: "状态",
        dataIndex: "status",
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
        dataIndex: "method",
        align: "center",
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
            </a>,
            <a
              onClick={() => {
                this.showRegions(item);
              }}
            >
              资源限额
            </a>
          ];
        }
      }
    ];

    const tenantColumns = [
      {
        title: "所属团队",
        dataIndex: "team_name",
        align: "center",
        render: (_, item) => {
          return (
            <a
              onClick={() => {
                this.handleJoinTeams(item.tenant_name);
              }}
            >
              {item.team_name}
            </a>
          );
        }
      },
      {
        title: "内存使用量(MB)",
        dataIndex: "memory_request",
        align: "center"
      },
      {
        title: "CPU使用量",
        dataIndex: "cpu_request",
        align: "center"
      },
      {
        title: "租户限额(MB)",
        dataIndex: "set_limit_memory",
        align: "center"
      },
      {
        title: "运行组件数",
        dataIndex: "running_app_num",
        align: "center"
      },
      {
        title: "操作",
        dataIndex: "method",
        align: "center",
        width: "100px",
        render: (_, item) => {
          return [
            <a
              onClick={() => {
                this.setTenantLimit(item);
              }}
            >
              设置限额
            </a>
          ];
        }
      }
    ];

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 20 },
        sm: { span: 12 }
      }
    };
    return (
      <PageHeaderLayout
        title="集群管理"
        content="集群是资源的集合，以Kubernetes集群为基础，部署Rainbond Region服务即可成为Rainbond集群资源。"
      >
        <Row style={{ marginBottom: "20px" }}>
          <Col span={24} style={{ textAlign: "right" }}>
            <Link to={`/enterprise/${eid}/addCluster`}>
              <Button type="primary">添加集群</Button>
            </Link>
          </Col>
        </Row>
        <Card>
          {delVisible && (
            <ConfirmModal
              onOk={this.handleDelete}
              title="删除集群"
              subDesc="此操作不可恢复"
              desc="确定要删除此集群吗？"
              onCancel={this.cancelClusters}
            />
          )}

          {this.state.editClusterShow && (
            <EditClusterInfo
              regionInfo={regionInfo}
              title={text}
              eid={eid}
              onOk={this.cancelEditClusters}
              onCancel={this.cancelEditClusters}
            />
          )}
          <Alert
            style={{ marginBottom: "16px" }}
            message="注意！集群内存使用量是指当前集群的整体使用量，一般都大于租户内存使用量的总和"
          />
          <Table size="middle" dataSource={clusters} columns={columns} />
        </Card>
        {showTenantList && (
          <Modal
            maskClosable={false}
            title="租户资源占用排行"
            width={800}
            visible={showTenantList}
            footer={null}
            onOk={this.hideTenantListShow}
            onCancel={this.hideTenantListShow}
          >
            {setTenantLimitShow && (
              <div>
                <Alert
                  style={{ marginBottom: "16px" }}
                  message={`正在设置 ${limitTeamName} 在 ${regionAlias} 集群的内存限额`}
                />
                <Form onSubmit={this.submitLimit}>
                  <Form.Item
                    {...formItemLayout}
                    name="limit_memory"
                    label="内存限额(MB)"
                  >
                    {getFieldDecorator("limit_memory", {
                      initialValue: initLimitValue,
                      rules: [
                        {
                          required: true,
                          message: "内存限制值必填"
                        }
                      ]
                    })(
                      <InputNumber
                        style={{ width: "200px" }}
                        min={0}
                        precision={0}
                        max={2147483647}
                      />
                    )}
                  </Form.Item>
                  <div style={{ textAlign: "center" }}>
                    <Button
                      onClick={() => {
                        this.setState({
                          setTenantLimitShow: false,
                          limitSummitLoading: false
                        });
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      style={{ marginLeft: "16px" }}
                      type="primary"
                      loading={limitSummitLoading}
                      htmlType="submit"
                    >
                      确认
                    </Button>
                  </div>
                </Form>
              </div>
            )}
            {!setTenantLimitShow && (
              <div>
                <Alert
                  style={{ marginBottom: "16px" }}
                  message={`CPU 使用量 1000 相当于分配1核 CPU`}
                />
                <Table
                  pagination={pagination}
                  dataSource={tenants}
                  columns={tenantColumns}
                  loading={loadTenants}
                />
              </div>
            )}
          </Modal>
        )}
      </PageHeaderLayout>
    );
  }
}

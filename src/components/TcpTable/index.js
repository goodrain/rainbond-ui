import React, { PureComponent } from "react";
import { Link, routerRedux } from "dva/router";
import Search from "../Search";
import TcpDrawerForm from "../TcpDrawerForm";
import InfoConnectModal from "../InfoConnectModal";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { connect } from "dva";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  notification,
  Modal,
  Tooltip,
  Icon
} from "antd";
import globalUtil from "../../utils/global";
import styles from "./index.less";

@connect(({ user, global, loading }) => ({
  currUser: user.currentUser,
  groups: global.groups,
  addTcpLoading: loading.effects["gateWay/querydomain_port"]
}))
export default class TcpTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      TcpDrawerVisible: false,
      page_num: 1,
      page_size: 10,
      total: "",
      tcp_search: "",
      dataList: [],
      innerEnvs: [],
      information_connect_visible: false,
      editInfo: "",
      values: "",
      whether_open_form: false,
      tcpLoading: true,
      visibleModal: false,
      agreement: {},
      NotHttpConnectInfo: [],
      tcpType: ""
    };
  }
  componentWillMount() {
    this.load();
  }
  load = () => {
    const { dispatch } = this.props;
    const { page_num, page_size } = this.state;
    dispatch({
      type: "gateWay/queryTcpData",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_num,
        page_size
      },
      callback: data => {
        if (data) {
          this.setState({
            dataList: data.list,
            loading: false,
            total: data.bean.total,
            tcpLoading: false
          });
        }
      }
    });
  };
  handleClick = () => {
    this.setState({ TcpDrawerVisible: true });
  };
  handleClose = () => {
    this.setState({ TcpDrawerVisible: false, editInfo: "" });
  };
  rowKey = (record, index) => index;

  onPageChange = page_num => {
    const { tcp_search } = this.state;
    // this.setState({ tcpLoading: true })
    if (tcp_search) {
      this.setState({ page_num }, () => {
        this.handleSearch(tcp_search, page_num);
      });
    } else {
      this.setState({ page_num, tcpLoading: true }, () => {
        this.load();
      });
    }
  };
  handleSearch = (search_conditions, page_num) => {
    this.setState({ tcpLoading: true, page_num: page_num ? page_num : 1 });
    const { dispatch } = this.props;
    dispatch({
      type: "gateWay/searchTcp",
      payload: {
        search_conditions,
        team_name: globalUtil.getCurrTeamName(),
        page_num,
        page_size: this.state.page_size
      },
      callback: data => {
        if (data) {
          this.setState({
            total: data.bean.total,
            dataList: data.list,
            tcp_search: search_conditions,
            tcpLoading: false
          });
        }
      }
    });
  };
  /**获取连接信息 */
  handleConectInfo = record => {
    const { dispatch } = this.props;
    dispatch({
      type: "gateWay/fetchEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({
            innerEnvs: data.list || [],
            information_connect_visible: true
          });
        }
      }
    });
    this.setState({ InfoConnectModal: true });
  };
  handleCancel = () => {
    this.setState({ information_connect_visible: false });
  };
  handleDelete = values => {
    const { dispatch } = this.props;
    dispatch({
      type: "gateWay/deleteTcp",
      payload: {
        service_id: values.service_id,
        tcp_rule_id: values.tcp_rule_id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          notification.success({ message: "删除成功" });
          this.reload();
        }
      }
    });
  };
  reload() {
    this.setState(
      {
        page_num: 1
      },
      () => {
        this.load();
      }
    );
  }

  handleOk = (values, obj) => {
    const { dispatch } = this.props;
    const { editInfo, end_point, tcpType } = this.state;
    if (obj && obj.whether_open) {
      values.whether_open = true;
    }
    if (!editInfo) {
      dispatch({
        type: "gateWay/addTcp",
        payload: {
          values,
          team_name: globalUtil.getCurrTeamName()
        },
        callback: data => {
          if (data && data.bean.is_outer_service == false) {
            this.setState({
              values
            });
            this.whether_open(values);
            return;
          }
          if (data) {
            notification.success({ message: data.msg_show || "添加成功" });
          }
          this.setState({
            TcpDrawerVisible: false
          });
          this.reload();
        }
      });
    } else {
      // let end_points= `${values.end_point.ip}:${values.end_point.port}`.replace(/\s+/g, "")
      let end_pointArr = editInfo.end_point.split(":");
      values.default_port = end_pointArr[1];
      values.end_point.port == end_pointArr[1]
        ? (values.type = tcpType)
        : (values.type = 1);
      dispatch({
        type: "gateWay/editTcp",
        payload: {
          values,
          team_name: globalUtil.getCurrTeamName(),
          tcp_rule_id: editInfo.tcp_rule_id
        },
        callback: data => {
          data
            ? notification.success({ message: data.msg_show || "编辑成功" })
            : notification.error({ message: "编辑失败" });
          this.setState({
            TcpDrawerVisible: false,
            editInfo: false
          });
          this.load();
        }
      });
    }
  };
  whether_open = () => {
    this.setState({
      whether_open_form: true
    });
    const { values } = this.state;
    // this.handleOk(values, { whether_open: true })
  };
  handleEdit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: "gateWay/queryDetail_tcp",
      payload: {
        tcp_rule_id: values.tcp_rule_id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            editInfo: data.bean,
            TcpDrawerVisible: true,
            tcpType: values.type,
            end_point: values.end_point
          });
        }
      }
    });
  };
  resolveOk = () => {
    this.setState(
      {
        whether_open_form: false
      },
      () => {
        const { values } = this.state;
        this.handleOk(values, { whether_open: true });
      }
    );
  };
  handleCancel_second = () => {
    this.setState({ whether_open_form: false });
  };
  saveForm = form => {
    this.form = form;
    const { editInfo } = this.state;
  };
  openService = record => {
    this.props.dispatch({
      type: "appControl/openPortOuter",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias,
        port: record.container_port,
        action: "only_open_outer"
      },
      callback: () => {
        this.load();
      }
    });
  };
  resolveNotHttp = record => {
    const { dispatch } = this.props;
    dispatch({
      type: "gateWay/fetchEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data) {
          const dataList = data.list.filter(item => {
            // !item.attr_name.endsWith("_HOST") || !item.attr_name.endsWith("_PORT");
            return (
              !item.attr_name.endsWith("_HOST") &&
              !item.attr_name.endsWith("_PORT")
            );
          });
          this.setState({
            visibleModal: true,
            agreement: record,
            NotHttpConnectInfo: dataList || []
          });
        }
      }
    });
  };
  handeModalCancel = () => {
    this.setState({
      visibleModal: false
    });
  };
  showConnectInfo = infoArr => {
    return (
      <Table
        rowKey={this.rowKey}
        className={styles.tdPadding}
        bordered
        columns={[
          {
            title: "变量名",
            dataIndex: "attr_name",
            key: "attr_name",
            align: "center"
          },
          {
            title: "变量值",
            dataIndex: "attr_value",
            key: "attr_value",
            align: "center"
          },
          {
            title: "说明",
            dataIndex: "name",
            key: "name",
            align: "center"
          }
        ]}
        pagination={false}
        dataSource={infoArr}
        bordered={false}
      />
    );
  };
  render() {
    const { region } = this.props.currUser.teams[0];
    const currentRegion = region.filter(item => {
      return item.team_region_name == globalUtil.getCurrRegionName();
    });

    const columns = [
      {
        title: "Endpoint",
        dataIndex: "end_point",
        key: "end_point",
        align: "left",
        render: (text, record) => {
          let str = text;
          if (
            str.indexOf("0.0.0.0") > -1 &&
            currentRegion &&
            currentRegion.length > 0
          ) {
            str = str.replace(/0.0.0.0/g, currentRegion[0].tcpdomain);
          }
          return record.protocol == "http" || record.protocol == "https" ? (
            <a href={"http://" + str.replace(/\s+/g, "")} target="blank">
              {text}
            </a>
          ) : (
            <a
              href="javascript:void(0)"
              onClick={this.resolveNotHttp.bind(this, record)}
            >
              {text}
            </a>
          );
        }
        // width: "25%",
      },
      {
        title: "类型",
        dataIndex: "type",
        key: "type",
        align: "center",
        // width: "10%",
        render: (text, record, index) => {
          return text == "0" ? <span>默认</span> : <span>自定义</span>;
        }
      },
      {
        title: "协议",
        dataIndex: "protocol",
        key: "protocol",
        align: "center"
        // width: "10%",
      },
      {
        title: "应用",
        dataIndex: "group_name",
        key: "group_name",
        align: "center",
        render: (text, record) => {
          return record.is_outer_service == 0 &&
            record.service_source != "third_party" ? (
            <a href="javascript:void(0)" disabled>
              {text}
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                record.group_id
              }/`}
            >
              {text}
            </Link>
          );
        }
      },
      {
        title: "服务组件(端口)",
        dataIndex: "container_port",
        key: "container_port",
        align: "center",
        // width: "10%",
        render: (text, record) => {
          return record.is_outer_service == 0 &&
            record.service_source != "third_party" ? (
            <a href="javascript:void(0)" disabled>
              {record.service_cname}({text})
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                record.service_alias
              }/port`}
            >
              {record.service_cname}({text})
            </Link>
          );
        }
      },
      {
        title: "操作",
        dataIndex: "action",
        key: "action",
        align: "center",
        // width: "20%",
        render: (data, record, index) => {
          return record.is_outer_service == 1 ||
            record.service_source == "third_party" ? (
            <div>
              <a
                style={{ marginRight: "10px" }}
                onClick={this.handleConectInfo.bind(this, record)}
              >
                连接信息
              </a>
              <a
                style={{ marginRight: "10px" }}
                onClick={this.handleEdit.bind(this, record)}
              >
                编辑
              </a>
              <a onClick={this.handleDelete.bind(this, record)}>删除</a>
            </div>
          ) : (
            <Tooltip
              placement="topLeft"
              title="请点击开启对外服务方可操作"
              arrowPointAtCenter
            >
              <div>
                <a
                  style={{ marginRight: "10px" }}
                  onClick={this.handleDelete.bind(this, record)}
                >
                  删除
                </a>
                <a
                  style={{ marginRight: "10px" }}
                  onClick={() => {
                    this.openService(record);
                  }}
                >
                  开启
                </a>
              </div>
            </Tooltip>
          );
        }
      }
    ];
    const {
      total,
      page_num,
      page_size,
      dataList,
      innerEnvs,
      information_connect_visible,
      TcpDrawerVisible,
      whether_open_form,
      visibleModal,
      tcpType,
      agreement
    } = this.state;
    return (
      <div className={styles.tdPadding}>
        <Row
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginBottom: "20px"
          }}
        >
          <Search onSearch={this.handleSearch} />
          <Button
            type="primary"
            icon="plus"
            style={{ position: "absolute", right: "0" }}
            onClick={this.handleClick}
            loading={this.props.addTcpLoading}
          >
            添加策略
          </Button>
        </Row>
        <Card bodyStyle={{ padding: "0" }}>
          <Table
            rowKey={this.rowKey}
            pagination={{
              total: total,
              page_num: page_num,
              pageSize: page_size,
              onChange: this.onPageChange,
              current: page_num
            }}
            dataSource={dataList}
            columns={columns}
            loading={this.state.tcpLoading}
          />
        </Card>
        {TcpDrawerVisible && (
          <TcpDrawerForm
            visible={TcpDrawerVisible}
            onClose={this.handleClose}
            editInfo={this.state.editInfo}
            onOk={this.handleOk}
            ref={this.saveForm}
            tcpType={tcpType}
          />
        )}
        {information_connect_visible && (
          <InfoConnectModal
            visible={information_connect_visible}
            dataSource={innerEnvs}
            onCancel={this.handleCancel}
          />
        )}
        {whether_open_form && (
          <Modal
            title="确认要添加吗？"
            visible={this.state.whether_open_form}
            onOk={this.resolveOk}
            onCancel={this.handleCancel_second}
            footer={[
              <Button type="primary" size="small" onClick={this.resolveOk}>
                确定
              </Button>
            ]}
            zIndex={9999}
          >
            <p>您选择的应用未开启外部访问，是否自动打开并添加此访问策略？</p>
          </Modal>
        )}
        {visibleModal && (
          <Modal
            title="访问信息"
            visible={visibleModal}
            footer={null}
            onCancel={this.handeModalCancel}
          >
            <ul className={styles.ul}>
              {agreement.protocol == "tcp" || agreement.protocol == "udp" ? (
                <li style={{ fontWeight: "bold" }}>
                  您当前的访问协议是{agreement.protocol}
                </li>
              ) : (
                <li style={{ fontWeight: "bold" }}>
                  您当前的访问协议是{agreement.protocol},打开MySQL客户端访问
                </li>
              )}
              <li>
                <a href="javascript:void(0)" style={{ marginRight: "10px" }}>
                  {agreement.end_point}
                </a>
                <CopyToClipboard
                  text={agreement.end_point.replace(/\s+/g, "")}
                  onCopy={() => {
                    notification.success({ message: "复制成功" });
                  }}
                >
                  <Button size="small" type="primary">
                    <Icon type="copy" />
                    复制
                  </Button>
                </CopyToClipboard>
              </li>
              {this.showConnectInfo(this.state.NotHttpConnectInfo)}
            </ul>
          </Modal>
        )}
      </div>
    );
  }
}

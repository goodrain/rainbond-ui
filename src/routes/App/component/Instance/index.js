import React, { PureComponent } from "react";
import {
  Button,
  Icon,
  Modal,
  Form,
  Checkbox,
  Tooltip,
  Card,
  Row,
  Col,
  Table
} from "antd";
import { connect } from "dva";
import dateUtil from "../../../../utils/date-util";
import styles from "../../Index.less";
import moment from "moment";
import globalUtil from "../../../../utils/global";

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      instanceInfo: null
    };
  }
  componentDidMount() {}

  showModal = pod_name => {
    this.props.dispatch({
      type: "appControl/fetchInstanceDetails",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        pod_name
      },
      callback: res => {
        this.setState({
          instanceInfo: res.bean
        });
      }
    });

    this.setState({
      visible: true
    });
  };

  handleOk = () => {
    this.setState({
      visible: false
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };
  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(false);
  };

  containerState = state => {
    switch (state) {
      case "Running":
        return <span style={{ color: "#39aa56" }}>成功</span>;
      default:
        return <span>state</span>;
    }
  };
  render() {
    const { new_pods, old_pods } = this.props;
    const { instanceInfo } = this.state;
    return (
      <Card
        bordered={false}
        title="运行实例"
        style={{ margin: "20px 0" }}
        bodyStyle={{ padding: "0", background: "#F0F2F5" }}
      >
        <Modal
          title={instanceInfo && instanceInfo.name}
          width="1000px"
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          bodyStyle={{ height: "500px", overflow: "auto" }}
        >
          <div>
            {instanceInfo && (
              <div className={styles.instanceBox}>
                <div>
                  <ul className={styles.instanceInfo}>
                    <li>
                      <span>所在节点:</span>
                      <Tooltip title={instanceInfo.node}>
                        <span>{instanceInfo.node}</span>
                      </Tooltip>
                    </li>
                    <li>
                      <span>创建时间:</span>
                      <span>
                        {moment(instanceInfo.start_time).format(
                          "YYYY年-MM月-DD日"
                        )}
                      </span>
                    </li>

                    <li>
                      <span>实例IP地址:</span>
                      <Tooltip title={instanceInfo.ip}>
                        <span>{instanceInfo.ip}</span>
                      </Tooltip>
                    </li>
                    <li>
                      <span />
                      <span />
                    </li>
                    <li>
                      <span>实例状态:</span>
                      <span>{instanceInfo.status.type}</span>
                    </li>
                    {instanceInfo.status.reason && (
                      <li style={{ width: "100%" }}>
                        <span>原因:</span>
                        <span>{instanceInfo.status.reason}</span>
                      </li>
                    )}

                    {instanceInfo.status.message && (
                      <li style={{ width: "100%" }}>
                        <span>说明:</span>
                        <span>{instanceInfo.status.message}</span>
                      </li>
                    )}
                    {instanceInfo.status.advice && (
                      <li style={{ width: "100%" }}>
                        <span>建议:</span>
                        <span>{instanceInfo.status.advice}</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <div
                    className={styles.logpassed}
                    style={{
                      padding: "10px",
                      color: "rgba(0, 0, 0, 0.85)",
                      fontSize: "14px"
                      // background: "#fff"
                    }}
                  >
                    实例中的容器
                  </div>

                  <div style={{ height: "15px", background: "#fff" }} />
                  {instanceInfo.containers &&
                    instanceInfo.containers.length > 0 && (
                      <Table
                        dataSource={instanceInfo.containers}
                        columns={[
                          {
                            title: "镜像名",
                            dataIndex: "image",
                            key: "image",
                            width: 100,
                            render: image => (
                              <Tooltip title={image}>
                                <span
                                  style={{
                                    wordWrap: "break-word",
                                    wordBreak: "break-all"
                                  }}
                                >
                                  {image}
                                </span>
                              </Tooltip>
                            )
                          },
                          {
                            title: "状态",
                            dataIndex: "state",
                            key: "state",
                            width: "10%",
                            render: state => this.containerState(state)
                          },
                          {
                            title: "异常状态的原因",
                            dataIndex: "reason",
                            key: "reason",
                            width: "20%",
                            render: reason => <span>{reason || "-"}</span>
                          },
                          {
                            title: "创建时间",
                            dataIndex: "started",
                            key: "started",
                            width: "20%",
                            render: started => (
                              <Tooltip
                                title={moment(started).format(
                                  "YYYY年-MM月-DD日"
                                )}
                              >
                                {moment(started).format("YYYY年-MM月-DD日")}
                              </Tooltip>
                            )
                          },
                          {
                            title: "内存",
                            dataIndex: "limit_memory",
                            key: "limit_memory",
                            width: "10%",
                            render: limit_memory => <span>{limit_memory}</span>
                          },
                          {
                            title: "CPU",
                            dataIndex: "limit_cpu",
                            key: "limit_cpu",
                            width: "10%",
                            render: limit_cpu => <span>{limit_cpu}</span>
                          }
                        ]}
                      />
                    )}
                </div>

                <div>
                  <div style={{ height: "15px", background: "#fff" }} />
                  <div
                    className={styles.logpassed}
                    style={{
                      padding: "10px",
                      color: "rgba(0, 0, 0, 0.85)",
                      fontSize: "14px"
                    }}
                  >
                    事件
                  </div>
                  <div style={{ height: "15px", background: "#fff" }} />
                  <Table
                    dataSource={instanceInfo.events}
                    columns={[
                      {
                        title: "类型",
                        dataIndex: "type",
                        key: "type",
                        width: "20%"
                      },
                      {
                        title: "原因",
                        dataIndex: "reason",
                        key: "reason",
                        width: "20%",
                        render: reason => (
                          <Tooltip title={reason}>
                            <span>{reason}</span>
                          </Tooltip>
                        )
                      },
                      {
                        title: "时间",
                        dataIndex: "age",
                        key: "age",
                        width: "10%"
                      },
                      {
                        title: "说明",
                        dataIndex: "message",
                        key: "message",
                        width: "50%",
                        render: message => (
                          <Tooltip title={message}>
                            <span
                              style={{
                                wordWrap: "break-word",
                                wordBreak: "break-all"
                              }}
                            >
                              {message}
                            </span>
                          </Tooltip>
                        )
                      }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
        <Row
          gutter={24}
          style={{
            margin: old_pods && old_pods.length > 0 ? "10px 0" : "0",
            borderTop:
              old_pods && old_pods.length > 0 ? "none" : "1px solid #e8e8e8"
          }}
        >
          <Col
            xs={old_pods && old_pods.length > 0 ? 10 : 24}
            xm={old_pods && old_pods.length > 0 ? 10 : 24}
            md={old_pods && old_pods.length > 0 ? 10 : 24}
            lg={old_pods && old_pods.length > 0 ? 10 : 24}
            xl={old_pods && old_pods.length > 0 ? 10 : 24}
            style={{ background: "#fff", padding: "15px 0" }}
          >
            <div>
              <Row>
                {new_pods &&
                  new_pods.length > 0 &&
                  new_pods.map((item, index) => {
                    const { pod_status, pod_name } = item;
                    return (
                      <Col
                        xs={new_pods.length > 4 ? 4 : 6}
                        xm={new_pods.length > 4 ? 4 : 6}
                        md={new_pods.length > 4 ? 4 : 6}
                        lg={new_pods.length > 4 ? 4 : 6}
                        xl={new_pods.length > 4 ? 4 : 6}
                        key={pod_name}
                        className={styles.boxImg}
                      >
                        <Tooltip title="点击查看详情">
                          <div
                            className={styles.nodeBox}
                            onClick={() => {
                              this.showModal(pod_name);
                            }}
                            style={{
                              cursor: "pointer",
                              background:
                                pod_status === "Running"
                                  ? "#259B24"
                                  : pod_status === "Closed"
                                  ? "#E51C23"
                                  : "#F7EA29"
                            }}
                          />
                        </Tooltip>
                        <p>
                          {pod_status === "Running"
                            ? "正常运行"
                            : pod_status === "Closed"
                            ? "运行异常"
                            : "关闭中"}
                        </p>
                      </Col>
                    );
                  })}
              </Row>
            </div>
          </Col>
          {old_pods && old_pods.length > 0 && (
            <Col xs={4} xm={4} md={4} lg={4} xl={4}>
              <div>
                <p style={{ marginTop: "40px", textAlign: "center" }}>
                  正在滚动升级
                </p>
              </div>
            </Col>
          )}

          {old_pods && old_pods.length > 0 && (
            <Col
              xs={10}
              xm={10}
              md={10}
              lg={10}
              xl={10}
              style={{ background: "#fff", padding: "15px 0" }}
            >
              <div>
                <Row>
                  {old_pods.map((item, index) => {
                    const { pod_status, pod_name } = item;
                    return (
                      <Col
                        xs={old_pods.length > 4 ? 4 : 6}
                        xm={old_pods.length > 4 ? 4 : 6}
                        md={old_pods.length > 4 ? 4 : 6}
                        lg={old_pods.length > 4 ? 4 : 6}
                        xl={old_pods.length > 4 ? 4 : 6}
                        key={pod_name}
                        className={styles.boxImg}
                      >
                        <Tooltip title="点击查看详情">
                          <div
                            className={styles.nodeBox}
                            style={{
                              background:
                                pod_status === "Running"
                                  ? "#259B24"
                                  : pod_status === "Closed"
                                  ? "#E51C23"
                                  : "#F7EA29"
                            }}
                          />
                        </Tooltip>
                        <p>
                          {pod_status === "Running"
                            ? "升级中"
                            : pod_status === "Closed"
                            ? "运行异常"
                            : "启动中"}
                        </p>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    );
  }
}

export default Index;

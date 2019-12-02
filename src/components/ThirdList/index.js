import React, { PureComponent, Fragment } from "react";
import debounce from "lodash.debounce";
import globalUtil from "../../utils/global";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import config from "../../config/config";
import App from "../../../public/images/app.svg";
import AddGroup from "../../components/AddOrEditGroup";
import ThirForm from "./form.js";
import styles from "./Index.less";

import {
  List,
  Avatar,
  Icon,
  Skeleton,
  Badge,
  Row,
  Col,
  Input,
  Card,
  Typography,
  Pagination,
  Modal,
  Form,
  Select,
  Button,
  Spin,
  Tooltip
} from "antd";

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;

@connect()
@Form.create()
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      detection: false,
      lists: [],
      page: 1,
      page_size: 10,
      total: 0,
      loading: true,
      thirdInfo: false,
      search: "",
      event_id: "",
      check_uuid: "",
      create_status: "",
      service_info: "",
      error_infos: ""
    };
  }
  componentDidMount() {
    this.handleCodeWarehouseInfo(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.type !== this.props.type) {
      this.handleCodeWarehouseInfo(nextProps);
    }
  }
  onPageChange = page => {
    this.setState({ page, loading: true }, () => {
      this.handleCodeWarehouseInfo(this.props);
    });
  };
  handleSearch = search => {
    const _th = this;
    this.setState(
      {
        page: 1,
        loading: true,
        search
      },
      () => {
        _th.handleCodeWarehouseInfo(_th.props);
      }
    );
  };
  //获取代码仓库信息
  handleCodeWarehouseInfo = props => {
    const { page, search } = this.state;
    const { dispatch, type } = props;
    dispatch({
      type: "global/codeWarehouseInfo",
      payload: {
        page,
        search,
        oauth_service_id: type
      },
      callback: res => {
        if (res) {
          this.setState({
            loading: false,
            total: res.data.bean.total,
            lists: res.data.bean.repositories
          });
        }
      }
    });
  };

  //代码检测
  handleTestCode = () => {
    const { thirdInfo } = this.state;
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: "global/testCode",
      payload: {
        region_name,
        tenant_name: team_name,
        project_url: thirdInfo.project_url,
        version: thirdInfo.project_default_branch,
        oauth_service_id: this.props.type
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              event_id: res.data.bean && res.data.bean.event_id,
              check_uuid: res.data.bean && res.data.bean.check_uuid,
              create_status: "Checking"
            },
            () => {
              this.handleDetectionCode();
            }
          );
        }
      }
    });
  };
  handleDetectionCode = () => {
    const { event_id, check_uuid } = this.state;
    const { dispatch, type } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const _th = this;
    dispatch({
      type: "global/detectionCode",
      payload: {
        oauth_service_id: type,
        region: region_name,
        tenant_name: team_name,
        check_uuid
      },
      callback: res => {
        if (res && res._code === 200) {
          if (
            res.data.bean &&
            res.data.bean.check_status != "Success" &&
            res.data.bean.check_status != "Failure"
          ) {
            this.timer = setTimeout(function() {
              _th.handleDetectionCode();
            }, 3000);
          } else {
            clearTimeout(this.timer);
            this.setState({
              create_status: res.data.bean && res.data.bean.check_status,
              service_info: res.data.bean && res.data.bean.service_info,
              error_infos: res.data.bean && res.data.bean.error_infos
            });
          }
        }
      }
    });
  };
  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  showModal = thirdInfo => {
    this.setState({
      visible: true,
      thirdInfo
    });
  };

  handleOk = e => {
    console.log(e);
    this.setState({
      visible: false
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      visible: false
    });
  };

  handleDetection = () => {
    this.setState({
      detection: false
    });
  };
  handleOpenDetection = thirdInfo => {
    this.setState({
      thirdInfo,
      detection: true
    });
  };
  render() {
    const { visible, detection, lists, loading, thirdInfo } = this.state;
    const { handleType } = this.props;
    const data = ["goodarin", "rainbond"];
    let ServiceComponent = handleType && handleType === "Service";
    return (
      <div
        style={{
          background: ServiceComponent ? "#fff " : "#F0F2F5"
        }}
      >
        {this.state.detection && (
          <Modal
            visible={detection}
            onCancel={this.handleDetection}
            title="重新检测"
            footer={
              !this.state.create_status
                ? [
                    <Button key="back" onClick={this.handleDetection}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleTestCode}
                    >
                      检测
                    </Button>
                  ]
                : this.state.create_status == "Success"
                ? [
                    <Button key="back" onClick={this.handleDetection}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleDetection}
                    >
                      确认
                    </Button>
                  ]
                : [<Button key="back">关闭</Button>]
            }
          >
            <div>
              {this.state.create_status == "Checking" ||
              this.state.create_status == "Complete" ? (
                <div>
                  <p style={{ textAlign: "center" }}>
                    <Spin />
                  </p>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    检测中，请稍后(请勿关闭弹窗)
                  </p>
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "Failure" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#28cb75",
                      fontSize: "36px"
                    }}
                  >
                    <Icon
                      style={{
                        color: "#f5222d",
                        marginRight: 8
                      }}
                      type="close-circle-o"
                    />
                  </p>
                  {this.state.error_infos &&
                    this.state.error_infos.map(items => {
                      return (
                        <div>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `<span>${items.error_info ||
                                ""} ${items.solve_advice || ""}</span>`
                            }}
                          />
                        </div>
                      );
                      // <p style={{ textAlign: 'center', fontSize: '14px' }}>{item.key}:{item.value} </p>
                    })}
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "Success" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#28cb75",
                      fontSize: "36px"
                    }}
                  >
                    <Icon type="check-circle-o" />
                  </p>

                  {this.state.service_info &&
                    this.state.service_info.map(item => {
                      return (
                        <p style={{ textAlign: "center", fontSize: "14px" }}>
                          检测语言:{item.language}{" "}
                        </p>
                      );
                    })}
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "Failed" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "999",
                      fontSize: "36px"
                    }}
                  >
                    <Icon type="close-circle-o" />
                  </p>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    检测失败，请重新检测
                  </p>
                </div>
              ) : (
                ""
              )}

              {!this.state.create_status && (
                <div>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    确定要重新检测吗?
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {!visible ? (
          <List
            loading={loading}
            className={styles.lists}
            header={
              <Input.Search
                ref="searchs"
                placeholder="请输入搜索内容"
                enterButton="搜索"
                size="large"
                onSearch={this.handleSearch}
                style={{
                  width: 522,
                  padding: "0 0 11px 0"
                }}
              />
            }
            footer={
              <div style={{ textAlign: "right" }}>
                <Pagination
                  size="small"
                  current={this.state.page}
                  pageSize={this.state.page_size}
                  total={Number(this.state.total)}
                  onChange={this.onPageChange}
                />
              </div>
            }
            dataSource={lists}
            gutter={1}
            renderItem={item => (
              <List.Item
                className={styles.listItem}
                actions={[
                  <div>
                    <a
                      onClick={() => {
                        this.showModal(item);
                      }}
                    >
                      创建组件
                    </a>
                  </div>
                ]}
              >
                <Skeleton avatar title={false} loading={false} active>
                  <List.Item.Meta
                    style={{
                      alignItems: "center"
                    }}
                    avatar={<Avatar src={App} />}
                    title={
                      <a target="_blank" href={item.project_url}>
                        <div className={styles.listItemMataTitle}>
                          <Tooltip title={item.project_name}>
                            <div>{item.project_name || "-"}</div>
                          </Tooltip>
                          <Tooltip
                            title={
                              item.project_full_name &&
                              item.project_full_name.split("/")[0]
                            }
                          >
                            <div>
                              {item.project_full_name &&
                                item.project_full_name.split("/")[0]}
                            </div>
                          </Tooltip>
                        </div>
                      </a>
                    }
                  />
                  <Row
                    justify="center"
                    style={{
                      width: "70%",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {!ServiceComponent && (
                      <Col span={8}>
                        <Tooltip title={item.project_description}>
                          <div className={styles.listItemMataDesc}>
                            {item.project_description}
                          </div>
                        </Tooltip>
                      </Col>
                    )}
                    <Col span={ServiceComponent ? 12 : 8}>
                      <Tooltip title={item.project_default_branch}>
                        <div className={styles.listItemMataBranch}>
                          <Icon
                            type="apartment"
                            style={{ marginRight: "5px" }}
                          />
                          {item.project_default_branch || "-"}
                        </div>
                      </Tooltip>
                    </Col>
                    <Col
                      span={ServiceComponent ? 12 : 8}
                      style={{ textAlign: "center" }}
                    >
                      <Badge
                        status="processing"
                        text={
                          <a
                            onClick={() => {
                              this.handleOpenDetection(item);
                            }}
                          >
                            {item.project_language || "未检测语言"}
                          </a>
                        }
                      />
                    </Col>
                  </Row>
                </Skeleton>
              </List.Item>
            )}
          />
        ) : (
          <Card bordered={false} style={{ padding: "24px 32px" }}>
            <div
              className={styles.formWrap}
              style={{
                width: ServiceComponent ? "auto" : "500px"
              }}
            >
              <ThirForm
                onSubmit={this.props.handleSubmit}
                {...this.props}
                thirdInfo={thirdInfo}
              />
            </div>
          </Card>
        )}
      </div>
    );
  }
}

export default Index;

/* eslint-disable no-nested-ternary */

import React, { PureComponent } from "react";
import { connect } from "dva";
import moment from "moment";
import {
  Card,
  Col,
  Divider,
  Form,
  Modal,
  Popconfirm,
  Row,
  Tooltip
} from "antd";
import globalUtil from "../../../../utils/global";
import styles from "../../Index.less";
import LogShow from "../LogShow";

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      logVisible: false,
      LogHistoryList: [],
      showHighlighted: "",
      EventID: ""
    };
  }
  componentDidMount() {}

  showModal = EventID => {
    this.setState({
      EventID,
      logVisible: true
    });
  };

  handleOk = () => {
    this.setState({
      logVisible: false
    });
  };

  handleCancel = () => {
    this.setState({
      logVisible: false
    });
  };

  handleRolback = item => {
    this.props.onRollback && this.props.onRollback(item);
  };

  handleDel = item => {
    const { handleDel } = this.props;

    handleDel && handleDel(item);
  };
  showStatus = status => {
    switch (status) {
      case "":
        return "构建中";
      case "success":
        return "构建成功";
      case "failure":
        return "构建失败";
      default:
        return "未知";
    }
  };

  render() {
    const {
      dataList,
      beanData,
      current_version,
      componentPermissions: { isRollback, isDelete }
    } = this.props;
    const { LogHistoryList, showHighlighted, EventID, logVisible } = this.state;
    return (
      <Row gutter={24}>
        {logVisible && (
          <Modal
            className={styles.logModal}
            title="构建日志"
            visible={logVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            width="1200px"
            bodyStyle={{ background: "#222222", color: "#fff" }}
            footer={null}
          >
            <LogShow EventID={EventID} />
          </Modal>
        )}
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <Card
            bordered={false}
            title="构建版本历史"
            style={{ margin: "20px 0" }}
          >
            <div className={styles.buildHistoryBox}>
              <ul className={styles.buildHistoryList}>
                {dataList &&
                  dataList.length > 0 &&
                  dataList.map(item => {
                    const {
                      code_commit_msg,
                      image_domain,
                      build_user,
                      code_version,
                      status,
                      create_time,
                      build_version,
                      finish_time,
                      upgrade_or_rollback,
                      event_id,
                      image_repo,
                      code_branch,
                      image_tag,
                      kind
                    } = item;

                    return (
                      <li
                        key={build_version}
                        className={`${styles.rowLi} ${styles.prRow} ${
                          status === "success"
                            ? styles.passed
                            : status === "failure"
                            ? styles.failed
                            : styles.canceled
                        } `}
                      >
                        <div className={`${styles.lineone} ${styles.fadeOute}`}>
                          <div
                            className={`${styles.rowRtem} ${styles.buildInfo}`}
                          >
                            <div
                              className={` ${styles.alcen}  ${styles.rowBranch}`}
                            >
                              <span className={`${styles.statusIcon} `}>
                                {status === "success" ? (
                                  globalUtil.fetchSvg("success")
                                ) : status === "failure" ? (
                                  <span
                                    className={styles.icon}
                                    style={{
                                      textAlign: "center",
                                      color: "#db4545",
                                      display: "inline-block",
                                      lineHeight: 1
                                    }}
                                  >
                                    !
                                  </span>
                                ) : (
                                  globalUtil.fetchSvg("close")
                                )}
                              </span>
                              <a
                                className={` ${styles.alcen} ${styles.passeda} `}
                              >
                                <font
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: "100%",
                                    color:
                                      status === "success"
                                        ? "#39aa56"
                                        : status === "failure"
                                        ? "#db4545"
                                        : "#9d9d9d"
                                  }}
                                >
                                  {build_version}
                                  {build_version &&
                                    build_version &&
                                    current_version &&
                                    build_version == current_version &&
                                    "(当前版本)"}
                                </font>
                              </a>
                            </div>
                            <div
                              className={` ${styles.alcen} ${styles.rowMessage} `}
                            >
                              <Tooltip
                                title={
                                  kind &&
                                  (kind === "源码构建"
                                    ? "提交信息"
                                    : "源镜像仓库地址")
                                }
                              >
                                {kind &&
                                  (kind === "源码构建"
                                    ? globalUtil.fetchSvg("basicInfo")
                                    : globalUtil.fetchSvg("warehouse"))}
                              </Tooltip>

                              <Tooltip
                                title={
                                  kind &&
                                  (kind === "源码构建"
                                    ? code_commit_msg && code_commit_msg
                                    : image_domain && image_domain)
                                }
                              >
                                <span
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: "90%"
                                  }}
                                >
                                  {kind &&
                                    (kind === "源码构建"
                                      ? code_commit_msg && code_commit_msg
                                      : image_domain && image_domain)}
                                </span>
                              </Tooltip>
                            </div>
                          </div>

                          <div
                            className={`${styles.rowRtem} ${styles.buildCommitter} ${styles.alcen}`}
                          >
                            <div
                              style={{
                                width: "210px"
                              }}
                            >
                              <a
                                style={{
                                  width: "100%",
                                  cursor: "auto"
                                }}
                              >
                                <font
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: "90%"
                                  }}
                                >
                                  {build_user && ` @&nbsp;${build_user}`}
                                </font>
                              </a>
                            </div>
                            <div
                              className={` ${styles.alcen} ${styles.calcwd} `}
                            >
                              <a
                                className={`${styles.alcen}`}
                                style={{
                                  width: "50%",
                                  cursor: "auto"
                                }}
                              >
                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === "源码构建"
                                      ? "代码分支"
                                      : "源镜像名称")
                                  }
                                >
                                  {kind &&
                                    (kind === "源码构建"
                                      ? globalUtil.fetchSvg("branch")
                                      : globalUtil.fetchSvg("basicInfo"))}
                                </Tooltip>

                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === "源码构建"
                                      ? code_branch && code_branch
                                      : image_repo && image_repo)
                                  }
                                >
                                  <span
                                    className={styles.nowarpCorolText}
                                    style={{
                                      width: "90%"
                                    }}
                                  >
                                    {kind &&
                                      (kind === "源码构建"
                                        ? code_branch && code_branch
                                        : image_repo && image_repo)}
                                  </span>
                                </Tooltip>
                              </a>
                              <a
                                className={` ${styles.alcen} `}
                                style={{
                                  width: "50%",
                                  cursor: "auto"
                                }}
                              >
                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === "源码构建"
                                      ? "代码版本"
                                      : "源镜像TAG")
                                  }
                                >
                                  <span
                                    className={` ${styles.alcen} ${styles.buildwidth} `}
                                    style={{ color: "rgba(0, 0, 0, 0.65)" }}
                                  >
                                    {kind &&
                                      (kind === "源码构建"
                                        ? globalUtil.fetchSvg("warehouse")
                                        : globalUtil.fetchSvg("branch"))}
                                  </span>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === "源码构建"
                                      ? code_version && ""
                                      : image_tag && image_tag)
                                  }
                                >
                                  <font
                                    className={styles.nowarpCorolText}
                                    style={{
                                      width: "90%"
                                    }}
                                  >
                                    {kind &&
                                      (kind === "源码构建"
                                        ? code_version &&
                                          code_version.substr(0, 8)
                                        : image_tag || "")}
                                  </font>
                                </Tooltip>
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.linetwo}`}>
                          <div className={`${styles.rowRtem} ${styles.alcen}`}>
                            <a
                              className={
                                status === "success"
                                  ? styles.passeda
                                  : status === "failure"
                                  ? styles.faileda
                                  : styles.canceleda
                              }
                            >
                              {globalUtil.fetchSvg(
                                "logState",
                                status === "failure" ? "#db4545" : "#39AA56"
                              )}
                              <font
                                style={{
                                  fontSize: "14px",
                                  color:status === "failure" ? "#db4545" : "#39AA56"
                                }}
                              >
                                {this.showStatus(status)}
                              </font>
                            </a>
                          </div>
                          <div className={`${styles.rowRtem} `} />
                        </div>
                        <div className={`${styles.linestree}`}>
                          <div
                            className={`${styles.rowRtem} ${styles.rowDuration}`}
                          >
                            <div className={styles.alcen}>
                              <Tooltip title="运行时间">
                                {globalUtil.fetchSvg("runTime")}
                              </Tooltip>

                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: "inline-block",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                >
                                  {globalUtil.fetchTime(
                                    finish_time
                                      ? new Date(finish_time).getTime() -
                                          new Date(create_time).getTime()
                                      : Date.parse(new Date()) -
                                          new Date(create_time).getTime()
                                  )}
                                </font>
                              </time>
                            </div>
                          </div>
                          <div
                            className={`${styles.rowRtem} ${styles.rowCalendar} ${styles.alcen}`}
                          >
                            <div className={styles.alcen}>
                              <Tooltip title="创建时间">
                                {globalUtil.fetchSvg("createTime")}
                              </Tooltip>

                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: "inline-block",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                >
                                  {create_time &&
                                    moment(create_time)
                                      .locale("zh-cn")
                                      .format("YYYY-MM-DD HH:mm:ss")}
                                </font>
                              </time>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.linefour}`}>
                          <span>
                            <a
                              style={{ fontSize: "12px" }}
                              onClick={() => {
                                this.showModal(event_id);
                              }}
                            >
                              日志
                            </a>
                          </span>
                          {upgrade_or_rollback == 1 && isRollback ? (
                            <Popconfirm
                              title="确定要升级到此版本吗?"
                              onConfirm={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <span>
                                <Divider type="vertical" />
                                <a style={{ fontSize: "12px" }}>升级</a>
                              </span>
                            </Popconfirm>
                          ) : upgrade_or_rollback == -1 &&
                            status == "success" &&
                            build_version != current_version &&
                            isRollback &&
                            current_version ? (
                              <Popconfirm
                                title="确定要回滚到此版本吗?"
                                onConfirm={() => {
                                this.handleRolback(item);
                              }}
                              >
                                <span>
                                  <Divider type="vertical" />
                                  <a style={{ fontSize: "12px" }}>回滚</a>
                                </span>
                              </Popconfirm>
                          ) : (
                            ""
                          )}

                          <Popconfirm
                            title="确定要删除此版本吗?"
                            onConfirm={() => {
                              this.handleDel(item);
                            }}
                          >
                            {build_version != current_version &&
                              isDelete &&
                              current_version && (
                                <span>
                                  <Divider type="vertical" />
                                  <a style={{ fontSize: "12px" }}>删除</a>
                                </span>
                              )}
                          </Popconfirm>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default Index;

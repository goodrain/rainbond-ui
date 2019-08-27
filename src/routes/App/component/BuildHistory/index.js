import React, { PureComponent } from "react";
import {
  Button,
  Icon,
  Modal,
  Form,
  Checkbox,
  Popconfirm,
  Card,
  Row,
  Col,
  Tooltip
} from "antd";
import LogShow from "../LogShow";
import { connect } from "dva";
import styles from "../../Index.less";
import globalUtil from "../../../../utils/global";

import moment from "moment";

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

  render() {
    const { dataList, beanData, current_version } = this.props;
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
                      EventID,
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
                            : status === "error"
                            ? styles.failed
                            : styles.canceled
                        } `}
                      >
                        <div className={`${styles.lineone} ${styles.fadeOute}`}>
                          <div
                            className={`${styles.rowRtem} ${styles.buildInfo}`}
                          >
                            <div
                              className={` ${styles.alcen}  ${
                                styles.rowBranch
                              }`}
                            >
                              <span className={`${styles.statusIcon} `}>
                                {status === "success"
                                  ? globalUtil.fetchSvg("success")
                                  : status === "error"
                                  ? globalUtil.fetchSvg("error")
                                  : globalUtil.fetchSvg("close")}
                              </span>
                              <a
                                className={` ${styles.alcen} ${
                                  styles.passeda
                                } `}
                              >
                                <font
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: "100%"
                                  }}
                                >
                                  {build_version}
                                  {build_version &&
                                    build_version &&
                                    current_version &&
                                    build_version == current_version &&
                                    "(当前版本)"}
                                </font>

                                {/* <Tooltip title="当前版本">
                                  {globalUtil.fetchSvg("currentVersion")}
                                </Tooltip> */}
                              </a>
                            </div>
                            <div
                              className={` ${styles.alcen} ${
                                styles.rowMessage
                              } `}
                            >
                              {globalUtil.fetchSvg("warehouse")}
                              {/* 代码版本÷ */}
                              <Tooltip
                                title={
                                  kind &&
                                  (kind === "源码构建"
                                    ? code_version && ""
                                    : image_domain && image_domain)
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
                                      : image_domain
                                      ? image_domain
                                      : "")}
                                </font>
                              </Tooltip>
                            </div>
                          </div>

                          <div
                            className={`${styles.rowRtem} ${
                              styles.buildCommitter
                            } ${styles.alcen}`}
                          >
                            <a
                              style={{
                                width: "186px"
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
                            <a
                              className={`${styles.alcen}`}
                              style={{
                                width: "60%"
                              }}
                            >
                              {globalUtil.fetchSvg("basicInfo")}
                              {/* 提交信息 */}
                              <Tooltip
                                title={
                                  kind &&
                                  (kind === "源码构建"
                                    ? code_commit_msg && code_commit_msg
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
                                      ? code_commit_msg && code_commit_msg
                                      : image_repo && image_repo)}
                                </span>
                              </Tooltip>
                            </a>
                          </div>
                        </div>
                        <div className={`${styles.linetwo}`}>
                          <div className={`${styles.rowRtem} ${styles.alcen}`}>
                            <a
                              className={
                                status === "success"
                                  ? styles.passeda
                                  : status === "error"
                                  ? styles.faileda
                                  : styles.canceleda
                              }
                            >
                              {globalUtil.fetchSvg("logState")}
                              <font
                                style={{
                                  fontSize: "14px",
                                  color:
                                    status === "success" ? "#39AA56" : "#db4545"
                                }}
                              >
                                {status === "success" ? "成功" : "失败"}
                              </font>
                            </a>
                          </div>
                          <div className={`${styles.rowRtem} `}>
                            <a
                              className={` ${styles.alcen} `}
                              style={{
                                width: "100%"
                              }}
                            >
                              <span
                                className={` ${styles.alcen} ${
                                  styles.buildwidth
                                } `}
                                style={{ color: "rgba(0, 0, 0, 0.65)" }}
                              >
                                {/* 代码分支 */}
                                {globalUtil.fetchSvg("branch")}
                              </span>
                              <Tooltip
                                title={
                                  kind &&
                                  (kind === "源码构建"
                                    ? code_branch && code_branch
                                    : image_tag && image_tag)
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
                                      : image_tag && image_tag)}
                                </span>
                              </Tooltip>
                            </a>
                          </div>
                        </div>
                        <div className={`${styles.linestree}`}>
                          <div
                            className={`${styles.rowRtem} ${
                              styles.rowDuration
                            }`}
                          >
                            <div className={styles.alcen}>
                              {globalUtil.fetchSvg("runTime")}
                              {/* 运行 */}

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
                            className={`${styles.rowRtem} ${
                              styles.rowCalendar
                            } ${styles.alcen}`}
                          >
                            <div className={styles.alcen}>
                              {globalUtil.fetchSvg("createTime")}
                              {/* 创建时间 */}
                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: "inline-block",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                >
                                  {create_time &&
                                    moment(create_time).format(
                                      "YYYY-MM-DD hh:mm:ss"
                                    )}
                                </font>
                              </time>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.linefour}`}>
                          <span
                            style={{
                              marginLeft: "5px"
                            }}
                          >
                            <Tooltip title="查看日志">
                              <svg
                                style={{
                                  cursor: "pointer"
                                }}
                                onClick={() => {
                                  this.showModal(EventID);
                                }}
                                t="1566527207023"
                                class="icon"
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                p-id="5957"
                                width="16"
                                height="16"
                              >
                                <path
                                  d="M902.8 892l-95.5-96.3c62.4-95.5 35.6-223.5-59.9-285.9s-223.5-35.6-285.9 59.9-35.6 223.5 59.9 285.9c33.7 22 73.1 33.7 113.4 33.6 40.6-0.1 80.3-12.2 114-34.8l95.6 96.2c11.9 11.9 31.3 11.9 43.2 0l15.3-15.4c11.9-12.1 11.9-31.4 0-43.5l-0.1 0.3zM746.4 734.6C732 765 706 788.3 674.2 799.3c-12.7 5-26.2 7.4-39.8 6.9-69.6 1-126.7-54.6-127.7-124.2S561.4 555.3 631 554.3 757.7 609 758.6 678.5c0.3 19.5-4 38.7-12.4 56.2l0.2-0.1zM364.6 720H263.4c-17.5-0.7-31.2-15.5-30.5-33 0.7-16.6 13.9-29.8 30.5-30.5H363c2.5-29.2 9.8-57.8 21.4-84.6H263.5c-17.5-0.7-31.2-15.5-30.5-33 0.7-16.6 13.9-29.8 30.5-30.5h159.3c31.1-38.5 72.1-67.8 118.6-84.6H263.5c-17.5 0-31.8-14.2-31.7-31.8 0-17.5 14.2-31.7 31.7-31.7H749c17.5 0 31.8 14.2 31.7 31.8 0 17.5-14.2 31.7-31.7 31.7h-23.8c85.9 31.3 150.5 103.6 171.9 192.6V160.1c0.1-52.9-42.7-96-95.6-96.3H210.8c-52.9 0.4-95.5 43.3-95.5 96.2v687c0 52.9 42.7 95.9 95.6 96.2h346.4C455 912.9 379.7 825.7 364.6 720zM263.4 212.2H749c17.5 0.7 31.2 15.5 30.5 33-0.7 16.6-13.9 29.8-30.5 30.5H263.4c-17.5-0.7-31.2-15.5-30.5-33 0.7-16.6 14-29.8 30.5-30.5z"
                                  fill="#cccccc"
                                  p-id="5958"
                                />
                              </svg>
                            </Tooltip>
                          </span>
                          {upgrade_or_rollback == 1 ? (
                            <Popconfirm
                              title="确定要升级到此版本吗?"
                              onConfirm={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <span style={{ marginLeft: "5px" }}>
                                {globalUtil.fetchSvg("upgrade")}
                              </span>
                            </Popconfirm>
                          ) : upgrade_or_rollback == -1 &&
                            status == "success" &&
                            build_version != current_version &&
                            current_version ? (
                            <Popconfirm
                              title="确定要回滚到此版本吗?"
                              onConfirm={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <span style={{ marginLeft: "5px" }}>
                                {globalUtil.fetchSvg("rollback")}
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
                            <span style={{ marginLeft: "5px" }}>
                              {build_version != current_version &&
                                current_version &&
                                globalUtil.fetchSvg("delete")}
                            </span>
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

import React, { PureComponent } from "react";
import { Icon, Form, Card, Row, Col, Tooltip, Modal } from "antd";
import { connect } from "dva";
import globalUtil from "../../../../utils/global";
import dateUtil from "../../../../utils/date-util";
import appAcionLogUtil from "../../../../utils/app-action-log-util";

import LogShow from "../LogShow";
import styles from "./operation.less";

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      logVisible: false,
      content: "",
      showHighlighted: "",
      selectEventID: "",
      showSocket: false
    };
  }
  componentDidMount() {}

  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(true);
  };

  showLogModal = (EventID, showSocket) => {
    const { isopenLog, onLogPush } = this.props;
    isopenLog && onLogPush && onLogPush(false);

    this.setState({
      logVisible: true,
      selectEventID: EventID,
      showSocket: showSocket
    });
  };

  handleCancel = e => {
    this.setState({
      logVisible: false
    });
  };

  render() {
    const { logList, has_next, recordLoading, isopenLog } = this.props;
    const { logVisible, selectEventID, showSocket } = this.state;
    const logsvg = globalUtil.fetchSvg("logs", "#cccccc");
    return (
      <Card bordered={false} title="操作记录" loading={recordLoading}>
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            {logList &&
              logList.map(item => {
                const {
                  Status,
                  FinalStatus,
                  UserName,
                  OptType,
                  Message,
                  EndTime,
                  SynType,
                  EventID,
                  create_time
                } = item;
                let UserNames =
                  UserName == "system"
                    ? "@系统"
                    : UserName
                    ? `@${UserName}`
                    : "";
                let Messages =
                  Status !== "success" &&
                  globalUtil.fetchAbnormalcolor(OptType) ===
                    "rgba(0,0,0,0.65)" &&
                  Message;
                return (
                  <div
                    key={EventID}
                    className={`${styles.loginfo} ${
                      Status === "success"
                        ? styles.logpassed
                        : Status === "timeout"
                        ? styles.logcanceled
                        : Status === "failure"
                        ? styles.logfailed
                        : styles.logfored
                    }`}
                  >
                    <div
                      style={{ wordBreak: "break-word", lineHeight: "17px" }}
                    >
                      {globalUtil.fetchdayTime(create_time)}
                    </div>
                    <div>
                      <Tooltip title={Messages}>
                        <span
                          style={{
                            color: globalUtil.fetchAbnormalcolor(OptType)
                          }}
                        >
                          {globalUtil.fetchStateOptTypeText(OptType)}&nbsp;
                        </span>
                        {globalUtil.fetchOperation(FinalStatus, Status)}
                        &nbsp;
                        {Messages}
                      </Tooltip>
                    </div>
                    <div className={styles.nowarpText}>
                      <span>
                        <Tooltip title={UserNames}>{UserNames}</Tooltip>
                      </span>
                    </div>
                    <div>
                      <span
                        className={styles.alcen}
                        // style={{ justifyContent: "flex-end" }}
                      >
                        {EndTime &&
                          create_time &&
                          globalUtil.fetchSvg("runTime")}
                        <span>
                          {EndTime && create_time
                            ? globalUtil.fetchTime(
                                new Date(EndTime).getTime()
                                  ? new Date(EndTime).getTime() -
                                      new Date(create_time).getTime()
                                  : ""
                              )
                            : ""}
                        </span>
                      </span>
                    </div>
                    <div>
                      {isopenLog &&
                        FinalStatus === "" &&
                        OptType &&
                        OptType.indexOf("build") > -1 &&
                        EventID &&
                        this.showLogModal(
                          EventID,
                          FinalStatus == "" ? true : false
                        )}
                      {SynType == 0 && (
                        <Tooltip
                          visible={FinalStatus == "" ? true : false}
                          placement="top"
                          arrowPointAtCenter={true}
                          autoAdjustOverflow={false}
                          title="查看日志"
                        >
                          <div
                            style={{
                              width: "16px"
                            }}
                            onClick={() => {
                              this.showLogModal(
                                EventID,
                                FinalStatus == "" ? true : false
                              );
                            }}
                          >
                            {logsvg}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}

            {!logList ||
              (logList && logList.length === 0 && (
                <div
                  style={{
                    background: "#fff",
                    paddingBottom: "10px",
                    textAlign: "center"
                  }}
                >
                  暂无操作记录
                </div>
              ))}
            {has_next && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 30
                }}
              >
                <Icon
                  style={{
                    cursor: "pointer"
                  }}
                  onClick={this.props.handleNextPage}
                  type="down"
                />
              </p>
            )}
          </Col>
        </Row>
        {logVisible && (
          <Modal
            title={"日志"}
            className={styles.logModal}
            onCancel={this.handleCancel}
            visible={true}
            maskClosable={false}
            width="1000px"
            bodyStyle={{ background: "#222222", color: "#fff" }}
            footer={null}
          >
            <LogShow
              showSocket={showSocket}
              EventID={selectEventID}
              socket={this.props.socket && this.props.socket}
            />
          </Modal>
        )}
      </Card>
    );
  }
}

export default Index;

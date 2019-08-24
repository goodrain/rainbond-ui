import React, { PureComponent } from "react";
import {
  Icon,
  Form,
  Card,
  Row,
  Col,
  Tooltip,
  Modal,
} from "antd";
import { connect } from "dva";
import globalUtil from "../../../../utils/global";
import LogShow from "../LogShow"
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
      showSocket: false,
    };
  }
  componentDidMount() {}

  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(true);
  };

  formatSeconds = value => {
    var secondTime = parseInt(value); // 秒
    var minuteTime = 0; // 分
    var hourTime = 0; // 小时
    if (secondTime > 60) {
      //如果秒数大于60，将秒数转换成整数
      //获取分钟，除以60取整数，得到整数分钟
      minuteTime = parseInt(secondTime / 60);
      //获取秒数，秒数取佘，得到整数秒数
      secondTime = parseInt(secondTime % 60);
      //如果分钟大于60，将分钟转换成小时
      if (minuteTime > 60) {
        //获取小时，获取分钟除以60，得到整数小时
        hourTime = parseInt(minuteTime / 60);
        //获取小时后取佘的分，获取分钟除以60取佘的分
        minuteTime = parseInt(minuteTime % 60);
      }
    }
    var result = "";
    if (secondTime > 0) {
      result = "" + parseInt(secondTime) + "秒";
    }
    if (minuteTime > 0) {
      result = "" + parseInt(minuteTime) + "分" + result;
    }
    if (hourTime > 0) {
      result = "" + parseInt(hourTime) + "小时" + result;
    }
    return result;
  };

  showLogModal = (EventID, showSocket) => {
    this.setState(
      {
        logVisible: true,
        selectEventID: EventID,
        showSocket: showSocket,
      }
      );
  };

  handleCancel = e => {
    this.setState({
      logVisible: false
    });
  };

  render() {
    const { logList, has_next, recordLoading } = this.props;
    const { logVisible, selectEventID, showSocket } = this.state;
    const statusCNMap = (finalstatus, status) => {
      if (finalstatus == "") {
        return (
          <span style={{ color: "#F69C49", paddingLeft: "5px" }}>进行中</span>
        );
      }
      if (finalstatus == "timeout") {
        return (
          <span style={{ color: "#F69C49", paddingLeft: "5px" }}>超时了但仍然在进行</span>
        );
      }
      switch (status) {
        case "success":
          return <span style={{ color: "#39AA56" }}>成功</span>;
        case "failure":
          return <span style={{ color: "#F5212D" }}>失败</span>;
      }
    };

    return (
      <Card bordered={false} title="操作记录" loading={recordLoading}>
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            {logList &&
              logList.map(item => {
                const {
                  StartTime,
                  Status,
                  FinalStatus,
                  UserName,
                  OptType,
                  Message,
                  EndTime,
                  SynType,
                  EventID
                } = item;
                return (
                  <div
                    key={EventID}
                    className={`${styles.loginfo} ${Status === "success"
                      ? styles.logpassed
                      : Status === "timeout"
                        ? styles.logcanceled
                        : Status === "failure"
                          ? styles.logfailed
                          : styles.logfored}`}
                  >
                    <div>
                      {StartTime}
                    </div>
                    <div>
                      <Tooltip title={Message}>
                        {globalUtil.fetchStateOptTypeText(OptType)}
                        {statusCNMap(FinalStatus, Status)}
                        {Status === "success" ? "" : Message}
                      </Tooltip>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>
                        @{UserName == "system" ? "系统" : UserName}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>
                        {this.formatSeconds(
                          (new Date(EndTime).getTime()
                            ? new Date(EndTime).getTime()
                            : Date.parse(new Date())) -
                            new Date(StartTime).getTime()
                        )}
                      </span>
                    </div>
                    <div>
                    {SynType==0 && <Tooltip title="查看日志">
                        <svg
                          style={{
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            this.showLogModal(EventID, FinalStatus==""?true:false);
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
                      </Tooltip>}
                    </div>
                  </div>
                );
              })}

            {!logList ||
              (logList &&
                logList.length === 0 &&
                <div
                  style={{
                    background: "#fff",
                    paddingBottom: "10px",
                    textAlign: "center"
                  }}
                >
                  暂无操作记录
                </div>)}
            {has_next &&
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
              </p>}
          </Col>
        </Row>
        {logVisible && <Modal
          title={"日志"}
          onCancel={this.handleCancel}
          visible={true}
          width="800px"
          bodyStyle={{ background: "#222222", color: "#fff" }}
          footer={null}
        >
          <LogShow showSocket={showSocket} EventID={selectEventID} socket={this.props.socket}></LogShow>
        </Modal>}
      </Card>
    );
  }
}

export default Index;

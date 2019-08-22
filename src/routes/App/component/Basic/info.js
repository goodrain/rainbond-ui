import React, { PureComponent } from "react";
import {
  Button,
  Icon,
  Modal,
  Form,
  Checkbox,
  Select,
  Card,
  Row,
  Col,
  Tooltip
} from "antd";
import moment from "moment";
import dateUtil from "../../../../utils/date-util";

import styles from "../../Index.less";

@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
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
  render() {
    const { logList, has_next } = this.props;

    const statusCNMap = val => {
      switch (val) {
        case "complete":
          return (
            <span style={{ color: "#39AA56", paddingLeft: "5px" }}>完成</span>
          );
        case "success":
          return (
            <span style={{ color: "#39AA56", paddingLeft: "5px" }}>完成</span>
          );
        case "failure":
          return (
            <span style={{ color: "#F5212D", paddingLeft: "5px" }}>失败</span>
          );
        case "timeout":
          return (
            <span style={{ color: "#F5212D", paddingLeft: "5px" }}>超时</span>
          );
        default:
          return (
            <span style={{ color: "#39AA56", paddingLeft: "5px" }}>进行中</span>
          );
      }
    };

    const statusOptType = {
      "": "-",
      "build-service": "构建服务",
      "start-service": "启动服务",
      "stop-service": "停止服务",
      "restart-service": "重启服务",
      "vertical-service": "垂直扩展服务",
      "horizontal-service": "水平扩展服务",
      "set-language": "设置服务语言",
      "delete-service": "删除服务",
      "upgrade-service": "升级服务",
      "delete-buildversion": "删除构建版本",
      "share-service": "分享服务",
      "add-service-dependency": "添加服务依赖",
      "delete-service-dependency": "删除服务依赖",
      "add-service-env": "添加服务环境变量",
      "update-service-env": "更新服务环境变量",
      "delete-service-env": "删除服务环境变量",
      "add-service-port": "添加服务端口",
      "update-service-port-old": "更新服务端口",
      "update-service-port": "更新服务端口",
      "delete-service-port": "删除服务端口",
      "handle-service-outerport": "修改服务对外端口",
      "handle-service-innerport": "修改服务对内端口",
      "change-service-lbport": "修改服务LB端口",
      "rollback-service": "回滚",
      "add-service-volume": "添加服务持久化存储",
      "update-service-volume": "更新服务持久化存储",
      "delete-service-volume": "删除服务持久化存储",
      "add-service-depvolume": "添加服务依赖存储",
      "delete-service-depvolume": "删除服务依赖存储",
      "add-service-probe": "添加服务探针",
      "update-service-probe": "更新服务探针",
      "delete-service-probe": "删除服务探针",
      "add-service-label": "添加服务标签",
      "update-service-label": "更新服务标签",
      "delete-service-label": "删除服务标签",
      "add-thirdpart-service": "添加第三方服务",
      "update-thirdpart-service": "更新第三方服务",
      "delete-thirdpart-service": "删除第三方服务",
      "update-service-gateway-rule": "更新服务网关规则",
      "app-restore-envs": "重新加载应用环境变量",
      "app-restore-ports": "重新加载应用端口",
      "app-restore-volumes": "重新加载应用存储",
      "app-restore-probe": "重新加载应用探针",
      "app-restore-deps": "重新加载应用依赖",
      "app-restore-depvols": "重新加载应用依赖存储",
      "app-restore-plugins": "重新加载应用插件"
    };

    return (
      <Card bordered={false} title="操作记录">
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            {logList &&
              logList.map((item, index) => {
                const {
                  StartTime,
                  Status,
                  UserName,
                  OptType,
                  Message,
                  EndTime,
                  type,
                  EventID
                } = item;
                return (
                  <div
                    key={EventID}
                    className={`${styles.loginfo} ${
                      Status === "success"
                        ? styles.logpassed
                        : Status === "timeout"
                        ? styles.logcanceled
                        : styles.logfailed
                    }`}
                  >
                    <div>{StartTime}</div>
                    <div>
                      <Tooltip title={Message}>
                        {statusOptType[OptType] ? statusOptType[OptType] : ""}
                        {statusCNMap(Status)}
                        {Status === "success" ? "" : Message}
                      </Tooltip>
                    </div>
                    <div>
                      <span>@{UserName}</span>
                      <span>
                        {this.formatSeconds(
                          (new Date(EndTime).getTime()
                            ? new Date(EndTime).getTime()
                            : Date.parse(new Date())) -
                            new Date(StartTime).getTime()
                        )}
                      </span>
                    </div>
                    {type === "deploy" && (
                      <div>
                        <Tooltip title={Message}>
                          <svg
                            t="1566376323726"
                            class="icon"
                            viewBox="0 0 1024 1024"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            p-id="1157"
                            data-spm-anchor-id="a313x.7781069.0.i2"
                            width="16"
                            height="16"
                          >
                            <path
                              d="M513.46384 60.225663c-248.291946 0-449.584462 201.299679-449.584462 449.624371 0 248.296039 201.292516 449.594695 449.584462 449.594695 248.28069 0 449.63665-201.299679 449.63665-449.594695C963.099467 261.525342 761.744529 60.225663 513.46384 60.225663zM473.683834 304.175721c2.690272-35.478026 40.597627-32.423457 40.597627-32.423457s34.488489-2.288113 39.011502 32.225959c0 0 8.162914 181.774997-15.904225 294.366308 0 0-3.746324 14.944364-23.107277 16.22145l0 0.275269c-20.751626-0.539282-24.692379-16.296151-24.692379-16.296151C465.521944 485.947647 473.683834 304.175721 473.683834 304.175721zM513.489422 747.984642c-25.719778 0-46.560432-20.840654-46.560432-46.560432 0-25.710568 20.840654-46.556339 46.560432-46.556339s46.561455 20.845771 46.561455 46.556339C560.050878 727.143988 539.2092 747.984642 513.489422 747.984642z"
                              p-id="1158"
                              fill="#BBBBBB"
                              data-spm-anchor-id="a313x.7781069.0.i3"
                              class=""
                            />
                          </svg>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                );
              })}

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
      </Card>
    );
  }
}

export default Index;

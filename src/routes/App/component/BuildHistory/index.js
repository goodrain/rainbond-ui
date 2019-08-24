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
      showHighlighted: ""
    };
  }
  componentDidMount() {}

  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(false);
  };

  showModal = EventID => {
    this.setState({
      // LogHistoryList: res.list,
      LogHistoryList: [
        {
          message: "App runtime begin restart app service gr1e74e4",
          time: "2019-08-20T11:53:25+08:00",
          utime: 1566273205
        }
      ],
      logVisible: true
    });
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "appControl/fetchLogContent",
      payload: {
        team_name,
        eventID: EventID
      },
      callback: res => {
        if (res) {
          console.log("res", res);
          this.setState({
            // LogHistoryList: res.list,
            LogHistoryList: [
              {
                message: "App runtime begin restart app service gr1e74e4",
                time: "2019-08-20T11:53:25+08:00",
                utime: 1566273205
              }
            ],
            logVisible: true
          });
        }
      }
    });
  };
  watchLog(EventID) {
    this.props.socket.watchEventLog(
      messages => {
        if (messages && messages.length > 0) {
          this.setState({ LogHistoryList: messages });
        }
      },
      message => {
        if (this.state.started) {
          var LogHistoryList = this.state.LogHistoryList || [];
          if (LogHistoryList.length >= 5000) {
            LogHistoryList.shift();
          }
          LogHistoryList.push(message);
          if (this.refs.box) {
            this.refs.box.scrollTop = this.refs.box.scrollHeight;
          }
          this.setState({ LogHistoryList: logs });
        }
      },
      error => {
        console.log("err", error);
      },
      EventID
    );
  }

  handleOk = e => {
    console.log(e);
    this.setState({
      logVisible: false
    });
  };

  handleCancel = e => {
    console.log(e);
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
    const { LogHistoryList, showHighlighted } = this.state;
    return (
      <Row gutter={24}>
        <Modal
          title="构建日志"
          visible={this.state.logVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width="1200px"
          bodyStyle={{ background: "#222222", color: "#fff" }}
          footer={null}
        >
          <div className={styles.logsss} ref="box">
            {LogHistoryList &&
              LogHistoryList.length > 0 &&
              LogHistoryList.map((item, index) => {
                const { message, utime } = item;
                return (
                  <div key={utime}>
                    <span
                      style={{
                        color: "#666666"
                      }}
                    >
                      <span>{index + 1}</span>
                    </span>
                    <span
                      ref="texts"
                      style={{
                        color: "#FFF"
                      }}
                    >
                      {message}
                    </span>
                  </div>
                );
              })}
          </div>
        </Modal>
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <Card
            bordered={false}
            title="构建版本历史"
            extra={<a onClick={this.handleMore}>返回实例列表</a>}
            style={{ margin: "20px 0" }}
          >
            <div className={styles.buildHistoryBox}>
              <ul className={styles.buildHistoryList}>
                {dataList &&
                  dataList.length > 0 &&
                  dataList.map(item => {
                    const {
                      commit_msg,
                      repo_url,
                      image_domain,
                      build_user,
                      code_version,
                      status,
                      create_time,
                      build_version,
                      finish_time,
                      dur_hours,
                      dur_minutes,
                      dur_seconds,
                      upgrade_or_rollback,
                      EventID,
                      image_repo
                    } = item;
                    return (
                      <li
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
                            <h2 className={`${styles.rowBranch}`}>
                              <span className={`${styles.statusIcon} `}>
                                {status === "success" ? (
                                  <svg
                                    className={styles.icon}
                                    viewBox="0 0 1024 1024"
                                    version="1.1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    p-id="31270"
                                    width="16"
                                    height="16"
                                  >
                                    <path
                                      d="M927.97968 108.360629a50.575037 50.575037 0 0 0-69.085501 18.517689l-391.898737 678.933747-316.000056-182.409708A50.575037 50.575037 0 0 0 100.427574 711.005546l359.812488 207.690002a50.553362 50.553362 0 0 0 69.078276-18.517689L946.504593 177.44613a50.575037 50.575037 0 0 0-18.524913-69.085501z"
                                      fill="#46AF60"
                                      p-id="31271"
                                    />
                                  </svg>
                                ) : status === "error" ? (
                                  <svg
                                    className={styles.icon}
                                    viewBox="0 0 1024 1024"
                                    version="1.1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    p-id="32079"
                                    width="16"
                                    height="16"
                                  >
                                    <path
                                      d="M 909.812 962.028 c -13.094 0 -26.188 -4.996 -36.179 -14.987 L 73.958 147.368 c -19.98 -19.98 -19.98 -52.378 0 -72.359 c 19.983 -19.98 52.38 -19.98 72.36 0 L 945.99 874.683 c 19.981 19.981 19.981 52.378 0 72.36 c -9.99 9.99 -23.084 14.985 -36.179 14.985 Z"
                                      fill="#db4545"
                                      p-id="32080"
                                    />
                                    <path
                                      d="M 110.138 962.028 c -13.094 0 -26.188 -4.996 -36.179 -14.987 c -19.98 -19.98 -19.98 -52.378 0 -72.359 L 873.632 75.01 c 19.982 -19.98 52.377 -19.98 72.36 0 c 19.98 19.981 19.98 52.378 0 72.36 L 146.316 947.041 c -9.99 9.99 -23.084 14.986 -36.179 14.986 Z"
                                      fill="#db4545"
                                      p-id="32081"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className={styles.icon}
                                    viewBox="0 0 1024 1024"
                                    version="1.1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    p-id="43063"
                                    width="16"
                                    height="16"
                                  >
                                    <path
                                      d="M511.998049 66.069397c-246.273427 0-445.926662 199.653235-445.926662 445.926462s199.653035 445.931458 445.926662 445.931458c246.296411 0 445.926462-199.658032 445.926462-445.931458S758.29446 66.069397 511.998049 66.069397zM511.998049 920.100164c-225.395582 0-408.104305-182.709523-408.104305-408.104305 0-225.395582 182.708723-408.105305 408.104305-408.105305 225.41357 0 408.125291 182.709723 408.125291 408.105305C920.12334 737.410428 737.411619 920.100164 511.998049 920.100164zM816.163025 803.452451 233.172693 196.400632l-25.336822 23.633976 583.593923 607.556477L816.163025 803.452451z"
                                      p-id="43064"
                                      fill="#9d9d9d"
                                    />
                                  </svg>
                                )}
                              </span>
                              <a className={styles.passeda}>
                                <font
                                  style={{
                                    width: "95%",
                                    display: "inline-block",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis"
                                  }}
                                >
                                  {" "}
                                  {build_version}
                                </font>
                              </a>
                            </h2>
                            <div className={styles.rowMessage}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 17 17"
                                className={styles.icon}
                              >
                                <circle
                                  cx="8.51"
                                  cy="8.5"
                                  r="3.5"
                                  fill="none"
                                  stroke="#9d9d9d"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-miterlimit="10"
                                />
                                <path
                                  d="M16.5 8.5h-4.49m-7 0H.5"
                                  fill="none"
                                  stroke="#9d9d9d"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-miterlimit="10"
                                />
                              </svg>
                              <Tooltip
                                title={
                                  commit_msg
                                    ? commit_msg
                                    : image_domain
                                    ? image_domain
                                    : "-"
                                }
                              >
                                <font
                                  style={{
                                    width: "95%",
                                    display: "inline-block",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                >
                                  {commit_msg
                                    ? commit_msg
                                    : image_domain
                                    ? image_domain
                                    : "-"}
                                </font>
                              </Tooltip>
                            </div>
                          </div>

                          <div
                            className={`${styles.rowRtem} ${
                              styles.buildCommitter
                            }`}
                          >
                            <a>
                              {/* <img
                                class="real-avatar"
                                src="https://avatars1.githubusercontent.com/u/18493394?v=4?v=3&amp;s=18"
                                srcset="https://avatars1.githubusercontent.com/u/18493394?v=4?v=3&amp;s=18 1x, https://avatars1.githubusercontent.com/u/18493394?v=4?v=3&amp;s=36 2x"
                                alt="barnettZQG头像"
                              /> */}
                              <font style={{ marginLeft: "10px" }}>
                                {build_user}
                              </font>
                            </a>
                          </div>
                        </div>
                        <div className={`${styles.linetwo}`}>
                          <h3 className={`${styles.rowRtem} ${styles.alcen}`}>
                            <a
                              className={
                                status === "success"
                                  ? styles.passeda
                                  : status === "error"
                                  ? styles.faileda
                                  : styles.canceleda
                              }
                            >
                              <svg
                                className={styles.icon}
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                p-id="26201"
                                width="16"
                                height="16"
                              >
                                <path
                                  d="M951.509333 507.2L465.194667 993.514667c-0.682667 1.024-1.130667 2.176-2.026667 3.072a20.8 20.8 0 0 1-15.253333 5.994666 20.8 20.8 0 0 1-15.253334-5.994666c-0.896-0.896-1.322667-2.048-2.026666-3.072L73.066667 635.946667c-1.024-0.682667-2.154667-1.130667-3.072-2.026667A20.8 20.8 0 0 1 64 618.666667a20.693333 20.693333 0 0 1 5.994667-15.253334c0.917333-0.896 2.048-1.322667 3.072-2.026666L559.381333 115.093333A20.906667 20.906667 0 0 1 575.914667 106.666667h86.528c2.837333-32.042667 15.914667-60.16 35.626666-78.570667l0.341334 0.384c4.181333-4.416 9.877333-7.146667 16.170666-7.146667 12.629333 0 22.869333 10.922667 22.869334 24.384 0 8-3.84 14.741333-9.408 19.178667-10.218667 9.429333-17.493333 24.298667-19.925334 41.770667h102.464c6.826667 0 12.672 3.413333 16.533334 8.426666l124.373333 124.373334a20.992 20.992 0 0 1 8.426667 16.554666V490.666667a20.906667 20.906667 0 0 1-8.405334 16.533333z m-220.757333-151.658667a22.101333 22.101333 0 0 1-16.170667 7.125334c-12.629333 0-22.826667-10.922667-22.826666-24.384 0-8 3.84-14.741333 9.408-19.2 5.290667-4.885333 9.621333-11.456 13.162666-18.837334-18.24 4.864-31.744 21.333333-31.744 41.066667a42.666667 42.666667 0 0 0 85.333334 0c0-10.090667-3.626667-19.221333-9.493334-26.538667-13.12 33.002667-27.669333 40.768-27.669333 40.768z m186.496-91.413333L802.453333 149.333333h-89.877333c3.712 9.472 9.045333 17.536 15.466667 23.466667 0.874667 0.704 1.962667 1.130667 2.709333 1.962667l0.384-0.384c22.208 20.757333 36.8 53.504 36.8 90.752 0 0.896-0.213333 1.685333-0.256 2.56 25.536 14.741333 42.922667 42.026667 42.922667 73.642666a85.333333 85.333333 0 0 1-170.666667 0 85.141333 85.141333 0 0 1 81.493333-84.949333c-1.92-18.944-9.408-35.157333-20.245333-45.184-0.874667-0.704-1.962667-1.130667-2.752-1.962667l-0.341333 0.384C682.218667 194.794667 670.506667 173.674667 664.96 149.333333h-80.917333l-469.333334 469.333334 333.205334 333.205333 469.333333-469.333333V264.128zM304.682667 582.08a20.842667 20.842667 0 0 1 29.461333 0l150.378667 150.378667a20.842667 20.842667 0 0 1-29.461334 29.461333l-150.378666-150.378667a20.842667 20.842667 0 0 1 0-29.461333z m85.333333-85.333333a20.842667 20.842667 0 0 1 29.461333 0l150.357334 150.378666a20.842667 20.842667 0 0 1-29.461334 29.461334l-150.357333-150.378667a20.842667 20.842667 0 0 1 0-29.461333z"
                                  fill=""
                                  p-id="26202"
                                />
                              </svg>
                              <font
                                style={{
                                  color:
                                    status === "success" ? "#39AA56" : "#db4545"
                                }}
                              >
                                {status === "success" ? "成功" : "失败"}
                              </font>
                            </a>
                          </h3>
                          <div className={`${styles.rowRtem} `}>
                            <a className={`${styles.alcen}`}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 17 17"
                                className={styles.icon}
                              >
                                <circle
                                  cx="3.8"
                                  cy="3.2"
                                  r="1.7"
                                  fill="none"
                                  stroke="#9d9d9d"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-miterlimit="10"
                                />
                                <path
                                  d="M6.75 15.5s1.95-1.95 1.95-1.98H6.3s-2.48.15-2.48-2.46V4.92m2.93 6.64s1.95 1.95 1.95 1.97"
                                  fill="none"
                                  stroke="#9d9d9d"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-miterlimit="10"
                                />
                                <g
                                  fill="none"
                                  stroke="#9d9d9d"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-miterlimit="10"
                                >
                                  <circle cx="13.2" cy="13.8" r="1.7" />
                                  <path d="M10.25 1.5S8.3 3.45 8.3 3.47h2.4s2.48-.15 2.48 2.46v6.14m-2.93-6.63S8.3 3.49 8.3 3.47" />
                                </g>
                              </svg>
                              <Tooltip title={image_repo ? image_repo : "-"}>
                                <font
                                  style={{
                                    maxWidth: "95%",
                                    display: "inline-block",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                  className={styles.passeda}
                                >
                                  {image_repo ? image_repo : "-"}
                                </font>
                              </Tooltip>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 17 17"
                                className={styles.icon}
                              >
                                <path
                                  d="M11.34 10.96v1.1c0 .55-.45 1-1 1H4.83c-.55 0-1-.45-1-1V6.55c0-.55.41-1 .91-1h.91m1.24 4.34l5.92-5.93m-3.9-.02h3.92v3.92"
                                  fill="none"
                                  stroke="#9d9d9d"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-miterlimit="10"
                                />
                              </svg>
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
                              <svg
                                t="1565779224563"
                                className={styles.icon}
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                p-id="1204"
                                width="16"
                                height="16"
                              >
                                <path
                                  d="M510.138182 143.592727h-3.258182A365.149091 365.149091 0 0 0 139.636364 513.163636a380.509091 380.509091 0 0 0 376.087272 375.156364h3.490909A365.149091 365.149091 0 0 0 884.363636 518.749091 379.810909 379.810909 0 0 0 510.138182 143.592727zM744.727273 748.450909a319.767273 319.767273 0 0 1-229.236364 93.090909A333.730909 333.730909 0 0 1 186.181818 512 318.603636 318.603636 0 0 1 506.88 190.138182h3.025455A333.265455 333.265455 0 0 1 837.818182 518.981818a318.138182 318.138182 0 0 1-93.090909 229.469091z"
                                  p-id="1205"
                                />
                                <path
                                  d="M605.090909 535.272727h-93.090909v-186.181818a23.272727 23.272727 0 0 0-46.545455 0v209.454546a23.272727 23.272727 0 0 0 23.272728 23.272727h116.363636a23.272727 23.272727 0 0 0 0-46.545455z"
                                  p-id="1206"
                                />
                              </svg>
                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: "inline-block",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                >
                                  {finish_time ? "   " : "-"}
                                  {dur_hours && `${dur_hours}小时`}
                                  {dur_minutes && `${dur_minutes}分钟`}
                                  {dur_seconds && `${dur_seconds}秒`}
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
                              <svg
                                t="1565853415564"
                                className={styles.icon}
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                p-id="17300"
                                width="16"
                                height="16"
                              >
                                <path
                                  d="M787.15 847.45H234.71a48.92 48.92 0 0 1-48.85-48.86V228a48.91 48.91 0 0 1 48.85-48.85h552.44A48.91 48.91 0 0 1 836 228v570.59a48.92 48.92 0 0 1-48.85 48.86zM234.71 195.19A32.89 32.89 0 0 0 201.86 228v570.59a32.89 32.89 0 0 0 32.85 32.86h552.44A32.89 32.89 0 0 0 820 798.59V228a32.89 32.89 0 0 0-32.85-32.85z"
                                  fill=""
                                  p-id="17301"
                                />
                                <path
                                  d="M836 364.29H185.86V228a48.91 48.91 0 0 1 48.85-48.85h552.44A48.91 48.91 0 0 1 836 228z m-634.14-16H820V228a32.89 32.89 0 0 0-32.85-32.85H234.71A32.89 32.89 0 0 0 201.86 228z"
                                  fill=""
                                  p-id="17302"
                                />
                                <path
                                  d="M348.92 121.08h16V250.6h-16zM672.03 121.08h16V250.6h-16zM483.31 677.22H355.84l16.78-14.12c26.14-22 93.18-88.53 89.48-131.62-1-12.15-7.67-21.64-20.27-29-29-17.39-62.07 9.22-62.4 9.49l-10.13-12.36c1.71-1.4 42.25-33.94 80.68-10.88 17.09 10 26.56 23.91 28.06 41.39 3.95 46-51.36 104.55-79.45 131.1h84.72zM567.94 679.35c-12.72 0-26.9-1.92-42.31-5.77l3.88-15.53c32.93 8.24 59.62 6.76 75.14-4.16 10-7 15.57-17.86 17.1-33.13 1.67-16.67-1.85-28.64-10.76-36.58-20.83-18.56-64.25-9.38-64.69-9.28l-11.17 2.43 1.54-11.33 11.16-81.82h88.69v16h-74.73L554 557.52c16.65-1.92 48.1-2.69 67.63 14.69 12.85 11.42 18.25 28.3 16.07 50.14-2 19.9-10 34.91-23.82 44.63-11.72 8.23-27.26 12.37-45.94 12.37z"
                                  fill=""
                                  p-id="17303"
                                />
                              </svg>
                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: "inline-block",
                                    color: "rgba(0,0,0,0.45)"
                                  }}
                                >
                                  {moment(create_time).format(
                                    "YYYY年-MM月-DD日"
                                  )}
                                </font>
                              </time>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.linefour}`}>
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
                                fill="#1296db"
                                p-id="5958"
                              />
                            </svg>
                          </Tooltip>

                          {build_version &&
                            build_version &&
                            current_version &&
                            build_version == current_version && (
                              <Tooltip title="当前版本">
                                <svg
                                  style={{
                                    cursor: "pointer"
                                  }}
                                  t="1566532978509"
                                  class="icon"
                                  viewBox="0 0 1024 1024"
                                  version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  p-id="10598"
                                  width="16"
                                  height="16"
                                >
                                  <path
                                    d="M512 42.666667C251.733333 42.666667 42.666667 251.733333 42.666667 512s209.066667 469.333333 469.333333 469.333333 469.333333-209.066667 469.333333-469.333333S772.266667 42.666667 512 42.666667z m0 874.666666C288 917.333333 106.666667 736 106.666667 512S288 106.666667 512 106.666667s405.333333 181.333333 405.333333 405.333333-181.333333 405.333333-405.333333 405.333333z"
                                    p-id="10599"
                                    fill="#1296db"
                                  />
                                  <path
                                    d="M544 279.466667c-10.666667 10.666667-14.933333 23.466667-14.933333 40.533333 0 12.8 4.266667 23.466667 12.8 32 8.533333 8.533333 19.2 12.8 32 12.8 10.666667 0 23.466667-2.133333 38.4-17.066667 10.666667-10.666667 14.933333-25.6 14.933333-40.533333 0-12.8-4.266667-23.466667-12.8-32-19.2-19.2-51.2-17.066667-70.4 4.266667zM556.8 644.266667c-14.933333 14.933333-25.6 23.466667-34.133333 29.866666 4.266667-19.2 12.8-57.6 34.133333-130.133333 21.333333-72.533333 23.466667-87.466667 23.466667-91.733333 0-10.666667-4.266667-21.333333-12.8-27.733334-17.066667-14.933333-49.066667-12.8-87.466667 10.666667-21.333333 12.8-44.8 32-68.266667 59.733333l-12.8 14.933334 44.8 34.133333 10.666667-10.666667c12.8-12.8 21.333333-19.2 25.6-25.6-34.133333 110.933333-49.066667 179.2-49.066667 209.066667 0 14.933333 4.266667 25.6 12.8 34.133333 8.533333 8.533333 19.2 12.8 32 12.8s27.733333-4.266667 44.8-14.933333c17.066667-8.533333 40.533333-29.866667 74.666667-61.866667l12.8-12.8-40.533333-38.4-10.666667 8.533334z"
                                    p-id="10600"
                                    fill="#1296db"
                                  />
                                </svg>
                              </Tooltip>
                            )}
                          {upgrade_or_rollback == 1 ? (
                            <Popconfirm
                              title="确定要升级到此版本吗?"
                              onConfirm={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <svg
                                style={{
                                  cursor: "pointer"
                                }}
                                t="1566533552365"
                                class="icon"
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                p-id="11396"
                                width="16"
                                height="16"
                              >
                                <path
                                  d="M512 57.6c249.6 0 454.4 204.8 454.4 454.4s-204.8 454.4-454.4 454.4S57.6 761.6 57.6 512 262.4 57.6 512 57.6M512 0C230.4 0 0 230.4 0 512s230.4 512 512 512 512-230.4 512-512-230.4-512-512-512z"
                                  p-id="11397"
                                  fill="#1296db"
                                />
                                <path
                                  d="M326.4 492.8l160-160v428.8c0 19.2 12.8 32 32 32s32-12.8 32-32V332.8l160 160c12.8 12.8 32 12.8 44.8 0s12.8-32 0-44.8L531.2 243.2s-6.4-6.4-12.8-6.4h-25.6c-6.4 0-6.4 6.4-12.8 6.4L281.6 448c-12.8 12.8-12.8 32 0 44.8s32 12.8 44.8 0z"
                                  p-id="11398"
                                  fill="#1296db"
                                />
                              </svg>
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
                              <svg
                                style={{
                                  cursor: "pointer"
                                }}
                                t="1566533701108"
                                class="icon"
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                p-id="14118"
                                width="16"
                                height="16"
                              >
                                <path
                                  d="M416 640V384H512v185.6l115.2 32-25.6 89.6-185.6-51.2zM512 102.4c243.2 0 448 198.4 448 448s-198.4 448-448 448-448-198.4-448-448c0-89.6 19.2-172.8 76.8-243.2l64 44.8c-38.4 57.6-57.6 128-57.6 198.4 0 198.4 166.4 364.8 364.8 364.8s364.8-166.4 364.8-364.8S710.4 185.6 512 185.6v102.4L326.4 147.2 512 0v102.4z"
                                  p-id="14119"
                                  fill="#1296db"
                                />
                              </svg>
                            </Popconfirm>
                          ) : (
                            ""
                          )}
                          <Popconfirm
                            title="确定要删除此版本吗?"
                            onConfirm={() => {
                              this.handleDel(beanData);
                            }}
                          >
                            {build_version != current_version &&
                              current_version && (
                                <svg
                                  style={{
                                    cursor: "pointer"
                                  }}
                                  t="1566533607654"
                                  class="icon"
                                  viewBox="0 0 1024 1024"
                                  version="1.1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  p-id="11648"
                                  width="16"
                                  height="16"
                                >
                                  <path
                                    d="M950.857143 219.428571h-182.857143V73.142857h-512v146.285714H73.142857v73.142858h109.714286v658.285714h658.285714V292.571429H950.857143V219.428571zM329.142857 146.285714h365.714286v73.142857h-365.714286V146.285714z m438.857143 731.428572h-512V292.571429h146.285714v438.857142h73.142857V292.571429h73.142858v438.857142h73.142857V292.571429h146.285714v585.142857z"
                                    p-id="11649"
                                    fill="#1296db"
                                  />
                                </svg>
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

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
import styles from "../../Index.less";
import moment from "moment";

@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      logVisible: false
    };
  }
  componentDidMount() {}

  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(false);
  };

  showModal = () => {
    this.setState({
      logVisible: true
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
        />
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <Card
            bordered={false}
            title="构建版本历史"
            extra={<a onClick={this.handleMore}>返回实例列表</a>}
            style={{ margin: "20px 0" }}
          >
            {/* <div
            style={{
              padding: "10px",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <span>构建版本历史</span>
            <a onClick={this.handleMore}>返回实例列表</a>
          </div> */}
            <div className={styles.buildHistoryBox}>
              <ul className={styles.buildHistoryList}>
                {dataList &&
                  dataList.length > 0 &&
                  dataList.map(item => {
                    const {
                      commit_msg,
                      repo_url,
                      build_user,
                      code_version,
                      status,
                      create_time,
                      build_version,
                      finish_time,
                      dur_hours,
                      dur_minutes,
                      dur_seconds,
                      upgrade_or_rollback
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
                              <Tooltip
                                title={commit_msg ? commit_msg : repo_url}
                              >
                                <font
                                  style={{
                                    width: "95%",
                                    display: "inline-block",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis"
                                  }}
                                >
                                  {commit_msg ? commit_msg : repo_url}
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
                              <font onClick={this.showModal}>
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
                                title={code_version ? code_version : "-"}
                              >
                                <font
                                  style={{
                                    marginLeft: "10px",
                                    maxWidth: "95%",
                                    display: "inline-block",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis"
                                  }}
                                  className={styles.passeda}
                                >
                                  {code_version ? code_version : "-"}
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
                                    color: "#39aa56",
                                    display: "inline-block"
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
                                    color: "#39aa56",
                                    display: "inline-block"
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
                          {upgrade_or_rollback == 1 ? (
                            <a
                              href="javascript:;"
                              onClick={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <Tooltip title="升级">
                                <Icon type="arrow-up" />
                              </Tooltip>
                            </a>
                          ) : upgrade_or_rollback == -1 &&
                            status == "success" &&
                            build_version != current_version &&
                            current_version ? (
                            <a
                              href="javascript:;"
                              onClick={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <Tooltip title="回滚">
                                <Icon type="rollback" />
                              </Tooltip>
                            </a>
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
                                <Tooltip title="删除">
                                  <Icon
                                    type="delete"
                                    style={{ color: "#1890FE" }}
                                  />
                                </Tooltip>
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

import React, { PureComponent } from "react";
import {
  Button,
  Icon,
  Modal,
  Form,
  Checkbox,
  Select,
  Tooltip,
  Row,
  Col
} from "antd";
import numeral from "numeral";
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
  render() {
    const { status, beanData, more, memory, disk } = this.props;
    return (
      <Row gutter={24}>
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <div className={styles.buildBox}>
            <div className={styles.buildContent}>
              <div className={styles.buildLeftBox}>
                <h2 className={styles.buildState}>
                  {(status && status.status_cn) || "-"}
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    <li>
                      <a target="_blank">
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
                        运行
                        <span
                          style={{
                            color: "#39AA55",
                            paddingLeft: "20px"
                          }}
                        >
                          {beanData && beanData.finish_time ? "   " : "-"}
                          {beanData &&
                            beanData.dur_hours &&
                            `${beanData.dur_hours}小时`}
                          {beanData &&
                            beanData.dur_minutes &&
                            `${beanData.dur_minutes}分钟`}
                          {beanData &&
                            beanData.dur_seconds &&
                            `${beanData.dur_seconds}秒`}
                        </span>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <svg
                          t="1565779336591"
                          className={styles.icon}
                          viewBox="0 0 1099 1024"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          p-id="1890"
                          width="16"
                          height="16"
                        >
                          <path
                            d="M841.66 313.7 676.06 189.2c-3.7-2.8-8.1-4.3-12.7-4.3L277.56 185c-8.5 0-16.7 5.9-16.7 16.8l0 618.8c0 13.9 12 27.2 27.3 27.2l552.2 0c8.8 0 14.8-4.3 14.8-14.2L855.16 330.1C855.06 323.4 847.06 317.7 841.66 313.7zM682.36 257.7l0 124.5c0 4.9-2.4 9.2-7.8 9.2l-262 0c-7.2 0-8.2-3.8-8.2-9.5l0-145.1 248.4 0L682.36 257.7zM804.66 778.6c0 10.7-6.5 18-16.9 18l-461 0c-8.1 0.1-13.5-5.8-13.5-14.5L313.26 248.4c0-7.1 6.6-11.5 15.3-11.5 7.5 0 17 0 27.7 0l0.1 190.4c0 6.9 4.3 10.1 10.8 10.1l346.1-0.1c6.8 0.1 10.7-5 10.5-12.7l0.1-135.2 80.8 60.4L804.66 778.6zM371.56 621.2l188.7 0c6.7 0 11.2-4.3 11.2-10.4 0-5.2 0-20.1 0-25.7 0-6.6-7-10.8-13.2-10.8L370.16 574.3c-7.8 0-11.7 4.9-11.7 10.8 0 6.4 0 21.7 0 25.4C358.46 616.5 363.16 621.2 371.56 621.2zM709.86 574.3l-95 0c-8.2 0-14.1 4.7-14.1 11.3 0 4.7 0 19 0 23.8 0 8.1 6.3 11.9 13.6 11.9l94.3 0c8.4 0 15.2-5.9 15.2-13.2 0-6.2 0-11.8 0-18.9C723.96 581.2 718.46 574.3 709.86 574.3zM480.06 698.5 371.76 698.5c-8.3 0-13.4 4.3-13.4 13.3 0 6 0 12.2 0 17.3 0 8.9 5.4 14.4 13.7 14.4l105.6 0c7.9 0 15.1-5.3 15.1-14 0-6.7 0-11.6 0-16.3C492.76 705 486.06 698.5 480.06 698.5zM709.06 698.5 533.56 698.5c-8.9 0-14.2 6.5-14.2 14.1 0 4.4 0 12.5 0 17.3 0 6.2 5.6 13.6 14.5 13.6l174 0c8.9 0 16-6.3 16-15.4 0-4.1 0-8.7 0-14.9C723.96 704.8 718.66 698.5 709.06 698.5zM627.46 360.4c7.3 0 13.2-6.1 13.2-11.4L640.66 277.4c0-7.4-4.1-11.5-10.3-11.5-5.1 0-24.9 0-29.3 0-6.2 0-9.2 4.5-9.2 11.4l0 71.9c0 6.4 6.3 11.3 11.9 11.3C608.56 360.4 622.06 360.4 627.46 360.4z"
                            p-id="1891"
                          />
                        </svg>
                        分配
                        <Tooltip title={numeral(memory).format("0,0")}>
                          <span
                            style={{
                              color: "#39AA55",
                              padding: "0 20px",
                              minWidth: "80px"
                            }}
                          >
                            {numeral(memory).format("0,0")}
                          </span>
                        </Tooltip>
                        MB 内存
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <svg
                          t="1565779448163"
                          className={styles.icon}
                          viewBox="0 0 1024 1024"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          p-id="2108"
                          width="16"
                          height="16"
                        >
                          <path
                            d="M631 117l286 286v504H107V117h524m16.5-40H67v870h890V386.5L647.5 77z m-50 40v248.6H250V117h347.5m40-40H210v328.6h427.5V77zM774 658.4V907H250V658.4h524m40-40H210V947h604V618.4zM360.7 158.1h-40v160h40v-160zM705 718.5H319v40h386v-40z m0 86.2H319v40h386v-40z"
                            fill=""
                            p-id="2109"
                          />
                        </svg>
                        占用
                        <Tooltip title={numeral(disk).format("0,0")}>
                          <span
                            style={{
                              color: "#39AA55",
                              padding: "0 20px",
                              minWidth: "80px"
                            }}
                          >
                            {numeral(disk).format("0,0")}
                          </span>
                        </Tooltip>
                        MB 磁盘
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className={styles.buildRightBox}>
                <h2 className={` ${styles.alcen} ${styles.buildState} `}>
                  <svg
                    t="1565853114924"
                    className={styles.icon}
                    viewBox="0 0 1184 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="6049"
                    width="16"
                    height="16"
                  >
                    <path
                      d="M448.576 576l118.272 0q-8 90.272-56.288 142.016t-122.56 51.712q-92.576 0-145.44-66.272t-52.864-180.576q0-110.848 53.152-178.016t133.152-67.136q84.576 0 132.576 49.728t55.424 141.152l-116 0q-2.848-36.576-20.288-56.576t-46.56-20q-32.576 0-50.56 34.56t-18.016 101.44q0 27.424 2.848 48t10.272 39.712 22.848 29.44 37.728 10.272q54.272 0 62.272-79.424zM855.424 576l117.728 0q-8 90.272-56 142.016t-122.272 51.712q-92.576 0-145.44-66.272t-52.864-180.576q0-110.848 53.152-178.016t133.152-67.136q84.576 0 132.576 49.728t55.424 141.152l-116.576 0q-2.272-36.576-20-56.576t-46.272-20q-32.576 0-50.56 34.56t-18.016 101.44q0 27.424 2.848 48t10.272 39.712 22.56 29.44 37.44 10.272q28 0 43.712-21.728t19.136-57.728zM1060.576 508q0-118.272-8.864-175.424t-34.56-92q-3.424-4.576-7.712-8t-12.288-8.576-9.152-6.272q-49.152-36-398.272-36-357.152 0-405.728 36-2.848 2.272-10.016 6.56t-12 8-8.288 8.288q-25.728 34.272-34.272 91.136t-8.576 176.288q0 118.848 8.576 175.712t34.272 91.712q3.424 4.576 8.576 8.576t11.712 8 10.016 6.848q25.152 18.848 136.864 28t268.864 9.152q348.576 0 398.272-37.152 2.848-2.272 9.728-6.272t11.712-8 7.712-9.152q26.272-34.272 34.848-90.848t8.576-176.576zM1170.272 73.152l0 877.728-1170.272 0 0-877.728 1170.272 0z"
                      p-id="6050"
                    />
                  </svg>

                  {beanData && beanData.build_version
                    ? beanData.build_version
                    : "-"}
                </h2>
                <div className={styles.buildCommitInfo}>
                  <ul className={styles.buildInfo}>
                    <li>
                      <a target="_blank">
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
                            beanData && beanData.code_version
                              ? beanData.code_version
                              : beanData && beanData.image_domain
                              ? "镜像域名"
                              : "-"
                          }
                        >
                          <span
                            style={{ color: "#39AA55", paddingLeft: "10px" }}
                          >
                            {beanData && beanData.code_version
                              ? beanData.code_version
                              : beanData && beanData.image_domain
                              ? beanData.image_domain
                              : "-"}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
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
                        <Tooltip
                          title={
                            beanData && beanData.commit_msg
                              ? beanData.commit_msg
                              : beanData && beanData.image_repo
                              ? "镜像名称"
                              : "-"
                          }
                        >
                          <span
                            style={{ color: "#39AA55", paddingLeft: "10px" }}
                          >
                            {beanData && beanData.commit_msg
                              ? beanData.commit_msg
                              : beanData && beanData.image_repo
                              ? beanData.image_repo
                              : "-"}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                    <li>
                      <a target="_blank">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 17 17"
                          className={styles.icon}
                        >
                          <circle
                            cx="4.94"
                            cy="2.83"
                            r="1.83"
                            fill="none"
                            stroke="#9d9d9d"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-miterlimit="10"
                          />
                          <circle
                            cx="11.78"
                            cy="5.15"
                            r="1.83"
                            fill="none"
                            stroke="#9d9d9d"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-miterlimit="10"
                          />
                          <circle
                            cx="4.98"
                            cy="14.17"
                            r="1.83"
                            fill="none"
                            stroke="#9d9d9d"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-miterlimit="10"
                          />
                          <path
                            d="M11.78 6.99s.09 2.68-1.9 3.38c-1.76.62-2.92-.04-4.93 1.97V4.66"
                            fill="none"
                            stroke="#9d9d9d"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-miterlimit="10"
                          />
                        </svg>
                        <Tooltip
                          title={
                            beanData && beanData.branch
                              ? beanData.branch
                              : beanData && beanData.image_tag
                              ? "镜像tag"
                              : "-"
                          }
                        >
                          <span
                            style={{ color: "#39AA55", paddingLeft: "10px" }}
                          >
                            {beanData && beanData.branch
                              ? beanData.branch
                              : beanData && beanData.image_tag
                              ? beanData.image_tag
                              : "-"}
                          </span>
                        </Tooltip>
                      </a>
                    </li>
                  </ul>
                  <p className={styles.buildAuthor}>
                    <a onClick={this.handleMore}>{!more && "查看更多版本"}</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}

export default Index;

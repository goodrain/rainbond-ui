import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Icon,
  List,
  Modal,
  notification,
  Pagination,
  Row,
  Table,
  Tooltip
} from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import moment from "moment";
import numeral from "numeral";
import React, { PureComponent } from "react";
import { FormattedMessage } from "umi-plugin-locale";
import EditGroupName from "../../components/AddOrEditGroup";
import { ChartCard, MiniArea } from "../../components/Charts";
import NumberInfo from "../../components/NumberInfo";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import { createEnterprise, createTeam } from "../../utils/breadcrumb";
import configureGlobal from "../../utils/configureGlobal";
import cookie from "../../utils/cookie";
import globalUtil from "../../utils/global";
import guideutil from "../../utils/guide";
import rainbondUtil from "../../utils/rainbond";
import roleUtil from "../../utils/role";
import sourceUtil from "../../utils/source-unit";
import userUtil from "../../utils/user";
import styles from "./Index.less";

@connect(({ user, index, loading, global, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  index,
  enterprise: global.enterprise,
  events: index.events,
  pagination: index.pagination,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  loading,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      addApplication: false,
      teamAppList: [],
      page: 1,
      page_size: 10,
      total: 0,
      domainList: [],
      domainPage: 1,
      domainPageSize: 5,
      domainTotal: 0,
      serviceList: [],
      servicePage: 1,
      servicePageSize: 5,
      num: "",
      visitData: [],
      current: null,
      guidevisible: false,
      GuideList: []
    };
  }

  componentWillMount() {
    this.getTeamAppList();
    const { enterprise } = this.props;
    if (rainbondUtil.newbieGuideEnable(enterprise)) {
      this.getGuideState();
    }
  }

  componentDidMount() {
    this.loadApps();
    this.loadOverview();
    this.getDomain();
    this.getDomainName();
    this.getTeamAppList();
    this.getService();
    this.loadEvents();
    if (this.isPublicRegion()) {
      this.getCompanyInfo();
      this.getRegionResource();
    }
  }
  componentWillUnmount() {
    this.handleClearTimeout(this.loadAppsTimer);
    this.handleClearTimeout(this.loadOverviewTimer);
    this.handleClearTimeout(this.getDomainTimer);
    this.handleClearTimeout(this.getDomainNameTimer);
  }

  onPageChange = (page, pageSize) => {
    this.setState({ page, page_size: pageSize }, () => {
      this.getTeamAppList();
    });
  };

  onDomainPageChange = domainPage => {
    this.setState({ domainPage }, () => {
      this.getDomainName();
    });
  };

  onServicePageChange = servicePage => {
    this.setState({ servicePage }, () => {
      this.getService();
    });
  };

  // 热门访问服务
  getService = () => {
    const { servicePage, servicePageSize } = this.state;
    this.props.dispatch({
      type: "global/getService",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        page: servicePage,
        page_size: servicePageSize
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            serviceList: res.list
          });
        }
      }
    });
  };

  getStartTime = () => {
    return new Date().getTime() / 1000 - 60 * 60;
  };
  getStep = () => {
    return 60;
  };

  getDomain = () => {
    const { domainPage, domainPageSize } = this.state;
    this.props.dispatch({
      type: "global/getDomainName",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        page: domainPage,
        page_size: domainPageSize,
        id: 0,
        start: this.getStartTime(),
        step: this.getStep(),
        end: new Date().getTime() / 1000
      },
      callback: res => {
        if (res && res._code == 200) {
          const visitDatas =
            res.bean &&
            res.bean.data &&
            res.bean.data.result &&
            res.bean.data.result.length > 0 &&
            res.bean.data.result[0].values &&
            res.bean.data.result[0].values;
          const arr = [];
          if (visitDatas && visitDatas.length > 0) {
            for (let i = 0; i < visitDatas.length; i += 1) {
              arr.push({
                x: moment(new Date(visitDatas[i][0] * 1000))
                  .locale('zh-cn')
                  .format('YYYY-MM-DD HH:mm'),
                y: Math.floor(visitDatas[i][1]),
              });
            }
          }
          this.setState(
            {
              visitData: arr
            },
            () => {
              this.handleTimers(
                "getDomainTimer",
                () => {
                  this.getDomain();
                },
                10000
              );
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          "getDomainTimer",
          () => {
            this.getDomain();
          },
          20000
        );
      }
    });
  };

  // 热门访问域名
  getDomainName = () => {
    const { domainPage, domainPageSize } = this.state;
    this.props.dispatch({
      type: "global/getDomainName",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        page: domainPage,
        page_size: domainPageSize,
        id: 1
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState(
            {
              domainTotal: res.bean && res.bean.total,
              domainList: res.list,
              num: res.bean && res.bean.total_traffic
            },
            () => {
              this.handleTimers(
                "getDomainNameTimer",
                () => {
                  this.getDomainName();
                },
                10000
              );
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          "getDomainNameTimer",
          () => {
            this.getDomainName();
          },
          20000
        );
      }
    });
  };

  getTeamAppList = () => {
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "global/getTeamAppList",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region: globalUtil.getCurrRegionName(),
        page,
        page_size
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            teamAppList: res.list,
            total: res.bean && res.bean.total
          });
        }
      }
    });
  };

  getGuideState = () => {
    this.props.dispatch({
      type: "global/getGuideState",
      payload: {
        enterprise_id: this.props.currUser.enterprise_id
      },
      callback: res => {
        if (res && res._code == 200) {
          const { list } = res;
          let current = 7;
          list.filter((item, index) => {
            if (!item.status) {
              current = index;
            }
            return !item.status;
          });

          this.setState(
            {
              GuideList: res.list,
              current
            },
            () => {
              const isGuidevisible =
                this.state.current === 7 ? false : !cookie.get("newbie_guide");
              if (this.state.current !== 7 && !cookie.get("newbie_guide")) {
                cookie.setGuide("newbie_guide", "true");
              }
              this.setState({
                guidevisible: isGuidevisible
              });
            }
          );
        }
      }
    });
  };

  getRegionResource() {
    this.props.dispatch({
      type: "global/getRegionSource",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.currUser.enterprise_id,
        region: globalUtil.getCurrRegionName()
      }
    });
  }
  getCompanyInfo = () => {
    this.props.dispatch({
      type: "global/getCompanyInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.currUser.enterprise_id
      }
    });
  };

  handleError = err => {
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: `请求错误`,
        description: err.data.msg_show
      });
    }
  };

  handleTimers = (timerName, callback, times) => {
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };

  isPublicRegion() {
    const region = userUtil.hasTeamAndRegion(
      this.props.currUser,
      globalUtil.getCurrTeamName(),
      globalUtil.getCurrRegionName()
    );
    if (region) {
      return region.region_scope === "public";
    }
    return false;
  }
  handleClearTimeout = timer => {
    if (timer) {
      clearTimeout(timer);
    }
  };
  loadOverview = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "index/fetchOverview",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res) {
          dispatch({
            type: "global/setNouse",
            payload: {
              isNouse: false
            }
          });
          this.handleTimers(
            "loadOverviewTimer",
            () => {
              this.loadOverview();
            },
            10000
          );
        }
      },
      handleError: err => {
        if (err && err.code === 10400) {
          dispatch({
            type: "global/setNouse",
            payload: {
              isNouse: true
            }
          });
        }
        this.handleError(err);
        this.handleTimers(
          "loadOverviewTimer",
          () => {
            this.loadOverview();
          },
          20000
        );
      }
    });
  };
  loadEvents = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "index/fetchEvents",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page: 1,
        page_size: 5
      }
    });
  };

  loadApps = () => {
    const { dispatch, form, index } = this.props;
    const { pagination } = index;
    let searchKey = {
      searchKey: "",
      service_status: ""
    };
    // 获取搜索信息
    form.validateFields((err, fieldsValue) => {
      searchKey = fieldsValue;
    });

    const payload = {
      team_name: globalUtil.getCurrTeamName(),
      region_name: globalUtil.getCurrRegionName(),
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      order: (pagination.order || "").replace("end", ""),
      fields: pagination.fields,
      ...searchKey
    };

    dispatch({
      type: "index/fetchApps",
      payload,
      callback: res => {
        if (res && res._code === 200) {
          this.handleTimers(
            "loadAppsTimer",
            () => {
              this.loadApps();
            },
            10000
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          "loadAppsTimer",
          () => {
            this.loadApps();
          },
          20000
        );
      }
    });
  };

  renderActivities() {
    const list = this.props.events || [];

    if (!list.length) {
      return (
        <p
          style={{
            textAlign: "center",
            color: "ccc",
            paddingTop: 20
          }}
        >
          暂无动态
        </p>
      );
    }

    return list.map(item => {
      const {
        UserName,
        OptType,
        FinalStatus,
        Status,
        create_time,
        Target
      } = item;

      const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
        item.service_alias
      }/overview`;
      return (
        <List.Item key={item.ID}>
          <List.Item.Meta
            title={
              <span>
                <a className={styles.username}>{UserName}</a>
                <span className={styles.event}>
                  {" "}
                  {globalUtil.fetchStateOptTypeText(OptType)}
                </span>
                &nbsp;
                {Target && Target === "service" && (
                  <Link to={linkTo} className={styles.event}>
                    {item.service_name}
                  </Link>
                )}
                <span
                  style={{
                    color: globalUtil.fetchAbnormalcolor(OptType)
                  }}
                >
                  {globalUtil.fetchOperation(FinalStatus, Status)}
                </span>
              </span>
            }
            description={
              <span className={styles.datatime_float} title={item.updatedAt}>
                {globalUtil.fetchdayTime(create_time)}
                {/* {moment(item.start_time).fromNow()}{" "} */}
              </span>
            }
          />
        </List.Item>
      );
    });
  }

  handleOkApplication = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_name: vals.group_name,
        group_note: vals.group_note
      },
      callback: res => {
        if (res) {
          notification.success({ message: "添加成功" });
          this.handleCancelApplication();
          this.getTeamAppList();
          dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName()
            }
          });
        }
      }
    });
  };

  handleCancelApplication = () => [
    this.setState({
      addApplication: false
    })
  ];

  handleOkGuidevisible = () => {
    this.setState({
      guidevisible: false
    });
  };
  handleCancelGuidevisible = () => {
    this.setState({
      guidevisible: false
    });
  };
  render() {
    const columns = [
      {
        title: "域名",
        dataIndex: "metric",
        key: "metric",
        width: "70%",
        render: (text, record) => (
          <Tooltip title={record.metric.host}>
            <div
              style={{
                wordBreak: "break-all",
                wordWrap: "break-word",
                height: "38px",
                lineHeight: "17px",
                overflow: "auto"
              }}
            >
              <a href={`http://${record.metric.host}`} target="_blank">
                {record.metric.host}
              </a>
            </div>
          </Tooltip>
        )
      },
      {
        title: "请求量/时",
        dataIndex: "value",
        key: "value",
        width: "30%",
        sorter: (a, b) => a.range - b.range,
        render: (text, record) => (
          // <Trend flag={record.status === 1 ? 'down' : 'up'}>
          <span
            style={{
              wordBreak: "break-all",
              wordWrap: "break-word",
              marginRight: 4,
              display: "inline-block"
              // minHeight: "35px"
            }}
          >
            {record.value[1]}
          </span>
        ),
        // </Trend>
        align: "right"
      }
    ];

    const columnTwo = [
      {
        title: "组件名称",
        dataIndex: "metric",
        key: "metric",
        width: "65%",
        render: (text, record) => (
          <Link
            to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
              record.metric.service_alias
            }`}
          >
            <Tooltip title={record.metric.service_cname}>
              <a
                style={{
                  display: "inline-block",
                  wordBreak: "break-all",
                  wordWrap: "break-word",
                  height: "38px",
                  lineHeight: "17px",
                  overflow: "auto"
                }}
              >
                {record.metric.service_cname}{" "}
              </a>
            </Tooltip>
          </Link>
        )
      },
      {
        title: "请求量/时",
        dataIndex: "value",
        key: "value",
        width: "35%",
        sorter: (a, b) => a.range - b.range,
        render: (text, record) => (
          // <Trend flag={record.status === 1 ? 'down' : 'up'}>
          <span
            style={{
              display: "inline-block",
              marginRight: 4,
              wordBreak: "break-all",
              wordWrap: "break-word",
              minHeight: "35px"
            }}
          >
            {record.value[1]}
          </span>
        ),
        // </Trend>
        align: "right"
      }
    ];
    const {
      index,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      currentTeamPermissionsInfo
    } = this.props;

    const { teamAppList, GuideList, domainList, serviceList } = this.state;

    const isCreate = roleUtil.queryAppInfo(
      currentTeamPermissionsInfo,
      "create"
    );

    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <p>
            <Badge status="success" />
            <FormattedMessage id="team.appNum" />
          </p>
          <div>
            <div style={{ color: "rgba(0,0,0,.85)" }}>
              {index.overviewInfo.team_app_num || 0}
            </div>
          </div>
        </div>
        <div className={styles.statItem}>
          <p>
            <Badge status="processing" />
            <FormattedMessage id="team.componentNum" />
          </p>
          <div style={{ color: "rgba(0,0,0,.85)" }}>
            {index.overviewInfo.team_service_num || 0}
          </div>
        </div>
        <div className={styles.statItem}>
          <p>
            <Badge status="error" />
            <FormattedMessage id="team.gatewayRuleNum" />
          </p>
          <div>
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control`}
              style={{
                wordBreak: "break-all",
                wordWrap: "break-word",
                color: "#1890ff"
              }}
            >
              {index.overviewInfo.total_http_domain +
                index.overviewInfo.total_tcp_domain || 0}
            </Link>
          </div>
        </div>
        <div className={styles.statItem}>
          <p>
            <Badge status="warning" />
            <FormattedMessage id="team.memoryUsage" />
          </p>
          <div>
            <Tooltip
              style={{ color: "rgba(0,0,0,.85)" }}
              title={`${sourceUtil.unit(
                index.overviewInfo.team_service_memory_count || 0,
                "MB"
              )}`}
            >
              {`${sourceUtil.unit(
                index.overviewInfo.team_service_memory_count || 0,
                "MB"
              )}`}
            </Tooltip>
          </div>
        </div>
        <div className={styles.statItem}>
          <p>
            <Badge status="warning" />
            <FormattedMessage id="team.diskUsage" />
          </p>
          <div>
            <Tooltip
              style={{ color: "rgba(0,0,0,.85)" }}
              title={`${sourceUtil.unit(
                index.overviewInfo.team_service_total_disk || 0,
                "MB"
              )}`}
            >
              {`${sourceUtil.unit(
                index.overviewInfo.team_service_total_disk || 0,
                "MB"
              )}`}
            </Tooltip>
          </div>
        </div>
        <div className={styles.statItem}>
          <p>
            <Badge status="default" />
            <FormattedMessage id="team.appmodeNum" />
          </p>
          <div>
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`}
              style={{
                wordBreak: "break-all",
                wordWrap: "break-word",
                color: "#1890ff"
              }}
            >
              {index.overviewInfo.share_app_num || 0}
            </Link>
          </div>
        </div>
      </div>
    );
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );

    const steps = guideutil.getStep(GuideList);
    return (
      <PageHeaderLayout breadcrumbList={breadcrumbList}>
        <div style={{ margin: "0px -24px 0" }}>
          <Modal
            title={
              configureGlobal.rainbondTextShow && (
                <h1
                  style={{
                    color: "#1890FF",
                    textAlign: "center",
                    border: "none",
                    marginBottom: "0px",
                    marginTop: "10px"
                  }}
                >
                  欢迎使用云应用操作系统
                </h1>
              )
            }
            visible={this.state.guidevisible}
            onOk={this.handleOkGuidevisible}
            onCancel={this.handleCancelGuidevisible}
            width={1000}
            footer={null}
            className={styles.modals}
            maskClosable={false}
          >
            <p style={{ fontSize: '17px' }}>
              是以企业云原生应用开发、架构、运维、共享、交付为核心的Kubernetes多云赋能平台。为了便于你使用和理解平台项目，我们特意为你准备了 平台 基础功能流程的新手任务
            </p>
            <p>
              <div className={styles.stepsbox}>
                {steps.map((item, index) => {
                  const { status } = item;
                  return (
                    <div
                      className={
                        status ? styles.stepssuccess : styles.stepsinfo
                      }
                      key={index}
                    >
                      <div
                        className={
                          status ? styles.stepssuccesslux : styles.stepsinfolux
                        }
                        style={{
                          marginLeft:
                            index == 0
                              ? "53px"
                              : index == 1
                              ? "80px"
                              : index == 2
                              ? "100px"
                              : index == 3
                              ? "72px"
                              : index == 4
                              ? "82px"
                              : index == 5
                              ? "77px"
                              : "53px",
                          width:
                            index == 1
                              ? "86%"
                              : index == 2
                              ? "60%"
                              : index == 3
                              ? "86%"
                              : index == 4
                              ? "78%"
                              : index == 5
                              ? "77%"
                              : "100%",
                          display: index == 6 ? "none" : ""
                        }}
                      />
                      <div
                        className={
                          status ? styles.stepssuccessbj : styles.stepsinfobj
                        }
                      >
                        <span>
                          {status && (
                            <svg
                              viewBox="64 64 896 896"
                              data-icon="check"
                              width="1em"
                              height="1em"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
                            </svg>
                          )}
                        </span>
                      </div>
                      <div
                        className={
                          status
                            ? styles.stepssuccesscontent
                            : styles.stepsinfocontent
                        }
                      >
                        <div>{item.title}</div>
                      </div>
                      <div />
                    </div>
                  );
                })}
              </div>
            </p>
            <p style={{ textAlign: "center" }}>
              <Link
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/guide`}
                style={{
                  wordBreak: "break-all",
                  wordWrap: "break-word",
                  color: "#1890ff"
                }}
              >
                <Button type="primary">查看详情</Button>
              </Link>
            </p>
          </Modal>

          <div className={styles.contents}>
            <Row>
              <Col
                xs={14}
                sm={14}
                md={14}
                lg={14}
                xl={14}
                style={{ paddingRight: "10px" }}
              >
                {extraContent}
                <Card
                  style={{
                    marginBottom: 10
                  }}
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>应用</span>
                      {isCreate && (
                        <a
                          style={{ fontSize: "14px", fontWeight: 400 }}
                          onClick={() => {
                            this.setState({ addApplication: true });
                          }}
                        >
                          增加应用
                        </a>
                      )}
                    </div>
                  }
                  bordered={false}
                  bodyStyle={{
                    padding: 0,
                    height: "100%"
                  }}
                >
                  {teamAppList &&
                    teamAppList.length > 0 &&
                    teamAppList.map((item, index) => {
                      const {
                        backup_record_num,
                        group_name,
                        run_service_num,
                        services_num,
                        share_record_num,
                        group_id
                      } = item;
                      return (
                        <div
                          key={index}
                          style={{ borderBottom: "1px solid #e8e8e8" }}
                        >
                          <div style={{ padding: "10px 20px" }}>
                            <Link
                              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                                item.group_id
                              }`}
                              style={{
                                wordBreak: "break-all",
                                wordWrap: "break-word",
                                color: "rgba(0,0,0,.85)"
                              }}
                            >
                              <a style={{ fontSize: "16px" }}>{group_name}</a>
                            </Link>

                            <div className={styles.teamListStyle}>
                              <div>
                                <span>组件：</span>
                                <Link
                                  to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                                    item.group_id
                                  }`}
                                  style={{
                                    wordBreak: "break-all",
                                    wordWrap: "break-word",
                                    color: "rgba(0,0,0,.85)"
                                  }}
                                >
                                  <a>
                                    {run_service_num
                                      ? `${run_service_num}/`
                                      : ""}
                                    {services_num}
                                  </a>
                                </Link>
                              </div>
                              <div>
                                <span>备份记录：</span>
                                <Link
                                  to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                                    item.group_id
                                  }/backup`}
                                  style={{
                                    wordBreak: "break-all",
                                    wordWrap: "break-word",
                                    color: "rgba(0,0,0,.85)"
                                  }}
                                >
                                  <a style={{ fontSize: "16px" }}>
                                    {backup_record_num}
                                  </a>
                                </Link>
                              </div>
                              <div>
                                <span>分享记录：</span>
                                <a style={{ color: "rgba(0, 0, 0, 0.65)" }}>
                                  {share_record_num}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {teamAppList &&
                  teamAppList.length > 0 &&
                  this.state.total > 0 ? (
                    <div style={{ textAlign: "right", margin: "15px" }}>
                      <Pagination
                        current={this.state.page}
                        pageSize={this.state.page_size}
                        total={Number(this.state.total)}
                        onChange={this.onPageChange}
                      />
                    </div>
                  ) : (
                    <List />
                  )}
                </Card>
              </Col>
              <Col xs={10} sm={10} md={10} lg={10} xl={10}>
                <Card
                  style={{
                    marginBottom: 10,
                    border: "none",
                    height: "562px",
                    overflow: "hidden"
                  }}
                  title="热门访问域名"
                  bordered={false}
                  bodyStyle={{
                    padding: 0
                  }}
                  border={false}
                >
                  <ChartCard
                    style={{
                      marginTop: "-20px",
                      border: "none"
                    }}
                  >
                    <NumberInfo
                      subTitle={
                        <span>
                          整体请求量
                          <Tooltip title="整体请求量">
                            <Icon
                              style={{ marginLeft: 8 }}
                              type="info-circle-o"
                            />
                          </Tooltip>
                        </span>
                      }
                      gap={8}
                      total={numeral(this.state.num).format("0,0")}
                    />
                    <MiniArea line height={45} data={this.state.visitData} />
                    <Table
                      rowKey={record => record.index}
                      size="small"
                      style={{ marginTop: "15px", height: "300px" }}
                      columns={columns}
                      dataSource={domainList}
                      pagination={{
                        style: { marginBottom: 0 },
                        current: this.state.domainPage,
                        pageSize: this.state.domainPageSize,
                        total: this.state.domainTotal,
                        onChange: this.onDomainPageChange
                      }}
                    />
                  </ChartCard>
                </Card>
                <Card
                  style={{
                    marginBottom: 10,
                    height: 468
                  }}
                  title="热门访问组件"
                  bordered={false}
                  bodyStyle={{
                    padding: 0
                  }}
                >
                  <Col span={24}>
                    <ChartCard
                      style={{
                        marginTop: "-20px",
                        border: "none"
                      }}
                    >
                      <Table
                        className={styles.cancelMargin}
                        style={{
                          height: "390px",
                          marginTop: "-20px",
                          overflow: "auto"
                        }}
                        rowKey={record => record.index}
                        size="small"
                        columns={columnTwo}
                        dataSource={serviceList}
                        pagination={false}
                      />
                    </ChartCard>
                  </Col>
                </Card>
              </Col>
            </Row>
            {this.state.addApplication && (
              <EditGroupName
                title="添加应用"
                onCancel={this.handleCancelApplication}
                onOk={this.handleOkApplication}
              />
            )}
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}

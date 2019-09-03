import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import { Card, Row, Col, List, Table, Popconfirm } from "antd";
import moment from "moment";
import globalUtil from "../../../utils/global";
import styles from "./index.less";

@connect(({ teamControl, loading, user }) => ({
  regions: teamControl.regions,
  currUser: user.currentUser,
  activitiesLoading: loading.effects["activities/fetchList"]
}))
export default class EventList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 8,
      total: 0,
      events: [],
      joinUsers: []
    };
  }
  componentDidMount() {
    this.loadEvents();
    this.loadJoinUsers();
  }
  loadEvents = () => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "index/fetchEvents",
      payload: {
        team_name: teamName,
        page_size: this.state.pageSize,
        page: this.state.page
      },
      callback: data => {
        if (data) {
          this.setState({
            events: data.list || [],
            total: data.total || data.list.length
          });
        }
      }
    });
  };
  loadJoinUsers = () => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/getJoinTeamUsers",
      payload: {
        team_name: teamName
      },
      callback: data => {
        if (data) {
          this.setState({
            joinUsers: data.list || []
          });
        }
      }
    });
  };
  hanldePageChange = page => {
    this.setState({ page }, () => {
      this.loadEvents();
    });
  };
  handleRefused = data => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/setJoinTeamUsers",
      payload: {
        team_name,
        user_id: data.user_id,
        action: false
      },
      callback: () => {
        this.loadJoinUsers();
      }
    });
  };
  handleJoin = data => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/setJoinTeamUsers",
      payload: {
        team_name,
        user_id: data.user_id,
        action: true
      },
      callback: () => {
        this.loadJoinUsers();
      }
    });
  };

  renderActivities() {
    const list = this.state.events || [];

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

    const statusCNMap = {
      "": "进行中",
      complete: "完成",
      failure: "失败",
      timeout: "超时"
    };

    // return list.map((item) => {
    //   const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
    //     item.service_alias
    //     }/overview`;
    //   return (
    //     <List.Item key={item.event_id}>
    //       <List.Item.Meta
    //         title={
    //           <span>
    //             <a className={styles.username}>{item.nick_name}</a>
    //             <span>{item.type_cn}</span>
    //             <Link to={linkTo}>
    //               {item.service_cname}
    //             </Link>应用<span>
    //               {statusCNMap[item.final_status] ? `${statusCNMap[item.final_status]}` : ""}
    //             </span>
    //           </span>
    //         }
    //         description={
    //           <span className={styles.datetime} title={item.updatedAt}>
    //             {" "}
    //             {moment(item.start_time).fromNow()}{" "}
    //           </span>
    //         }
    //       />
    //     </List.Item>
    //   );
    // });

    return list.map(item => {
      const {
        UserName,
        OptType,
        FinalStatus,
        Status,
        create_time,
        Target
      } = item;

      const linkTo = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
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
                <span>应用</span>
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
              </span>
            }
          />
        </List.Item>
      );
    });
  }
  render() {
    const { activitiesLoading } = this.props;
    const pagination = {
      current: this.state.page,
      pageSize: this.state.pageSize,
      total: this.state.total,
      onChange: v => {
        this.hanldePageChange(v);
      }
    };
    return (
      <Row gutter={24}>
        <Col md={12} sm={24}>
          <Card
            bodyStyle={{
              paddingTop: 12
            }}
            bordered={false}
            title="团队动态"
            loading={activitiesLoading}
          >
            <List
              pagination={pagination}
              loading={activitiesLoading}
              size="large"
            >
              <div className={styles.activitiesList}>
                {this.renderActivities()}
              </div>
            </List>
          </Card>
        </Col>
        <Col md={12} sm={24}>
          <Card
            bodyStyle={{
              paddingTop: 12
            }}
            bordered={false}
            title="以下用户申请加入团队"
          >
            <Table
              pagination={false}
              dataSource={this.state.joinUsers || []}
              columns={[
                {
                  title: "用户",
                  dataIndex: "user_name"
                },
                {
                  title: "申请时间",
                  dataIndex: "apply_time"
                },
                {
                  title: "操作",
                  dataIndex: "",
                  render: (v, data) =>
                    data.is_pass == 0 && (
                      <Fragment>
                        <Popconfirm
                          title="确定要通过用户加入么?"
                          onConfirm={() => {
                            this.handleJoin(data);
                          }}
                        >
                          <a href="javascript:;">通过</a>
                        </Popconfirm>
                        <Popconfirm
                          title="确定要拒绝用户么?"
                          onConfirm={() => {
                            this.handleRefused(data);
                          }}
                        >
                          <a style={{ marginLeft: 6 }} href="javascript:;">
                            拒绝
                          </a>
                        </Popconfirm>
                      </Fragment>
                    )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    );
  }
}

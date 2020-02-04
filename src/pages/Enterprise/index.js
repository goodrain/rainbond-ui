import React, { PureComponent } from "react";
import moment from "moment";
import { connect } from "dva";
import { routerRedux, Link } from "dva/router";
import {
  Card,
  Switch,
  notification,
  Button,
  Radio,
  Col,
  Row,
  Popconfirm
} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import styles from "../List/BasicList.less";
import globalUtil from "../../utils/global";
import Addimg from "../../../public/images/add.png";
import TeamListTable from "../../components/tables/TeamListTable";
import userUtil from "../../utils/user";
import ScrollerX from "../../components/ScrollerX";
import CreateTeam from "../../components/CreateTeam";
import DescriptionList from "../../components/DescriptionList";
import CreatUser from "../../components/CreatUserForm";
import rainbondUtil from "../../utils/rainbond";
import ConfirmModal from "../../components/ConfirmModal";

import AddTeam from "../../../public/images/addTeam.png";
import Cpus from "../../../public/images/cpus.png";
import CreationTeam from "../../../public/images/creationTeam.png";
import Element from "../../../public/images/element.png";
import EnterpriseBj from "../../../public/images/enterpriseBj.png";
import EnterpriseInfo from "../../../public/images/enterpriseInfo.png";
import Memory from "../../../public/images/memory.png";
import Records from "../../../public/images/records.png";
import Team from "../../../public/images/team.png";
import TeamCrew from "../../../public/images/teamCrew.png";
import User from "../../../public/images/user.png";

import OauthForm from "../../components/OauthForm";

const { Description } = DescriptionList;
const RadioGroup = Radio.Group;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects["global/creatOauth"],
  overviewInfo: index.overviewInfo
}))
export default class Enterprise extends PureComponent {
  constructor(props) {
    super(props);
    const params = this.getParam();
    // const isPublic = this.props.rainbondInfo && this.props.rainbondInfo.is_public;
    const { user, rainbondInfo } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      date: moment(new Date().getTime()).format("YYYY-MM-DD"),
      companyInfo: {},
      list: [],
      datalist: [],
      showPayHistory: false,
      showConsumeDetail: false,
      // isPublic,
      teamList: [],
      teamsPage: 1,
      teamsPageSize: 8,
      showAddTeam: false,
      adminer,
      userVisible: false,
      openOauth: false,
      oauthInfo: false,
      isOpen: false,
      scope: params.type || this.getDefaultScope(),
      showDeleteDomain: false,
      israinbondTird: rainbondUtil.OauthbEnable(rainbondInfo)
    };
  }
  componentDidMount() {
    const { dispatch, rainbondInfo } = this.props;

    if (
      rainbondUtil.OauthbIsEnable(rainbondInfo) ||
      rainbondUtil.OauthbEnable(rainbondInfo)
    ) {
      this.handelOauthInfo();
    }

    dispatch({
      type: "global/getIsRegist",
      callback: () => {}
    });

    dispatch({
      type: "global/getEnterpriseInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: () => {}
    });
    this.loadTeams();
  }
  onDelTeam = teamName => {
    this.props.dispatch({
      type: "teamControl/delTeam",
      payload: {
        team_name: teamName
      },
      callback: () => {
        this.loadTeams();
      }
    });
  };
  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  onRegistChange = e => {
    this.props.dispatch({
      type: "global/putIsRegist",
      payload: {
        isRegist: e.target.value
      },
      callback: () => {}
    });
  };
  getDefaultScope() {
    // if (this.props.rainbondInfo && this.props.rainbondInfo.is_public) {
    //   return "finance";
    // }
    return "manage";
  }
  getParam() {
    return this.props.match.params;
  }
  getCompanyInfo = () => {
    this.props.dispatch({
      type: "global/getCompanyInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.user.enterprise_id
      },
      callback: data => {
        if (data) {
          this.setState({ companyInfo: data.bean });
        }
      }
    });
  };

  handleCreateTeam = values => {
    this.props.dispatch({
      type: "teamControl/createTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "添加成功" });
        this.cancelCreateTeam();
        this.props.dispatch({ type: "user/fetchCurrent" });
        //添加完查询企业团队列表
        this.loadTeams();
      }
    });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
  };
  showConsumeDetail = () => {
    this.setState({ showConsumeDetail: true });
  };
  hideConsumeDetail = () => {
    this.setState({ showConsumeDetail: false });
  };
  showPayHistory = () => {
    this.setState({ showPayHistory: true });
  };
  hidePayHistory = () => {
    this.setState({ showPayHistory: false });
  };

  hanldePageChange = page => {
    this.setState(
      {
        teamsPage: page
      },
      () => {
        this.loadTeams();
      }
    );
  };
  loadTeams = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/getEnterpriseTeams",
      payload: {
        enterprise_id: this.props.user.enterprise_id,
        page_size: this.state.teamsPageSize,
        page_num: this.state.teamsPage,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            teamList: data.list || [],
            teamsTotal: data.total
          });
        }
      }
    });
  };

  handelUnderstand = () => {
    window.open("https://www.goodrain.com/industrycloud");
  };
  handelObtain = () => {
    window.open("https://t.goodrain.com/");
  };

  handlChooseeOpen = () => {
    const { isOpen, israinbondTird } = this.state;
    israinbondTird && isOpen ? this.handleOpenDomain() : this.handleOpen();
  };

  handleOpenDomain = () => {
    this.setState({
      showDeleteDomain: true
    });
  };

  handleOpen = () => {
    this.setState({
      openOauth: true
    });
  };
  handelClone = () => {
    this.setState({
      openOauth: false,
      showDeleteDomain: false
    });
  };

  handelOauthInfo = info => {
    const { dispatch, rainbondInfo } = this.props;
    dispatch({
      type: "global/getOauthInfo",
      callback: res => {
        if (res && res._code == 200) {
          let bean = res.bean;
          let judge = rainbondUtil.OauthbEnable(info ? info : rainbondInfo);
          this.setState({
            oauthInfo: bean && bean.oauth_services,
            isOpen: judge
              ? bean.oauth_services && bean.oauth_services.enable
              : false
          });
        }
      }
    });
  };

  handleDeleteOauth = () => {
    const { dispatch } = this.props;
    const { oauthInfo } = this.state;
    dispatch({
      type: "global/deleteOauthInfo",
      payload: {
        service_id: oauthInfo.service_id
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "删除成功" });
          window.location.reload();
        }
      }
    });
  };

  getSettingShow = () => {
    const { rainbondInfo, is_public } = this.props;
    const { oauthInfo, isOpen, israinbondTird } = this.state;
    let ishow = rainbondUtil.OauthbIsEnable(rainbondInfo);
    if (!is_public) {
      return (
        <Card
          style={{
            marginBottom: 24
          }}
          bodyStyle={{
            paddingTop: 12
          }}
          bordered={false}
          title="平台设置"
        >
          <DescriptionList
            col="1"
            size="large"
            style={{
              marginBottom: 32,
              marginTop: 32
            }}
          >
            <Description term="用户注册">
              <RadioGroup
                onChange={this.onRegistChange}
                value={this.props.isRegist}
              >
                <Radio value>允许注册</Radio>
                <Radio value={false}>禁止注册</Radio>
              </RadioGroup>
              <div
                style={{
                  float: "right",
                  color: "rgba(153,153,153,1)",
                  textAlign: "center",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
                onClick={this.addUser}
              >
                <img style={{ width: "30px", height: "30px" }} src={Addimg} />
                <div>添加用户</div>
              </div>
            </Description>
          </DescriptionList>
          <div
            style={{
              height: "1px",
              background: " #E8E8E8 ",
              margin: "0 -32px"
            }}
          />
          {ishow && (
            <DescriptionList
              col="1"
              size="large"
              style={{ marginBottom: 32, marginTop: 32 }}
            >
              <Description term="Oauth互联">
                {oauthInfo && oauthInfo.enable && israinbondTird ? (
                  <span>
                    已开通{oauthInfo.oauth_type}类型的第三方OAuth互联服务&nbsp;
                    {oauthInfo.is_auto_login && ", 且已开启自动登录"}
                  </span>
                ) : (
                  <span ctyle="color:rgba(0, 0, 0, 0.45)">
                    支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目
                  </span>
                )}

                <Switch
                  style={{ float: "right" }}
                  onClick={this.handlChooseeOpen}
                  checked={israinbondTird && isOpen}
                />
                {oauthInfo && (
                  <Popconfirm
                    title="删除配置后已绑定的用户数据将清除，确认删除吗?"
                    onConfirm={this.handleDeleteOauth}
                    okText="确认"
                    cancelText="我再想想"
                  >
                    <a style={{ float: "right", marginRight: "10px" }} href="#">
                      移除配置
                    </a>
                  </Popconfirm>
                )}
                {oauthInfo && oauthInfo.enable && israinbondTird && (
                  <a
                    onClick={this.handleOpen}
                    style={{ float: "right", marginRight: "10px" }}
                  >
                    编辑
                  </a>
                )}
              </Description>
            </DescriptionList>
          )}
        </Card>
      );
    }
  };
  manage = () => {
    const pagination = {
      current: this.state.teamsPage,
      pageSize: this.state.teamsPageSize,
      total: this.state.teamsTotal,
      onChange: v => {
        this.hanldePageChange(v);
      }
    };
    const teamBox = {
      marginTop: "16px",
      minHeight: "40px",
      maxHeight: "73px",
      lineHeight: "1px",
      borderColor: "rgba(0, 0, 0, 0.09)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.09)",
      color: "#3D54C4",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    };
    return (
      <div>
        <Card
          style={{
            marginBottom: 24
          }}
          bodyStyle={{
            paddingTop: 12
          }}
          bordered={false}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div className={styles.enterpriseInfo}>
                <img src={EnterpriseInfo} alt="" />
                &nbsp; 企业信息
              </div>

              <div className={styles.enterpriseName}>
                企业名称：
                {this.props.enterprise &&
                  this.props.enterprise.enterprise_alias}
              </div>
              <div className={styles.enterpriseBox}>
                联合云ID&nbsp;
                {this.props.enterprise && this.props.enterprise.enterprise_id}
                平台版本&nbsp;
                {this.props.rainbondInfo.version || "V3.7.1-release"}
                创建时间&nbsp;
                {this.props.enterprise && this.props.enterprise.create_time}
              </div>

              <div>
                <Button
                  type="primary"
                  style={{ marginLeft: 16 }}
                  onClick={this.handelObtain}
                >
                  开源社区
                </Button>
                <Button
                  style={{ marginLeft: 16 }}
                  className={styles.buttonBjNot}
                  onClick={this.handelUnderstand}
                >
                  获取资源管理后台
                </Button>
                <Button
                  style={{ marginLeft: 16 }}
                  className={styles.buttonBjNot}
                  onClick={this.handelObtain}
                >
                  获取商业解决方案
                </Button>
              </div>
            </div>
            <div>
              <img src={EnterpriseBj} alt="" />
            </div>
          </div>
        </Card>

        {this.state.adminer && (
          <div>
            <Row
              style={{
                marginBottom: 24
              }}
            >
              <Col span={12}>
                <Card>
                <Row>
                    <Col className={styles.grays} span={12}>
                      应用数量
                    </Col>
                    <Col className={styles.grays} span={12}>
                      组件数量
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={11} offset={1}>
                <Card>
                  <Row>
                    <Col span={8}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={Element} alt="" />
                          </div>
                        </li>
                        <li>26</li>
                        <li>共享组件数量</li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={8}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={Team} alt="" />
                          </div>
                        </li>
                        <li>8</li>
                        <li>共享团队数量</li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={8}>
                      <ul className={styles.Box}>
                        <li>
                          <div>
                            <img src={User} alt="" />
                          </div>
                        </li>
                        <li>16</li>
                        <li>共享用户数量</li>
                        <li>——</li>
                      </ul>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
            {/* {this.getSettingShow()} */}

            <Row
              style={{
                marginBottom: 24
              }}
            >
              <Col span={12}>
                <Card>
                  <Row>
                    <Col className={styles.grays} span={12}>
                      团队
                    </Col>
                    <Col className={styles.grays} span={12}>
                      活跃团队
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12}>
                      <Card bodyStyle={teamBox} bordered={false}>
                        <div className={styles.addTeam}>
                          <img src={TeamCrew} alt="" />
                        </div>

                        <div className={styles.grays}>新加入团队：</div>
                        <div> Mark Davis </div>
                        <div>→</div>
                      </Card>

                      <Card bodyStyle={teamBox} bordered={false}>
                        <div style={{ textAlign: "center" }}>
                          <img src={AddTeam} alt="" />
                          <div style={{ marginTop: "5px" }}>
                            <a
                              href="javascript:;"
                              onClick={this.onAddTeam}
                              className={styles.teamTit}
                            >
                              加入团队
                            </a>
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <img src={CreationTeam} alt="" />
                          <div style={{ marginTop: "5px" }}>
                            <a
                              href="javascript:;"
                              onClick={this.onAddTeam}
                              className={styles.teamTit}
                            >
                              创建团队
                            </a>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={11} offset={1}>
                      <Card
                        bodyStyle={teamBox}
                        bordered={false}
                        style={{height:"40px"}}
                      >
                        <div style={{ width: "95%" }}> Mark Davis </div>
                        <div>→</div>
                      </Card>
                      <Card
                        bodyStyle={teamBox}
                        bordered={false}
                        style={{height:"40px"}}
                      >
                        <div style={{ width: "95%" }}> Mark Davis </div>
                        <div>→</div>
                      </Card>
                      <Card
                        bodyStyle={teamBox}
                        bordered={false}
                        style={{height:"40px"}}
                      >
                        <div style={{ width: "95%" }}> Mark Davis </div>
                        <div>→</div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={11} offset={1}>
                <Card>
                  <Row>
                    <Col span={8}>
                      <ul className={styles.Box}>
                        <li>
                          <img src={Memory} alt="" />
                        </li>
                        <li>26</li>
                        <li>数据中心数量</li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={8}>
                      <ul className={styles.Box}>
                        <li>
                          <img src={Records} alt="" />
                        </li>
                        <li>8</li>
                        <li>内存使用量/总量</li>
                        <li>——</li>
                      </ul>
                    </Col>
                    <Col span={8}>
                      <ul className={styles.Box}>
                        <li>
                          <img src={Cpus} alt="" />
                        </li>
                        <li>16</li>
                        <li>CPU使用量/总量</li>
                        <li>——</li>
                      </ul>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Card
              style={{
                marginBottom: 24
              }}
              bodyStyle={{
                paddingTop: 12
              }}
              bordered={false}
              title="企业团队列表"
              extra={
                <a href="javascript:;" onClick={this.onAddTeam}>
                  添加团队
                </a>
              }
            >
              <ScrollerX sm={600}>
                <TeamListTable
                  pagination={pagination}
                  onDelete={this.onDelTeam}
                  onChange={this.onChange}
                  list={this.state.teamList}
                />
              </ScrollerX>
            </Card>
          </div>
        )}
      </div>
    );
  };

  renderContent = () => {
    const { user } = this.props;
    if (this.state.scope === "manage") {
      return this.manage();
    }
    // 不是系统管理员
    if (!userUtil.isSystemAdmin(user) && !userUtil.isCompanyAdmin(user)) {
      this.props.dispatch(
        routerRedux.replace(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Exception/403`
        )
      );
      return null;
    }
  };
  //管理员添加用户
  addUser = () => {
    this.setState({
      userVisible: true
    });
  };
  handleCreatUser = values => {
    this.props.dispatch({
      type: "global/creatUser",
      payload: {
        ...values
      },
      callback: data => {
        if (data && data._condition == 200) {
          notification.success({ message: data.msg_show });
        } else {
          notification.error({ message: data.msg_show });
        }
      }
    });
    this.cancelCreatUser();
  };

  handleCreatOauth = values => {
    let {
      name,
      client_id,
      client_secret,
      oauth_type,
      home_url,
      is_auto_login,
      redirect_domain
    } = values;
    oauth_type = oauth_type.toLowerCase();
    if (oauth_type === "github") {
      home_url = "https://github.com";
    }
    let obj = {
      name,
      client_id,
      client_secret,
      is_auto_login,
      oauth_type,
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      home_url,
      is_console: true
    };
    this.handelRequest(obj);
  };

  handelRequest = (obj = {}, isclone) => {
    const { dispatch, rainbondInfo } = this.props;
    const { oauthInfo } = this.state;
    obj.eid = rainbondInfo.eid;
    oauthInfo
      ? (obj.service_id = oauthInfo.service_id)
      : (obj.service_id = null);
    isclone ? (obj.enable = false) : (obj.enable = true);

    dispatch({
      type: "global/editOauth",
      payload: {
        arr: { enable: obj.enable, value: null }
      }
    });

    dispatch({
      type: "global/creatOauth",
      payload: {
        arr: [obj]
      },
      callback: data => {
        dispatch({
          type: "global/fetchRainbondInfo",
          callback: info => {
            if (info) {
              this.setState({
                israinbondTird: rainbondUtil.OauthbEnable(info)
              });
              this.handelOauthInfo(info);
            }
          }
        });
        this.props.dispatch({ type: "user/fetchCurrent" });
        notification.success({ message: "成功" });
        this.handelClone();
      }
    });
  };

  cancelCreatUser = () => {
    this.setState({
      userVisible: false
    });
  };
  render() {
    const { userVisible, openOauth, showDeleteDomain, oauthInfo } = this.state;
    const { oauthLongin } = this.props;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div>企业管理员可以设置平台信息，管理企业下的团队</div>
        </div>
      </div>
    );

    return (
      <div>
        {this.renderContent()}
        {this.state.showAddTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {userVisible && (
          <CreatUser
            onOk={this.handleCreatUser}
            onCancel={this.cancelCreatUser}
          />
        )}
        {openOauth && (
          <OauthForm
            loading={oauthLongin}
            oauthInfo={oauthInfo}
            onOk={this.handleCreatOauth}
            onCancel={this.handelClone}
          />
        )}

        {showDeleteDomain && (
          <ConfirmModal
            loading={oauthLongin}
            title="关闭"
            desc="确定要关闭Oauth2.0认证？"
            onOk={() => {
              this.handelRequest(oauthInfo, "clone");
            }}
            onCancel={this.handelClone}
          />
        )}
      </div>
    );
  }
}

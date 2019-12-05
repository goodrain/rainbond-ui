import React, { PureComponent } from "react";
import {
  Layout,
  Menu,
  Icon,
  Spin,
  Tag,
  Dropdown,
  Avatar,
  Divider,
  Tooltip,
  Modal
} from "antd";
import { connect } from "dva";
import Ellipsis from "../Ellipsis";
import moment from "moment";
import groupBy from "lodash/groupBy";
import Debounce from "lodash-decorators/debounce";
import { Link } from "dva/router";
import NoticeIcon from "../NoticeIcon";
import styles from "./index.less";
import oauthUtil from "../../utils/oauth";
import userIcon from "../../../public/images/user-icon-small.png";
import teamUtil from "../../utils/team";
import globalUtil from "../../utils/global";
import rainbondUtil from "../../utils/rainbond";
import Gitee from "../../../public/images/gitee.png";
import Github from "../../../public/images/github.png";
import Gitlab from "../../../public/images/gitlab.png";

import { routerRedux } from "dva/router";

class DialogMessage extends PureComponent {
  constructor(props) {
    super(props);
    this.modal = "";
  }
  componentDidMount() {
    this.loadin(this.props.data);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.data && nextProps.data[0].ID !== this.props.data[0].ID) {
      this.modal.destroy();
      this.loadin(nextProps.data);
    }
  }
  gbdd = () => {
    Modal.destroyAll();
  };
  loadin = data => {
    if (data && data.length) {
      const ids = data.map(item => item.ID);

      this.props.dispatch({
        type: "global/putMsgAction",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          msg_ids: ids.join(","),
          action: "mark_read"
        },
        callback: data => {}
      });

      this.modal = Modal.info({
        title: data[0].title,
        okText: "知道了",
        width: 500,
        style: { left: "-100px" },
        onOk: () => {
          this.gbdd();
          this.props.onCancel();
        },
        content: (
          <div
            dangerouslySetInnerHTML={{ __html: data[0].content }}
            style={{ whiteSpace: "pre-wrap" }}
          />
        )
      });
    }
  };
  render() {
    return null;
  }
}

const { Header } = Layout;

const noticeTit = {
  公告: "announcement",
  消息: "news",
  提醒: "warn"
};
@connect(({ global, appControl }) => ({
  rainbondInfo: global.rainbondInfo,
  appDetail: appControl.appDetail
}))
export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      noticeCount: 0,
      noticeList: [],
      total: 0,
      pageSize: 1000,
      msg_type: "",
      popupVisible: false,
      msg_ids: "",
      newNoticeList: {},
      showDialogMessage: null
    };
  }
  componentDidMount() {
    this.getuserMessage();
  }
  componentWillUnmount() {
    this.triggerResizeEvent.cancel();
  }
  getNoticeData(notices) {
    if (notices.length === 0) {
      return {};
    }
    const newNotices = notices.map(notice => {
      const newNotice = {
        ...notice
      };
      if (newNotice.create_time) {
        newNotice.datetime = moment(notice.create_time).fromNow();
      }
      // transform id to item key
      if (newNotice.ID) {
        newNotice.key = newNotice.ID;
      }
      if (newNotice.content) {
        newNotice.description = newNotice.content;
      }
      if (newNotice.msg_type) {
        newNotice.msg_type = newNotice.msg_type;
      }
      return newNotice;
    });
    return groupBy(newNotices, "msg_type");
  }
  handleVisibleChange = flag => {
    this.setState({ popupVisible: flag, total: 0 }, () => {});
  };
  onClear = () => {
    this.props.dispatch(
      routerRedux.replace(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/message`
      )
    );
  };
  getuserMessage = (page_num, page_size, msg_type, is_read) => {
    this.props.dispatch({
      type: "global/getuserMessage",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_num: 1,
        page_size: this.state.pageSize,
        msg_type: this.state.msg_type,
        is_read: 0
      },
      callback: data => {
        if (data) {
          const datalist = data.list;
          let ids = "";
          datalist.map(order => {
            ids += `${order.ID},`;
          });
          ids = ids.slice(0, ids.length - 1);
          const newTotal = datalist.filter(item => item.is_read === false)
            .length;

          this.setState(
            {
              total: newTotal,
              noticeList: data.list,
              msg_ids: ids,
              showDialogMessage: data.list.filter(
                item => item.level === "high" && item.is_read === false
              )
            },
            () => {
              const newNotices = this.getNoticeData(this.state.noticeList);
              this.setState({ newNoticeList: newNotices });
            }
          );
        }
      }
    });
  };

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };
  @Debounce(600)
  triggerResizeEvent() {
    // eslint-disable-line
    const event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, false);
    window.dispatchEvent(event);
  }
  renderTeams = () => {
    const onTeamClick = this.props.onTeamClick;
    const { currTeam } = this.props;
    const currentUser = this.props.currentUser;
    const teams = currentUser.teams || [];
    const team = teams.filter(item => {
      item.team_name === currTeam;
    });

    return (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onTeamClick}>
        {teams.map(item => (
          <Menu.Item key={item.team_name}>
            <Ellipsis tooltip> {item.team_alias} </Ellipsis>
          </Menu.Item>
        ))}
        <Menu.Divider />
        {currentUser.is_user_enter_amdin && (
          <Menu.Item key="createTeam">
            <Icon type="plus" />
            新建团队
          </Menu.Item>
        )}
        <Menu.Item key="joinTeam">
          <Icon type="plus" />
          加入团队
        </Menu.Item>
      </Menu>
    );
  };
  getCurrTeam = () => {
    const currTeam = this.props.currTeam;
    const currentUser = this.props.currentUser;
    const teams = currentUser.teams || [];
    return teams.filter(item => item.team_name === currTeam)[0];
  };
  renderRegions = () => {
    const onRegionClick = this.props.onRegionClick;
    const team = this.getCurrTeam();
    const { rainbondInfo } = this.props;
    if (team) {
      return (
        <Menu className={styles.menu} selectedKeys={[]} onClick={onRegionClick}>
          {(team.region || []).map(item => (
            <Menu.Item key={item.team_region_name}>
              {item.team_region_alias}
            </Menu.Item>
          ))}
          <Menu.Divider />
          {teamUtil.canAddRegion(team) &&
            rainbondUtil.openDataCenterStatusEnable(rainbondInfo) && (
              <Menu.Item key="openRegion">
                <Icon type="plus" />
                开通数据中心
              </Menu.Item>
            )}
        </Menu>
      );
    }
    return <Menu />;
  };
  getCurrTeamTit() {
    const team = this.getCurrTeam();
    if (team) {
      return team.team_alias;
    }
    return "";
  }
  getCurrRegionTit() {
    const { currRegion } = this.props;
    const team = this.getCurrTeam();
    if (team) {
      const regions = team.region;
      const selectedRegion = regions.filter(
        item => item.team_region_name === currRegion
      )[0];
      if (selectedRegion) {
        return selectedRegion.team_region_alias;
      }
    }

    return "";
  }
  onhandleThird = (
    oauth_type,
    auth_url,
    client_id,
    redirect_uri,
    service_id
  ) => {
    const githubUrl = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&scope=user%20repo%20admin:repo_hook`;
    const gitlabUrl = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&response_type=code`;
    const giteeUrl = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&response_type=code`;
    window.location.href =
      oauth_type === "github"
        ? githubUrl
        : oauth_type === "gitlab"
        ? gitlabUrl
        : giteeUrl;
  };

  render() {
    const {
      currentUser,
      collapsed,
      isMobile,
      logo,
      onMenuClick,
      isPubCloud,
      rainbondInfo
    } = this.props;
    const noticesList = this.state.newNoticeList;
    if (!currentUser) {
      return null;
    }

    const handleEditSvg = () => (
      <svg width="15px" height="15px" viewBox="0 0 1024 1024">
        <path d="M626.9 248.2L148.2 726.9 92.1 932.3l204.6-57 480.5-480.5-150.3-146.6z m274.3-125.8c-41-41-107.5-41-148.5 0l-80.5 80.5L823.1 349l78.1-78.2c41-41 41-107.5 0-148.4zM415.1 932.3h452.2v-64.6H415.1v64.6z m193.8-193.8h258.4v-64.6H608.9v64.6z" />
      </svg>
    );
    const handleLogoutSvg = () => (
      <svg width="15px" height="15px" viewBox="0 0 1024 1024">
        <path d="M1024 445.44 828.414771 625.665331l0-116.73472L506.88 508.930611l0-126.98112 321.53472 0 0-116.73472L1024 445.44zM690.174771 41.985331 100.34944 41.985331l314.37056 133.12 0 630.78528 275.45472 0L690.17472 551.93472l46.08 0 0 296.96L414.72 848.89472 414.72 1024 0 848.894771 0 0l736.25472 0 0 339.97056-46.08 0L690.17472 41.98528 690.174771 41.985331zM690.174771 41.985331" />
      </svg>
    );
    const menu = (
      <div className={styles.uesrInfo}>
        <Menu selectedKeys={[]} onClick={onMenuClick}>
          {rainbondUtil.OauthbEnable(rainbondInfo) && (
            <div className={styles.uesrInfoTitle}>Oauth认证：</div>
          )}
          {rainbondUtil.OauthbEnable(rainbondInfo) &&
            currentUser.oauth_services &&
            currentUser.oauth_services.length > 0 &&
            currentUser.oauth_services.map(item => {
              const {
                service_name,
                is_authenticated,
                is_expired,
              } = item;
              const authURL = oauthUtil.getAuthredictURL(item)
              return (
                <Menu.Item
                  key={service_name}
                >
                  <div className={styles.userInfoContent}>
                    <span className={styles.oneSpan} title={service_name}>
                      {oauthUtil.getIcon(item,"16px")}
                      {service_name}
                    </span>
                    <span>
                      {is_authenticated
                        ? <span style={{"color":"green"}}>已认证</span>
                        : is_expired
                        ? <a href={authURL} target="_blank">已过期重新认证</a>
                        : <a href={authURL} target="_blank">去认证</a>}
                    </span>
                  </div>
                </Menu.Item>
              );
            })}

          <div className={styles.uesrInfoTitle}>账号设置：</div>

          {!isPubCloud && (
            <Menu.Item key="cpw">
              <div className={styles.userInfoContent}>
                <Icon
                  component={handleEditSvg}
                  style={{
                    marginRight: 8
                  }}
                />{" "}
                修改密码{" "}
              </div>
            </Menu.Item>
          )}
          <Menu.Item key="logout">
            <div className={styles.userInfoContent}>
              <Icon
                component={handleLogoutSvg}
                style={{
                  marginRight: 8
                }}
              />
              退出登录
            </div>
          </Menu.Item>
        </Menu>
      </div>
    );

    return (
      <Header className={styles.header}>
        {isMobile && [
          <Link
            to="/"
            className={styles.logo}
            key="logo"
            width="40"
            style={{
              width: "65px",
              display: "inline-block",
              overflow: "hidden"
            }}
          >
            <img src={logo} alt="logo" />
          </Link>,
          <Divider type="vertical" key="line" />
        ]}
        <Icon
          className={styles.trigger}
          type={collapsed ? "menu-unfold" : "menu-fold"}
          onClick={this.toggle}
        />

        <div className={styles.teamregion}>
          <span className={styles.tit}>团队:</span>
          <Dropdown overlay={this.renderTeams()}>
            <a className={styles.dropdown}>
              <span className={styles.smShow}>团队</span>
              <span className={styles.smHidden}>
                {this.getCurrTeamTit()}
                <Icon type="down" />
              </span>
            </a>
          </Dropdown>
          <Divider
            type="vertical"
            style={{
              margin: "0 20px 0 20px"
            }}
          />
          <span className={styles.tit}>数据中心:</span>
          <Dropdown overlay={this.renderRegions()}>
            <a className={styles.dropdown}>
              <span className={styles.smShow}>数据中心</span>
              <span className={styles.smHidden}>
                {this.getCurrRegionTit()}
                <Icon type="down" />
              </span>
            </a>
          </Dropdown>
        </div>

        <div className={styles.right}>
          {rainbondUtil.documentEnable(rainbondInfo) && (
            <Tooltip title="平台使用手册">
              <a
                target="_blank"
                href={`${rainbondUtil.documentPlatform_url(
                  rainbondInfo
                )}docs/user-manual/`}
                rel="noopener noreferrer"
                className={styles.action}
              >
                <Icon type="question-circle-o" />
              </a>
            </Tooltip>
          )}
          {/*
          <HeaderSearch
            className={`${styles.action} ${styles.search}`}
            placeholder="站内搜索"
            dataSource={['搜索提示一', '搜索提示二', '搜索提示三']}
            onSearch={(value) => {
              console.log('input', value); // eslint-disable-line
            }}
            onPressEnter={(value) => {
              console.log('enter', value); // eslint-disable-line
            }}
          /> */}

          <NoticeIcon
            count={this.state.total}
            className="notice-icon"
            popupVisible={this.state.popupVisible}
            onPopupVisibleChange={this.handleVisibleChange}
            onClear={this.onClear}
            onItemClick={item => {
              this.setState({ showDialogMessage: [item] });
            }}
          >
            <NoticeIcon.Tab
              title="公告"
              emptyText="暂无数据"
              list={noticesList.announcement}
            />
            <NoticeIcon.Tab
              title="消息"
              emptyText="暂无数据"
              list={noticesList.news}
            />
            <NoticeIcon.Tab
              title="提醒"
              emptyText="暂无数据"
              list={noticesList.warn}
            />
          </NoticeIcon>

          {currentUser ? (
            <Dropdown overlay={menu}>
              <span className={`${styles.action} ${styles.account}`}>
                <Avatar size="small" className={styles.avatar} src={userIcon} />
                <span className={styles.name}>{currentUser.user_name}</span>
              </span>
            </Dropdown>
          ) : (
            <Spin
              size="small"
              style={{
                marginLeft: 8
              }}
            />
          )}
        </div>
        {this.state.showDialogMessage && this.state.showDialogMessage.length ? (
          <DialogMessage
            dispatch={this.props.dispatch}
            onCancel={() => {
              this.setState({ showDialogMessage: null });
            }}
            data={[this.state.showDialogMessage[0]]}
          />
        ) : null}
      </Header>
    );
  }
}

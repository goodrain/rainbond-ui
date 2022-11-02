import React, { Component } from 'react'
import {
  Card,
  Col,
  Empty,
  Icon,
  notification,
  Pagination,
  Row,
  Layout,
  Spin,
  Tooltip,
  Avatar
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import moment from 'moment';
import GlobalHeader from '../components/GlobalHeader';
import cookie from '../utils/cookie';
import globalUtil from '../utils/global'
import teamLogo from '../../public/images/team_logo.png'
import headerStype from '../components/GlobalHeader/index.less';
import Logo from '../../public/logo.png'
import styles from './PersonalSpace.less'

@connect(({ user, global }) => ({
  user: user.currentUser,
  collapsed: global.collapsed,
  currentUser: user.currentUser,
  enterprise: global.enterprise
}))
export default class Space extends Component {

  constructor(props) {
    super(props)
    this.state = {
      userTeamList: [],
      dynamicList: [],
      regionName: '',
      enterpriseInfo: false,
      dynamicLoding: true,
      teamListLoding: true,
      page: 1,
      pageSize: 200,
      language: cookie.get('language') === 'zh-CN' ? true : false
    }

  }

  componentDidMount() {
    this.getEnterpriseList()
    this.getUserTeams()

  }

  // 跳转登录
  handleJumpLogin = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push('/user/login'));
  };
  // 获取企业列表
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res.status_code === 200) {
          const ready = !!(res.list && res.list.length > 0);
          this.setState({
            enterpriseInfo: res.list[0]
          },
            () => {
              if (!ready) {
                this.handleJumpLogin();
              }
            });
        } else {
          this.handleJumpLogin();
        }
      },
      handleError: () => {
        this.handleJumpLogin();
      }
    });
  };
  // 数组去重
  unique = (arr) => {
    if (!Array.isArray(arr)) {
      return
    }
    var array = [];
    for (var i = 0; i < arr.length; i++) {
      if (array.indexOf(arr[i]) === -1) {
        array.push(arr[i])
      }
    }
    return array;
  }
  // 获取用户团队
  getUserTeams = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 999
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const arr = [];
          res.list.map((item, index) => {
            item.region_list.map(v => {
              arr.push(v.region_name)
            })
          });
          const region_names = JSON.stringify(this.unique(arr))
          this.getUserTeamsDynamic(region_names)
          this.setState({
            userTeamList: res.list,
            teamListLoding: false,
            regionName: region_names
          });
        } else {
          this.handleCloseTeamLoading()
        }
      },
    });
  };
  // 获取团队动态
  getUserTeamsDynamic = (region_names) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { teamId, page, pageSize } = this.state
    dispatch({
      type: 'global/fetchMyTeamsDynamic',
      payload: {
        enterprise_id: eid,
        page: page,
        page_size: pageSize,
        region_names
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            dynamicList: res.list,
            dynamicLoding: false,
          });
        } else {
          this.handleCloseLoading()
        }

      }
    });
  };
  // 动态跳转
  onJumpDynamic = (key, team, region, group, component) => {
    const { dispatch } = this.props;
    if (key == 'component') {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/components/${component}/overview`));
    } else if (key == 'team') {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/index`));
    } else {
      dispatch(routerRedux.push(`/team/${team}/region/${region}/apps/${group}`));
    }
  }
  // 跳转团队
  onJumpTeam = (team_name, region) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`/team/${team_name}/region/${region}/index`));
  };
  // 动态操作人信息
  showUserName = UserName => {
    if (UserName === 'system') {
      return <FormattedMessage id='componentOverview.body.tab.overview.handle.system' />;
    }
    if (UserName) {
      return `@${UserName}`;
    }
    return '';
  };


  //收藏
  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed
    });
  };
  // loding
  handleCloseLoading = () => {
    const { dynamicLoding } = this.state
    this.setState({
      dynamicLoding: false
    })
  }
  handleCloseTeamLoading = () => {
    const { teamListLoding } = this.state
    this.setState({
      teamListLoding: false
    })
  }
  render() {
    const { userTeamList, dynamicList, enterpriseInfo, dynamicLoding, teamListLoding, } = this.state
    const {
      match: {
        params: { eid }
      },
      enterprise,
      user,
      collapsed,
      currentUser
    } = this.props
    const colorList = ['#6d60e7', '#55b563', '#ebaa44', '#e86f2c', '#00a2ae' ];
    const customHeader = () => {
      return (
        <div className={headerStype.enterprise}>
          <img src={Logo} alt="" />
        </div>
      );
    }
    return (
      <div style={{ height: "100%" }}>
        <GlobalHeader
          eid={eid}
          is_admin={user.is_enterprise_admin}
          onCollapse={this.handleMenuCollapse}
          collapsed={collapsed}
          currentUser={currentUser}
          customHeader={customHeader}
        />
        <div className={styles.teamBox}>
          <div className={styles.teamBox_left}>
            <div className={styles.title}>
              <h3>
                {formatMessage({ id: 'enterpriseOverview.information.team' })}
              </h3>
            </div>
            {userTeamList.length > 0 &&
              <div className={styles.teamList}>
                {userTeamList.map((item,index) => {
                  const {
                    team_alias,
                    app_count,
                    service_count,
                    logo,
                    region_list,
                    team_name
                  } = item
                  const colorIndex = userTeamList && userTeamList.length >0 && userTeamList.length - index - 1
                  return (
                    <div className={styles.list}
                      style={{
                        boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 5px 0px',
                      }}
                      onClick={() => {
                        this.onJumpTeam(team_name, region_list[0].region_name)
                      }}
                    >
                      <div className={styles.list_img}>
                        {logo  ? 
                        <img src={ logo } alt="" /> 
                        :                         
                        <Avatar 
                          style=
                          {{ 
                            backgroundColor: colorIndex>= 5 ? colorList[ colorIndex % 5 ] : colorList[colorIndex], 
                            verticalAlign: 'middle' 
                          }} 
                          size={60} 
                          shape="square">
                          <span 
                            style=
                              {{
                                color:'#fff',
                                fontSize:35,
                                textTransform:'uppercase'
                              }}
                          >
                          {team_alias.substr(0,1)}
                          </span>
                        </Avatar>
                        }
                      </div>
                      <div className={styles.list_detail}>
                        <Tooltip title={team_alias}>
                          <div
                            className={styles.team_name}
                          >
                            {team_alias}
                            <span className={styles.team_index}>
                              #{userTeamList.length - index}
                            </span>
                          </div>
                        </Tooltip>
                        <div className={styles.num}>
                          <div>
                            <span className={styles.team_logo}>
                              <Tooltip title={formatMessage({ id: 'enterpriseOverview.overview.app' })}>
                                {globalUtil.fetchSvg('teamApp')}
                              </Tooltip>
                            </span>
                            <span>{app_count || 0}</span>
                          </div>
                          <div>
                            <span className={styles.team_logo} style={{ marginTop: '2px' }}>
                              <Tooltip title={formatMessage({ id: 'enterpriseOverview.overview.component' })}>
                                {globalUtil.fetchSvg('teamComponent')}
                              </Tooltip>
                            </span>
                            <span>{service_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            }
            {teamListLoding && (
              <div className={styles.no_teamList}>
                <Spin></Spin>
              </div>
            )}
            {!teamListLoding && userTeamList.length == 0 && (
              <div className={styles.no_teamList}>
                <Empty />
              </div>
            )}
          </div>
          <div className={styles.teamBox_right} style={{ boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px' }}>
            <div className={styles.title}>
              <h3>{formatMessage({ id: 'enterpriseOverview.information.dynamic' })}</h3>
            </div>
            <div className={styles.titleTh}>
              <div className={styles.left}>
                <span className={styles.spanAppName}>{formatMessage({id:'enterpriseOverview.PersonalSpace.name'})}</span>
                <span className={styles.spanEvent}>{formatMessage({id:'enterpriseOverview.PersonalSpace.event'})}</span>
              </div>
              <div className={styles.center}>
                <span>{formatMessage({id:'enterpriseOverview.PersonalSpace.edit'})}</span>
                <span>{formatMessage({id:'enterpriseOverview.PersonalSpace.time'})}</span>
              </div>
              <div className={styles.right}>
                <span >{formatMessage({id:'enterpriseOverview.PersonalSpace.team'})}</span>
              </div>
            </div>
            {dynamicList.length > 0 &&
              <div className={styles.dynamicList}>

                {dynamicList.map(item => {
                  const {
                    group_name,
                    team_name,
                    service_name,
                    StartTime,
                    create_time,
                    EndTime,
                    UserName,
                    code_commit_msg,
                    EventID,
                    OptType,
                    Status,
                    Reason,
                    FinalStatus,
                    Message,
                    group_id,
                    team_alias,
                    region_name,
                    service_alias
                  } = item
                  const UserNames = this.showUserName(UserName);
                  const Messages = globalUtil.fetchMessageLange(Message, Status, OptType)
                  return (
                    <div className={styles.list}>
                      <div className={styles.list_left}>
                        <div
                          className={styles.cname}
                          onClick={() => {
                            this.onJumpDynamic('app', team_name, region_name, group_id, service_alias)
                          }}
                        >
                          <Tooltip title={group_name}>
                            {group_name}
                          </Tooltip>
                        </div>
                        <span>/</span>
                        <div
                          className={styles.cname}
                          onClick={() => {
                            this.onJumpDynamic('component', team_name, region_name, group_id, service_alias)
                          }}
                        >
                          <Tooltip title={service_name}>
                            {service_name}
                          </Tooltip>
                        </div>
                        <div className={styles.content}>
                          <div className={styles.contentInfo}>
                            <div
                              style={{
                                color: Status == 'failure' ? '#CD0200' : globalUtil.fetchAbnormalcolor(OptType)
                              }}
                            >
                              {globalUtil.fetchStateOptTypeText(OptType)}
                            </div>
                            <div>{globalUtil.fetchOperation(FinalStatus, Status)}</div>
                            <div>{Status === 'failure' && globalUtil.fetchReason(Reason)}</div>
                            <div>{Status === 'failure' ? <div style={{ color: '#CD0200' }}>{Messages}</div> : Messages}</div>
                          </div>
                        </div>
                        {code_commit_msg &&
                          <div className={styles.commit}>
                            <div>{globalUtil.fetchSvg('commit')}</div>
                            <div><Tooltip title={code_commit_msg}>{code_commit_msg}</Tooltip></div>
                          </div>
                        }
                      </div>
                      <div className={styles.list_center}>
                        <div><Tooltip title={UserNames}>{UserNames}</Tooltip></div>
                        <div
                          className={styles.time}
                          key={EventID}
                        >
                          <Tooltip
                            title={moment(StartTime)
                              .locale('zh-cn')
                              .format('YYYY-MM-DD HH:mm:ss')}
                          >
                            <div
                              style={{ wordBreak: 'break-word', lineHeight: '17px' }}
                            >
                              {globalUtil.fetchdayTime(StartTime)}
                            </div>
                          </Tooltip>
                        </div>
                      </div>

                      <div className={styles.list_right}>
                        <div
                          className={styles.teamName}
                          onClick={() => {
                            this.onJumpDynamic('team', team_name, region_name, group_id, service_alias)
                          }}
                        >
                          <Tooltip title={team_alias}>
                            {team_alias}
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                  )
                })}
              </div>
            }

            {dynamicLoding && (
              <div className={styles.no_dynamicList}>
                <Spin></Spin>
              </div>
            )}
            {!dynamicLoding && dynamicList.length == 0 && (
              <div className={styles.no_dynamicList}>
                <Empty />
              </div>
            )}

          </div>
        </div>
      </div >
    )
  }
}

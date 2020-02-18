import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  Popconfirm,
  notification,
  Tabs,
  Switch,
} from 'antd';
import More from '../../../public/images/more.svg';
import userUtil from '../../utils/user';
import rainbondUtil from '../../utils/rainbond';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CreateTeam from '../../components/CreateTeam';
import ConfirmModal from '../../components/ConfirmModal';
import styles from './index.less';
import OauthForm from '../../components/OauthForm';

const { TabPane } = Tabs;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
}))
export default class EnterpriseTeams extends PureComponent {
  constructor(props) {
    super(props);
    const { user, rainbondInfo } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      teamList: [],
      overviewTeamInfo: false,
      showAddTeam: false,
      showExitTeam: false,
      exitTeamName: '',
      enterpriseTeamsLoading: false,
      overviewTeamsLoading: false,
      adminer,
      showDelTeam: false,

      userVisible: false,
      openOauth: false,
      oauthInfo: false,
      isOpen: false,
      showDeleteDomain: false,
      israinbondTird: rainbondUtil.OauthbEnable(rainbondInfo),
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
    this.getEnterpriseTeams();

    dispatch({
      type: 'global/getIsRegist',
    });
  }

  handelOauthInfo = info => {
    const { dispatch, rainbondInfo } = this.props;
    dispatch({
      type: 'global/getOauthInfo',
      callback: res => {
        if (res && res._code == 200) {
          const bean = res.bean;
          const judge = rainbondUtil.OauthbEnable(info || rainbondInfo);
          this.setState({
            oauthInfo: bean && bean.oauth_services,
            isOpen: judge
              ? bean.oauth_services && bean.oauth_services.enable
              : false,
          });
        }
      },
    });
  };

  handleDeleteOauth = () => {
    const { dispatch } = this.props;
    const { oauthInfo } = this.state;
    dispatch({
      type: 'global/deleteOauthInfo',
      payload: {
        service_id: oauthInfo.service_id,
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: '删除成功' });
          window.location.reload();
        }
      },
    });
  };

  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '添加成功' });
        // 添加完查询企业团队列表
        this.load();
        this.cancelCreateTeam();
      },
    });
  };

  getEnterpriseTeams = () => {
    const { dispatch, user } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseAdminTeams',
      payload: {
        enterprise_id: user.enterprise_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            teamList: res.bean.list,
            enterpriseTeamsLoading: false,
          });
        }
      },
    });
  };

  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
  };
  showExitTeam = exitTeamName => {
    this.setState({ showExitTeam: true, exitTeamName });
  };

  handleExitTeam = () => {
    const { exitTeamName } = this.state;
    if (exitTeamName == 'jdgn6pk5') {
      notification.warning({ message: '当前为演示团队，不能退出！' });
      return;
    }
    this.props.dispatch({
      type: 'teamControl/exitTeam',
      payload: {
        team_name: exitTeamName,
      },
      callback: () => {
        location.reload();
      },
    });
  };

  hideExitTeam = () => {
    this.setState({ showExitTeam: false, exitTeamName: '' });
  };
  handleActiveTabs = () => {};

  showDelTeam = exitTeamName => {
    this.setState({ showDelTeam: true, exitTeamName });
  };
  hideDelTeam = () => {
    this.setState({ showExitTeam: false, showDelTeam: false });
  };

  handleDelTeam = () => {
    const { exitTeamName } = this.state;
    this.props.dispatch({
      type: 'teamControl/delTeam',
      payload: {
        team_name: exitTeamName,
      },
      callback: () => {
        location.reload();
      },
    });
  };

  onRegistChange = checked => {
    this.props.dispatch({
      type: 'global/putIsRegist',
      payload: {
        isRegist: checked,
      },
    });
  };

  handlChooseeOpen = () => {
    const { isOpen, israinbondTird } = this.state;
    israinbondTird && isOpen ? this.handleOpenDomain() : this.handleOpen();
  };

  handleOpenDomain = () => {
    this.setState({
      showDeleteDomain: true,
    });
  };

  handleOpen = () => {
    this.setState({
      openOauth: true,
    });
  };

  handleCreatOauth = values => {
    let {
      name,
      client_id,
      client_secret,
      oauth_type,
      home_url,
      is_auto_login,
      redirect_domain,
    } = values;
    oauth_type = oauth_type.toLowerCase();
    if (oauth_type === 'github') {
      home_url = 'https://github.com';
    }
    const obj = {
      name,
      client_id,
      client_secret,
      is_auto_login,
      oauth_type,
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      home_url,
      is_console: true,
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
      type: 'global/editOauth',
      payload: {
        arr: { enable: obj.enable, value: null },
      },
    });

    dispatch({
      type: 'global/creatOauth',
      payload: {
        arr: [obj],
      },
      callback: data => {
        dispatch({
          type: 'global/fetchRainbondInfo',
          callback: info => {
            if (info) {
              this.setState({
                israinbondTird: rainbondUtil.OauthbEnable(info),
              });
              this.handelOauthInfo(info);
            }
          },
        });
        this.props.dispatch({ type: 'user/fetchCurrent' });
        notification.success({ message: '成功' });
        this.handelClone();
      },
    });
  };

  handelClone = () => {
    this.setState({
      openOauth: false,
      showDeleteDomain: false,
    });
  };
  render() {
    const {
      teamList,
      overviewTeamInfo,
      enterpriseTeamsLoading,
      overviewTeamsLoading,
      adminer,
      oauthInfo,
      isOpen,
      openOauth,
      showDeleteDomain,
      israinbondTird,
    } = this.state;

    const { rainbondInfo, is_public, oauthLongin } = this.props;
    const ishow = rainbondUtil.OauthbIsEnable(rainbondInfo);

    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );

    const menu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showExitTeam(exitTeamName);
              }}
            >
              退出团队
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    const managementMenu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showExitTeam(exitTeamName);
              }}
            >
              退出团队
            </a>
          </Menu.Item>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showDelTeam(exitTeamName);
              }}
            >
              删除团队
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    const operation = (
      <Col span={4} style={{ textAlign: 'right' }}>
        {adminer && (
          <Button type="primary" onClick={this.onAddTeam}>
            添加管理员
          </Button>
        )}
      </Col>
    );
    const managementTemas = (
      <div style={{ marginTop: '20px' }}>
        <Row>
          <Col span={20} className={styles.teamsTit}>
            企业管理员管理
          </Col>
          {operation}
        </Row>
        <Row className={styles.teamMinTit} type="flex" align="middle">
          <Col span={8}>名称</Col>
          <Col span={5}>时间</Col>
        </Row>

        {teamList.map(item => {
          const {
            team_id,
            team_alias,
            region,
            owner_name,
            role,
            team_name,
          } = item;
          return (
            <Card key={team_id} style={{ marginBottom: '10px' }} hoverable>
              <Row type="flex" align="middle">
                <Col span={8}>{team_alias}</Col>
                <Col span={5}>{owner_name}</Col>
                <Col span={5}>{role}</Col>
                <Col span={5}>{region}</Col>
                <Col span={1}>
                  <Dropdown
                    overlay={managementMenu(team_name)}
                    placement="bottomLeft"
                  >
                    <Button style={{ border: 'none' }}>
                      <Icon component={moreSvg} />
                    </Button>
                  </Dropdown>
                </Col>
              </Row>
            </Card>
          );
        })}
      </div>
    );

    const userRegistered = (
      <div>
        <Row>
          <Col span={20} className={styles.teamsTit}>
            平台设置
          </Col>
        </Row>
        <Card style={{ marginTop: '10px' }} hoverable bordered={false}>
          <Row type="flex" align="middle">
            <Col span={23}>是否允许用户注册：</Col>
            <Col span={1} style={{ textAlign: 'right' }}>
              <Switch
                onChange={this.onRegistChange}
                className={styles.automaTictelescopingSwitch}
                value={this.props.isRegist}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );

    const oauth = (
      <div>
        <Card
          style={{ marginBottom: '10px', borderTop: '1px solid  #ccc' }}
          hoverable
          bordered={false}
        >
          <Row type="flex" align="middle">
            <Col span={2}>Oauth互联</Col>
            <Col span={18}>
              {oauthInfo && oauthInfo.enable && israinbondTird ? (
                <span>
                  已开通{oauthInfo.oauth_type}类型的第三方OAuth互联服务&nbsp;
                  {oauthInfo.is_auto_login && ', 且已开启自动登录'}
                </span>
              ) : (
                <span ctyle="color:rgba(0, 0, 0, 0.45)">
                  支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目
                </span>
              )}
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
              {oauthInfo && (
                <Popconfirm
                  title="删除配置后已绑定的用户数据将清除，确认删除吗?"
                  onConfirm={this.handleDeleteOauth}
                  okText="确认"
                  cancelText="我再想想"
                >
                  <a style={{ marginRight: '10px' }} href="#">
                    移除配置
                  </a>
                </Popconfirm>
              )}
              {oauthInfo && oauthInfo.enable && israinbondTird && (
                <a onClick={this.handleOpen} style={{ marginRight: '10px' }}>
                  编辑
                </a>
              )}
              <Switch
                onChange={this.handlChooseeOpen}
                checked={israinbondTird && isOpen}
                className={styles.automaTictelescopingSwitch}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );

    return (
      <PageHeaderLayout
        title="——"
        content="企业管理员可以设置平台信息，管理企业下的团队"
      >
        {this.state.showAddTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {this.state.showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title="退出团队"
            subDesc="此操作不可恢复"
            desc="确定要退出此团队吗?"
            onCancel={this.hideExitTeam}
          />
        )}
        {this.state.showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelTeam}
            title="删除团队"
            subDesc="此操作不可恢复"
            desc="确定要删除此团队吗？"
            onCancel={this.hideDelTeam}
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
              this.handelRequest(oauthInfo, 'clone');
            }}
            onCancel={this.handelClone}
          />
        )}

        {enterpriseTeamsLoading || overviewTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>
            {userRegistered}
            {ishow && oauth}
            {/* {adminer && managementTemas} */}
          </div>
        )}
      </PageHeaderLayout>
    );
  }
}

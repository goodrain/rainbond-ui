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
  Empty,
} from 'antd';
import { routerRedux } from 'dva/router';
import userUtil from '../../utils/user';
import rainbondUtil from '../../utils/rainbond';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import AddAdmin from '../../components/AddAdmin';
import OauthTable from './oauthTable';
import ConfirmModal from '../../components/ConfirmModal';
import styles from './index.less';
import OauthForm from '../../components/OauthForm';

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
export default class EnterpriseSetting extends PureComponent {
  constructor(props) {
    super(props);
    const { user, rainbondInfo } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      adminList: [],
      showAddAdmin: false,
      exitAdminNameID: '',
      enterpriseAdminLoading: false,
      adminer,
      showDelTeam: false,
      openOauth: false,
      oauthInfo: false,
      oauthTable: [],
      isOpen: false,
      showDeleteDomain: false,
      israinbondTird: rainbondUtil.OauthbEnable(rainbondInfo),
    };
  }

  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    !adminer && dispatch(routerRedux.push(`/`));
  }
  componentDidMount() {
    const { dispatch, rainbondInfo } = this.props;
    this.getEnterpriseAdmins();
    if (
      rainbondUtil.OauthbIsEnable(rainbondInfo) ||
      rainbondUtil.OauthbEnable(rainbondInfo)
    ) {
      this.handelOauthInfo();
    }

    dispatch({
      type: 'global/getIsRegist',
    });
  }

  handelOauthInfo = info => {
    const {
      dispatch,
      rainbondInfo,
      match: {
        params: { eid },
      },
    } = this.props;

    dispatch({
      type: 'global/getOauthInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code == 200) {
          const judge = rainbondUtil.OauthbEnable(info || rainbondInfo);
          const oauthEnable = rainbondUtil.OauthbIsEnableState(
            info || rainbondInfo
          );
          const lists = res.list && res.list.length > 0 && res.list;
          this.setState({
            oauthInfo: lists ? lists[0] : false,
            oauthTable: lists || [],
            isOpen: judge ? oauthEnable : false,
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

  handleCreateAdmin = values => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/addEnterpriseAdminTeams',
      payload: {
        enterprise_id: eid,
        user_id: values.user_id,
      },
      callback: () => {
        notification.success({ message: '添加成功' });
        this.getEnterpriseAdmins();
        this.cancelCreateAdmin();
      },
    });
  };

  getEnterpriseAdmins = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseAdmin',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            adminList: res.list,
            enterpriseAdminLoading: false,
          });
        }
      },
    });
  };

  onAddAdmin = () => {
    this.setState({ showAddAdmin: true });
  };
  cancelCreateAdmin = () => {
    this.setState({ showAddAdmin: false });
  };

  showDelTeam = exitAdminNameID => {
    this.setState({ showDelTeam: true, exitAdminNameID });
  };

  hideDelAdmin = () => {
    this.setState({ showDelTeam: false });
  };

  handleDelAdmin = () => {
    const { exitAdminNameID } = this.state;
    this.props.dispatch({
      type: 'global/deleteEnterpriseAdmin',
      payload: {
        user_id: exitAdminNameID,
      },
      callback: () => {
        notification.success({ message: '删除成功' });
        this.getEnterpriseAdmins();
        this.hideDelAdmin();
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
    const {
      dispatch,
      rainbondInfo,
      match: {
        params: { eid },
      },
    } = this.props;

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
      callback: res => {
        if (res && res._code === 200 && isclone) {
          this.fetchRainbondInfo();
        }
      },
    });

    if (isclone) {
      return null;
    }
    dispatch({
      type: 'global/creatOauth',
      payload: {
        enterprise_id: eid,
        arr: [obj],
      },
      callback: data => {
        if (data && data._code === 200) {
          this.fetchRainbondInfo();
        }
      },
    });
  };

  fetchRainbondInfo = () => {
    const { dispatch } = this.props;
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
    dispatch({ type: 'user/fetchCurrent' });
    notification.success({ message: '成功' });
    this.handelClone();
  };

  handelClone = () => {
    this.setState({
      openOauth: false,
      showDeleteDomain: false,
    });
  };

  render() {
    const {
      adminList,
      enterpriseAdminLoading,
      adminer,
      oauthInfo,
      isOpen,
      openOauth,
      showDeleteDomain,
      israinbondTird,
      oauthTable,
    } = this.state;

    const {
      rainbondInfo,
      oauthLongin,
      isRegist,
      match: {
        params: { eid },
      },
    } = this.props;
    const oauth_services_is_sonsole = rainbondUtil.OauthbIsEnable(rainbondInfo);
    const oauthEnable = rainbondUtil.OauthbIsEnableState(rainbondInfo);

    const adminLists = adminList && adminList.length > 0 && adminList;
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

    const managementMenu = exitAdminNameID => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showDelTeam(exitAdminNameID);
              }}
            >
              删除管理员
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    const operation = (
      <Col span={4} style={{ textAlign: 'right' }}>
        {adminer && (
          <Button
            type="primary"
            onClick={this.onAddAdmin}
            className={styles.btns}
          >
            添加管理员
          </Button>
        )}
      </Col>
    );
    const managementAdmin = (
      <div style={{ marginTop: '20px' }}>
        <Row>
          <Col span={20} className={styles.teamsTit}>
            企业管理员管理
          </Col>
          {operation}
        </Row>
        {adminLists && (
          <Row
            className={styles.teamMinTit}
            type="flex"
            align="middle"
            style={{ padding: ' 0 0 10px 24px' }}
          >
            <Col span={10}>名称</Col>
            <Col span={5}>时间</Col>
          </Row>
        )}

        {adminLists ? (
          adminLists.map(item => {
            const { user_id, create_time, nick_name } = item;
            return (
              <Card
                key={user_id}
                style={{ marginBottom: '10px' }}
                bodyStyle={{ padding: 0 }}
                hoverable
              >
                <Row
                  type="flex"
                  align="middle"
                  style={{ paddingLeft: '24px', height: '70px' }}
                >
                  <Col span={10}>{nick_name}</Col>
                  <Col span={5}>{create_time}</Col>
                  <Col span={8} />
                  <Col span={1} className={styles.bor}>
                    <Dropdown
                      overlay={managementMenu(user_id)}
                      placement="bottomLeft"
                    >
                      <Icon component={moreSvg} style={{ width: '100%' }} />
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
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
            <Col span={12}>是否允许用户注册：</Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Switch
                onChange={this.onRegistChange}
                className={styles.automaTictelescopingSwitch}
                checked={this.props.isRegist}
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
              {oauthEnable && oauthInfo ? (
                <span>
                  已开通{oauthInfo.oauth_type}类型的第三方OAuth互联服务&nbsp;
                  {oauthInfo.is_auto_login && ', 且已开启自动登录'}
                </span>
              ) : (
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                  支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目。
                </span>
              )}
              {!oauth_services_is_sonsole && (
                <span
                  style={{
                    color: 'rgba(0, 0, 0, 0.45)',
                    marginLeft: '10px',
                  }}
                >
                  管理后台配置了当前只能查看配置。
                </span>
              )}
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
              {oauthInfo && oauth_services_is_sonsole && (
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
              {oauthEnable && israinbondTird && oauth_services_is_sonsole && (
                <a onClick={this.handleOpen} style={{ marginRight: '10px' }}>
                  编辑
                </a>
              )}
              {!oauth_services_is_sonsole && (
                <a
                  onClick={() => {
                    this.setState({ showOauthTable: true });
                  }}
                  style={{ marginRight: '10px' }}
                >
                  查看配置
                </a>
              )}
              {oauth_services_is_sonsole && (
                <Switch
                  onChange={this.handlChooseeOpen}
                  checked={israinbondTird && isOpen}
                  className={styles.automaTictelescopingSwitch}
                />
              )}
            </Col>
          </Row>
        </Card>
      </div>
    );

    return (
      <PageHeaderLayout
        title="企业设置"
        content="支持用户注册、Oauth2.0集成等企业设置功能，更丰富的企业管理资源管理功能在企业资源管理平台提供。"
      >
        {this.state.showOauthTable && (
          <OauthTable
            oauthTable={oauthTable}
            onOk={() => {
              this.setState({ showOauthTable: false });
            }}
            onCancel={() => {
              this.setState({ showOauthTable: false });
            }}
          />
        )}
        {this.state.showAddAdmin && (
          <AddAdmin
            eid={eid}
            onOk={this.handleCreateAdmin}
            onCancel={this.cancelCreateAdmin}
          />
        )}
        {this.state.showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelAdmin}
            title="删除管理员"
            subDesc="此操作不可恢复"
            desc="确定要删除此管理员吗？"
            onCancel={this.hideDelAdmin}
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

        {enterpriseAdminLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>
            {userRegistered}
            {oauth}
            {adminer && managementAdmin}
          </div>
        )}
      </PageHeaderLayout>
    );
  }
}

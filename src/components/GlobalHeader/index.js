import React, { PureComponent } from 'react';
import {
  Layout,
  Menu,
  Icon,
  Spin,
  Button,
  Dropdown,
  Avatar,
  Divider,
  Tooltip,
  Modal,
} from 'antd';
import { connect } from 'dva';
import ChangePassword from '../ChangePassword';
import moment from 'moment';
import groupBy from 'lodash/groupBy';
import Debounce from 'lodash-decorators/debounce';
import { Link, routerRedux } from 'dva/router';
import cookie from '../../utils/cookie';
import styles from './index.less';
import oauthUtil from '../../utils/oauth';
import userIcon from '../../../public/images/user-icon-small.png';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';

const { Header } = Layout;

@connect(({ global, appControl, order }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  appDetail: appControl.appDetail,
  enterpriseServiceInfo: order.enterpriseServiceInfo,
}))
export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      noticeCount: 0,
      noticeList: [],
      total: 0,
      pageSize: 1000,
      msg_type: '',
      popupVisible: false,
      msg_ids: '',
      newNoticeList: {},
      showDialogMessage: null,
      showChangePassword: false,
    };
  }
  componentDidMount() {}

  handleNoticeClear = type => {
    message.success(`清空了${type}`);
    const { dispatch } = this.props;
    dispatch({ type: 'global/clearNotices', payload: type });
  };

  handleNoticeVisibleChange = visible => {
    const { dispatch } = this.props;
    if (visible) {
      dispatch({ type: 'global/fetchNotices' });
    }
  };

  showChangePass = () => {
    this.setState({ showChangePassword: true });
  };
  cancelChangePass = () => {
    this.setState({ showChangePassword: false });
  };
  handleChangePass = vals => {
    this.props.dispatch({
      type: 'user/changePass',
      payload: {
        ...vals,
      },
      callback: () => {
        notification.success({ message: '修改成功，请重新登录' });
      },
    });
  };

  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;

    if (key === 'cpw') {
      this.showChangePass();
    }
    if (key === 'logout') {
      dispatch({ type: 'user/logout' });
    }
  };
  componentWillUnmount() {
    this.triggerResizeEvent.cancel();
  }
  getNoticeData(notices) {
    if (notices.length === 0) {
      return {};
    }
    const newNotices = notices.map(notice => {
      const newNotice = {
        ...notice,
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
    return groupBy(newNotices, 'msg_type');
  }
  handleVisibleChange = flag => {
    this.setState({ popupVisible: flag, total: 0 }, () => {});
  };
  onClear = () => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.replace(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/message`
      )
    );
  };

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };
  @Debounce(600)
  triggerResizeEvent() {
    // eslint-disable-line
    const event = document.createEvent('HTMLEvents');
    event.initEvent('resize', true, false);
    window.dispatchEvent(event);
  }
  handleVip = () => {
    const { dispatch, eid } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/overviewService`));
  };

  render() {
    const {
      currentUser,
      customHeader,
      isPubCloud,
      rainbondInfo,
      collapsed,
      enterprise,
      enterpriseServiceInfo,
      eid,
    } = this.props;
    if (!currentUser && !enterpriseServiceInfo) {
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
    const isOauth = rainbondUtil.OauthEnterpriseEnable(enterprise);
    const oauth_services =
      currentUser.oauth_services &&
      currentUser.oauth_services.length > 0 &&
      currentUser.oauth_services;
    const menu = (
      <div className={styles.uesrInfo}>
        <Menu selectedKeys={[]} onClick={this.handleMenuClick}>
          {isOauth && oauth_services && (
            <div className={styles.uesrInfoTitle}>Oauth认证：</div>
          )}
          {enterprise &&
            isOauth &&
            oauth_services.map(item => {
              const { service_name, is_authenticated, is_expired } = item;
              const authURL = oauthUtil.getAuthredictURL(item);
              return (
                <Menu.Item key={service_name}>
                  <div className={styles.userInfoContent}>
                    <span className={styles.oneSpan} title={service_name}>
                      {oauthUtil.getIcon(item, '16px')}
                      {service_name}
                    </span>
                    <span>
                      {is_authenticated ? (
                        <span style={{ color: 'green' }}>已认证</span>
                      ) : is_expired ? (
                        <a href={authURL} target="_blank">
                          已过期重新认证
                        </a>
                      ) : (
                        <a href={authURL} target="_blank">
                          去认证
                        </a>
                      )}
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
                    marginRight: 8,
                  }}
                />{' '}
                修改密码{' '}
              </div>
            </Menu.Item>
          )}
          <Menu.Item key="logout">
            <div className={styles.userInfoContent}>
              <Icon
                component={handleLogoutSvg}
                style={{
                  marginRight: 8,
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
        <Icon
          className={styles.trigger}
          type={!collapsed ? 'menu-unfold' : 'menu-fold'}
          style={{ color: '#ffffff', float: 'left' }}
          onClick={this.toggle}
        />
        {customHeader && customHeader()}
        <div className={styles.right}>
          {enterpriseServiceInfo.type === 'free' && (
            <Button type="primary" onClick={this.handleVip}>
              升级付费服务
            </Button>
          )}
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
                marginLeft: 8,
              }}
            />
          )}
        </div>
        {/* change password */}
        {this.state.showChangePassword && (
          <ChangePassword
            onOk={this.handleChangePass}
            onCancel={this.cancelChangePass}
          />
        )}
      </Header>
    );
  }
}

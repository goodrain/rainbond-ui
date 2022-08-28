/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/sort-comp */
/* eslint-disable prettier/prettier */
import rainbondUtil from '@/utils/rainbond';
import {
  Avatar,
  Dropdown,
  Icon,
  Layout,
  Menu,
  notification,
  Popconfirm,
  Spin
} from 'antd';
import { connect } from 'dva';
import { formatMessage, setLocale, getLocale, FormattedMessage } from 'umi/locale'
import { routerRedux } from 'dva/router';
import Debounce from 'lodash-decorators/debounce';
import React, { PureComponent } from 'react';
import userIcon from '../../../public/images/user-icon-small.png';
import { setNewbieGuide } from '../../services/api';
import ChangePassword from '../ChangePassword';
import styles from './index.less';
import cookie from '../../utils/cookie';
const { Header } = Layout;

@connect(({ user, global, appControl }) => ({
  rainbondInfo: global.rainbondInfo,
  appDetail: appControl.appDetail,
  currentUser: user.currentUser,
  enterprise: global.enterprise
  // enterpriseServiceInfo: order.enterpriseServiceInfo
}))
export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise } = this.props;
    this.state = {
      isNewbieGuide: false && rainbondUtil.isEnableNewbieGuide(enterprise),
      showChangePassword: false,
      language: cookie.get('language') === 'zh-CN' ? '中文语言' : '英文语言'
    };
  }
  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;
    if (key === 'userCenter') {
      dispatch(routerRedux.push(`/account/center`));
    }
    if (key === 'cpw') {
      this.showChangePass();
    }
    if (key === 'logout') {
      dispatch({ type: 'user/logout' });
    }
  };
  handleMenuCN = (e) => {
    cookie.set('language', e.key)
    const lang = cookie.get('language')
    if(e.key === 'zh-CN'){
      setLocale('zh-CN')
    }else if(e.key === 'en-US'){
      setLocale('en-US')
    }
    this.setState({
      language: e.item.props.children
    })
  }
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
        ...vals
      },
      callback: () => {
        notification.success({ message: '修改成功，请重新登录' });
      }
    });
  };

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
  };
  @Debounce(600)
  handleVip = () => {
    const { dispatch, eid } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/overviewService`));
  };
  handlIsOpenNewbieGuide = () => {
    const { eid, dispatch } = this.props;
    setNewbieGuide({
      enterprise_id: eid,
      data: {
        NEWBIE_GUIDE: { enable: false, value: '' }
      }
    }).then(() => {
      notification.success({
        message: formatMessage({id:'notification.success.close'})
      });
      dispatch({
        type: 'global/fetchEnterpriseInfo',
        payload: {
          enterprise_id: eid
        },
        callback: info => {
          if (info && info.bean) {
            this.setState({
              isNewbieGuide: rainbondUtil.isEnableNewbieGuide(info.bean)
            });
          }
        }
      });
    });
  };
  render() {
    const { currentUser, customHeader, rainbondInfo, collapsed } = this.props;
    const { language } = this.state
    if (!currentUser) {
      return null;
    }
    const { isNewbieGuide } = this.state;
    const handleUserSvg = () => (
      <svg viewBox="0 0 1024 1024" width="13" height="13">
        <path
          d="M511.602218 541.281848a230.376271 230.376271 0 1 0 0-460.752543 230.376271 230.376271 0 0 0 0 460.752543zM511.960581 0a307.168362 307.168362 0 0 1 155.63197 572.049879c188.806153 56.826147 330.615547 215.939358 356.059326 413.551004 2.406152 18.788465-11.570008 35.836309-31.228783 38.140072-19.60758 2.303763-37.525735-11.006866-39.931887-29.795331-27.645153-214.505906-213.430817-376.025269-438.73881-376.02527-226.536667 0-414.728483 161.826532-442.322441 376.02527-2.406152 18.788465-20.324307 32.099094-39.931887 29.795331-19.658775-2.303763-33.634936-19.351607-31.228783-38.140072 25.392585-196.79253 167.969899-355.700963 357.08322-413.039057A307.168362 307.168362 0 0 1 511.960581 0z"
          fill="#555555"
          p-id="1138"
        />
      </svg>
    );
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
    const handleZhEn = (
      <svg t="1660542671302" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4823" width="20" height="20">
        <path d="M585.142857 804.571429H146.285714a73.142857 73.142857 0 0 1-73.142857-73.142858V146.285714a73.142857 73.142857 0 0 1 73.142857-73.142857h585.142857a73.142857 73.142857 0 0 1 73.142858 73.142857v298.422857a36.571429 36.571429 0 0 0 73.142857 0V146.285714a146.285714 146.285714 0 0 0-146.285715-146.285714H146.285714a146.285714 146.285714 0 0 0-146.285714 146.285714v585.142857a146.285714 146.285714 0 0 0 146.285714 146.285715h438.857143a36.571429 36.571429 0 0 0 0-73.142857zM157.257143 574.171429A35.84 35.84 0 0 1 146.285714 548.571429v-292.571429a37.302857 37.302857 0 0 1 36.571429-36.571429h219.428571a36.571429 36.571429 0 0 1 36.571429 36.571429 36.571429 36.571429 0 0 1-36.571429 36.571429H219.428571v73.142857h182.857143a36.571429 36.571429 0 0 1 0 73.142857H219.428571v73.142857h182.857143a36.571429 36.571429 0 0 1 0 73.142857h-219.428571a35.84 35.84 0 0 1-25.6-10.971428zM512 550.765714V374.491429c0-23.405714 12.434286-36.571429 34.377143-37.302858a29.257143 29.257143 0 0 1 30.72 28.525715 68.754286 68.754286 0 0 1 62.902857-27.062857A84.845714 84.845714 0 0 1 731.428571 423.497143v127.268571a32.914286 32.914286 0 0 1-36.571428 34.377143 33.645714 33.645714 0 0 1-36.571429-34.377143V438.857143c0-28.525714-8.777143-44.617143-36.571428-46.811429S585.142857 405.942857 585.142857 438.857143v111.908571a33.645714 33.645714 0 0 1-36.571428 34.377143 32.914286 32.914286 0 0 1-36.571429-34.377143zM841.142857 512a36.571429 36.571429 0 0 1 36.571429 36.571429v438.857142a36.571429 36.571429 0 0 1-36.571429 36.571429 36.571429 36.571429 0 0 1-36.571428-36.571429v-438.857142a36.571429 36.571429 0 0 1 36.571428-36.571429zM702.171429 658.285714h277.942857a43.885714 43.885714 0 0 1 43.885714 43.885715v131.657142a43.885714 43.885714 0 0 1-43.885714 43.885715H702.171429a43.885714 43.885714 0 0 1-43.885715-43.885715V702.171429a43.885714 43.885714 0 0 1 43.885715-43.885715z m43.885714 73.142857a14.628571 14.628571 0 0 0-14.628572 14.628572v43.885714a14.628571 14.628571 0 0 0 14.628572 14.628572h190.171428a14.628571 14.628571 0 0 0 14.628572-14.628572v-43.885714a14.628571 14.628571 0 0 0-14.628572-14.628572z" fill="#ffffff" p-id="4824"></path>
      </svg>
    )
    const MenuItems = (key, component, text) => {
      return (
        <Menu.Item key={key}>
          <Icon
            component={component}
            style={{
              marginRight: 8
            }}
          />
          {text}
        </Menu.Item>
      );
    };

    const menu = (
      <div className={styles.uesrInfo}>
        <Menu selectedKeys={[]} onClick={this.handleMenuClick}>
          {MenuItems('userCenter', handleUserSvg, '个人中心')}
          {MenuItems('cpw', handleEditSvg, '修改密码')}
          {!rainbondUtil.logoutEnable(rainbondInfo) &&
            MenuItems('logout', handleLogoutSvg, '退出登录')}
        </Menu>
      </div>
    );
    const MenuCN = (key, text) => {
      return (
        <Menu.Item key={key}>
          {text}
        </Menu.Item>
      );
    };
    const menuCN = (
      <div className={styles.uesrInfos}>
        <Menu selectedKeys={[]} onClick={this.handleMenuCN}>
          {MenuCN('zh-CN', '中文语言')}
          {MenuCN('en-US', '英文语言')}
        </Menu>
      </div>
    );
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const platformUrl = rainbondUtil.documentPlatform_url(rainbondInfo);
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
            <Dropdown overlay={menuCN} trigger="hover">  
              <span className={`${styles.action} ${styles.account}`} style={{ color: '#fff' }}>
                <span style={{ marginRight:'4px', display:'inline-block' }}>{handleZhEn}</span>
                <span className={styles.name}>{language}</span>
              </span>
            </Dropdown>
          {enterpriseEdition ? (
            <span className={styles.action} style={{ color: '#fff' }}>
              企业版
            </span>
          ) : (
            <a
              className={styles.action}
              style={{ color: '#fff' }}
              href="https://www.rainbond.com/enterprise_server"
              // eslint-disable-next-line react/jsx-no-target-blank
              target="_blank"
            >
              开源版
            </a>
          )}
          {isNewbieGuide && (
            <Popconfirm
              title="是否要关闭新手引导功能、关闭后并无法开启此功能?"
              onConfirm={this.handlIsOpenNewbieGuide}
              okText="关闭"
              cancelText="取消"
            >
              <a
                className={styles.action}
                style={{ color: '#fff' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                新手引导
              </a>
            </Popconfirm>
          )}
          {platformUrl && (
            <a
              className={styles.action}
              style={{ color: '#fff' }}
              href={`${platformUrl}docs/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              平台使用手册
            </a>
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
                marginLeft: 8
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

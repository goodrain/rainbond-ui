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
  Spin,
  Tooltip,
  Popover
} from 'antd';
import { connect } from 'dva';
import { setLocale, FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { routerRedux } from 'dva/router';
import ScrollerX from '../ScrollerX';
import React, { PureComponent } from 'react';
import userIcon from '../../../public/images/default_Avatar.png';
import defaultLogo from '../../../public/logo-icon.png';
import { setNewbieGuide, fetchAllVersion } from '../../services/api';
import ChangePassword from '../ChangePassword';
import ProductServiceDrawer from '../ProductServiceDrawer';
import styles from './index.less';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
const { Header } = Layout;

@connect(({ user, global, appControl }) => ({
  rainbondInfo: global.rainbondInfo,
  appDetail: appControl.appDetail,
  currentUser: user.currentUser,
  enterprise: global.enterprise,
  collapsed: global.collapsed
}))
export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise } = this.props;
    this.state = {
      isNewbieGuide: false && rainbondUtil.isEnableNewbieGuide(enterprise),
      showChangePassword: false,
      language: cookie.get('language') === 'zh-CN',
      showBill: false,
      isTeamView: globalUtil.getCurrTeamName() !== '' && globalUtil.getCurrRegionName() !== '',
      balance: null,
      balanceStatus: '',
      showProductDrawer: false
    };
  }
  componentDidMount() {
    const { currentUser } = this.props
    const eid = globalUtil.getCurrEnterpriseId() || currentUser?.enterprise_id
    const region_name = globalUtil.getCurrRegionName() || currentUser?.teams[0]?.region[0]?.team_region_name;
    if (region_name) {
      this.fetchPipePipeline(eid, region_name)
    }
    // 初始化语言设置
    if (!cookie.get('language')) {
      const browserLang = navigator.systemLanguage || navigator.language;
      const isZh = browserLang.toLowerCase().indexOf('zh') !== -1 || browserLang.toLowerCase().indexOf('en') === -1;
      const language = isZh ? 'zh-CN' : 'en-US';
      cookie.set('language', language);
      setLocale(language);
      this.setState({ language: isZh });
    }
  }

  componentDidUpdate(prevProps) {
    // 检测路由变化，更新 isTeamView 状态
    const currentTeam = globalUtil.getCurrTeamName();
    const currentRegion = globalUtil.getCurrRegionName();
    const newIsTeamView = currentTeam !== '' && currentRegion !== '';

    if (this.state.isTeamView !== newIsTeamView) {
      this.setState({ isTeamView: newIsTeamView });
    }
  }

  fetchPipePipeline = (eid, region_name) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: eid,
        region_name: region_name
      },
      callback: res => {
        if (res.list.some(item => item.name === 'rainbond-bill')) {
          this.setState({
            showBill: true
          }, () => {
            this.fetchBalance()
          })
        }
      }
    })
  }
  fetchBalance = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/getUserBalance',
      payload: {},
      callback: (res) => {
        this.setState({
          balance: res?.response_data?.balance / 1000000,
          balanceStatus: res?.response_data?.status
        })
      }
    });
  };

  /**
   * 获取用户默认导航路径
   */
  getLoginRole = (currUser) => {
    const { teams } = currUser || {};
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0];
      const { team_region_name } = region?.[0] || {};
      if (team_name && team_region_name) {
        return `/team/${globalUtil.getCurrTeamName() || team_name}/region/${globalUtil.getCurrRegionName() || team_region_name}/index`;
      }
    }
    if (currUser?.is_enterprise_admin) {
      return `/enterprise/${currUser?.enterprise_id}/index`;
    }
    return '/';
  };

  /**
   * Logo 点击跳转
   */
  onLogoClick = () => {
    const { dispatch, currentUser } = this.props;
    const link = this.getLoginRole(currentUser);
    dispatch(routerRedux.replace(link));
  };

  handleMenuClick = ({ key }) => {
    const { dispatch, currentUser, rainbondInfo } = this.props;
    const region_name = globalUtil.getCurrRegionName() || currentUser?.teams[0]?.region[0]?.team_region_name;
    const team_name = globalUtil.getCurrTeamName() || currentUser?.teams[0]?.team_name;

    switch (key) {
      case 'userCenter':
        dispatch(routerRedux.push(`/account/center/personal`));
        break;
      case 'cpw':
        this.showChangePass();
        break;
      case 'bill':
        // 跳转到门户的账户中心
        this.handlePortalNavigation('account-center');
        break;
      case 'logout':
        window.sessionStorage.removeItem('Pipeline');
        dispatch({ type: 'user/logout' });
        break;
      default:
        break;
    }
  };

  handlePortalNavigation = (key) => {
    const { rainbondInfo } = this.props;
    const portalSite = rainbondInfo?.portal_site;
    const token = cookie.get('token');

    if (portalSite && token) {
      // 构造跳转URL，携带token和key参数
      const url = `${portalSite}?token=${token}&redirect=${key}`;
      window.location.href = url;
    }
  };

  handleMenuCN = (val) => {
    cookie.set('language', val);
    setLocale(val, true);
    this.setState({ language: val === 'zh-CN' });
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
        notification.success({ message: formatMessage({ id: 'GlobalHeader.success' }) });
      }
    });
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
        message: formatMessage({ id: 'notification.success.close' })
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
  handleBalanceBill = () => {
    // 点击余额跳转到门户的账户中心
    this.handlePortalNavigation('account-center');
  }

  toggleProductDrawer = () => {
    this.setState({ showProductDrawer: !this.state.showProductDrawer });
  }

  closeProductDrawer = () => {
    this.setState({ showProductDrawer: false });
  }
  render() {
    const { currentUser, customHeader, rainbondInfo, collapsed, logo, enterprise } = this.props;
    const { language, isTeamView, showBill, balance, balanceStatus } = this.state;
    // 获取 Logo，优先使用 props 传入的，否则从 rainbondInfo 和 enterprise 获取
    const fetchLogo = logo || rainbondUtil.fetchLogo(rainbondInfo, enterprise) || defaultLogo;
    if (!currentUser) {
      return null;
    }
    const { isNewbieGuide } = this.state;
    const handleUserSvg = () => (
      <svg viewBox="0 0 1024 1024" width="13" height="13">
        <path
          d="M511.602218 541.281848a230.376271 230.376271 0 1 0 0-460.752543 230.376271 230.376271 0 0 0 0 460.752543zM511.960581 0a307.168362 307.168362 0 0 1 155.63197 572.049879c188.806153 56.826147 330.615547 215.939358 356.059326 413.551004 2.406152 18.788465-11.570008 35.836309-31.228783 38.140072-19.60758 2.303763-37.525735-11.006866-39.931887-29.795331-27.645153-214.505906-213.430817-376.025269-438.73881-376.02527-226.536667 0-414.728483 161.826532-442.322441 376.02527-2.406152 18.788465-20.324307 32.099094-39.931887 29.795331-19.658775-2.303763-33.634936-19.351607-31.228783-38.140072 25.392585-196.79253 167.969899-355.700963 357.08322-413.039057A307.168362 307.168362 0 0 1 511.960581 0z"
          fill="#161616"
          p-id="1138"
        />
      </svg>
    );
    const handleLogoutSvg = () => (
      <svg width="15px" height="15px" viewBox="0 0 1024 1024">
        <path d="M1024 445.44 828.414771 625.665331l0-116.73472L506.88 508.930611l0-126.98112 321.53472 0 0-116.73472L1024 445.44zM690.174771 41.985331 100.34944 41.985331l314.37056 133.12 0 630.78528 275.45472 0L690.17472 551.93472l46.08 0 0 296.96L414.72 848.89472 414.72 1024 0 848.894771 0 0l736.25472 0 0 339.97056-46.08 0L690.17472 41.98528 690.174771 41.985331zM690.174771 41.985331" />
      </svg>
    );
    const handleBillSvg = () => (
      <svg t="1736330635739" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5523" width="16" height="16"><path d="M793.1904 742.4H220.5696a20.48 20.48 0 1 1 0-40.96h572.6208a20.48 20.48 0 0 1 0 40.96z" p-id="5524"></path><path d="M856.2688 952.32H157.4912A105.2672 105.2672 0 0 1 51.2 848.1792V175.8208A105.2672 105.2672 0 0 1 157.4912 71.68h698.7776A105.2672 105.2672 0 0 1 962.56 175.8208v672.3584A105.2672 105.2672 0 0 1 856.2688 952.32zM156.672 112.64A64 64 0 0 0 92.16 175.8208v672.3584A64 64 0 0 0 156.672 911.36h700.416a64 64 0 0 0 64.512-63.1808V175.8208A64 64 0 0 0 857.088 112.64z" p-id="5525"></path><path d="M777.4208 460.8H635.6992a20.48 20.48 0 1 1 0-40.96h141.7216a20.48 20.48 0 1 1 0 40.96M417.5872 386.4576H224.3584a20.48 20.48 0 0 1 0-40.96h193.2288a20.48 20.48 0 0 1 0 40.96M417.5872 472.064H224.3584a20.48 20.48 0 0 1 0-40.96h193.2288a20.48 20.48 0 0 1 0 40.96" p-id="5526"></path><path d="M325.2224 555.3152a20.48 20.48 0 0 1-20.48-20.48V365.4656a20.48 20.48 0 1 1 40.96 0v169.3696a20.48 20.48 0 0 1-20.48 20.48" p-id="5527"></path><path d="M323.7888 389.12a20.48 20.48 0 0 1-18.2272-11.264l-93.0816-184.32a20.48 20.48 0 0 1 36.5568-18.432l93.0816 184.32a20.48 20.48 0 0 1-9.1136 27.5456 19.7632 19.7632 0 0 1-9.216 2.2528" p-id="5528"></path><path d="M329.6256 386.048a19.6608 19.6608 0 0 1-9.728-2.4576 20.48 20.48 0 0 1-8.2944-27.7504l92.9792-172.544A20.48 20.48 0 0 1 440.32 202.752l-92.16 172.544a20.48 20.48 0 0 1-18.0224 10.752" p-id="5529"></path></svg>
    )
    const languageSvg = () => (
      <svg t="1742959338405" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15135" width="20" height="20">
        <path d="M364.16 259.776a361.408 361.408 0 0 1-73.024 124.16 385.664 385.664 0 0 1-80.64-124.16H364.16z m128.576 0v-51.968H297.856l38.528-12.16c-5.376-18.368-18.816-47.104-30.464-67.84l-56.896 16.64c10.304 19.84 20.16 44.928 25.088 63.36H85.056v51.968h70.336c24.192 63.232 55.104 116.992 95.424 161.408-46.592 36.288-104.384 61.888-174.272 79.36 10.752 12.096 26.432 37.184 32.256 49.728 72.128-20.608 132.16-50.176 181.44-90.56 47.04 39.488 104.832 69.12 175.168 87.872 8.064-14.72 23.744-38.08 35.84-49.728-66.752-15.68-123.2-41.728-169.344-77.568 38.976-43.52 69.44-96 92.288-160.512h68.544zM693.76 739.84l11.264-41.472a2728.96 2728.96 0 0 0 32.256-123.904h2.048c11.264 40.96 21.504 84.48 33.28 123.904l11.264 41.472H693.76zM826.88 896h79.36l-121.856-378.88h-89.088L573.952 896h76.8l26.624-97.28h122.88L826.88 896zM768 160H576a32 32 0 0 0 0 64h192q13.248 0 22.656 9.344 9.344 9.408 9.344 22.656v192a32 32 0 0 0 64 0V256q0-39.744-28.16-67.84-28.096-28.16-67.84-28.16zM192 928q-39.744 0-67.84-28.16-28.16-28.096-28.16-67.84v-192a32 32 0 0 1 64 0v192q0 13.248 9.344 22.656 9.408 9.344 22.656 9.344h192a32 32 0 0 1 0 64H192z" p-id="15136" fill="#333">
        </path>
      </svg>
    )

    const docsUrl = (rainbondInfo?.document?.enable && `${rainbondInfo?.document?.value?.platform_url}${language ? 'docs/tutorial/via-rainbond-deploy-sourceandmiddleware' : 'en/docs/tutorial/via-rainbond-deploy-sourceandmiddleware'}`) || (language ? 'https://www.rainbond.com/docs/' : 'https://www.rainbond.com/en/docs/')
    const portalSite = rainbondInfo?.portal_site
    const menuTextMap = {
      userCenter: 'GlobalHeader.core',
      bill: 'GlobalHeader.account',
      logout: 'GlobalHeader.exit'
    };
    const MenuItems = (key, component) => (
      <Menu.Item key={key}>
        <Icon component={component} style={{ marginRight: 8 }} />
        <FormattedMessage id={menuTextMap[key]} />
      </Menu.Item>
    );
    const menu = (
      <div className={styles.uesrInfo}>
        <Menu onClick={this.handleMenuClick}>
          {MenuItems('userCenter', handleUserSvg)}
          {showBill && MenuItems('bill', handleBillSvg)}
          {!rainbondUtil.logoutEnable(rainbondInfo) && MenuItems('logout', handleLogoutSvg)}
        </Menu>
      </div>
    );
    const platformUrl = rainbondUtil.documentPlatform_url(rainbondInfo);
    const showFullLogo = !isTeamView || !collapsed;
    const actionStyle = { verticalAlign: '-7px', color: '#333' };

    const showAppMarket = rainbondUtil.isShowAppMarket(rainbondInfo);
    const customerServiceQrcode = rainbondInfo && rainbondInfo.customer_service_qrcode && rainbondInfo.customer_service_qrcode.value || '';
    return (
      <ScrollerX sm={900}>
        <Header className={styles.header}>
          <div className={styles.left}>
            {showBill && portalSite && 
              <div
                className={styles.productIcon}
                onClick={this.toggleProductDrawer}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4h16M2 10h16M2 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            }
            <div
              className={`${styles.logoWrapper} ${isTeamView && collapsed ? styles.logoCollapsed : ''} ${!isTeamView ? styles.logoEnterprise : ''}`}
              onClick={this.onLogoClick}
            >
              <img src={fetchLogo} alt="logo" />
              {showFullLogo && (
                <span className={styles.enterpriseName}>
                  {(rainbondInfo?.title?.enable && rainbondInfo?.title?.value)|| 'Rainbond'}
                </span>
              )}
            </div>
            {customHeader && customHeader()}
          </div>
          <div className={styles.right}>
            {showAppMarket && showBill && (
              <a
                className={styles.platform}
                style={{ color: '#333', fontSize: '14px', fontWeight: '600',}}
                href='https://hub.grapps.cn/marketplace'
                target='_blank'
              >
                <Icon type="shop" style={{ fontSize: 16, marginRight: 6 }}/>
                <FormattedMessage id="GlobalHeader.market" />
              </a>
            )}

            {isNewbieGuide && (
              <Popconfirm
                title={formatMessage({ id: 'GlobalHeader.close' })}
                onConfirm={this.handlIsOpenNewbieGuide}
                okText={formatMessage({ id: 'button.close' })}
                cancelText={formatMessage({ id: 'button.cancel' })}
              >
                <a
                  className={styles.action}
                  style={{ color: '#333' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FormattedMessage id="GlobalHeader.new" />
                </a>
              </Popconfirm>
            )}
            <div className={styles.iconContainer}>
              {showBill && balance != null && (
                <div
                  onClick={this.handleBalanceBill}
                  className={styles.balance}
                  style={{ color: balanceStatus !== 'NORMAL' ? '#f50' : '#333' }}
                >
                  <div className={styles.balanceTitle}>{formatMessage({ id: 'GlobalHeader.balance' })}</div>
                  <div className={styles.balanceNum}>¥{balance.toFixed(2)}</div>
                </div>
              )}
              {platformUrl && (
                <Tooltip title={formatMessage({ id: 'GlobalHeader.help' })}>
                  <a
                    className={styles.action}
                    style={actionStyle}
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon type="read" style={{ fontSize: 16 }}/>
                  </a>
                </Tooltip>
              )}
              {showBill && (
                <Popover
                  content={
                    <div className={styles.wechat}>
                      <img style={{ width: '120px', height: '120px', marginTop: '12px' }} src={customerServiceQrcode || ''} alt='客服' />
                      <p>{formatMessage({ id: 'CustomerFloat.wechat_desc' })}</p>
                    </div>
                  }
                >
                  <a className={styles.action} style={actionStyle}>
                    {globalUtil.fetchSvg('serviceSvg', '#333', 18)}
                  </a>
                </Popover>
              )}
              <a
                className={styles.action}
                style={actionStyle}
                onClick={() => this.handleMenuCN(language ? 'en-US' : 'zh-CN')}
              >
                {languageSvg()}
              </a>
              {currentUser ? (
                <Dropdown overlay={menu}>
                  <span className={`${styles.action} ${styles.account}`}>
                    <Avatar size='default' className={styles.avatar} src={currentUser?.logo || userIcon} />
                  </span>
                </Dropdown>
              ) : (
                <Spin size="small" style={{ marginLeft: 8 }} />
              )}
            </div>
          </div>
          {this.state.showChangePassword && (
            <ChangePassword
              onOk={this.handleChangePass}
              onCancel={this.cancelChangePass}
            />
          )}
          <ProductServiceDrawer
            visible={this.state.showProductDrawer}
            onClose={this.closeProductDrawer}
          />
        </Header>
      </ScrollerX>
    );
  }
}

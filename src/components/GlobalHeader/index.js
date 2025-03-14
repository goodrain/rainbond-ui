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
  Modal,
  Popover
} from 'antd';
import { connect } from 'dva';
import { setLocale, getLocale, } from 'umi/locale'
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
// import Debounce from 'lodash-decorators/debounce';
import ScrollerX from '../ScrollerX';
import React, { PureComponent } from 'react';
import userIcon from '../../../public/images/default_Avatar.png';
import wechat from '../../../public/images/wechat.jpg';
import { setNewbieGuide, fetchAllVersion } from '../../services/api';
import ChangePassword from '../ChangePassword';
import styles from './index.less';
import cookie from '../../utils/cookie';
import { Link } from 'umi';
import globalUtil from '../../utils/global';
const { Header } = Layout;

@connect(({ user, global, appControl }) => ({
  rainbondInfo: global.rainbondInfo,
  appDetail: appControl.appDetail,
  currentUser: user.currentUser,
  enterprise: global.enterprise,
  // enterpriseServiceInfo: order.enterpriseServiceInfo
}))
export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise } = this.props;
    this.state = {
      isNewbieGuide: false && rainbondUtil.isEnableNewbieGuide(enterprise),
      showChangePassword: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      treeData: [],
      isVersionUpdate: false,
      showBill: false,
      isTeamView: globalUtil.getCurrTeamName() !== '' && globalUtil.getCurrRegionName() !== '',
      balance: null,
      balanceStatus: ''
    };
  }
  componentDidMount() {
    const { is_enterprise, currentUser } = this.props
    const eid = globalUtil.getCurrEnterpriseId() || currentUser?.enterprise_id
    const region_name = globalUtil.getCurrRegionName() || currentUser?.teams[0]?.region[0]?.team_region_name;
    if (region_name) {
      this.fetchPipePipeline(eid, region_name)
    }
    let lan = navigator.systemLanguage || navigator.language;
    const Language = cookie.get('language')
    if (Language == null) {
      if (lan.toLowerCase().indexOf('zh') !== -1) {
        const language = 'zh-CN'
        cookie.set('language', language)
        const lang = cookie.get('language')
        setLocale('zh-CN')
        this.setState({
          language: true,
        })
      } else if (lan.toLowerCase().indexOf('en') !== -1) {
        const language = 'en-US'
        cookie.set('language', language)
        const lang = cookie.get('language')
        setLocale('en-US')
        this.setState({
          language: false,
        })
      } else {
        const language = 'zh-CN'
        cookie.set('language', language)
        const lang = cookie.get('language')
        setLocale('zh-CN')
        this.setState({
          language: true,
        })
      }
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
  handleMenuClick = ({ key }) => {
    const { dispatch, currentUser } = this.props;
    const { language } = this.state
    const region_name = globalUtil.getCurrRegionName() || currentUser?.teams[0]?.region[0]?.team_region_name;
    const team_name = globalUtil.getCurrTeamName() || currentUser?.teams[0]?.team_name;
    if (key === 'userCenter') {
      dispatch(routerRedux.push(`/account/center/personal`));
    }
    if (key === 'cpw') {
      this.showChangePass();
    }
    if (key === 'bill') {
      dispatch(routerRedux.push(`/team/${team_name}/region/${region_name}/plugins/rainbond-bill`));
    }
    if (key === 'zh_en') {
      if (language) {
        this.handleMenuCN("en-US")
      } else {
        this.handleMenuCN("zh-CN");
      }
    }
    if (key === 'logout') {
      window.sessionStorage.removeItem('Pipeline')
      dispatch({ type: 'user/logout' });
    }
  };

  handleMenuCN = (val) => {
    const { language } = this.state
    cookie.set('language', val)
    if (val === 'zh-CN') {
      setLocale('zh-CN')
    } else if (val === 'en-US') {
      setLocale('en-US')
    }
    this.setState({
      language: !language
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
        notification.success({ message: formatMessage({ id: 'GlobalHeader.success' }) });
      }
    });
  };

  // toggle = () => {
  //   const { collapsed, onCollapse } = this.props;
  //   onCollapse(!collapsed);
  // };
  // @Debounce(600)
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
  // 获取所有主机版本
  fetchAllVersion = () => {
    const { dispatch, rainbondInfo } = this.props
    const currentVersion = rainbondInfo.version.value.split('-')[0]
    fetchAllVersion().then(res => {
      if (res) {
        res.forEach((item, index) => {
          if (item.split('-')[0] === currentVersion && index !== 0) {
            window.sessionStorage.setItem('isShowUpdateVersion', currentVersion)
            this.setState({
              isVersionUpdate: true,
            })
          }
        })
      }
    }).catch(e => { console.log(e) })
  }
  // 跳转到版本更新页面
  handleRouteupdate = () => {
    const { dispatch, eid } = this.props
    this.setState({
      isVersionUpdate: false
    }, () => {
      dispatch(routerRedux.push(`/enterprise/${eid}/setting?showupdate=true`));
    })
  }
  handleShowUpdate = () => {
    this.setState({
      isVersionUpdate: true,
    })
  };
  handleBalanceBill = () => {
    const { dispatch, currentUser } = this.props;
    const region_name = globalUtil.getCurrRegionName() || currentUser?.teams[0]?.region[0]?.team_region_name;
    const team_name = globalUtil.getCurrTeamName() || currentUser?.teams[0]?.team_name;
    dispatch(routerRedux.push(`/team/${team_name}/region/${region_name}/plugins/rainbond-bill`));
  }
  render() {
    const { currentUser, customHeader, rainbondInfo, collapsed, eid, is_space = false, is_enterprise = false, customHeaderImg } = this.props;
    const { language, treeData, isVersionUpdate, isTeamView, showBill, balance, balanceStatus } = this.state
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
    const handleHandBookSvg = (
      <svg t="1741836491769" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2679" width="20" height="20">
        <path d="M537.152 414.72h-288.64a29.44 29.44 0 0 1-26.24-30.72 29.44 29.44 0 0 1 26.24-32h288.64a29.44 29.44 0 0 1 26.24 32 29.44 29.44 0 0 1-26.24 30.72z m209.92 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z m0 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z" fill="#ffffff" p-id="2680"></path>
        <path d="M192.832 0a128 128 0 0 0-128 128v768a128 128 0 0 0 128 128h640a128 128 0 0 0 128-128l7.04-670.72L748.992 0h-556.16z m512 64l192 192h-160.64a31.36 31.36 0 0 1-31.36-31.36V64z m128 896h-640a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64h448v192a64 64 0 0 0 64 64h192v576a64 64 0 0 1-64 64z" fill="#ffffff" p-id="2681"></path>
      </svg>
    )
    const handleBillSvg = () => (
      <svg t="1736330635739" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5523" width="16" height="16"><path d="M793.1904 742.4H220.5696a20.48 20.48 0 1 1 0-40.96h572.6208a20.48 20.48 0 0 1 0 40.96z" p-id="5524"></path><path d="M856.2688 952.32H157.4912A105.2672 105.2672 0 0 1 51.2 848.1792V175.8208A105.2672 105.2672 0 0 1 157.4912 71.68h698.7776A105.2672 105.2672 0 0 1 962.56 175.8208v672.3584A105.2672 105.2672 0 0 1 856.2688 952.32zM156.672 112.64A64 64 0 0 0 92.16 175.8208v672.3584A64 64 0 0 0 156.672 911.36h700.416a64 64 0 0 0 64.512-63.1808V175.8208A64 64 0 0 0 857.088 112.64z" p-id="5525"></path><path d="M777.4208 460.8H635.6992a20.48 20.48 0 1 1 0-40.96h141.7216a20.48 20.48 0 1 1 0 40.96M417.5872 386.4576H224.3584a20.48 20.48 0 0 1 0-40.96h193.2288a20.48 20.48 0 0 1 0 40.96M417.5872 472.064H224.3584a20.48 20.48 0 0 1 0-40.96h193.2288a20.48 20.48 0 0 1 0 40.96" p-id="5526"></path><path d="M325.2224 555.3152a20.48 20.48 0 0 1-20.48-20.48V365.4656a20.48 20.48 0 1 1 40.96 0v169.3696a20.48 20.48 0 0 1-20.48 20.48" p-id="5527"></path><path d="M323.7888 389.12a20.48 20.48 0 0 1-18.2272-11.264l-93.0816-184.32a20.48 20.48 0 0 1 36.5568-18.432l93.0816 184.32a20.48 20.48 0 0 1-9.1136 27.5456 19.7632 19.7632 0 0 1-9.216 2.2528" p-id="5528"></path><path d="M329.6256 386.048a19.6608 19.6608 0 0 1-9.728-2.4576 20.48 20.48 0 0 1-8.2944-27.7504l92.9792-172.544A20.48 20.48 0 0 1 440.32 202.752l-92.16 172.544a20.48 20.48 0 0 1-18.0224 10.752" p-id="5529"></path></svg>
    )
    const en_language = () => (
      <svg class="icon" width="15" height="15" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path d="M229.248 704V337.504h271.744v61.984h-197.76v81.28h184v61.76h-184v99.712h204.768V704h-278.72z m550.496 0h-70.24v-135.488c0-28.672-1.504-47.232-4.48-55.648a39.04 39.04 0 0 0-14.656-19.616 41.792 41.792 0 0 0-24.384-7.008c-12.16 0-23.04 3.328-32.736 10.016-9.664 6.656-16.32 15.488-19.872 26.496-3.584 11.008-5.376 31.36-5.376 60.992V704h-70.24v-265.504h65.248v39.008c23.168-30.016 52.32-44.992 87.488-44.992 15.52 0 29.664 2.784 42.496 8.352 12.832 5.6 22.56 12.704 29.12 21.376 6.592 8.672 11.2 18.496 13.76 29.504 2.56 11.008 3.872 26.752 3.872 47.264V704zM160 144a32 32 0 0 0-32 32V864a32 32 0 0 0 32 32h688a32 32 0 0 0 32-32V176a32 32 0 0 0-32-32H160z m0-64h688a96 96 0 0 1 96 96V864a96 96 0 0 1-96 96H160a96 96 0 0 1-96-96V176a96 96 0 0 1 96-96z" />
      </svg>
    )
    const cn_language = () => (
      <svg class="icon" width="15" height="15" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path d="M160 144a32 32 0 0 0-32 32V864a32 32 0 0 0 32 32h688a32 32 0 0 0 32-32V176a32 32 0 0 0-32-32H160z m0-64h688a96 96 0 0 1 96 96V864a96 96 0 0 1-96 96H160a96 96 0 0 1-96-96V176a96 96 0 0 1 96-96zM482.176 262.272h59.616v94.4h196v239.072h-196v184.416h-59.616v-184.416H286.72v-239.04h195.456V262.24z m-137.504 277.152h137.504v-126.4H344.64v126.4z m197.12 0h138.048v-126.4H541.76v126.4z" />
      </svg>
    )
    const serviceSvg = (
      <svg t="1741835955770" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15593" width="22" height="22">
        <path d="M916.507 356.287C864.846 185.304 706.096 60.801 518.257 60.801c-186.801 0-344.841 123.132-397.389 292.66-56.372 11.351-98.906 62.383-98.906 123.631 0 61.327 42.645 112.412 99.125 123.674 0.072 0.231 0.139 0.465 0.211 0.696h0.526c2.92 13.385 14.833 23.409 29.093 23.409 16.45 0 29.785-13.335 29.785-29.784a29.644 29.644 0 0 0-4.18-15.216c-9.837-32.643-15.154-67.245-15.154-103.095 0-197.104 159.785-356.89 356.889-356.89s356.891 159.785 356.891 356.89c0 161.485-107.262 297.905-254.42 341.942-12.588-20.766-35.402-34.643-61.458-34.643h-90.349c-39.665 0-71.82 32.155-71.82 71.819 0 39.665 32.155 71.82 71.82 71.82h90.349c31.864 0 58.866-20.76 68.26-49.487 137.905-37.449 247.34-144.043 288.762-280.266 50.824-15.378 87.927-63.668 87.927-120.87-0.001-57.121-36.999-105.356-87.712-120.804z" p-id="15594" fill="#ffffff"></path>
        <path d="M724.255 579.373c0-17.332-14.051-31.385-31.385-31.385-13.486 0-24.983 8.509-29.424 20.448h-0.041c-26.547 56.372-83.862 95.397-150.302 95.397-66.438 0-123.753-39.025-150.3-95.397h-0.07c-4.44-11.939-15.937-20.448-29.423-20.448-17.334 0-31.386 14.053-31.386 31.385a31.258 31.258 0 0 0 7.266 20.08c37.359 74.791 114.625 126.165 203.914 126.165 89.318 0 166.605-51.409 203.95-126.241a31.254 31.254 0 0 0 7.201-20.004z" fill="#ffffff" p-id="15595"></path>
      </svg>
    )
    const docsUrl = (rainbondInfo?.document?.enable && `${rainbondInfo?.document?.value?.platform_url}docs/tutorial/via-rainbond-deploy-sourceandmiddleware`) || (language ? 'https://www.rainbond.com/docs/' : 'https://www.rainbond.com/en/docs/')
    const MenuItems = (key, component, text) => {
      return (
        <Menu.Item key={key}>
          <Icon
            component={component}
            style={{
              marginRight: 8
            }}
          />
          {text == 1 && <FormattedMessage id="GlobalHeader.core" />}
          {text == 2 && '账户中心'}
          {text == 3 && <FormattedMessage id="GlobalHeader.language" />}
          {text == 4 && <FormattedMessage id="GlobalHeader.exit" />}
        </Menu.Item>
      );
    };
    const menu = (
      <div className={styles.uesrInfo}>
        <Menu onClick={this.handleMenuClick}>
          {MenuItems('userCenter', handleUserSvg, 1)}
          {showBill && MenuItems('bill', handleBillSvg, 2)}
          {MenuItems('zh_en', language ? cn_language : en_language, 3)}
          {!rainbondUtil.logoutEnable(rainbondInfo) &&
            MenuItems('logout', handleLogoutSvg, 4)}
        </Menu>
      </div>
    );
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const platformUrl = rainbondUtil.documentPlatform_url(rainbondInfo);
    return (
      <ScrollerX sm={900}>
      <Header className={styles.header}>
        <div>
          {customHeaderImg && customHeaderImg()}
          {customHeader && customHeader()}
        </div>
        <div className={styles.right}>
          {showBill && (
            <a 
              className={styles.platform} 
              style={{ color: '#fff', fontSize: '16px', fontWeight: 'bolder', marginRight: '14px' }} 
              href='https://hub.grapps.cn/marketplace' 
              target='_blank'
            >
              应用市场
            </a>
          )}
          {/* 平台管理 */}
          {currentUser.is_enterprise_admin && (
            <Link className={styles.platform} style={{ color: '#fff', fontSize: '16px', fontWeight: 'bolder', marginRight: '14px' }} to={`/enterprise/${eid}/index`}>
              <FormattedMessage id="GlobalHeader.platform" />
            </Link>
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
                style={{ color: '#fff' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FormattedMessage id="GlobalHeader.new" />
              </a>
            </Popconfirm>
          )}
          {showBill &&  (
            <div
              onClick={() => {this.handleBalanceBill()}}
              className={styles.balance}
              style={{ color: balanceStatus !== 'NORMAL' ? '#f50' : '#fff' }}
            >
              {balance != null &&
                <div>
                  余额 ｜ ¥{balance.toFixed(2)}
                </div>
              }
            </div>
          )}
          {platformUrl && (
            <a
              className={styles.action}
              style={{ verticalAlign: '-7px', color: '#fff' }}
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {handleHandBookSvg}
            </a>
          )}
          {showBill && (
            <Popover 
              content={
                <div>
                  <img style={{ width: '120px', height: '120px' }} src={wechat} alt='客服' />
                </div>
              }
            >
               <a
                className={styles.action}
                style={{ verticalAlign: '-7px', color: '#fff' }}
                rel="noopener noreferrer"
              >
                {serviceSvg}
              </a>
            </Popover>
          )}
          {currentUser ? (
            <Dropdown overlay={menu}>
              <span className={`${styles.action} ${styles.account}`}>
                <Avatar size='default' className={styles.avatar} src={currentUser?.logo || userIcon} />
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
        {/* 版本更新弹窗 */}
        {isVersionUpdate && (
          <Modal
            title={formatMessage({ id: 'enterpriseOverview.overview.UpdateVersion.title' })}
            visible
            onOk={this.handleRouteupdate}
            onCancel={() => {
              this.setState({
                isVersionUpdate: false
              })
            }}
          >
            <p>{formatMessage({ id: 'enterpriseOverview.overview.UpdateVersion.tip' })}</p>
          </Modal>
        )}
      </Header>
      </ScrollerX>
    );
  }
}

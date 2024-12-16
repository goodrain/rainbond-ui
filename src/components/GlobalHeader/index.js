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
} from 'antd';
import { connect } from 'dva';
import { setLocale, getLocale, } from 'umi/locale'
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import Debounce from 'lodash-decorators/debounce';
import React, { PureComponent } from 'react';
import userIcon from '../../../public/images/user-icon-small.png';
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
    };
  }
  componentDidMount() {
    const { is_enterprise } = this.props
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
  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;
    const { language } = this.state
    if (key === 'userCenter') {
      dispatch(routerRedux.push(`/account/center`));
    }
    if (key === 'cpw') {
      this.showChangePass();
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
    const {dispatch, rainbondInfo} = this.props
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
    }).catch(e => {console.log(e)})
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

  render() {
    const { currentUser, customHeader, rainbondInfo, collapsed, eid, is_space=false, is_enterprise=false, customHeaderImg } = this.props;
    const { language, treeData, isVersionUpdate } = this.state
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
      <svg t="1666244296772" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9654" width="22" height="22">
        <path d="M661.807934 565.30402l-1.069355-14.042831c-3.260254-29.15297 6.485715-61.007469 33.55114-93.41353 24.348548-28.610618 37.880749-49.666166 37.880749-73.966619 0-27.535123-17.318434-45.898353-51.41295-46.439682-19.47454 0-41.141002 6.479575-54.655807 16.736173l-12.988826-34.014698c17.844413-12.95915 48.696072-21.597901 77.391624-21.597901 62.228273 0 90.38045 38.334073 90.38045 79.378885 0 36.70804-20.561291 63.167668-46.539966 93.946672-23.822568 28.077475-32.481785 51.835575-30.851659 79.370699l0.543376 14.042831L661.807934 565.30402zM649.90586 640.897695c0-19.980054 13.532201-34.014698 32.481785-34.014698 18.931165 0 31.921014 14.034645 31.921014 34.014698 0 18.896372-12.44545 33.472346-32.464389 33.472346C662.894685 674.370041 649.90586 659.793044 649.90586 640.897695z" p-id="9655" fill="#ffffff"></path>
        <path d="M394.163221 350.265432c-1.77032 0-3.576455-0.261966-5.354961-0.813528-0.552585-0.174985-55.462173-17.10354-102.353133-17.10354-46.899146 0-101.809757 16.928554-102.362342 17.10354-9.482979 2.937912-19.535939-2.316765-22.481014-11.751648-2.962471-9.434883 2.305509-19.481703 11.761881-22.437012 2.453888-0.760317 60.607356-18.729573 113.081475-18.729573 52.464909 0 110.618377 17.969257 113.072265 18.729573 9.457396 2.955308 14.724353 13.002129 11.761881 22.437012C408.896784 345.359702 401.806295 350.265432 394.163221 350.265432z" p-id="9656" fill="#ffffff"></path>
        <path d="M394.163221 511.437182c-1.77032 0-3.576455-0.261966-5.354961-0.813528-0.552585-0.174985-55.462173-17.10354-102.353133-17.10354-46.899146 0-101.809757 16.928554-102.362342 17.10354-9.482979 2.90312-19.535939-2.325975-22.481014-11.751648-2.962471-9.434883 2.305509-19.481703 11.761881-22.437012 2.453888-0.760317 60.607356-18.729573 113.081475-18.729573 52.464909 0 110.618377 17.969257 113.072265 18.729573 9.457396 2.955308 14.724353 13.002129 11.761881 22.437012C408.896784 506.531452 401.806295 511.437182 394.163221 511.437182z" p-id="9657" fill="#ffffff"></path>
        <path d="M394.163221 672.608931c-1.77032 0-3.576455-0.261966-5.354961-0.813528-0.552585-0.174985-55.462173-17.10354-102.353133-17.10354-46.899146 0-101.809757 16.928554-102.362342 17.10354-9.482979 2.911306-19.535939-2.316765-22.481014-11.751648-2.962471-9.434883 2.305509-19.481703 11.761881-22.437012 2.453888-0.760317 60.607356-18.729573 113.081475-18.729573 52.464909 0 110.618377 17.969257 113.072265 18.729573 9.457396 2.955308 14.724353 13.002129 11.761881 22.437012C408.896784 667.703201 401.806295 672.608931 394.163221 672.608931z" p-id="9658" fill="#ffffff"></path>
        <path d="M496.454956 859.112626c-18.808368 0-37.652552-3.690042-55.997362-11.070126-51.185776-20.583804-100.066043-30.595832-149.419078-30.595832-109.952204 0-190.56008 33.393551-191.366446 33.726126-8.300037 3.488451-17.485233 2.614547-25.00551-2.360767-7.520277-4.975315-11.700483-13.378705-11.700483-22.384823L62.966077 190.694133c0-10.729365 6.055926-20.435425 15.943111-24.676006 3.611248-1.547239 89.832981-38.028105 212.879412-38.028105 74.419943 0 131.120316 19.437701 167.370939 34.0587 23.112394 9.321296 49.468668 9.636474 72.335469 0.865717 33.927717-13.037944 102.594633-34.924417 181.388187-34.924417 122.152061 0 224.49803 35.868929 228.802056 37.389562 10.736529 3.812839 17.697057 13.94664 17.697057 25.314549l0 635.733069c0 8.700149-4.034896 16.84976-11.134595 21.895683-7.134491 5.036713-16.168238 6.321986-24.362874 3.462868-0.99056-0.340761-100.086509-34.338063-210.494085-34.338063-73.359798 0-139.262764 22.219047-164.197666 31.767518C531.953448 855.816556 514.229784 859.112626 496.454956 859.112626zM291.062052 763.723092c55.602366 0 112.64043 11.603269 169.548534 34.495652 22.832008 9.181103 46.77942 9.478885 69.313645 0.839111 27.739784-10.623965 101.270475-35.334763 183.640484-35.334763 79.065753 0 151.674445 15.581883 192.606693 26.634614L906.171408 210.393801c-33.769105-9.723455-109.109-28.681226-193.187931-28.681226-70.082148 0-131.669832 19.630083-162.109098 31.338752-35.479049 13.605879-76.299757 13.168927-111.963001-1.198292-32.069393-12.941753-82.22163-30.141484-147.254785-30.141484-82.335217 0-145.80169 17.986653-175.47757 27.65792l0 579.491137C151.993716 777.835508 215.897142 763.723092 291.062052 763.723092z" p-id="9659" fill="#ffffff"></path>
        <path d="M511.174192 746.339166c-9.912767 0-18.419512-8.018627-18.419512-17.907858L492.75468 298.639634c0-9.889231 8.506744-17.907858 18.419512-17.907858s18.419512 8.018627 18.419512 17.907858l0 429.791673C529.593703 738.321562 521.086959 746.339166 511.174192 746.339166z" p-id="9660" fill="#ffffff"></path>
      </svg>
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
    const docsUrl = (rainbondInfo?.document?.enable && rainbondInfo?.document?.value?.platform_url) || (language ? 'https://www.rainbond.com/docs/' : 'https://www.rainbond.com/en/docs/')
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
          {text == 3 && <FormattedMessage id="GlobalHeader.language" />}
          {text == 4 && <FormattedMessage id="GlobalHeader.exit" />}
        </Menu.Item>
      );
    };
    const menu = (
      <div className={styles.uesrInfo}>
        <Menu onClick={this.handleMenuClick}>
          {MenuItems('userCenter', handleUserSvg, 1)}
          {MenuItems('zh_en', language ? cn_language : en_language, 3)}
          {!rainbondUtil.logoutEnable(rainbondInfo) &&
            MenuItems('logout', handleLogoutSvg, 4)}
        </Menu>
      </div>
    );
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const platformUrl = rainbondUtil.documentPlatform_url(rainbondInfo);
    return (
      <Header className={styles.header}>
        <div>
          {customHeaderImg && customHeaderImg()}
          {customHeader && customHeader()}
        </div>
        <div className={styles.right}>
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
    );
  }
}

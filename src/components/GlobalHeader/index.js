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
      language: cookie.get('language') === 'zh-CN' ?  true : false ,
    };
  }
  componentDidMount(){
    let lan = navigator.systemLanguage || navigator.language;
    const Language = cookie.get('language')
    if(Language == null) {
    if(lan.toLowerCase().indexOf('zh')!==-1){
      const language = 'zh-CN'
      cookie.set('language', language)
      const lang = cookie.get('language')
      setLocale('zh-CN')
      this.setState({
        language:true,
      })
    }else if(lan.toLowerCase().indexOf('en')!==-1){
      const language = 'en-US'
      cookie.set('language', language)
      const lang = cookie.get('language')
      setLocale('en-US')
      this.setState({
        language:false,
      })
    }else{
      const language = 'zh-CN'
      cookie.set('language', language)
      const lang = cookie.get('language')
      setLocale('zh-CN')
      this.setState({
        language:true,
      })
    }
    }
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
  
  handleMenuCN = (val) => {
    const {language} = this.state
    cookie.set('language', val)
    if(val === 'zh-CN'){
      setLocale('zh-CN')
    }else if(val === 'en-US'){
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
        notification.success({ message: formatMessage({id:'GlobalHeader.success'}) });
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
    const en_language = (
      <svg class="icon" width="25px" height="25px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffffff" d="M229.248 704V337.504h271.744v61.984h-197.76v81.28h184v61.76h-184v99.712h204.768V704h-278.72z m550.496 0h-70.24v-135.488c0-28.672-1.504-47.232-4.48-55.648a39.04 39.04 0 0 0-14.656-19.616 41.792 41.792 0 0 0-24.384-7.008c-12.16 0-23.04 3.328-32.736 10.016-9.664 6.656-16.32 15.488-19.872 26.496-3.584 11.008-5.376 31.36-5.376 60.992V704h-70.24v-265.504h65.248v39.008c23.168-30.016 52.32-44.992 87.488-44.992 15.52 0 29.664 2.784 42.496 8.352 12.832 5.6 22.56 12.704 29.12 21.376 6.592 8.672 11.2 18.496 13.76 29.504 2.56 11.008 3.872 26.752 3.872 47.264V704zM160 144a32 32 0 0 0-32 32V864a32 32 0 0 0 32 32h688a32 32 0 0 0 32-32V176a32 32 0 0 0-32-32H160z m0-64h688a96 96 0 0 1 96 96V864a96 96 0 0 1-96 96H160a96 96 0 0 1-96-96V176a96 96 0 0 1 96-96z" />
      </svg>
  )
    const cn_language = (
      <svg class="icon" width="25px" height="25px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffffff" d="M160 144a32 32 0 0 0-32 32V864a32 32 0 0 0 32 32h688a32 32 0 0 0 32-32V176a32 32 0 0 0-32-32H160z m0-64h688a96 96 0 0 1 96 96V864a96 96 0 0 1-96 96H160a96 96 0 0 1-96-96V176a96 96 0 0 1 96-96zM482.176 262.272h59.616v94.4h196v239.072h-196v184.416h-59.616v-184.416H286.72v-239.04h195.456V262.24z m-137.504 277.152h137.504v-126.4H344.64v126.4z m197.12 0h138.048v-126.4H541.76v126.4z" />
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
          {text == 1 && <FormattedMessage id="GlobalHeader.core"/>}
          {text == 2 && <FormattedMessage id="GlobalHeader.edit"/>}
          {text == 3 && <FormattedMessage id="GlobalHeader.exit"/>}
        </Menu.Item>
      );
    };
    const menu = (
      <div className={styles.uesrInfo}>
        <Menu selectedKeys={[]} onClick={this.handleMenuClick}>
          {MenuItems('userCenter', handleUserSvg, 1 )}
          {MenuItems('cpw', handleEditSvg, 2 )}
          {!rainbondUtil.logoutEnable(rainbondInfo) &&
            MenuItems('logout', handleLogoutSvg, 3)}
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
          <a 
          className={styles.action}
          style={{ color: '#fff' }}
          href={ language ?  "https://www.rainbond.com/enterprise_server/" :'https://www.rainbond.com/en/enterprise_server/'}
          target="_blank"
          >
              
              <FormattedMessage id="GlobalHeader.serve"/>
            </a>
          {isNewbieGuide && (
            <Popconfirm
              title={formatMessage({id:'GlobalHeader.close'})}
              onConfirm={this.handlIsOpenNewbieGuide}
              okText={formatMessage({id:'button.close'})}
              cancelText={formatMessage({id:'button.cancel'})}
            >
              <a
                className={styles.action}
                style={{ color: '#fff' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FormattedMessage id="GlobalHeader.new"/>
              </a>
            </Popconfirm>
          )}
          {platformUrl && (
            <a
              className={styles.action}
              style={{ color: '#fff' }}
              href={language ? 'https://www.rainbond.com/docs/' : 'https://www.rainbond.com/en/docs/'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FormattedMessage id="GlobalHeader.manual"/>
            </a>
          )}
            <span
            style={{  
            verticalAlign: '-9px',
            cursor: 'pointer',
              }}
            onClick = {language ? () => this.handleMenuCN("en-US") :  () => this.handleMenuCN("zh-CN")}
            >
              {language ? en_language : cn_language}
            </span>
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

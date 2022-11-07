import { Icon, Menu } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import userUtil from '../../utils/user';
import CollectionView from '../SiderMenu/CollectionView';
import styles from './index.less';

const { SubMenu } = Menu;

// Allow menu.js config icon as string or ReactNode   icon: 'setting',   icon:
// 'http://demo.com/icon.png',   icon: <Icon type="setting" />,
const getIcon = icon => {
  if (typeof icon === 'string' && icon.indexOf('http') === 0) {
    return <img src={icon} alt="icon" className={styles.icon} />;
  }
  if (typeof icon === 'string') {
    return <Icon type={icon} />;
  }
  return icon;
};

@connect(({ loading, region }) => ({
  viewLoading: loading.effects['user/addCollectionView'],
  navigation_status: region.navigation_status
}))
export default class GlobalRouter extends PureComponent {
  constructor(props) {
    super(props);
    this.menus = props.menuData;
    this.state = {
      collectionVisible: false,
      openKeys: this.getDefaultCollapsedSubMenus(props)
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        openKeys: this.getDefaultCollapsedSubMenus(nextProps)
      });
    }
  }

  /**
   * Convert pathname to openKeys
   * /list/search/articles = > ['list','/list/search']
   * @param  props
   */
  getDefaultCollapsedSubMenus(props) {
    const {
      location: { pathname }
    } = props || this.props;
    // eg. /list/search/articles = > ['','list','search','articles']
    let snippets = pathname.split('/');
    // Delete the end eg.  delete 'articles' snippets.pop(); Delete the head eg.
    // delete ''
    snippets.shift();
    // eg. After the operation is completed, the array should be ['list','search']
    // eg. Forward the array as ['list','list/search']
    snippets = snippets.map((item, index) => {
      // If the array length > 1
      if (index > 0) {
        // eg. search => ['list','search'].join('/')
        return snippets.slice(0, index + 1).join('/');
      }
      // index 0 to not do anything
      return item;
    });
    let withapp = false;
    snippets = snippets.map(item => {
      const itemArr = item.split('/');
      if (itemArr[itemArr.length - 1] === 'index') {
        withapp = true;
      }
      if (itemArr[itemArr.length - 1] === 'app') {
        withapp = true;
        return `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups`;
      }
      if (itemArr[itemArr.length - 2] === 'app') {
        withapp = true;
        return this.getOpenGroup(itemArr[itemArr.length - 1]);
      }
      return this.getSelectedMenuKeys(`/${item}`)[0];
    });
    // eg. ['list','list/search']
    if (withapp) {
      snippets.push(
        `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups`
      );
    }
    return snippets;
  }
  getOpenGroup(appAlias) {
    const data = this.props.menuData;
    const groups = data.filter(item => item.path.indexOf('groups') > -1)[0];

    if (groups) {
      const childs = groups.children || [];
      const currGroup = childs.filter(child => {
        const res = (child.children || []).filter(
          item => item.path.indexOf(appAlias) > -1
        )[0];
        return res;
      })[0];

      if (currGroup) {
        return currGroup.path;
      }
    }
  }
  /**
   * Recursively flatten the data
   * [{path:string},{path:string}] => {path,path2}
   * @param  menus
   */
  getFlatMenuKeys(menus) {
    let keys = [];
    menus.forEach(item => {
      if (item.children) {
        keys.push(item.path);
        keys = keys.concat(this.getFlatMenuKeys(item.children));
      } else {
        keys.push(item.path);
      }
    });
    return keys;
  }
  /**
   * Get selected child nodes
   * /user/chen => /user/:id
   */
  getSelectedMenuKeys = path => {
    const flatMenuKeys = this.getFlatMenuKeys(this.props.menuData);
    return flatMenuKeys.filter(item => {
      if (item == path) {
        return true;
      }
      return `/${item}` == path;
    });
  };
  /**
   * 判断是否是http链接.返回 Link 或 a
   * Judge whether it is http link.return a or Link
   * @memberof SiderMenu
   */
  getMenuItemPath = (item ,bool = false) => {
    const { navigation_status } = this.props;
    const itemPath = this.conversionPath(item.path);
    const icon = getIcon(item.icon);
    const { target, name } = item;
    // Is it a http link
    if (/^https?:\/\//.test(itemPath)) {
      return (
        <a href={itemPath} target={target}>
          <span>{icon}</span>
          <span>{name}</span>
        </a>
      );
    }
    return (
      <Link
        style=
        {navigation_status ? 
          {} 
          : 
          bool ? 
          {            
          display:'flex', 
          alignItems:'start', 
          justifyContent:'start',
        }
          :
          {
            display:'flex', 
            alignItems:'center', 
            justifyContent:'flex-start',
            width:"100%"
          }
        }
        to={itemPath}
        target={target}
        replace={itemPath === this.props.location.pathname}
        onClick={
          this.props.isMobile
            ? () => {
                this.props.onCollapse(true);
              }
            : undefined
        }
      >
        {icon}
        <span style={navigation_status? {padding:'0 5px', textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap',fontSize:12} : {paddingLeft:12}}>{name}</span>
      </Link>
    );
  };
  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = (item, bool) => {
    const {  navigation_status } = this.props
    if (item.children && item.children.some(child => child.name)) {
      return (
        <SubMenu
          className={styles.items}
          title={
            <span
            className={styles.item}
            style=
            {navigation_status ? 
              {} : 
              {
                display:'flex', 
                alignItems:'center', 
                justifyContent:'flex-start',
                width:"100%"
              }
            }
            >
              {item.icon && getIcon(item.icon)}
              <span style={navigation_status ? {fontSize:12} :{marginLeft:16}}>{item.name}</span>
            </span>
          }
          key={item.path}
        >
          {this.getNavMenuItems(item.children,true)}
        </SubMenu>
      );
    }
    return <Menu.Item key={item.path} style={!bool && {display: 'flex',alignItems: 'center',justifyContent: "center",height:60}}>{this.getMenuItemPath(item, bool)}</Menu.Item>;
  };
  /**
   * 获得菜单子节点
   * @memberof SiderMenu
   */
  getNavMenuItems = (menusData, bool) => {
    if (!menusData) {
      return [];
    }

    return menusData
      .filter(item => item.name && !item.hideInMenu)
      .map(item => {
        const ItemDom = this.getSubMenuOrItem(item, bool);
        return this.checkPermissionItem(item.authority, ItemDom);
      })
      .filter(item => !!item);
  };
  // conversion Path 转化路径
  conversionPath = path => {
    if (path && path.indexOf('http') === 0) {
      return path;
    }
    return `/${path || ''}`.replace(/\/+/g, '/');
  };
  // permission to check
  checkPermissionItem = (authority, ItemDom) => {
    const user = this.props.currentUser;
    const team_name = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(user, team_name);
    if (ItemDom.key.indexOf('source') > -1) {
      if (user.is_sys_admin || user.is_user_enter_amdin) {
        return ItemDom;
      }
      return null;
    } else if (ItemDom.key.indexOf('finance') > -1) {
      const region_name = globalUtil.getCurrRegionName();
      const region = userUtil.hasTeamAndRegion(user, team_name, region_name);
      if (region) {
        // 当前是公有集群
        if (region.region_scope === 'public') {
          return ItemDom;
        }
      }
      //  return null;
      return ItemDom;
    }
    return ItemDom;
  };
  handleOpenChange = openKeys => {
    // const lastOpenKey = openKeys[openKeys.length - 1]; const isMainMenu =
    // this.props.menuData.some(   item => lastOpenKey && (item.key === lastOpenKey
    // || item.path === lastOpenKey) );
    this.setState({
      openKeys: [...openKeys]
    });
  };
  handleOpenCollectionVisible = () => {
    const { dispatch, navigation_status } = this.props;
    if( navigation_status ){
      dispatch({
        type:'region/shortNavigation',
        payload: true,
      })
    }else{
      dispatch({
        type:'region/logNavigation',
        payload: true,
      })
    }
  };
  handleCloseCollectionVisible = () => {
    this.setState({
      collectionVisible: false
    });
  };
  handleCollectionView = values => {
    const { dispatch, location, currentEnterprise } = this.props;
    dispatch({
      type: 'user/addCollectionView',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        name: values.name,
        url: location.pathname
      },
      callback: res => {
        if (res) {
          this.fetchCollectionViewInfo();
        }
      }
    });
  };

  fetchCollectionViewInfo = () => {
    const { dispatch, currentEnterprise, onCollapse } = this.props;
    dispatch({
      type: 'user/fetchCollectionViewInfo',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id
      },
      callback: res => {
        if (res) {
          onCollapse(true);
          this.handleCloseCollectionVisible();
        }
      }
    });
  };
  render() {
    const { showMenu, viewLoading, pathname, menuData, navigation_status, tabBarStatus=false } = this.props;
    const { openKeys, collectionVisible } = this.state;
    // if pathname can't match, use the nearest parent's key
    let selectedKeys = this.getSelectedMenuKeys(pathname);
    if (!selectedKeys.length) {
      selectedKeys = [openKeys[openKeys.length - 1]];
    }
    return (
      <div
        style={{
          background: '#fff',
          width: navigation_status ? '68px' : '220px',
          display: showMenu ? 'block' : 'none',
          transition: ".5s ease"
        }}
      >
        {collectionVisible && (
          <CollectionView
            title={formatMessage({ id: 'sidecar.collection.add' })}
            visible={collectionVisible}
            loading={viewLoading}
            onOk={this.handleCollectionView}
            onCancel={this.handleCloseCollectionVisible}
          />
        )}
        <Menu
          className={styles.globalSider}
          key="Menu"
          theme="dark"
          mode="inline"
          onOpenChange={this.handleOpenChange}
          selectedKeys={selectedKeys}
          onSelect = {this.onSelect}
          inlineCollapsed="menu-fold"
          defaultOpenKeys={[
            `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups`
          ]}
          style={{
            width: '100%',
            height: 'calc(100vh - 60px)',
            position: 'relative',
            // paddingTop: tabBarStatus ? 18 : 46
          }}
        >
          {this.getNavMenuItems(menuData || [])}
          <Menu.Item
            key="collection"
            title={navigation_status ? '展开' : '收起'}
            onClick={this.handleOpenCollectionVisible}
            style={{
              width: '100%',
              position: 'absolute',
              bottom: '-9px',
              borderTop: "1px solid #dfdfdfa6"
            }}
          >
            <a 
            style={{
            display:'flex', 
            alignItems:'end', 
            justifyContent:'center',
            marginTop:'7px'
            }}
            >
              {navigation_status ? <Icon type="double-right" /> : <Icon type="double-left" />}
            </a>
          </Menu.Item>
        </Menu>
      </div>
    );
  }
}

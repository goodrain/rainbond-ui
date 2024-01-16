/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-console */
import { Icon, Menu,Button } from 'antd';
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
    return < img src={icon} alt="icon" className={styles.icon} />;
  }
  if (typeof icon === 'string') {
    return <Icon type={icon} />;
  }
  return icon;
};

@connect(({ loading }) => ({
  viewLoading: loading.effects['user/addCollectionView']
}))
export default class GlobalRouter extends PureComponent {
  constructor(props) {
    super(props);
    this.menus = props.menuData;
    this.state = {
      collectionVisible: false,
      openKeys: this.getDefaultCollapsedSubMenus(props),
      collapsed: window.localStorage.getItem('collapsed') === 'true' ? true : false,
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
  getMenuItemPath = (item, bool) => {
    const { enterprise } = this.props;
    const itemPath = this.conversionPath(item.path);
    const icon = getIcon(item.icon);
    const { target, name } = item;
    // Is it a http link
    if (/^https?:\/\//.test(itemPath)) {
      return (
        <a href={itemPath} target={target}>
          {icon}
          <span>{name}</span>
        </a>
      );
    }
    return (
      <Link
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
        <span>{name}</span>
      </Link>
    );
  };
  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = (item, bool) => {
    if (item.children && item.children.some(child => child.name)) {
      return (
        <SubMenu
          title={
            <a>
              {item.icon && getIcon(item.icon)}
              <span>{item.name}</span>
            </a>
          }
          key={item.path}
        >
          {this.getNavMenuItems(item.children, true)}
        </SubMenu>
      );
    }
    return <Menu.Item key={item.path} >{this.getMenuItemPath(item)}</Menu.Item>;
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
    this.setState({
      collectionVisible: true
    });
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
  toggleCollapsed = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    },()=>{
      window.localStorage.setItem('collapsed', this.state.collapsed);
    });
  };
  render() {
    const { showMenu, viewLoading, pathname, menuData } = this.props;
    const { openKeys, collectionVisible } = this.state;
    // if pathname can't match, use the nearest parent's key
    let selectedKeys = this.getSelectedMenuKeys(pathname);
    if (!selectedKeys.length) {
      selectedKeys = [openKeys[openKeys.length - 1]];
    }
    
    return (
      <div
        style={{
          display: showMenu ? 'block' : 'none',
          width: this.state.collapsed ? '56px' : '200px',
          transition: 'all 0.2s',
          position: 'relative',
        }}
        
      >
        <p onClick={this.toggleCollapsed} className={styles.menuStyle}>
        <Icon type={this.state.collapsed ? 'right' : 'left'} />
        </p>
        {/* {collectionVisible && (
          <CollectionView
            title={formatMessage({ id: 'sidecar.collection.add' })}
            visible={collectionVisible}
            loading={viewLoading}
            onOk={this.handleCollectionView}
            onCancel={this.handleCloseCollectionVisible}
          />
        )} */}
        <Menu
          className={styles.globalSider}
          key="Menu"
          mode="inline"
          placement="left"
          onOpenChange={this.handleOpenChange}
          selectedKeys={selectedKeys}
          inlineCollapsed="menu-fold"
          defaultOpenKeys={[
            `team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups`
          ]}
          inlineCollapsed={this.state.collapsed}
          style={{ width: this.state.collapsed ? '56px' : '200px'}}
        >
          {this.getNavMenuItems(menuData || [])}
        </Menu>
      </div>
    );
  }
}

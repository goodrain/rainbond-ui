/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-console */
import { Icon, Tooltip, Popover } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import userUtil from '../../utils/user';
import styles from './index.less';

/**
 * 获取菜单图标
 */
const getIcon = icon => {
  if (!icon) return null;

  // URL 图标
  if (typeof icon === 'string' && icon.indexOf('http') === 0) {
    return <img src={icon} alt="icon" className={styles.menuIcon} />;
  }
  // antd Icon 类型字符串
  if (typeof icon === 'string') {
    return <Icon type={icon} className={styles.menuIcon} />;
  }
  // React 组件（SVG 等）
  return <span className={styles.menuIcon}>{icon}</span>;
};

@connect(({ loading, global, user }) => ({
  viewLoading: loading.effects['user/addCollectionView'],
  collapsed: global.collapsed,
  currentUser: user.currentUser
}))
export default class GlobalRouter extends PureComponent {
  constructor(props) {
    super(props);
    // 初始化时计算一次 isTeamView，避免后续多次更新导致闪烁
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { currentUser, currentEnterprise } = props;
    const eid = currentEnterprise?.enterprise_id;
    this.state = {
      expandedKeys: [], // 展开的子菜单 keys
      isTeamView: !!(teamName && regionName), // 缓存视图状态
      // 缓存管理员状态，避免数据加载导致的闪烁
      isAdmin: !!(currentUser?.is_enterprise_admin && eid),
    };
  }

  componentDidMount() {
    // 初始化展开状态
    this.initExpandedKeys();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location?.pathname !== this.props.location?.pathname) {
      this.initExpandedKeys();
    }

    // 首次加载时 currentUser/currentEnterprise 可能为空，需要在数据加载后更新一次 isAdmin
    const { currentUser, currentEnterprise } = this.props;
    const { isAdmin } = this.state;
    const eid = currentEnterprise?.enterprise_id;
    const newIsAdmin = !!(currentUser?.is_enterprise_admin && eid);

    // 只在从 false 变为 true 时更新一次，避免后续闪烁
    if (!isAdmin && newIsAdmin) {
      this.setState({ isAdmin: newIsAdmin });
    }
  }

  /**
   * 初始化展开的菜单
   */
  initExpandedKeys = () => {
    const { pathname } = this.props;
    const allItems = this.getAllMenuItems();
    const expandedKeys = [];

    allItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child =>
          this.isMenuItemActive(child.path, pathname)
        );
        if (hasActiveChild) {
          expandedKeys.push(item.path);
        }
      }
    });

    this.setState({ expandedKeys });
  };

  /**
   * 切换到工作空间
   */
  handleSwitchToWorkspace = () => {
    const { dispatch, currentUser } = this.props;
    const teamName = globalUtil.getCurrTeamName() || currentUser?.teams?.[0]?.team_name;
    const regionName = globalUtil.getCurrRegionName() || currentUser?.teams?.[0]?.region?.[0]?.team_region_name;

    if (teamName && regionName) {
      dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/index`));
    }
  };

  /**
   * 切换到平台管理
   */
  handleSwitchToPlatform = () => {
    const { dispatch, currentEnterprise } = this.props;
    const eid = currentEnterprise?.enterprise_id || globalUtil.getCurrEnterpriseId();

    if (eid) {
      dispatch(routerRedux.push(`/enterprise/${eid}/index`));
    }
  };

  /**
   * 获取所有菜单项（展平分组）
   */
  getAllMenuItems = () => {
    const { menuData } = this.props;
    if (!menuData || !Array.isArray(menuData)) return [];
    return menuData.reduce((acc, group) => {
      if (group.items) {
        return [...acc, ...group.items];
      }
      return acc;
    }, []);
  };

  /**
   * 转换路径
   */
  conversionPath = path => {
    if (path && path.indexOf('http') === 0) {
      return path;
    }
    return `/${path || ''}`.replace(/\/+/g, '/');
  };

  /**
   * 判断菜单项是否激活
   */
  isMenuItemActive = (itemPath, currentPath) => {
    const path = this.conversionPath(itemPath);
    return path === currentPath || path === `${currentPath}/`;
  };

  /**
   * 切换子菜单展开状态
   */
  toggleSubMenu = (key) => {
    this.setState(prevState => {
      const { expandedKeys } = prevState;
      if (expandedKeys.includes(key)) {
        return { expandedKeys: expandedKeys.filter(k => k !== key) };
      }
      return { expandedKeys: [...expandedKeys, key] };
    });
  };

  /**
   * 切换折叠状态
   */
  toggleCollapsed = () => {
    const { onCollapse, collapsed } = this.props;
    const newCollapsed = !collapsed;
    onCollapse && onCollapse(newCollapsed);
    window.localStorage.setItem('collapsed', newCollapsed);
  };

  /**
   * 权限检查
   */
  checkPermission = (item) => {
    const { currentUser } = this.props;
    const team_name = globalUtil.getCurrTeamName();

    if (item.path?.indexOf('source') > -1) {
      return currentUser?.is_sys_admin || currentUser?.is_user_enter_amdin;
    }
    if (item.path?.indexOf('finance') > -1) {
      const region_name = globalUtil.getCurrRegionName();
      const region = userUtil.hasTeamAndRegion(currentUser, team_name, region_name);
      if (region && region.region_scope !== 'public') {
        return true;
      }
    }
    return true;
  };

  /**
   * 渲染视图切换器
   */
  renderViewSwitcher = () => {
    const { collapsed } = this.props;
    const { isTeamView: isTeam, isAdmin } = this.state; // 使用缓存的状态，避免多次更新

    if (!isAdmin) {
      return null;
    }

    // 折叠状态下显示垂直切换器
    if (collapsed) {
      return (
        <div className={styles.viewSwitcherCollapsed}>
          <Tooltip
            title={formatMessage({ id: 'menu.switcher.platform', defaultMessage: '平台管理' })}
            placement="right"
          >
            <div
              className={`${styles.switcherItemCollapsed} ${!isTeam ? styles.active : ''}`}
              onClick={this.handleSwitchToPlatform}
            >
              <Icon type="setting" />
            </div>
          </Tooltip>
          <Tooltip
            title={formatMessage({ id: 'menu.switcher.workspace', defaultMessage: '工作空间' })}
            placement="right"
          >
            <div
              className={`${styles.switcherItemCollapsed} ${isTeam ? styles.active : ''}`}
              onClick={this.handleSwitchToWorkspace}
            >
              <Icon type="appstore" />
            </div>
          </Tooltip>
        </div>
      );
    }

    return (
      <div className={styles.viewSwitcher}>
        <div className={styles.switcherInner}>
          <div
            className={`${styles.switcherItem} ${!isTeam ? styles.active : ''}`}
            onClick={this.handleSwitchToPlatform}
          >
            <Icon type="setting" className={styles.switcherIcon} />
            <span className={styles.switcherText}>
              {formatMessage({ id: 'menu.switcher.platform', defaultMessage: '平台管理' })}
            </span>
          </div>
          <div
            className={`${styles.switcherItem} ${isTeam ? styles.active : ''}`}
            onClick={this.handleSwitchToWorkspace}
          >
            <Icon type="appstore" className={styles.switcherIcon} />
            <span className={styles.switcherText}>
              {formatMessage({ id: 'menu.switcher.workspace', defaultMessage: '工作空间' })}
            </span>
          </div>
          <div
            className={styles.switcherSlider}
            style={{ transform: !isTeam ? 'translateX(0)' : 'translateX(100%)' }}
          />
        </div>
      </div>
    );
  };

  /**
   * 渲染单个菜单项
   */
  renderMenuItem = (item, isChild = false) => {
    const { pathname, isMobile, onCollapse, collapsed } = this.props;
    const itemPath = this.conversionPath(item.path);
    const isActive = this.isMenuItemActive(item.path, pathname);
    const isExternal = /^https?:\/\//.test(itemPath);

    const handleClick = isMobile ? () => onCollapse?.(true) : undefined;

    const content = (
      <>
        {getIcon(item.icon)}
        {!collapsed && <span className={styles.menuText}>{item.name}</span>}
      </>
    );

    const itemClass = `${styles.menuItem} ${isActive ? styles.active : ''} ${isChild ? styles.childItem : ''} ${collapsed ? styles.collapsed : ''}`;

    let menuItem;
    if (isExternal) {
      menuItem = (
        <a
          key={item.path}
          href={itemPath}
          target={item.target}
          className={itemClass}
          onClick={handleClick}
        >
          {content}
        </a>
      );
    } else {
      menuItem = (
        <Link
          key={item.path}
          to={itemPath}
          className={itemClass}
          onClick={handleClick}
        >
          {content}
        </Link>
      );
    }

    // 折叠状态使用 Tooltip 显示名称
    if (collapsed) {
      return (
        <Tooltip key={item.path} title={item.name} placement="right">
          {menuItem}
        </Tooltip>
      );
    }

    return menuItem;
  };

  /**
   * 渲染带子菜单的菜单项
   */
  renderSubMenu = (item) => {
    const { pathname, collapsed } = this.props;
    const { expandedKeys } = this.state;
    const isExpanded = expandedKeys.includes(item.path);

    const visibleChildren = item.children?.filter(
      child => child.name && !child.hideInMenu && this.checkPermission(child)
    ) || [];

    // 折叠状态使用 Popover 显示子菜单
    if (collapsed) {
      const popoverContent = (
        <div className={styles.popoverMenu}>
          {visibleChildren.map(child => {
            const childPath = this.conversionPath(child.path);
            const isActive = this.isMenuItemActive(child.path, pathname);
            return (
              <Link
                key={child.path}
                to={childPath}
                className={`${styles.popoverMenuItem} ${isActive ? styles.active : ''}`}
              >
                {getIcon(child.icon)}
                <span>{child.name}</span>
              </Link>
            );
          })}
        </div>
      );

      return (
        <Popover
          key={item.path}
          content={popoverContent}
          placement="right"
          overlayClassName={styles.subMenuPopover}
        >
          <div className={`${styles.subMenuTitle} ${styles.collapsed}`}>
            {getIcon(item.icon)}
          </div>
        </Popover>
      );
    }

    return (
      <div key={item.path} className={styles.subMenu}>
        <div
          className={`${styles.subMenuTitle} ${isExpanded ? styles.expanded : ''}`}
          onClick={() => this.toggleSubMenu(item.path)}
        >
          {getIcon(item.icon)}
          <span className={styles.menuText}>{item.name}</span>
          <Icon
            type="down"
            className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`}
          />
        </div>
        {isExpanded && (
          <div className={styles.subMenuContent}>
            {visibleChildren.map(child => this.renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染菜单分组
   */
  renderMenuGroups = () => {
    const { menuData, collapsed } = this.props;

    if (!menuData || !Array.isArray(menuData)) {
      return null;
    }

    return menuData.map(group => {
      const { groupKey, groupName, items } = group;
      const visibleItems = items?.filter(
        item => item.name && !item.hideInMenu && this.checkPermission(item)
      ) || [];

      if (visibleItems.length === 0) return null;

      return (
        <div key={groupKey} className={styles.menuGroup}>
          {!collapsed && groupName && (
            <div className={styles.groupTitle}>{groupName}</div>
          )}
          <div className={styles.groupItems}>
            {visibleItems.map(item => {
              if (item.children && item.children.some(child => child.name)) {
                return this.renderSubMenu(item);
              }
              return this.renderMenuItem(item);
            })}
          </div>
        </div>
      );
    });
  };

  /**
   * 渲染底部收起按钮
   */
  renderCollapseButton = () => {
    const { collapsed, isAppOverview } = this.props;

    if (isAppOverview) return null;

    const button = (
      <div className={`${styles.collapseButton} ${collapsed ? styles.collapsed : ''}`} onClick={this.toggleCollapsed}>
        <Icon
          type={collapsed ? 'menu-unfold' : 'menu-fold'}
          className={styles.collapseIcon}
        />
        {!collapsed && (
          <span className={styles.collapseText}>
            {formatMessage({ id: 'menu.collapse', defaultMessage: '收起菜单' })}
          </span>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <Tooltip
          title={formatMessage({ id: 'menu.expand', defaultMessage: '展开菜单' })}
          placement="right"
        >
          {button}
        </Tooltip>
      );
    }

    return button;
  };

  render() {
    const { showMenu, collapsed } = this.props;

    return (
      <div
        className={`${styles.menuWrapper} ${collapsed ? styles.collapsed : ''}`}
        style={{ display: showMenu ? 'flex' : 'none' }}
      >
        {/* 顶部：切换器 */}
        <div className={styles.menuHeader}>
          {this.renderViewSwitcher()}
        </div>

        {/* 中间：菜单列表 */}
        <div className={styles.menuContent}>
          <nav className={styles.menuNav}>
            {this.renderMenuGroups()}
          </nav>
        </div>

        {/* 底部：收起按钮 */}
        <div className={styles.menuFooter}>
          {this.renderCollapseButton()}
        </div>
      </div>
    );
  }
}

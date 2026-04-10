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

const UpgradeStatusIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M323.904 651.072a32 32 0 0 1 17.024 17.024L416 845.76l75.072-177.664a32 32 0 0 1 17.024-17.024L685.76 576 508.16 500.928a32 32 0 0 1-17.024-17.024L416 306.24 340.928 483.84a32 32 0 0 1-17.024 17.024L146.24 576l177.664 75.072zM51.52 605.44a32 32 0 0 1 0-59.008l235.52-99.456 99.456-235.52a32 32 0 0 1 59.008 0l99.456 235.52 235.52 99.456a32 32 0 0 1 0 59.008l-235.52 99.456-99.456 235.52a32 32 0 0 1-59.008 0l-99.456-235.52-235.52-99.456z m688.64-249.28L704 448l-36.224-91.776L576 320l91.776-36.224L704 192l36.224 91.776L832 320l-91.776 36.224z m151.04-169.088L864 256l-27.136-68.864L768 160l68.864-27.136L864 64l27.136 68.864L960 160l-68.864 27.136z m0 704L864 960l-27.136-68.864L768 864l68.864-27.136L864 768l27.136 68.864L960 864l-68.864 27.136z"
      fill="currentColor"
    />
  </svg>
);

@connect(({ loading, global, user }) => ({
  viewLoading: loading.effects['user/addCollectionView'],
  collapsed: global.collapsed,
  rainbondInfo: global.rainbondInfo,
  currentUser: user.currentUser
}))
export default class GlobalRouter extends PureComponent {
  constructor(props) {
    super(props);
    // 初始化时计算一次 isTeamView，避免后续多次更新导致闪烁
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    this.state = {
      expandedKeys: [], // 展开的子菜单 keys
      hasUpgradeVersion: false
    };
  }

  componentDidMount() {
    // 初始化展开状态
    this.initExpandedKeys();
    this.fetchPlatformUpdateStatus();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location?.pathname !== this.props.location?.pathname) {
      this.initExpandedKeys();
    }

    if (
      prevProps.currentUser?.is_enterprise_admin !== this.props.currentUser?.is_enterprise_admin ||
      prevProps.currentUser?.enterprise_id !== this.props.currentUser?.enterprise_id ||
      prevProps.currentEnterprise?.enterprise_id !== this.props.currentEnterprise?.enterprise_id ||
      prevProps.rainbondInfo?.version?.value !== this.props.rainbondInfo?.version?.value
    ) {
      this.fetchPlatformUpdateStatus();
    }
  }

  getEnterpriseId = () => {
    const { currentEnterprise, currentUser, pathname } = this.props;
    if (currentEnterprise?.enterprise_id) {
      return currentEnterprise.enterprise_id;
    }
    if (currentUser?.enterprise_id) {
      return currentUser.enterprise_id;
    }
    const match = pathname && pathname.match(/\/enterprise\/([^/]+)/);
    return match ? match[1] : '';
  };

  fetchPlatformUpdateStatus = () => {
    const { dispatch, currentUser, rainbondInfo } = this.props;
    const enterpriseId = this.getEnterpriseId();
    const currentVersion = rainbondInfo?.version?.value
      ? rainbondInfo.version.value.split('-')[0]
      : '';

    if (!currentUser?.is_enterprise_admin || !enterpriseId || !currentVersion) {
      if (this.state.hasUpgradeVersion) {
        this.setState({ hasUpgradeVersion: false });
      }
      return;
    }

    dispatch({
      type: 'global/fetchAllVersion',
      callback: res => {
        const list = Array.isArray(res && res.response_data) ? res.response_data : [];
        const latestVersion = list[0];
        const hasUpgradeVersion =
          !!latestVersion && latestVersion.split('-')[0] !== currentVersion;
        this.setState({ hasUpgradeVersion });
      },
      handleError: () => {
        this.setState({ hasUpgradeVersion: false });
      }
    });
  };

  handleUpgradeNavigation = () => {
    const { dispatch, isMobile, onCollapse } = this.props;
    const enterpriseId = this.getEnterpriseId();
    if (!enterpriseId) {
      return;
    }

    if (isMobile) {
      onCollapse?.(true);
    }

    dispatch(routerRedux.push(`/enterprise/${enterpriseId}/setting?type=updateVersion`));
  };

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

  renderUpgradeEntry = () => {
    const { collapsed, currentUser } = this.props;
    const { hasUpgradeVersion } = this.state;

    if (!currentUser?.is_enterprise_admin || !hasUpgradeVersion) {
      return null;
    }

    if (collapsed) {
      return (
        <Tooltip
          title={formatMessage({ id: 'platformUpgrade.index.clicktoupload' })}
          placement="right"
        >
          <div
            className={styles.upgradeShortcut}
            onClick={this.handleUpgradeNavigation}
          >
            <UpgradeStatusIcon className={styles.upgradeStatusIcon} />
          </div>
        </Tooltip>
      );
    }

    return (
      <div
        className={styles.upgradeCard}
        onClick={this.handleUpgradeNavigation}
      >
        <div className={styles.upgradeCardIcon}>
          <UpgradeStatusIcon className={styles.upgradeStatusIcon} />
        </div>
        <div className={styles.upgradeCardContent}>
          <div className={styles.upgradeCardTitle}>
            {formatMessage({ id: 'enterpriseOverview.overview.UpdateVersion.title' })}
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { showMenu, collapsed } = this.props;

    return (
      <div
        className={`${styles.menuWrapper} ${collapsed ? styles.collapsed : ''}`}
        style={{ display: showMenu ? 'flex' : 'none' }}
      >
        {/* 中间：菜单列表 */}
        <div className={styles.menuContent}>
          <nav className={styles.menuNav}>
            {this.renderMenuGroups()}
          </nav>
        </div>

        {/* 底部：升级提示和收起按钮 */}
        <div className={styles.menuFooter}>
          {this.renderUpgradeEntry()}
          {this.renderCollapseButton()}
        </div>
      </div>
    );
  }
}

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
      d="M462.937651 886.528c0.512 0.8192 1.1776 1.5872 1.8432 2.4064 3.9936 4.7616 25.088 16.4352 62.1056 19.7632 24.0128 2.0992 85.0944 2.6624 132.1984-37.6832 56.7808-48.6912 77.3632-111.104 62.9248-190.5664l-2.6624-14.592 10.5984-10.3424c187.5456-182.4768 157.3888-413.2864 138.1376-497.9712-26.8288-6.656-88.9344-18.9952-166.144-13.824-129.3824 8.4992-240.896 59.6992-331.1104 152.3712L360.486451 306.688l-14.592-2.6624c-79.5136-14.4896-141.8752 6.0928-190.5664 62.9248-40.4992 47.104-39.8336 108.1856-37.6832 132.1984 3.328 37.1712 15.0016 58.2656 19.7632 62.1056 0.9216 0.8192 1.7408 1.3312 2.4064 1.8432l0.6656-1.7408 111.104-71.936-12.0832 63.8464c-6.912 36.608-12.8512 82.176-11.6736 98.2016l147.8656 147.8656c14.1824 1.7408 57.088-3.84 96.3584-12.5952l66.3552-14.7456-73.5232 113.6128-1.8432 0.9216z"
      fill="#009162"
    />
    <path
      d="M545.625651 965.2736c-7.8336 0-15.6672-0.4096-23.6032-1.0752-45.6704-3.9936-83.2-18.9952-100.352-39.936-18.432-22.5792-18.688-41.5232-15.6672-53.504 1.8432-7.168 5.0688-13.0048 8.7552-17.664-41.6768 4.9152-62.5152 1.8432-75.008-10.752l-156.0576-155.9552c-10.496-10.496-15.0016-25.6-9.1648-76.288-4.9152 4.2496-11.1616 7.9872-19.0976 9.9328-11.9296 3.072-30.7712 2.7648-53.504-15.6672-20.992-17.1008-35.9424-54.6816-39.936-100.352-5.8368-65.6896 12.7488-128.8704 50.8416-173.312 58.7776-68.608 135.5264-96.768 228.2496-83.8656 97.28-95.0272 220.4672-149.8624 357.12-158.72 115.712-7.5776 200.8064 20.1728 201.728 20.5824l14.4896 4.7616 4.2496 16.9984c17.408 67.0208 23.5008 139.4688 17.5104 209.7152-5.1712 61.44-19.5072 120.2176-42.752 174.6432-26.6752 62.5152-65.024 119.7056-114.2784 170.1376 12.8512 92.7744-15.2576 169.472-83.8656 228.2496-38.8608 33.5872-92.6208 52.0192-149.7088 52.0192z m-82.688-78.6944c0.512 0.8192 1.1776 1.5872 1.8432 2.4064 3.9936 4.7616 25.088 16.4352 62.1056 19.7632 24.0128 2.0992 85.0944 2.6624 132.1984-37.6832 56.7808-48.6912 77.3632-111.104 62.9248-190.5664l-2.6624-14.592 10.5984-10.3424c187.5456-182.4768 157.3888-413.2864 138.1376-497.9712-26.8288-6.656-88.9344-18.9952-166.144-13.824-129.3824 8.4992-240.896 59.6992-331.1104 152.3712l-10.3424 10.5984-14.592-2.6624c-79.5136-14.4896-141.8752 6.0928-190.5664 62.9248-40.4992 47.104-39.8336 108.1856-37.6832 132.1984 3.328 37.1712 15.0016 58.2656 19.7632 62.1056 0.9216 0.8192 1.7408 1.3312 2.4064 1.8432l0.6656-1.7408 111.104-71.936-12.0832 63.8464c-6.912 36.608-12.8512 82.176-11.6736 98.2016l147.8656 147.8656c14.1824 1.7408 57.088-3.84 96.3584-12.5952l66.3552-14.7456-73.5232 113.6128-1.8432 0.9216z"
      fill="#4AD991"
    />
    <path
      d="M27.840051 880.5888c-7.168 0-14.1824-2.6624-19.6608-8.0896a27.84256 27.84256 0 0 1 0-39.424l119.296-119.296c10.9056-10.9056 28.5184-10.9056 39.424 0s10.9056 28.5184 0 39.424l-119.296 119.296a28.3392 28.3392 0 0 1-19.7632 8.0896z m60.3648 117.6064c-7.168 0-14.1824-2.6624-19.6608-8.0896a27.84256 27.84256 0 0 1 0-39.424l147.8656-147.8656c10.9056-10.9056 28.5184-10.9056 39.424 0s10.9056 28.5184 0 39.424l-147.8656 147.712a27.97056 27.97056 0 0 1-19.7632 8.2432z m154.624 23.5008c-7.168 0-14.1824-2.6624-19.6608-8.0896a27.84256 27.84256 0 0 1 0-39.424l82.2784-82.2784c10.9056-10.9056 28.5184-10.9056 39.424 0s10.9056 28.5184 0 39.424l-82.2784 82.2784a28.3392 28.3392 0 0 1-19.7632 8.0896z"
      fill="#009162"
    />
    <path
      d="M639.168051 536.832c-39.936 0-77.6192-15.5136-105.9328-43.9296-28.2624-28.2624-43.9296-65.9456-43.9296-105.9328s15.5136-77.6192 43.9296-105.9328c28.2624-28.2624 65.9456-43.9296 105.9328-43.9296s77.6192 15.5136 105.9328 43.9296c28.2624 28.2624 43.9296 65.9456 43.9296 105.9328s-15.5136 77.6192-43.9296 105.9328c-28.2624 28.416-65.8432 43.9296-105.9328 43.9296z m0-243.9168c-25.088 0-48.6912 9.8304-66.5088 27.5968-17.7664 17.7664-27.5968 41.4208-27.5968 66.5088s9.8304 48.6912 27.5968 66.5088 41.4208 27.5968 66.5088 27.5968 48.6912-9.8304 66.5088-27.5968c17.7664-17.7664 27.5968-41.4208 27.5968-66.5088s-9.8304-48.6912-27.5968-66.5088c-17.7664-17.7664-41.2672-27.5968-66.5088-27.5968z"
      fill="#FFFFFF"
    />
    <path
      d="M156.352051 175.3088c-7.168 0-14.1824-2.6624-19.6608-8.0896a27.84256 27.84256 0 0 1 0-39.424L256.038451 8.4992c10.9056-10.9056 28.5184-10.9056 39.424 0s10.9056 28.5184 0 39.424l-119.296 119.296a28.24704 28.24704 0 0 1-19.7632 8.0896zM876.787251 697.2928c-7.168 0-14.1824-2.6624-19.6608-8.0896a27.84256 27.84256 0 0 1 0-39.424l119.296-119.296c10.9056-10.9056 28.5184-10.9056 39.424 0s10.9056 28.5184 0 39.424l-119.296 119.296a28.5184 28.5184 0 0 1-19.7632 8.0896zM871.052851 1017.3952c-7.168 0-14.1824-2.6624-19.6608-8.0896a27.84256 27.84256 0 0 1 0-39.424l119.296-119.296c10.9056-10.9056 28.5184-10.9056 39.424 0s10.9056 28.5184 0 39.424l-119.296 119.296c-5.4272 5.4272-12.7488 8.0896-19.7632 8.0896z"
      fill="#009162"
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
        this.setState({
          hasUpgradeVersion: false
        });
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
        this.setState({
          hasUpgradeVersion
        });
      },
      handleError: () => {
        this.setState({
          hasUpgradeVersion: false
        });
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

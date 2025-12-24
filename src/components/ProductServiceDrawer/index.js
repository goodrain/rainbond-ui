import React, { PureComponent } from 'react';
import { Drawer, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import styles from './index.less';

@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
export default class ProductServiceDrawer extends PureComponent {
  handleNavigation = (path) => {
    const { dispatch, onClose } = this.props;
    onClose();
    if (path) {
      dispatch(routerRedux.push(path));
    }
  };

  handlePortalNavigation = (key) => {
    const { rainbondInfo, onClose } = this.props;
    const portalSite = rainbondInfo?.portal_site;
    const token = cookie.get('token');

    onClose();

    if (portalSite && token) {
      // 构造跳转URL，携带token和key参数
      const url = `${portalSite}?token=${token}&redirect=${key}`;
      window.location.href = url;
    }
  };

  renderCategoryItem = (icon, title, desc, onClick, active = false) => {
    return (
      <div
        className={`${styles.categoryItem} ${active ? styles.active : ''}`}
        onClick={onClick}
      >
        <div className={styles.iconWrapper}>
          {icon}
        </div>
        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          <div className={styles.desc}>{desc}</div>
        </div>
        {active && <span className={styles.badge}>当前</span>}
      </div>
    );
  };

  render() {
    const { visible, onClose, currentUser } = this.props;
    const eid = globalUtil.getCurrEnterpriseId() || (currentUser && currentUser.enterprise_id);
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    // 判断当前是否在后台管理页面
    const isAdmin = window.location.pathname.includes('/enterprise/');
    // 判断当前是否在团队/应用管理页面
    const isAppManagement = teamName && regionName && !isAdmin;

    return (
      <Drawer
        title={
          <div className={styles.drawerTitle}>
            <div className={styles.mainTitle}>产品与服务</div>
            <div className={styles.subTitle}>选择您要访问的产品模块</div>
          </div>
        }
        placement="left"
        width={480}
        onClose={onClose}
        visible={visible}
        className={styles.productDrawer}
        closable={true}
        closeIcon={<Icon type="close" style={{ fontSize: 18, color: '#999' }} />}
      >
        <div className={styles.categoryList}>
          {this.renderCategoryItem(
            <Icon type="user" style={{ fontSize: 24, color: '#1890ff' }} />,
            '用户中心',
            '管理个人信息和账号设置',
            () => this.handlePortalNavigation('user-center')
          )}

          {this.renderCategoryItem(
            <Icon type="wallet" style={{ fontSize: 24, color: '#52c41a' }} />,
            '账户中心',
            '管理充值、账单和发票',
            () => this.handlePortalNavigation('account-center')
          )}

          {this.renderCategoryItem(
            <Icon type="appstore" style={{ fontSize: 24, color: '#722ed1' }} />,
            '应用市场',
            '浏览和购买应用',
            () => this.handlePortalNavigation('app-market')
          )}

          {this.renderCategoryItem(
            <Icon type="dashboard" style={{ fontSize: 24, color: '#fa8c16' }} />,
            '应用管理',
            '管理和监控您的应用',
            () => {
              if (teamName && regionName) {
                this.handleNavigation(`/team/${teamName}/region/${regionName}/index`);
              }
            },
            isAppManagement
          )}

          {currentUser && currentUser.is_enterprise_admin && this.renderCategoryItem(
            <Icon type="setting" style={{ fontSize: 24, color: '#eb2f96' }} />,
            '后台管理',
            '订单管理、费用账单、额度设置等',
            () => this.handlePortalNavigation('admin-management'),
            isAdmin
          )}
        </div>
      </Drawer>
    );
  }
}

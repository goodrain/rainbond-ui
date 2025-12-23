/* eslint-disable react/no-multi-comp */
import { Button, Icon, List, Modal, notification } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import ConfirmModal from '../../components/ConfirmModal';
import Ellipsis from '../../components/Ellipsis';
import MarketPluginDetailShow from '../../components/MarketPluginDetailShow';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import roleUtil from '../../utils/newRole';
import handleAPIError from '../../utils/error';
import styles from './Index.less';
import Manage from './manage';

const { confirm } = Modal;
class MarketPlugin extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: null,
      showMarketPluginDetail: false,
      showPlugin: {}
    };
  }
  componentDidMount() {
    this.fetchPlugins();
  }

  // 获取未安装的插件列表
  fetchPlugins = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/getUnInstalledPlugin',
      payload: {
        page: 1,
        limit: 1000
      },
      callback: data => {
        this.setState({
          list: (data && data.list) || []
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 安装插件
  handleInstall = data => {
    const { dispatch, onInstallSuccess } = this.props;
    dispatch({
      type: 'plugin/installMarketPlugin',
      payload: {
        plugin_id: data.id
      },
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'notification.success.install_success' })
        });
        this.fetchPlugins();
        onInstallSuccess && onInstallSuccess();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 显示/隐藏插件详情
  hideMarketPluginDetail = () => {
    this.setState({ showMarketPluginDetail: false, showPlugin: {} });
  };

  showMarketPluginDetail = plugin => {
    this.setState({ showMarketPluginDetail: true, showPlugin: plugin });
  };
  // 渲染插件列表
  renderTmp = () => {
    const { list } = this.state;

    if (!list) {
      return (
        <p style={{ textAlign: 'center' }}>
          <Icon type="loading" />
        </p>
      );
    }

    const filteredList = list.filter(item => !item.is_installed && item.is_complete);

    return (
      <List
        rowKey="id"
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1
        }}
        dataSource={filteredList}
        renderItem={item => (
          <List.Item key={item.id}>
            <Card
              className={styles.card}
              actions={[
                <span onClick={() => this.handleInstall(item)}>
                  {formatMessage({ id: 'teamPlugin.btn.install' })}
                </span>
              ]}
            >
              <Card.Meta
                style={{ height: 99, overflow: 'hidden' }}
                avatar={
                  <Icon
                    onClick={() => this.showMarketPluginDetail(item)}
                    style={{ fontSize: 50, color: 'rgba(0, 0, 0, 0.2)' }}
                    type="api"
                  />
                }
                title={
                  <a
                    style={{ color: '#1890ff' }}
                    href="javascript:;"
                    onClick={() => this.showMarketPluginDetail(item)}
                  >
                    {item.plugin_name}
                  </a>
                }
                description={
                  <Fragment>
                    <p
                      style={{
                        display: 'block',
                        color: 'rgb(220, 220, 220)',
                        marginBottom: 8
                      }}
                    >
                      {pluginUtil.getCategoryCN(item.plugin_type || item.category)}
                    </p>
                    <Ellipsis className={styles.item} lines={3}>
                      {item.desc}
                    </Ellipsis>
                  </Fragment>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    );
  };
  render() {
    const list = this.state.list || [];
    return (
      <div className={styles.cardList}>
        {this.renderTmp()}
        {this.state.showMarketPluginDetail && (
          <MarketPluginDetailShow
            onOk={this.hideMarketPluginDetail}
            onCancel={this.hideMarketPluginDetail}
            plugin={this.state.showPlugin}
          />
        )}
      </div>
    );
  }
}

@connect(({ teamControl, enterprise, loading }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  deletePluginLoading: loading.effects['plugin/deletePlugin']
}))
class PluginList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      defaultList: [],
      list: [],
      installLoading: false,
      deletePlugin: null,
      pluginInfo: null,
      currentType: false,
      appOutPlugin: false
    };
    this.timer = null;
  }

  componentDidMount() {
    this.fetchDefaultPlugin();
    this.fetchPlugins();
  }

  // 准备删除插件
  onDeletePlugin = plugin => {
    this.setState({ deletePlugin: plugin, pluginInfo: plugin });
  };
  // 安装插件
  onInstallPlugin = item => {
    const { dispatch } = this.props;

    this.setState(
      {
        currentType: item.plugin_type,
        installLoading: true
      },
      () => {
        dispatch({
          type: 'plugin/installDefaultPlugin',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            plugin_type: item.category
          },
          callback: res => {
            if (res && res.status_code === 200) {
              notification.success({
                message: formatMessage({ id: 'notification.success.install_success' })
              });
            }
            this.fetchDefaultPlugin();
          },
          handleError: err => {
            handleAPIError(err);
            this.setState({ installLoading: false, currentType: false });
          }
        });
      }
    );
  };

  // 获取插件操作按钮
  getAction = (item, operationPermissions) => {
    const { isCreate, isDelete } = operationPermissions;
    const { installLoading, currentType } = this.state;

    // 已安装的插件显示删除和管理按钮
    if (item.has_install !== false) {
      const arr = [];
      if (isDelete) {
        arr.push(
          <span onClick={() => this.onDeletePlugin(item)}>
            {formatMessage({ id: 'teamPlugin.btn.delete' })}
          </span>
        );
      }
      arr.push(
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
            item.plugin_id
          }`}
        >
          {formatMessage({ id: 'teamPlugin.btn.manage' })}
        </Link>
      );
      return arr;
    }

    // 未安装的插件显示安装按钮
    if (isCreate) {
      return [
        <Button
          type="link"
          style={{ height: '17px', color: 'rgba(0, 0, 0, 0.45)' }}
          loading={currentType && currentType === item.plugin_type && installLoading}
          onClick={() => this.onInstallPlugin(item)}
        >
          {formatMessage({ id: 'teamPlugin.btn.install' })}
        </Button>
      ];
    }
    return [];
  };

  // 获取插件标题
  getItemTitle = item => {
    if (item.has_install) {
      return (
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
            item.plugin_id
          }`}
        >
          {item.plugin_alias}
        </Link>
      );
    }
    return item.plugin_alias;
  };

  // 渲染插件卡片
  renderPluginCard = (item, operationPermissions) => {
    const { isCreate, isDelete } = operationPermissions;
    const { installLoading, currentType } = this.state;
    const isInstalled = item.has_install !== false;

    const handleAction = () => {
      if (isInstalled) {
        // 已安装，跳转到管理页面
        const { dispatch } = this.props;
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${item.plugin_id}`
          )
        );
      } else if (isCreate) {
        // 未安装，执行安装
        this.onInstallPlugin(item);
      }
    };

    const getButtonText = () => {
      if (isInstalled) {
        return formatMessage({ id: 'teamPlugin.btn.manage' });
      }
      return formatMessage({ id: 'teamPlugin.btn.install' });
    };

    const getButtonIcon = () => {
      if (isInstalled) {
        return 'setting';
      }
      return 'download';
    };

    return (
      <div className={styles.pluginCard}>
        <div className={styles.pluginCardContent}>
          <div className={styles.pluginCardLogo}>
            <Icon
              style={{ fontSize: 40, color: 'rgba(0, 0, 0, 0.2)' }}
              type="api"
            />
          </div>
          <div className={styles.pluginCardInfo}>
            <div className={styles.pluginCardHeader}>
              <span
                className={styles.pluginCardName}
                title={item.plugin_alias}
                onClick={handleAction}
              >
                {item.plugin_alias}
              </span>
            </div>
            <div className={styles.pluginCardType}>
              {pluginUtil.getCategoryCN(item.plugin_type || item.category)}
            </div>
            <div className={styles.pluginCardDesc} title={item.desc}>
              {item.desc}
            </div>
          </div>
        </div>
        <div className={styles.pluginCardAction}>
          {isInstalled ? (
            <div className={styles.pluginCardBtnGroup}>
              {isDelete && (
                <button
                  className={styles.pluginCardDeleteBtn}
                  onClick={() => this.onDeletePlugin(item)}
                >
                  <Icon type="delete" />
                  {formatMessage({ id: 'teamPlugin.btn.delete' })}
                </button>
              )}
              <button
                className={styles.pluginCardPrimaryBtn}
                onClick={handleAction}
              >
                <Icon type="setting" />
                {formatMessage({ id: 'teamPlugin.btn.manage' })}
              </button>
            </div>
          ) : (
            <button
              className={styles.pluginCardPrimaryBtn}
              onClick={handleAction}
              disabled={!isCreate || (currentType && currentType === item.plugin_type && installLoading)}
            >
              {currentType && currentType === item.plugin_type && installLoading ? (
                <Icon type="loading" />
              ) : (
                <Icon type="download" />
              )}
              {formatMessage({ id: 'teamPlugin.btn.install' })}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 获取默认插件列表
  fetchDefaultPlugin = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/getDefaultPlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data && data.bean) {
          this.setState(
            {
              defaultList: data.list
            },
            () => {
              this.fetchPlugins();
            }
          );
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 获取已安装的插件列表
  fetchPlugins = () => {
    const { dispatch } = this.props;
    const { defaultList } = this.state;
    dispatch({
      type: 'plugin/getMyPlugins',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          const arr = defaultList.filter(item => !item.has_install);
          let installList = [];
          if (data.list && data.list.length > 0) {
            data.list.map(item => {
              item.has_install = true;
              installList.push(item);
            });
          }
          const list = [...arr, ...installList] || [];
          this.setState({
            list,
            installLoading: false,
            currentType: false
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ installLoading: false, currentType: false });
      }
    });
  };
  // 创建插件
  handleCreate = () => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create-plugin`
      )
    );
  };

  // 从市场安装插件
  handleInstall = () => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Install-plugin`
      )
    );
  };
  // 删除插件
  handleDeletePlugin = isForce => {
    const { dispatch } = this.props;
    const { pluginInfo, deletePlugin } = this.state;
    dispatch({
      type: 'plugin/deletePlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        is_force: isForce,
        plugin_id:
          (deletePlugin && deletePlugin.plugin_id) ||
          (pluginInfo && pluginInfo.plugin_id)
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
        }
        this.fetchDefaultPlugin();
        this.cancelDeletePlugin();
        this.cancelDeletePluginInfo();
      },
      handleError: res => {
        if (res && res.data && res.data.code === 20600) {
          this.handlePlugIn();
          this.cancelDeletePlugin();
        } else {
          handleAPIError(res);
        }
      }
    });
  };

  // 取消删除插件
  cancelDeletePlugin = () => {
    this.setState({ deletePlugin: null });
  };

  // 取消删除插件信息
  cancelDeletePluginInfo = () => {
    this.setState({ pluginInfo: null });
  };

  // 确认强制删除插件
  handlePlugIn = () => {
    const th = this;
    confirm({
      title: formatMessage({id: 'confirmModal.plugin.delete.force.title'}),
      content: formatMessage({id: 'confirmModal.plugin.delete.force.content'}),
      okText: formatMessage({id: 'popover.confirm'}),
      cancelText: formatMessage({id: 'popover.cancel'}),
      onOk() {
        th.handleDeletePlugin(true);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
        }).catch(() => console.log('Oops errors!'));
      }
    });
  };
  // 鼠标移出
  appOut = () => {
    this.setState({ appOutPlugin: false });
  };

  // 鼠标移入
  appOver = () => {
    this.setState({ appOutPlugin: true });
  };
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      operationPermissions,
      deletePluginLoading
    } = this.props;
    const { list, appOutPlugin } = this.state;
    const content = (
      <div className={styles.pageHeaderContent}>
        <p>{formatMessage({id: 'teamPlugin.desc'})}</p>
      </div>
    );
    const extraContent = <div></div>;
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({id: 'teamPlugin.list'}) });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'teamPlugin.title'})}
        content={content}
        extraContent={extraContent}
        titleSvg={pageheaderSvg.getPageHeaderSvg('api',18)}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`)
            );
          }} type="default">
              <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.home' })}
          </Button>
        }
      >
        <div className={styles.cardList}>
          <List
            rowKey="id"
            grid={{
              gutter: 24,
              lg: 3,
              md: 2,
              sm: 1,
              xs: 1
            }}
            dataSource={['', ...list]}
            renderItem={item =>
              // eslint-disable-next-line no-nested-ternary
              item ? (
                <List.Item key={item.id}>
                  {this.renderPluginCard(item, operationPermissions)}
                </List.Item>
              ) : operationPermissions.isCreate ? (
                <List.Item key={item.id}>
                  <div className={styles.addPluginCard}>
                    <div className={styles.addPluginContent}>
                      <div className={styles.addPluginIcon}>
                        <Icon type="plus" />
                      </div>
                      <div className={styles.addPluginText}>
                        {formatMessage({id: 'teamPlugin.hint'})}
                      </div>
                    </div>
                    <div className={styles.addPluginActions}>
                      <button
                        className={styles.addPluginBtn}
                        onClick={this.handleInstall}
                      >
                        <Icon type="appstore" />
                        {formatMessage({id: 'teamPlugin.btn.marketAdd'})}
                      </button>
                      <button
                        className={styles.addPluginBtnPrimary}
                        onClick={this.handleCreate}
                      >
                        <Icon type="plus" />
                        {formatMessage({id: 'teamPlugin.btn.add'})}
                      </button>
                    </div>
                  </div>
                </List.Item>
              ) : (
                <div />
              )
            }
          />
          {this.state.deletePlugin && (
            <ConfirmModal
              title={formatMessage({id: 'confirmModal.plugin.delete.title'})}
              desc={formatMessage({id: 'confirmModal.delete.plugin.desc'})}
              loading={deletePluginLoading}
              onOk={() => {
                this.handleDeletePlugin(false);
              }}
              onCancel={this.cancelDeletePlugin}
            />
          )}
        </div>
        
      </PageHeaderLayout>
    );
  }
}

@connect(({ user, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      operationPermissions: roleUtil.queryPermissionsInfo(
        this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team,
        'team_plugin_manage'
      )
    };
  }

  render() {
    const { match } = this.props;
    const { pluginId } = match.params;
    const { operationPermissions: { isAccess } } = this.state;

    // 检查权限
    if (!isAccess) {
      return roleUtil.noPermission();
    }

    // 如果有 pluginId，显示插件管理页面
    if (pluginId) {
      return <Manage {...this.props} {...this.state} />;
    }

    // 否则显示插件列表页面
    return <PluginList {...this.props} {...this.state} />;
  }
}

export default Index;

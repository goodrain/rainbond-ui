import { Icon, List, Modal, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import ConfirmModal from '../../../components/ConfirmModal';
import globalUtil from '../../../utils/global';
import pluginUtil from '../../../utils/plugin';
import roleUtil from '../../../utils/newRole';
import handleAPIError from '../../../utils/error';
import styles from '../Index.less';

const { confirm } = Modal;

@connect(({ teamControl, loading }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  deletePluginLoading: loading.effects['plugin/deletePlugin']
}))
export default class PluginListContent extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      defaultList: [],
      list: [],
      installLoading: false,
      deletePlugin: null,
      pluginInfo: null,
      currentType: false
    };
  }

  componentDidMount() {
    this.fetchDefaultPlugin();
    this.fetchPlugins();
  }

  getOperationPermissions = () => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.queryPermissionsInfo(
      currentTeamPermissionsInfo && currentTeamPermissionsInfo.team,
      'team_plugin_manage'
    );
  };

  onDeletePlugin = plugin => {
    this.setState({ deletePlugin: plugin, pluginInfo: plugin });
  };

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

  renderPluginCard = (item, operationPermissions) => {
    const { isCreate, isDelete } = operationPermissions;
    const { installLoading, currentType } = this.state;
    const isInstalled = item.has_install !== false;

    const handleAction = () => {
      if (isInstalled) {
        const { dispatch } = this.props;
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${item.plugin_id}`
          )
        );
      } else if (isCreate) {
        this.onInstallPlugin(item);
      }
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
              disabled={
                !isCreate ||
                (currentType && currentType === item.plugin_type && installLoading)
              }
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
          const installList = [];
          if (data.list && data.list.length > 0) {
            data.list.forEach(item => {
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

  handleCreate = () => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create-plugin`
      )
    );
  };

  handleInstall = () => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/install-plugin`
      )
    );
  };

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
          notification.success({
            message: formatMessage({ id: 'notification.success.delete' })
          });
        }
        this.fetchDefaultPlugin();
        this.cancelDeletePlugin();
        this.cancelDeletePluginInfo();
      },
      handleError: res => {
        if (res && res.data && res.data.code === 20600) {
          this.handleForceDelete();
          this.cancelDeletePlugin();
        } else {
          handleAPIError(res);
        }
      }
    });
  };

  cancelDeletePlugin = () => {
    this.setState({ deletePlugin: null });
  };

  cancelDeletePluginInfo = () => {
    this.setState({ pluginInfo: null });
  };

  handleForceDelete = () => {
    confirm({
      title: formatMessage({ id: 'confirmModal.plugin.delete.force.title' }),
      content: formatMessage({ id: 'confirmModal.plugin.delete.force.content' }),
      okText: formatMessage({ id: 'popover.confirm' }),
      cancelText: formatMessage({ id: 'popover.cancel' }),
      onOk: () => {
        this.handleDeletePlugin(true);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
        }).catch(() => {});
      }
    });
  };

  render() {
    const { deletePluginLoading } = this.props;
    const { list, deletePlugin } = this.state;
    const operationPermissions = this.getOperationPermissions();
    const dataSource = operationPermissions.isCreate ? ['', ...list] : list;

    return (
      <div className={styles.cardList}>
        <List
          rowKey={item => item.plugin_id || item.id || 'plugin-home-entry'}
          grid={{
            gutter: 24,
            lg: 3,
            md: 2,
            sm: 1,
            xs: 1
          }}
          dataSource={dataSource}
          renderItem={item =>
            item ? (
              <List.Item key={item.id}>
                {this.renderPluginCard(item, operationPermissions)}
              </List.Item>
            ) : (
              <List.Item key="plugin-home-entry">
                <div className={styles.addPluginCard}>
                  <div className={styles.addPluginContent}>
                    <div className={styles.addPluginIcon}>
                      <Icon type="plus" />
                    </div>
                    <div className={styles.addPluginText}>
                      {formatMessage({ id: 'teamPlugin.hint' })}
                    </div>
                  </div>
                  <div className={styles.addPluginActions}>
                    <button
                      className={styles.addPluginBtn}
                      onClick={this.handleInstall}
                    >
                      <Icon type="appstore" />
                      {formatMessage({ id: 'teamPlugin.btn.marketAdd' })}
                    </button>
                    <button
                      className={styles.addPluginBtnPrimary}
                      onClick={this.handleCreate}
                    >
                      <Icon type="plus" />
                      {formatMessage({ id: 'teamPlugin.btn.add' })}
                    </button>
                  </div>
                </div>
              </List.Item>
            )
          }
        />
        {deletePlugin && (
          <ConfirmModal
            title={formatMessage({ id: 'confirmModal.plugin.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.plugin.desc' })}
            loading={deletePluginLoading}
            onOk={() => {
              this.handleDeletePlugin(false);
            }}
            onCancel={this.cancelDeletePlugin}
          />
        )}
      </div>
    );
  }
}

/* eslint-disable react/no-multi-comp */
import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Card, Button, Icon, List, notification } from 'antd';
import { Link, routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import roleUtil from '../../utils/role';
import styles from './Index.less';
import Ellipsis from '../../components/Ellipsis';
import Manage from './manage';
import ConfirmModal from '../../components/ConfirmModal';
import MarketPluginDetailShow from '../../components/MarketPluginDetailShow';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';

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
  fetchPlugins = () => {
    this.props.dispatch({
      type: 'plugin/getUnInstalledPlugin',
      payload: {
        page: 1,
        limit: 1000
      },
      callback: (data) => {
        this.setState({
          list: (data && data.list) || []
        });
      }
    });
  };
  handleInstall = (data) => {
    this.props.dispatch({
      type: 'plugin/installMarketPlugin',
      payload: {
        plugin_id: data.id
      },
      callback: (data) => {
        notification.success({
          message: '安装成功'
        });
        this.fetchPlugins();
        this.props.onInstallSuccess && this.props.onInstallSuccess();
      }
    });
  };
  hideMarketPluginDetail = () => {
    this.setState({ showMarketPluginDetail: false, showPlugin: {} });
  };
  showMarketPluginDetail = (plugin) => {
    this.setState({ showMarketPluginDetail: true, showPlugin: plugin });
  };
  renderTmp = () => {
    let list = this.state.list;
    if (!list) {
      return (
        <p style={{ textAlign: 'center' }}>
          <Icon type="loading" />
        </p>
      );
    }

    list = list.filter((item) => {
      return !item.is_installed && item.is_complete;
    });

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
        dataSource={list}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Card
              className={styles.card}
              actions={[
                <span
                  onClick={() => {
                    this.handleInstall(item);
                  }}
                >
                  安装
                </span>
              ]}
            >
              <Card.Meta
                style={{ height: 99, overflow: 'hidden' }}
                avatar={
                  <Icon
                    onClick={() => {
                      this.showMarketPluginDetail(item);
                    }}
                    style={{ fontSize: 50, color: 'rgba(0, 0, 0, 0.2)' }}
                    type="api"
                  />
                }
                title={
                  <a
                    style={{ color: '#1890ff' }}
                    href="javascript:;"
                    onClick={() => {
                      this.showMarketPluginDetail(item);
                    }}
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
                      {' '}
                      {pluginUtil.getCategoryCN(
                        item.plugin_type || item.category
                      )}{' '}
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

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
class PluginList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      defaultList: [],
      list: [],
      deletePlugin: null
    };
    this.timer = null;
  }
  componentDidMount() {
    this.fetchDefaultPlugin();
  }

  onDeletePlugin = (plugin) => {
    this.setState({ deletePlugin: plugin });
  };
  onInstallPlugin = (item) => {
    this.props.dispatch({
      type: 'plugin/installDefaultPlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_type: item.category
      },
      callback: (data) => {
        this.fetchDefaultPlugin();
      }
    });
  };

  getAction = (item, operationPermissions) => {
    const { isCreate, isDelete } = operationPermissions;
    if (item.has_install !== false) {
      const arr = [];
      if (isDelete) {
        arr.push(
          <span
            onClick={() => {
              this.onDeletePlugin(item);
            }}
          >
            删除
          </span>
        );
      }
      arr.push(
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
            item.plugin_id
          }`}
        >
          管理
        </Link>
      );

      return arr;
    }
    if (isCreate) {
      return [
        <span
          onClick={() => {
            this.onInstallPlugin(item);
          }}
        >
          安装
        </span>
      ];
    }
    return [];
  };
  getItemTitle = (item) => {
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

  fetchDefaultPlugin = () => {
    this.props.dispatch({
      type: 'plugin/getDefaultPlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: (data) => {
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
      }
    });
  };
  fetchPlugins = () => {
    const { defaultList } = this.state;
    this.props.dispatch({
      type: 'plugin/getMyPlugins',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: (data) => {
        if (data) {
          const arr = defaultList.filter((item) => {
            return !item.has_install;
          });
          let installList = [];
          if (data.list && data.list.length > 0) {
            data.list.map((item) => {
              item.has_install = true;
              installList.push(item);
            });
          }
          const list = [...arr, ...installList] || [];
          this.setState({
            list
          });
        }
      }
    });
  };
  handleCreate = () => {
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create-plugin`
      )
    );
  };
  hanldeDeletePlugin = () => {
    this.props.dispatch({
      type: 'plugin/deletePlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.state.deletePlugin.plugin_id
      },
      callback: (res) => {
        if (res && res._code === 200) {
          notification.success({ message: '删除成功' });
        }
        this.fetchDefaultPlugin();
        this.cancelDeletePlugin();
      }
    });
  };

  cancelDeletePlugin = () => {
    this.setState({ deletePlugin: null });
  };
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      operationPermissions
    } = this.props;
    const { list } = this.state;
    const content = (
      <div className={styles.pageHeaderContent}>
        <p>应用插件是标准化的为应用提供功能扩展，与应用共同运行的程序</p>
      </div>
    );
    const extraContent = <div className={styles.extraImg} />;
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '插件列表' });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="我的插件"
        content={content}
        extraContent={extraContent}
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
            renderItem={(item) =>
              // eslint-disable-next-line no-nested-ternary
              item ? (
                <List.Item key={item.id}>
                  <Card
                    className={styles.card}
                    actions={this.getAction(item, operationPermissions)}
                  >
                    <Card.Meta
                      style={{ height: 100, overflow: 'auto' }}
                      avatar={
                        <Icon
                          style={{ fontSize: 50, color: 'rgba(0, 0, 0, 0.2)' }}
                          type="api"
                        />
                      }
                      title={this.getItemTitle(item)}
                      description={
                        <Fragment>
                          <p
                            style={{
                              display: 'block',
                              color: 'rgb(220, 220, 220)',
                              marginBottom: 8
                            }}
                          >
                            {' '}
                            {pluginUtil.getCategoryCN(
                              item.plugin_type || item.category
                            )}{' '}
                          </p>
                          <Ellipsis className={styles.item} lines={3}>
                            {item.desc}
                          </Ellipsis>
                        </Fragment>
                      }
                    />
                  </Card>
                </List.Item>
              ) : operationPermissions.isCreate ? (
                <List.Item key={item.id}>
                  <Button
                    type="dashed"
                    onClick={this.handleCreate}
                    className={styles.newButton}
                  >
                    <Icon type="plus" />
                    新建插件
                  </Button>
                </List.Item>
              ) : (
                <div />
              )
            }
          />
          {this.state.deletePlugin && (
            <ConfirmModal
              onOk={this.hanldeDeletePlugin}
              onCancel={this.cancelDeletePlugin}
              title="删除插件"
              desc="确定要删除此插件吗？"
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
      operationPermissions: this.handlePermissions('queryPluginInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }

  handlePermissions = (type) => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    const { match } = this.props;
    const { pluginId } = match.params;
    if (pluginId) {
      return <Manage {...this.props} {...this.state} />;
    }
    return <PluginList {...this.props} {...this.state} />;
  }
}

export default Index;

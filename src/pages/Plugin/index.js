/* eslint-disable react/no-multi-comp */
import { Button, Card, Icon, List, Modal, notification, Col, Tooltip, Form, Select } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import Ellipsis from '../../components/Ellipsis';
import MarketPluginDetailShow from '../../components/MarketPluginDetailShow';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import roleUtil from '../../utils/role';
import styles from './Index.less';
import Manage from './manage';
import Lists from '../../components/Lists'
const { confirm } = Modal;
const { Option } = Select;
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
      callback: data => {
        this.setState({
          list: (data && data.list) || []
        });
      }
    });
  };
  handleInstall = data => {
    this.props.dispatch({
      type: 'plugin/installMarketPlugin',
      payload: {
        plugin_id: data.id
      },
      callback: data => {
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
  showMarketPluginDetail = plugin => {
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

    list = list.filter(item => {
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
        renderItem={item => (
          <List.Item key={item.id}>
            <Card
              className={styles.card}
              actions={[
                <span
                  onClick={() => {
                    this.handleInstall(item);
                  }}
                >
                  
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
      appPlugin: false,
      appVersions: false,
      appOutPlugin:false
    };
    this.timer = null;
  }
  componentDidMount() {
    this.fetchDefaultPlugin();
    this.fetchPlugins();
  }

  onDeletePlugin = plugin => {
    this.setState({ deletePlugin: plugin, pluginInfo: plugin });
  };
  onInstallPlugin = item => {
    this.setState(
      {
        currentType: item.plugin_type,
        installLoading: true
      },
      () => {
        this.props.dispatch({
          type: 'plugin/installDefaultPlugin',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            plugin_type: item.category
          },
          callback: res => {
            if (res && res.status_code === 200) {
              notification.success({ message: '安装成功' });
            }
            this.fetchDefaultPlugin();
          }
        });
      }
    );
  };

  getAction = (item, operationPermissions) => {
    const { isCreate, isDelete } = operationPermissions;
    const { installLoading, currentType } = this.state;
    if (item.has_install !== false) {
      const arr = [];
      if (isDelete) {
        arr.push(
          <span
            onClick={() => {
              this.onDeletePlugin(item);
            }}
          >
            {formatMessage({id: 'teamPlugin.btn.delete'})}
          </span>
        );
      }
      arr.push(
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${item.plugin_id
            }`}
        >
          {formatMessage({id: 'teamPlugin.btn.manage'})}
        </Link>
      );

      return arr;
    }
    if (isCreate) {
      return [
        <Button
          type="link"
          style={{ height: '17px', color: 'rgba(0, 0, 0, 0.45)' }}
          loading={
            currentType && currentType === item.plugin_type && installLoading
          }
          onClick={() => {
            this.onInstallPlugin(item);
          }}
        >
          {formatMessage({id: 'teamPlugin.btn.install'})}
        </Button>
      ];
    }
    return [];
  };
  getItemTitle = item => {
    if (item.has_install) {
      return (
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${item.plugin_id
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
      callback: data => {
        if (data) {
          const arr = defaultList.filter(item => {
            return !item.has_install;
          });
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
  handleInstall = ()=>{
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Install-plugin`
      )
    );
  }
  hanldeDeletePlugin = isForce => {
    const { pluginInfo, deletePlugin } = this.state;
    this.props.dispatch({
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
          notification.success({ message: '删除成功' });
        }
        this.fetchDefaultPlugin();
        this.cancelDeletePlugin();
        this.cancelDeletePluginInfo();
      },
      handleError: res => {
        if (res && res.data.code === 20600) {
          this.handlePlugIn();
          this.cancelDeletePlugin();
        } else {
          notification.warning({
            message: res.data.msg_show
          });
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

  handlePlugIn = () => {
    const th = this;
    confirm({
      title: '该插件有组件使用',
      content: '是否强制删除',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        th.hanldeDeletePlugin(true);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
        }).catch(() => console.log('Oops errors!'));
      }
    });
  };
  //安装应用插件
  installAppPlugin = () => {
    this.setState({
      appPlugin: true
    })
  }
  hideModal = () => {
    this.setState({
      appPlugin: false
    })
  }
  changeVersions = () => {
    this.setState({
      appVersions: true
    })
  }
  instAppPlugin = () => {
    this.setState({
      appVersions: false
    })

  }
  appOut = () => {
    this.setState({
      appOutPlugin:false
    })
  }
  appOver = () => {
    this.setState({
      appOutPlugin:true
    })
  }
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      operationPermissions,
      deletePluginLoading
    } = this.props;
    const { list, appPlugin, appVersions, appOutPlugin } = this.state;
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
                  <div 
                    className={styles.newButton}
                    onMouseEnter={this.appOver}
                    onMouseLeave={this.appOut}
                  >
                    {
                      !appOutPlugin && (
                        <div style={{ display: appOutPlugin ? 'none' : 'block'}}>
                        <Icon type="plus" style={{fontSize:'40px',fontWeight:'bolder',marginTop:'50px'}}/>
                        <p style={{marginTop:'20px',fontSize:'14px'}}>{formatMessage({id: 'teamPlugin.hint'})}</p>
                        </div>
                      )
                    }
                    {
                      appOutPlugin && (
                      <div className={styles.changeBtn} >
                        <div onClick={this.handleInstall} className={styles.appBtn}>{formatMessage({id: 'teamPlugin.btn.marketAdd'})}</div>
                        <div onClick={this.handleCreate} className={styles.instBtn}>{formatMessage({id: 'teamPlugin.btn.add'})}</div>
                      </div>
                    )
                    
                  }
                  </div>
                 
                </List.Item>
              ) : (
                <div />
              )
            }
          />
          {this.state.deletePlugin && (
            <ConfirmModal
              title="删除插件"
              desc="确定要删除此插件吗？"
              loading={deletePluginLoading}
              onOk={() => {
                this.hanldeDeletePlugin(false);
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

  handlePermissions = type => {
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

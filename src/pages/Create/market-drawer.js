/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-indent-props */
/* eslint-disable react/jsx-indent */
import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    List,
    Modal,
    Radio,
    Select,
    Spin,
    Tabs,
    Tag,
    Tooltip,
    Row,
    Col
  } from 'antd';
  import { connect } from 'dva';
  import { routerRedux } from 'dva/router';
  import React, { Fragment, PureComponent } from 'react';
  import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
  import AuthCompany from '../../components/AuthCompany';
  import CreateAppFromHelmForm from '../../components/CreateAppFromHelmForm';
  import CreateAppFromMarketForm from '../../components/CreateAppFromMarketForm';
  import styles from '../../components/CreateTeam/index.less';
  import Ellipsis from '../../components/Ellipsis';
  import GoodrainRZ from '../../components/GoodrainRenzheng';
  import MarketAppDetailShow from '../../components/MarketAppDetailShow';
  import PageHeaderLayout from '../../layouts/PageHeader-drawer';
  import { fetchMarketAuthority } from '../../utils/authority';
  import { createEnterprise, createTeam } from '../../utils/breadcrumb';
  import globalUtil from '../../utils/global';
  import roleUtil from '../../utils/role';
  import sourceUtil from '../../utils/source-unit';
  import PluginStyles from '../Plugin/Index.less';
  
  const { Option } = Select;
  const { TabPane } = Tabs;
  
  @connect(
    ({ global, loading, teamControl, enterprise }) => ({
      loading,
      enterprise: global.enterprise,
      currentTeam: teamControl.currentTeam,
      currentRegionName: teamControl.currentRegionName,
      currentEnterprise: enterprise.currentEnterprise,
      currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
    }),
    null,
    null,
    { pure: false }
  )
  @Form.create()
  export default class Main extends PureComponent {
    constructor(arg) {
      super(arg);
      const {
        handleType = '',
        match,
        scope = '',
        moreState,
        scopeMax
      } = this.props;
      const appName = decodeURIComponent(
        handleType === 'Service'
          ? ''
          : (match && match.params && match.params.keyword) || ''
      );
      this.state = {
        helmInstallLoading: false,
        list: [],
        authorizations: false,
        app_name: appName,
        page: 1,
        pageSize: 9,
        total: 0,
        isSpinList: true,
        isSpincloudList: true,
        networkText: '',
        cloudList: [],
        cloudApp_name: '',
        cloudPage: 1,
        cloudPageSize: 9,
        cloudTotal: 0,
        helmCreate: null,
        showCreate: null,
        scope,
        scopeMax: scopeMax || 'localApplication',
        showApp: {},
        showMarketAppDetail: false,
        installBounced: false,
        handleType: handleType || null,
        moreState: moreState || null,
        is_deploy: true,
        localAppTab: [
          {
            key: 'localApplication',
            tab: formatMessage({id:'popover.applicationMarket.local'})
          },
          {
            key: 'command',
            tab: formatMessage({id:'teamAdd.create.market.command'})
          }
        ],
        rainStoreTab: [],
        helmStoreTab: [],
        currentKey: '',
        helmList: [],
        helmLoading: true,
        helmPag: {
          pageSize: 9,
          total: 0,
          page: 1,
          query: ''
        },
        addAppLoading: false
      };
      this.mount = false;
    }
    componentWillMount() {
      // const { currentTeamPermissionsInfo, dispatch } = this.props;
      // roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
    }
    componentDidMount() {
      this.mount = true;
      this.getApps();
      this.getMarketsTab();
      this.getHelmMarketsTab();
    }
    componentWillUnmount() {
      this.mount = false;
      this.mountquery = false;
    }
  
    onCancelCreate = () => {
      this.setState({ showCreate: null, helmCreate: null, addAppLoading: false });
    };
    getCloudRecommendApps = v => {
      const { currentKey } = this.state;
      const { currentEnterprise } = this.props;
      this.props.dispatch({
        type: 'market/fetchMarkets',
        payload: {
          name: currentKey,
          enterprise_id: currentEnterprise.enterprise_id,
          query: v ? '' : this.state.cloudApp_name || '',
          pageSize: v ? 9 : this.state.cloudPageSize,
          page: v ? 1 : this.state.cloudPage
        },
        callback: data => {
          if (data) {
            this.setState(
              {
                cloudList: data.list || [],
                cloudTotal: data.total
              },
              () => {
                if (
                  data._code &&
                  data.status_code === 210 &&
                  data._condition &&
                  data._condition === 10503
                ) {
                  this.setState({
                    isSpincloudList: -1,
                    networkText: data.msg_show
                  });
                } else {
                  this.setState({
                    isSpincloudList: false
                  });
                }
              }
            );
          } else {
            this.setState({ isSpincloudList: false });
          }
        }
      });
    };
    getApps = v => {
      const { currentEnterprise, dispatch } = this.props;
      const { scopeMax } = this.state;
      if (scopeMax && scopeMax !== 'localApplication') {
        return null;
      }
      dispatch({
        type: 'market/fetchAppModels',
        payload: {
          enterprise_id: currentEnterprise.enterprise_id,
          app_name: v ? '' : this.state.app_name || '',
          scope: v ? '' : this.state.scope,
          page_size: v ? 9 : this.state.pageSize,
          page: v ? 1 : this.state.page,
          need_install: true,
          is_complete: 1
        },
        callback: data => {
          if (data) {
            this.setState(
              {
                list: data.list || [],
                total: data.total
              },
              () => {
                this.setState({
                  isSpinList: false
                });
              }
            );
          } else {
            this.setState({ isSpinList: false });
          }
        }
      });
    };
    getMarketsTab = () => {
      const { dispatch, currentEnterprise } = this.props;
      const { scopeMax } = this.state;
      dispatch({
        type: 'market/fetchMarketsTab',
        payload: {
          enterprise_id: currentEnterprise.enterprise_id
        },
        callback: res => {
          const list = (res && res.list) || [];
          const rainStores = [];
          if (list && list.length > 0) {
            list.map(item => {
              const { name, status, alias } = item;
              if (status === 1) {
                rainStores.push(
                  Object.assign({}, item, { tab: alias || name, key: name })
                );
              }
            });
          }
          this.setState({
            rainStoreTab: rainStores
          });
          if (scopeMax && scopeMax !== 'localApplication') {
            this.handleTabMaxChange(scopeMax);
          }
        }
      });
    };
  
    getHelmMarketsTab = () => {
      const { dispatch, currentEnterprise, isHelm = true } = this.props;
      if (isHelm) {
        dispatch({
          type: 'market/fetchHelmMarketsTab',
          payload: {
            enterprise_id: currentEnterprise.enterprise_id
          },
          callback: res => {
            if (res && res.status_code === 200) {
              const helmStores = [];
              if (Array.isArray(res)) {
                res.map(item => {
                  helmStores.push(
                    Object.assign({}, item, {
                      tab: item.name,
                      key: `Helm-${item.name}`
                    })
                  );
                });
              }
              this.setState({
                helmStoreTab: helmStores
              });
            }
          }
        });
      }
    };
    getHelmAppStore = name => {
      const { dispatch, currentEnterprise } = this.props;
      const { helmPag } = this.state;
      const payload = Object.assign(
        {},
        {
          name,
          enterprise_id: currentEnterprise.enterprise_id
        },
        helmPag
      );
      dispatch({
        type: 'market/fetchHelmAppStore',
        payload,
        callback: res => {
          if (res && res.status_code === 200) {
            const setHelmPag = Object.assign({}, helmPag, {
              total: (res && res.length) || 0
            });
            let helmList = [];
            if (Array.isArray(res)) {
              const helmQuery = helmPag.query;
              const helmPage = helmPag.page;
              if (helmQuery) {
                const arr = [];
                const ql = helmQuery.length;
                res.map(item => {
                  if (ql <= item.name.length) {
                    const str = item.name.substring(0, ql);
                    if (str.indexOf(helmQuery) > -1) {
                      arr.push(item);
                    }
                  }
                });
                setHelmPag.total = arr.length;
                helmList =
                  arr.length > 9 ? arr.splice((helmPage - 1) * 9, 9) : arr;
              } else {
                helmList = res.splice(helmPage > 1 ? (helmPage - 1) * 9 : 0, 9);
              }
            }
            this.setState({
              helmLoading: false,
              helmList,
              helmPag: setHelmPag
            });
          }
        }
      });
    };
  
    handleSearch = v => {
      const { scopeMax } = this.state;
      if (scopeMax === 'localApplication') {
        this.setState(
          {
            app_name: v,
            page: 1
          },
          () => {
            this.getApps();
          }
        );
      } else if (scopeMax.indexOf('Helm-') > -1) {
        const { helmPag } = this.state;
        const setHelmPag = Object.assign({}, helmPag, {
          page: 1,
          query: v
        });
        this.setState({ helmPag: setHelmPag }, () => {
          this.getHelmAppStore(scopeMax.slice(5));
        });
      } else {
        this.setState(
          {
            cloudApp_name: v,
            cloudPage: 1
          },
          () => {
            this.getCloudRecommendApps();
          }
        );
      }
    };
  
    hanldePageChange = page => {
      this.setState(
        {
          page
        },
        () => {
          this.getApps();
        }
      );
    };
  
    hanldeCloudPageChange = page => {
      this.setState(
        {
          cloudPage: page
        },
        () => {
          this.getCloudRecommendApps();
        }
      );
    };
    hanldeHelmPageChange = page => {
      const { helmPag, scopeMax } = this.state;
      const paginfo = Object.assign({}, helmPag, { page });
      this.setState(
        {
          helmPag: paginfo
        },
        () => {
          this.getHelmAppStore(scopeMax.slice(5));
        }
      );
    };
    handleTabChange = key => {
      this.setState(
        {
          scope: key,
          page: 1
        },
        () => {
          this.getApps();
        }
      );
    };
  
    handleTabMaxChange = key => {
      this.setState(
        {
          page: 1,
          cloudPage: 1,
          currentKey: key,
          scopeMax: key,
          isSpinList: true,
          isSpincloudList: true,
          app_name: '',
          cloudApp_name: ''
        },
        () => {
          if (key === 'localApplication') {
            this.getApps('reset');
          } else if (key.indexOf('Helm-') > -1) {
            this.getHelmAppStore(key.slice(5));
          } else if(key != 'command'){
            this.getCloudRecommendApps('reset');
          }
        }
      );
      this.loadMore(key)
    };
  
    showCreate = app => {
      const { handleType } = this.state;
      if (handleType) {
        this.setState({ installBounced: app });
      } else {
        this.setState({ showCreate: app });
      }
    };
    handleHelmIntall = app => {
      const { scopeMax, helmStoreTab } = this.state;
      let info = {};
  
      helmStoreTab.map(item => {
        if (item.key === scopeMax) {
          info = item;
        }
      });
      this.setState({
        helmCreate: Object.assign({}, app, info, {
          app_store_name: scopeMax.slice(5)
        })
      });
    };
    handleInstallBounced = e => {
      e.preventDefault();
      const { form, dispatch, groupId, refreshCurrent } = this.props;
      const {
        installBounced,
        is_deploy,
        scopeMax,
        handleType,
        currentKey
      } = this.state;
      const teamName = globalUtil.getCurrTeamName();
  
      form.validateFields((err, Value) => {
        if (err) return;
        dispatch({
          type: 'createApp/installApp',
          payload: {
            team_name: teamName,
            group_id: groupId || 0,
            app_id: installBounced.app_id,
            is_deploy,
            group_key: installBounced.ID,
            app_version: Value.group_version,
            marketName: currentKey,
            install_from_cloud: scopeMax !== 'localApplication'
          },
          callback: () => {
            // 刷新左侧按钮
            dispatch({
              type: 'global/fetchGroups',
              payload: {
                team_name: teamName
              }
            });
  
            // 关闭弹框
            this.setState({ installBounced: false, is_deploy: true });
            if (handleType && refreshCurrent) {
              refreshCurrent();
            }
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${groupId ||
                  0}`
              )
            );
          }
        });
      });
    };
    handleCreate = (vals, is_deploy) => {
      this.setState({
        addAppLoading: true
      });
      const { dispatch } = this.props;
      const { showCreate: app, currentKey } = this.state;
      const teamName = globalUtil.getCurrTeamName();
      dispatch({
        type: 'createApp/installApp',
        payload: {
          team_name: teamName,
          ...vals,
          app_id: app.app_id,
          is_deploy,
          group_key: app.group_key,
          app_version: vals.group_version,
          marketName: currentKey
        },
        callback: () => {
          // 刷新左侧按钮
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teamName
            },
            callback: () => {
              // 关闭弹框
              this.onCancelCreate();
              dispatch(
                routerRedux.push(
                  `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${
                    vals.group_id
                  }`
                )
              );
            }
          });
        }
      });
    };
    handleCreateHelm = (vals, is_deploy) => {
      const { dispatch } = this.props;
      const teamName = globalUtil.getCurrTeamName();
      this.setState({ helmInstallLoading: true });
      dispatch({
        type: 'createApp/installHelmApp',
        payload: {
          team_name: teamName,
          ...vals,
          is_deploy
        },
        callback: res => {
          // 刷新左侧按钮
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teamName
            },
            callback: () => {
              if (res && res.status_code === 200 && res.bean && res.bean.ID) {
                this.onCancelCreate();
                dispatch(
                  routerRedux.push(
                    `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${res.bean.ID}/helminstall`
                  )
                );
              }
              this.setState({ helmInstallLoading: false });
            },
            renderError: () => {
              this.setState({ helmInstallLoading: false });
            }
          });
        }
      });
    };
    handleCloudCreate = (vals, is_deploy) => {
      this.setState({
        addAppLoading: true
      });
      const { scopeMax, currentKey } = this.state;
      const app = this.state.showCreate;
  
      this.props.dispatch({
        type: 'createApp/installApp',
        payload: {
          app_id: app.app_id,
          team_name: globalUtil.getCurrTeamName(),
          ...vals,
          is_deploy,
          app_versions: app.app_versions,
          group_key: app.app_key_id,
          app_version: vals.group_version,
          install_from_cloud: scopeMax !== 'localApplication',
          marketName: currentKey
        },
        callback: () => {
          // 刷新左侧按钮;
          this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName()
            },
            callback: () => {
              // 关闭弹框
              this.onCancelCreate();
              this.setState({ is_deploy: true });
              this.props.dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                    vals.group_id
                  }`
                )
              );
            }
          });
        }
      });
    };
  
    handleVisibleChange = (item, flag) => {
      const newvisible = this.state.visiblebox;
      const { ID } = item;
      newvisible[ID] = flag;
      this.setState({ visiblebox: newvisible });
      this.queryExport(item);
    };
    showMarketAppDetail = app => {
      // cloud app
      if (app && app.app_detail_url) {
        window.open(app.app_detail_url, '_blank');
        return;
      }
      this.setState({
        showApp: app,
        showMarketAppDetail: true
      });
    };
    hideMarketAppDetail = () => {
      this.setState({
        showApp: {},
        showMarketAppDetail: false
      });
    };
    loadMore = (scopeMax) => {
      this.props.handleServiceComponent(scopeMax);
    };
  
    handleTabs = (tabList, cardList) => {
      const { handleType } = this.state;
      return (
        <Tabs
          defaultActiveKey=""
          onChange={this.handleTabChange}
          style={{
            background: '#fff',
            padding: handleType ? '0 20px 20px' : '20px '
          }}
        >
          {tabList.map(item => {
            const { key, tab } = item;
            return (
              <TabPane tab={tab} key={key}>
                <div
                  className={PluginStyles.cardList}
                  style={{ paddingBottom: '20px' }}
                >
                  {cardList}
                </div>
              </TabPane>
            );
          })}
        </Tabs>
      );
    };
    // eslint-disable-next-line react/sort-comp
    renderApp = (item, isInstall, type) => {
      const { archInfo } = this.props
      const { scopeMax, handleType } = this.state;
      const cloud = scopeMax != 'localApplication';
      const title = item => (
        <div
          title={item.app_name || item.name || ''}
          style={{
            maxWidth: '200px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}
        >
          <a
            onClick={() => {
              this.showMarketAppDetail(item);
            }}
          >
            {item.app_name || item.name}
          </a>
        </div>
      );
      const versionBox = (
        <div title={item.version} className={PluginStyles.cardVersionStyle}>
          <span>{formatMessage({id:'otherApp.marketDrawer.edition'})}</span>
          <div className={PluginStyles.overScroll}>
            <div>
              {item.versions_info &&
                item.versions_info.map((items, index) => {
                  return (
                    <Tag
                      title={items.version}
                      className={PluginStyles.cardVersionTagStyle}
                      color="green"
                      size="small"
                      key={index}
                    >
                      {items.version}
                    </Tag>
                  );
                })}
              {item.versions &&
                item.versions.map((itemx, index) => {
                  return (
                    <Tag
                      className={PluginStyles.cardVersionTagStyle}
                      color="green"
                      size="small"
                      title={itemx.app_version || itemx.version}
                      key={index}
                    >
                      {itemx.app_version || itemx.version}
                    </Tag>
                  );
                })}
            </div>
          </div>
        </div>
      );
      const fastactions = [
        <Tooltip title={isInstall ? formatMessage({id:'otherApp.marketDrawer.click'}) : formatMessage({id:'otherApp.marketDrawer.not'})}>
          <div
            onClick={() => {
              if (isInstall) {
                this.showCreate(item);
              }
            }}
          >
            <div className={PluginStyles.cardTitle}>
              <span title={item.app_name}>{item.app_name}</span>
            </div>
            {versionBox}
          </div>
        </Tooltip>
      ];
      const defaultActions = isInstall
        ? [
            <span
              onClick={() => {
                if (type === 'helm') {
                  this.handleHelmIntall(item);
                } else {
                  this.showCreate(item);
                }
              }}
            >
              {formatMessage({id:'button.install'})}
            </span>
          ]
        : [];
      const appIcon = require('../../../public/images/app_icon.jpg');
      return (
        <Fragment>
          {(item.is_official == true || item.is_official == 1) && (
            <GoodrainRZ style={{ marginLeft: 6, marginTop: 6 }} />
          )}
          <Card
            className={
              handleType
                ? `${PluginStyles.cards} ${PluginStyles.clearAvatar}`
                : PluginStyles.cards
            }
            actions={handleType ? fastactions : defaultActions}
          >
            <Card.Meta
              className={PluginStyles.cardsMetas}
              style={
                handleType && {
                  height: 80,
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }
              }
              avatar={
                <img
                  style={
                    handleType
                      ? { width: 80, height: 80, margin: ' 0 auto' }
                      : { width: 110, height: 110, margin: ' 0 auto' }
                  }
                  alt={item.title}
                  src={
                    cloud
                      ? item.logo || item.icon || appIcon
                      : item.pic || appIcon
                  }
                  height={handleType ? 154 : 80}
                  onClick={() => {
                    this.showMarketAppDetail(item);
                  }}
                />
              }
              title={handleType ? '' : title(item)}
              description={
                handleType ? (
                  ''
                ) : (
                  <Fragment>
                    <span
                      style={{
                        display: 'block',
                        color: 'rgb(200, 200, 200)',
                        marginBottom: 2,
                        fontSize: 12
                      }}
                    >
                      {versionBox}
                      {!cloud && (
                        <div className={PluginStyles.memoryStyle}>
                          <span>{formatMessage({id:'otherApp.marketDrawer.Memory'})}</span>
                          {sourceUtil.unit(item.min_memory || 128, 'MB')}
                        </div>
                      )}
                    </span>
                    <Ellipsis className={PluginStyles.item} lines={3}>
                      <span title={item.describe || item.description}>
                        {item.describe || item.description}
                      </span>
                    </Ellipsis>
                  </Fragment>
                )
              }
            />
          </Card>
        </Fragment>
      );
    };
    renderSuccessOnChange = () => {
      this.setState({
        is_deploy: !this.state.is_deploy
      });
    };
    renderFormComponent = () => {
      const formItemLayout = {
        labelCol: {
          span: 5
        },
        wrapperCol: {
          span: 19
        }
      };
      const { form } = this.props;
      const { getFieldDecorator } = form;
      const { installBounced } = this.state;
      const versionList = installBounced.versions_info || installBounced.versions;
  
      return (
        <Form
          onSubmit={this.handleInstallBounced}
          layout="horizontal"
          hideRequiredMark
        >
          <Form.Item {...formItemLayout} label={formatMessage({id:'otherApp.marketDrawer.Select_version'})}>
            {getFieldDecorator('group_version', {
              initialValue: versionList[0].version || versionList[0].app_version,
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'otherApp.marketDrawer.input_version'})
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                style={{ width: '220px' }}
              >
                {versionList.map(item => {
                  return (
                    <Option
                      key={item.version}
                      value={item.version || item.app_version}
                    >
                      {item.version || item.app_version}

                    </Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
        </Form>
      );
    };
  
    handleCertification = marketName => {
      this.setState({
        authorizations: marketName
      });
    };
  
    render() {
      const {
        loading,
        currentEnterprise,
        currentTeam,
        currentRegionName,
        isHelm = true,
        archInfo
      } = this.props;
      const {
        handleType,
        moreState,
        installBounced,
        list,
        scopeMax,
        cloudList,
        cloudPage,
        cloudPageSize,
        cloudTotal,
        isSpinList,
        isSpincloudList,
        networkText,
        page,
        pageSize,
        total,
        helmInstallLoading,
        currentKey,
        authorizations,
        showCreate,
        showMarketAppDetail,
        showApp,
        is_deploy: isDeploy,
        app_name: appName,
        cloudApp_name: cloudAppName,
        helmList,
        helmPag,
        helmLoading,
        helmCreate,
        addAppLoading,
        localAppTab,
        rainStoreTab,
        helmStoreTab,
      } = this.state;
      
      const dockerSvg = globalUtil.fetchSvg('dockerSvg');
      const setHideOnSinglePage = !!moreState;
      const paginationProps = {
        current: moreState ? 1 : page,
        pageSize: moreState ? 3 : pageSize,
        total: moreState ? 1 : total,
        hideOnSinglePage: setHideOnSinglePage,
        onChange: v => {
          this.hanldePageChange(v);
        }
      };
      const cloudPaginationProps = {
        current: moreState ? 1 : cloudPage,
        pageSize: moreState ? 3 : cloudPageSize,
        total: moreState ? 1 : cloudTotal,
        hideOnSinglePage: setHideOnSinglePage,
        onChange: v => {
          this.hanldeCloudPageChange(v);
        }
      };
      const helmPaginationProps = {
        current: moreState ? 1 : helmPag.page,
        pageSize: moreState ? 3 : helmPag.pageSize,
        total: moreState ? 1 : helmPag.total,
        hideOnSinglePage: setHideOnSinglePage,
        onChange: v => {
          this.hanldeHelmPageChange(v);
        }
      };
      let isInstall = true;
  
      const marketTab = [...localAppTab, ...rainStoreTab, ...helmStoreTab];
  
      if (marketTab && marketTab.length > 0) {
        const arr = marketTab.filter(item => {
          return item.name === currentKey;
        });
        if (arr && arr.length > 0) {
          isInstall = fetchMarketAuthority(arr[0], 'ReadInstall');
        }
      }
      const mores = handleType &&
        moreState &&
        ((scopeMax === 'localApplication' && list && list.length > 0) ||
          (scopeMax != 'localApplication' &&
            cloudList &&
            cloudList.length > 0)) && (
          <div
            style={{
              textAlign: 'right',
              height: '70px',
              marginTop: '-40px',
              position: 'relative',
              zIndex: 99
            }}
          >
            <a onClick={this.loadMore}>{formatMessage({id:'otherApp.marketDrawer.more'})}</a>
          </div>
        );
      //本地组件库
      const cardList = (
        <List
          bordered={false}
          grid={{
            gutter: 24,
            lg: 3,
            md: 2,
            sm: 1,
            xs: 1
          }}
          locale={{
            emptyText: !isSpinList && list && list.length <= 0 && (
              <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
                {formatMessage({id:'notification.market.hint.null_app1'})}
                <br />
                <br />
                {formatMessage({id:'notification.market.hint.null_app2'})}
              </p>
            )
          }}
          pagination={paginationProps}
          dataSource={list}
          renderItem={item => (
            <List.Item style={{ border: 'none' }}>
              {this.renderApp(item, true)}
            </List.Item>
          )}
        />
      );
      //开源应用商店
      const cloudCardList = (
        <List
          bordered={false}
          grid={{
            gutter: 24,
            lg: 3,
            md: 2,
            sm: 1,
            xs: 1
          }}
          pagination={cloudPaginationProps}
          dataSource={cloudList}
          renderItem={item => (
            <List.Item style={{ border: 'none' }}>
              {this.renderApp(item, isInstall)}
            </List.Item>
          )}
        />
      );
      const helmCardList = (
        <List
          bordered={false}
          grid={{
            gutter: 24,
            lg: 3,
            md: 2,
            sm: 1,
            xs: 1
          }}
          pagination={helmPaginationProps}
          dataSource={helmList}
          renderItem={item => {
            let info = item;
            if (item.versions && item.versions.length > 0) {
              info = Object.assign({}, item, item.versions[0]);
            }
            return (
              <List.Item style={{ border: 'none' }}>
                {this.renderApp(info, true, 'helm')}
              </List.Item>
            );
          }}
        />
      );
      const defaultValue =
        scopeMax == 'localApplication' ? appName : cloudAppName;
      //搜索框
      const mainSearch = (
        <div
          style={{
            textAlign: 'center'
          }}
        >
          {scopeMax != 'command' &
          <span id="searchWrap" style={{ display: 'inline-block' }}>
            <Input.Search
              // eslint-disable-next-line react/no-string-refs
              ref="searchs"
              placeholder={formatMessage({id:'placeholder.group_name'})}
              enterButton={formatMessage({id:'button.search'})}
              size="large"
              value={defaultValue}
              onChange={event => {
                this.setState({
                  app_name: event.target.value,
                  cloudApp_name: event.target.value
                });
              }}
              defaultValue={defaultValue}
              onSearch={this.handleSearch}
              style={{
                width: 500
              }}
            />
          </span>}
        </div>
      );
  
      const tabAllList = [
        {
          key: '',
          tab: formatMessage({id:'popover.applicationMarket.all'})
        }
      ];
      const tabComponentList = [
        {
          key: 'enterprise',
          tab: formatMessage({id:'popover.applicationMarket.company'})
        },
        {
          key: 'team',
          tab: formatMessage({id:'popover.applicationMarket.team'})
        }
      ];
      const tabList = tabAllList.concat(tabComponentList);
  
      let breadcrumbList = [];
      breadcrumbList = createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      );
      breadcrumbList.push({ title: formatMessage({id:'otherApp.marketDrawer.creat'}) });
  
      const SpinBox = (
        <div
          style={{
            height: '255px',
            lineHeight: '255px',
            textAlign: 'center'
          }}
        >
          <Spin size="large" />
        </div>
      );
      return (
        <div>
          {authorizations && (
            <AuthCompany
              eid={currentEnterprise.enterprise_id}
              marketName={authorizations}
              title={formatMessage({id:'otherApp.marketDrawer.store'})}
              onCancel={() => {
                this.setState({ authorizations: false });
              }}
              currStep={2}
            />
          )}
          {helmCreate && (
            <CreateAppFromHelmForm
              installLoading={helmInstallLoading}
              data={helmCreate}
              onSubmit={this.handleCreateHelm}
              onCancel={this.onCancelCreate}
            />
          )}
          {showCreate && (
            <CreateAppFromMarketForm
              disabled={loading.effects['createApp/installApp']}
              onSubmit={
                handleType
                  ? this.handleCreate
                  : scopeMax == 'localApplication'
                  ? this.handleCreate
                  : this.handleCloudCreate
              }
              onCancel={this.onCancelCreate}
              showCreate={showCreate}
              addAppLoading={addAppLoading}
            />
          )}
  
          {showMarketAppDetail && (
            <MarketAppDetailShow
              onOk={this.hideMarketAppDetail}
              onCancel={this.hideMarketAppDetail}
              app={showApp}
            />
          )}
        
          {marketTab && marketTab.length > 0 && (
            <div>
              <PageHeaderLayout
                isSvg
                breadcrumbList={breadcrumbList}
                content={handleType ? (!moreState ? mainSearch : '') : mainSearch}
                tabList={marketTab}
                tabActiveKey={scopeMax}
                onTabChange={this.handleTabMaxChange}
                isFooter={!!handleType}
                isDrawer={true}
              >
                {scopeMax !== 'localApplication' && !isInstall && (
                  <Alert
                    message={
                      <div>
                        {formatMessage({id:'notification.market.hint.null_app5'})}
                        <a
                          onClick={() => {
                            this.handleCertification(scopeMax);
                          }}
                        >
                          {formatMessage({id:'notification.market.hint.null_app6'})}
                        </a>
                      </div>
                    }
                    type="success"
                    style={{ margin: '-10px 0 15px 0' }}
                  />
                )}
                {scopeMax.indexOf('Helm-') > -1 && isHelm ? (
                  
                  <div>{helmLoading ? SpinBox : helmCardList}</div>
                ) : scopeMax === 'localApplication' ? (
                  <div
                    style={{
                      marginBottom:
                        !moreState &&
                        handleType &&
                        handleType === 'Service' &&
                        '40px'
                    }}
                  >
                  </div>
                ) : (
                  <div>
                    {isSpincloudList && isSpincloudList !== -1 ? (
                      SpinBox
                    ) : (
                      <div>
                        <div
                          className={PluginStyles.cardList}
                          style={{
                            paddingBottom: '20px',
                            marginBottom: !moreState ? '40px' : '0px'
                          }}
                        >
                          {isSpincloudList !== -1 && cloudCardList}
                          {networkText && (
                            <Alert
                              style={{ textAlign: 'center', marginBottom: 16 }}
                              message={networkText}
                              type="warning"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </PageHeaderLayout>
            </div>
          )}
        </div>
      );
    }
  }
  
import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import {
  Card,
  Form,
  List,
  Input,
  Modal,
  Button,
  Tabs,
  Radio,
  Select,
  Tag,
  Spin,
  Alert,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CreateAppFromMarketForm from '../../components/CreateAppFromMarketForm';
import Ellipsis from '../../components/Ellipsis';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import GoodrainRZ from '../../components/GoodrainRenzheng';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import rainbondUtil from '../../utils/rainbond';
import sourceUtil from '../../utils/source-unit';
import { fetchMarketAuthority } from '../../utils/authority';
import PluginStyles from '../Plugin/Index.less';
import styles from '../../components/CreateTeam/index.less';

const { Option } = Select;
const { TabPane } = Tabs;

@connect(
  ({ global, loading, teamControl, enterprise }) => ({
    loading,
    enterprise: global.enterprise,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
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
      enterprise,
      moreState,
    } = this.props;
    const appName = decodeURIComponent(
      handleType === 'Service'
        ? ''
        : (match && match.params && match.params.keyword) || ''
    );
    this.state = {
      list: [],
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
      showCreate: null,
      scope,
      scopeMax: 'localApplication',
      showApp: {},
      showMarketAppDetail: false,
      installBounced: false,
      handleType: handleType || null,
      moreState: moreState || null,
      is_deploy: true,
      marketTabLoading: false,
      marketTab: [],
      currentKey: '',
    };
    this.mount = false;
  }
  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  componentDidMount() {
    this.mount = true;
    this.getApps();
    this.getMarketsTab();
  }
  componentWillUnmount() {
    this.mount = false;
    this.mountquery = false;
  }

  onCancelCreate = () => {
    this.setState({ showCreate: null });
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
        page: v ? 1 : this.state.cloudPage,
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              cloudList: data.list || [],
              cloudTotal: data.total,
            },
            () => {
              if (
                data._code &&
                data._code === 210 &&
                data._condition &&
                data._condition === 10503
              ) {
                this.setState({
                  isSpincloudList: -1,
                  networkText: data.msg_show,
                });
              } else {
                this.setState({
                  isSpincloudList: false,
                });
              }
            }
          );
        } else {
          this.setState({ isSpincloudList: false });
        }
      },
    });
  };
  getApps = v => {
    const { currentEnterprise } = this.props;
    this.props.dispatch({
      type: 'market/fetchAppModels',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        app_name: v ? '' : this.state.app_name || '',
        scope: v ? '' : this.state.scope,
        page_size: v ? 9 : this.state.pageSize,
        page: v ? 1 : this.state.page,
        is_complete: 1,
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              list: data.list || [],
              total: data.total,
            },
            () => {
              this.setState({
                isSpinList: false,
              });
            }
          );
        } else {
          this.setState({ isSpinList: false });
        }
      },
    });
  };
  getMarketsTab = () => {
    const { dispatch, currentEnterprise, enterprise } = this.props;
    // if (!rainbondUtil.cloudMarketEnable(enterprise)) {
    //   return null;
    // }
    this.setState({ marketTabLoading: true });
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          const arr = res.list;
          const arryNew = [];
          if (arr && arr.length > 0) {
            res.list.map(item => {
              const { name, status, alias } = item;
              if (status == 1) {
                arryNew.push(
                  Object.assign({}, item, { tab: alias || name, key: name })
                );
              }
            });
          }
          this.setState({
            marketTabLoading: false,
            marketTab: arryNew,
          });
        }
      },
    });
  };
  handleSearch = v => {
    const { scopeMax } = this.state;
    if (scopeMax == 'localApplication') {
      this.setState(
        {
          app_name: v,
          page: 1,
        },
        () => {
          this.getApps();
        }
      );
    } else {
      this.setState(
        {
          cloudApp_name: v,
          cloudPage: 1,
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
        page,
      },
      () => {
        this.getApps();
      }
    );
  };

  hanldeCloudPageChange = page => {
    this.setState(
      {
        cloudPage: page,
      },
      () => {
        this.getCloudRecommendApps();
      }
    );
  };

  handleTabChange = key => {
    this.setState(
      {
        scope: key,
        page: 1,
      },
      () => {
        this.getApps();
      }
    );
  };

  handleTabMaxChange = key => {
    this.setState(
      {
        currentKey: key,
        scopeMax: key,
        isSpinList: true,
        isSpincloudList: true,
        app_name: '',
        cloudApp_name: '',
      },
      () => {
        if (key == 'localApplication') {
          this.getApps('reset');
        } else {
          this.getCloudRecommendApps('reset');
        }
      }
    );
  };

  showCreate = app => {
    const { handleType } = this.state;
    if (handleType) {
      this.setState({ installBounced: app });
    } else {
      this.setState({ showCreate: app });
    }
  };
  handleInstallBounced = e => {
    e.preventDefault();
    const { form, dispatch, groupId, refreshCurrent } = this.props;
    const {
      installBounced,
      is_deploy,
      scopeMax,
      handleType,
      currentKey,
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
          install_from_cloud: scopeMax !== 'localApplication',
        },
        callback: () => {
          // 刷新左侧按钮
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teamName,
            },
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
        },
      });
    });
  };
  handleCreate = (vals, is_deploy) => {
    const { dispatch } = this.props;
    const { showCreate: app } = this.state;
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
      },
      callback: () => {
        // 刷新左侧按钮
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: teamName,
          },
          callback: () => {
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${
                  vals.group_id
                }`
              )
            );
          },
        });
      },
    });
  };

  handleCloudCreate = (vals, is_deploy) => {
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
        marketName: currentKey,
      },
      callback: () => {
        // 刷新左侧按钮
        this.props.dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
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
          },
        });
      },
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
      showMarketAppDetail: true,
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false,
    });
  };
  loadMore = () => {
    this.props.handleServiceComponent();
  };

  handleTabs = (tabList, cardList) => {
    const { handleType } = this.state;
    return (
      <Tabs
        defaultActiveKey=""
        onChange={this.handleTabChange}
        style={{
          background: '#fff',
          padding: handleType ? '0 20px 20px' : '20px ',
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
  renderApp = (item, isInstall) => {
    const { scopeMax, handleType } = this.state;
    const cloud = scopeMax != 'localApplication';

    const title = item => (
      <div
        title={item.app_name || ''}
        style={{
          maxWidth: '200px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        <a
          onClick={() => {
            this.showMarketAppDetail(item);
          }}
        >
          {item.app_name}
        </a>
      </div>
    );
    const versionBox = (
      <div title={item.version} className={PluginStyles.cardVersionStyle}>
        <span>版本:</span>
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
                    title={itemx.app_version}
                    key={index}
                  >
                    {itemx.app_version}
                  </Tag>
                );
              })}
          </div>
        </div>
      </div>
    );
    const fastactions = [
      <div
        onClick={() => {
          isInstall && this.showCreate(item);
        }}
      >
        <div className={PluginStyles.cardTitle}>
          <span title={item.app_name}>{item.app_name}</span>
          {isInstall && <span>安装</span>}
        </div>
        {versionBox}
      </div>,
    ];

    const defaultActions = isInstall
      ? [
        <span
            onClick={() => {
              this.showCreate(item);
            }}
          >
            安装
          </span>,
        ]
      : [];

    return (
      <Fragment>
        {(item.is_official == true || item.is_official == 1) && (
          <GoodrainRZ style={{ marginLeft: 6, marginTop: 6 }} />
        )}
        <Card
          className={PluginStyles.cards}
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
                cursor: 'pointer',
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
                    ? item.logo
                    : item.pic || require('../../../public/images/app_icon.jpg')
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
                      fontSize: 12,
                    }}
                  >
                    {versionBox}
                    {!cloud && (
                      <div className={PluginStyles.memoryStyle}>
                        <span>内存: </span>
                        {sourceUtil.unit(item.min_memory || 128, 'MB')}
                      </div>
                    )}
                  </span>
                  <Ellipsis className={PluginStyles.item} lines={3}>
                    <span title={item.describe}>{item.describe}</span>
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
      is_deploy: !this.state.is_deploy,
    });
  };
  renderFormComponent = () => {
    const formItemLayout = {
      labelCol: {
        span: 5,
      },
      wrapperCol: {
        span: 19,
      },
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
        <Form.Item {...formItemLayout} label="安装版本">
          {getFieldDecorator('group_version', {
            initialValue: versionList[0].version || versionList[0].app_version,
            rules: [
              {
                required: true,
                message: '请选择版本',
              },
            ],
          })(
            <Select style={{ width: '220px' }}>
              {versionList.map((item, index) => {
                return (
                  <Option key={index} value={item.version || item.app_version}>
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
  render() {
    const {
      loading,
      enterprise,
      currentEnterprise,
      currentTeam,
      currentRegionName,
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
      marketTab,
      currentKey,
    } = this.state;

    const paginationProps = {
      current: moreState ? 1 : page,
      pageSize: moreState ? 3 : pageSize,
      total: moreState ? 1 : total,
      onChange: v => {
        this.hanldePageChange(v);
      },
    };
    const cloudPaginationProps = {
      current: moreState ? 1 : cloudPage,
      pageSize: moreState ? 3 : cloudPageSize,
      total: moreState ? 1 : cloudTotal,
      onChange: v => {
        this.hanldeCloudPageChange(v);
      },
    };
    let isInstall = true;

    if (marketTab && marketTab.length > 0) {
      const arr = marketTab.filter(item => {
        return item.name == currentKey;
      });
      if (arr && arr.length > 0) {
        isInstall = fetchMarketAuthority(arr[0], 'ReadInstall');
      }
    }
    const cardList = (
      <List
        bordered={false}
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1,
        }}
        locale={{
          emptyText: !isSpinList && list && list.length <= 0 && (
            <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
              暂无应用模型， 你可以
              <br />
              <br />
              发布应用模型
            </p>
          ),
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

    const cloudCardList = (
      <List
        bordered={false}
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1,
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

    const mainSearch = (
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <span id="searchWrap" style={{ display: 'inline-block' }}>
          <Input.Search
            ref="searchs"
            placeholder="请输入应用名称"
            enterButton="搜索"
            size="large"
            value={
              this.state.scopeMax == 'localApplication'
                ? this.state.app_name
                : this.state.cloudApp_name
            }
            onChange={event => {
              this.setState({
                app_name: event.target.value,
                cloudApp_name: event.target.value,
              });
            }}
            defaultValue={
              this.state.scopeMax == 'localApplication'
                ? this.state.app_name
                : this.state.cloudApp_name
            }
            onSearch={this.handleSearch}
            style={{
              width: 500,
            }}
          />
        </span>
      </div>
    );

    const tabAllList = [
      {
        key: '',
        tab: '全部',
      },
    ];
    const tabComponentList = [
      {
        key: 'enterprise',
        tab: '公司分享',
      },
      {
        key: 'team',
        tab: '团队分享',
      },
    ];
    const tabList = tabAllList.concat(tabComponentList);
    const tabListMax = [
      {
        key: 'localApplication',
        tab: '本地组件库',
      },
    ].concat(marketTab);

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '创建组件' });

    const SpinBox = (
      <div
        style={{
          height: '300px',
          lineHeight: '300px',
          textAlign: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );

    return (
      <div>
        {this.state.showCreate && (
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
            showCreate={this.state.showCreate}
          />
        )}

        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}

        {handleType && installBounced && (
          <Modal
            title="确认要安装此应用作为你的组件么？"
            className={styles.TelescopicModal}
            visible={installBounced}
            onOk={this.handleInstallBounced}
            onCancel={() => {
              this.setState({ installBounced: false });
            }}
            footer={
              <div>
                <Button
                  onClick={() => {
                    this.setState({
                      installBounced: false,
                      is_deploy: true,
                    });
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={this.handleInstallBounced}
                  type="primary"
                  style={{ marginRight: '5px' }}
                  loading={loading.effects['createApp/installApp']}
                >
                  安装
                </Button>
                <Radio
                  size="small"
                  onClick={this.renderSuccessOnChange}
                  checked={this.state.is_deploy}
                >
                  并构建启动
                </Radio>
              </div>
            }
          >
            <p>{installBounced.describe}</p>
            {this.renderFormComponent()}
          </Modal>
        )}

        <div>
          <PageHeaderLayout
            breadcrumbList={breadcrumbList}
            content={handleType ? (!moreState ? mainSearch : '') : mainSearch}
            tabList={tabListMax}
            tabActiveKey={scopeMax}
            onTabChange={this.handleTabMaxChange}
            isFooter={!!handleType}
          >
            {scopeMax != 'localApplication' && !isInstall && (
              <Alert
                message="当前市场没有安装权限，请联系企业管理员更新市场AccessKey"
                type="success"
                style={{ margin: '-10px 0 15px 0' }}
              />
            )}
            {scopeMax == 'localApplication' ? (
              <div>
                {isSpinList ? SpinBox : this.handleTabs(tabList, cardList)}
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
                        marginBottom: !moreState ? '40px' : '0px',
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

            {handleType && moreState && list && list.length > 0 && (
              <div
                style={{
                  textAlign: 'right',
                  zIndex: 9,
                  position: 'absolute',
                  height: '70px',
                  background: 'white',
                  width: '100%',
                  right: 0,
                  bottom: '-10px',
                }}
              >
                <a onClick={this.loadMore}>查看更多...</a>
              </div>
            )}
          </PageHeaderLayout>
        </div>
      </div>
    );
  }
}

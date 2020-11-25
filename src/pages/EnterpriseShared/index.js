/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/alt-text */
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Empty,
  Icon,
  Input,
  Menu,
  notification,
  Pagination,
  Radio,
  Row,
  Spin,
  Tabs,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import NoComponent from '../../../public/images/noComponent.png';
import AuthCompany from '../../components/AuthCompany';
import ConfirmModal from '../../components/ConfirmModal';
import CreateAppMarket from '../../components/CreateAppMarket';
import CreateAppModels from '../../components/CreateAppModels';
import DeleteApp from '../../components/DeleteApp';
import Lists from '../../components/Lists';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { fetchMarketMap } from '../../utils/authority';
import globalUtil from '../../utils/global';
import userUtil from '../../utils/user';
import ExportOperation from './ExportOperation';
import styles from './index.less';
import TagList from './TagList';

const { TabPane } = Tabs;
const { Search } = Input;

@connect(({ user, global, loading }) => ({
  user: user.currentUser,
  enterprise: global.enterprise,
  upAppMarketLoading: loading.effects['market/upAppMarket'],
  createAppMarketLoading: loading.effects['market/createAppMarket']
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const appStoreAdmin = userUtil.isPermissions(user, 'app_store');
    this.state = {
      marketPag: {
        pageSize: 10,
        total: 0,
        page: 1,
        query: ''
      },
      pageSize: 10,
      total: 0,
      page: 1,
      componentList: [],
      localLoading: true,
      marketLoading: true,
      marketTabLoading: true,
      appStoreAdmin,
      tagList: [],
      tags: [],
      scope: 'enterprise',
      appInfo: false,
      visibles: null,
      bouncedText: '',
      bouncedType: '',
      group_version: null,
      chooseVersion: null,
      deleteApp: false,
      deleteAppMarket: false,
      deleteAppMarketLoading: false,
      createAppModel: false,
      upDataAppModel: false,
      createAppMarket: false,
      moreTags: false,
      editorTags: false,
      seeTag: false,
      marketList: [],
      marketTab: [],
      activeTabKey: 'local',
      marketInfo: false,
      upAppMarket: false,
      showCloudMarketAuth: false,
      showApp: {},
      showMarketAppDetail: false
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }
  onChangeRadio = (e) => {
    this.setState(
      {
        page: 1,
        scope: e.target.value
      },
      () => {
        this.getApps();
      }
    );
  };
  onChangeCheckbox = (checkedValues) => {
    this.setState(
      {
        tags: checkedValues
      },
      () => {
        this.getApps();
      }
    );
  };

  onChangeBounced = (checkedValues) => {
    this.setState({
      chooseVersion: checkedValues
    });
  };

  onPageChangeApp = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.getApps();
    });
  };
  onPageChangeAppMarket = (page, pageSize) => {
    const { marketInfo, marketPag } = this.state;
    const setMarketPag = Object.assign({}, marketPag, {
      page,
      pageSize
    });
    this.setState({ marketPag: setMarketPag }, () => {
      this.getMarkets(marketInfo && marketInfo.name);
    });
  };
  onTabChange = (tabID) => {
    if (tabID === 'add') {
      this.handleOpencreateAppMarket();
      return null;
    }
    const { marketTab } = this.state;
    let arr = [];
    arr = marketTab.filter((item) => {
      return item.ID === Number(tabID);
    });
    const isArr = arr && arr.length > 0;
    const showCloudMarketAuth =
      (isArr && arr[0].access_key === '' && arr[0].domain === 'rainbond') ||
      false;
    this.setState(
      {
        marketInfo: isArr ? arr[0] : false,
        showCloudMarketAuth,
        activeTabKey: `${tabID}`,
        name: '',
        marketList: [],
        marketLoading: false,
        marketPag: {
          pageSize: 10,
          total: 0,
          page: 1,
          query: ''
        }
      },
      () => {
        if (tabID !== 'local' && isArr && arr[0].status === 1) {
          this.getMarkets(arr[0].name);
        }
      }
    );
    return null;
  };

  getApps = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, pageSize, name, scope, tags } = this.state;
    this.setState({ localLoading: true }, () => {
      dispatch({
        type: 'market/fetchAppModels',
        payload: {
          enterprise_id: eid,
          user_id: user.user_id,
          app_name: name,
          scope,
          page,
          page_size: pageSize,
          tags
        },
        callback: (res) => {
          if (res && res._code === 200) {
            this.setState({
              total: res.total,
              componentList: res.list,
              localLoading: false
            });
          }
        }
      });
    });
  };

  getTags = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'market/fetchAppModelsTags',
      payload: {
        enterprise_id: eid
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState({
            tagList: res.list
          });
        }
      }
    });
  };

  getMarketsTab = (ID) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    this.setState({ marketTabLoading: true });
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: eid
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState(
            {
              marketTabLoading: false,
              marketTab: res.list
            },
            () => {
              if (ID) {
                this.onTabChange(ID);
              }
            }
          );
        }
      }
    });
  };

  getMarkets = (name) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { marketPag } = this.state;
    const payload = Object.assign(
      {},
      {
        name,
        enterprise_id: eid
      },
      marketPag
    );
    this.setState({ marketLoading: true });

    dispatch({
      type: 'market/fetchMarkets',
      payload,
      callback: (res) => {
        if (res && res._code === 200) {
          const setMarketPag = Object.assign({}, this.state.marketPag, {
            total: res.total
          });
          this.setState({
            marketLoading: false,
            marketList: res.list,
            marketPag: setMarketPag
          });
        }
      }
    });
  };

  load = () => {
    this.getApps();
    this.getTags();
    this.getMarketsTab();
  };

  handleSearchLocal = (name) => {
    this.setState(
      {
        page: 1,
        name
      },
      () => {
        this.getApps();
      }
    );
  };
  handleSearchMarket = (query) => {
    const { marketPag, marketInfo } = this.state;

    const setMarketPag = Object.assign({}, marketPag, {
      page: 1,
      query
    });
    this.setState(
      {
        marketPag: setMarketPag
      },
      () => {
        this.getMarkets(marketInfo && marketInfo.name);
      }
    );
  };
  handleOpenEditorMoreTags = () => {
    this.setState({ moreTags: true, editorTags: true });
  };
  handleOpenMoreTags = (seeTag) => {
    this.setState({ moreTags: true, seeTag });
  };
  handleCloseMoreTags = () => {
    this.setState({ moreTags: false, editorTags: false, seeTag: false });
  };

  showOfflineApp = (appInfo) => {
    this.setState({
      appInfo,
      deleteApp: true,
      bouncedText: '删除应用模版',
      bouncedType: 'delete'
    });
  };
  handleOpenDeleteAppMarket = () => {
    this.setState({ deleteAppMarket: true });
  };
  handleCloseDeleteAppMarket = () => {
    this.setState({ deleteAppMarket: false });
  };
  handleOkBounced = (values) => {
    const { bouncedType } = this.state;
    this.setState(
      {
        chooseVersion: values.chooseVersion
      },
      () => {
        if (bouncedType == 'delete') {
          this.setState({
            deleteApp: true
          });
        } else {
          this.handleCloudsUpdate(values.chooseVersion);
        }
      }
    );
  };
  handleDeleteApp = () => {
    const { appInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/deleteAppModel',
      payload: {
        enterprise_id: eid,
        app_id: appInfo.app_id
      },
      callback: (res) => {
        if (res && res._code === 200) {
          notification.success({
            message: '删除成功'
          });
          this.handleCancelDelete();
          this.getApps();
        }
      }
    });
  };
  handleDeleteAppMarket = () => {
    const { marketInfo } = this.state;
    this.setState({ deleteAppMarketLoading: true });
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'market/deleteAppMarket',
      payload: {
        enterprise_id: eid,
        marketName: marketInfo.name
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.handleCloseDeleteAppMarket();
          this.getMarketsTab();
          this.setState({
            activeTabKey: 'local',
            marketInfo: false,
            deleteAppMarketLoading: false
          });
          notification.success({
            message: '删除成功'
          });
        }
      }
    });
  };
  handleCancelDelete = () => {
    this.setState({
      deleteApp: null,
      visibles: null,
      group_version: null,
      bouncedText: '',
      bouncedType: '',
      appInfo: false
    });
  };

  handlePageChange = (page) => {
    this.state.page = page;
    this.getApps();
  };

  handleLoadAppDetail = (item, text) => {
    const versions_info =
      item.versions_info && item.versions_info.length > 0 && item.versions_info;
    if (versions_info) {
      this.setState({
        visibles: true,
        group_version: versions_info,
        appInfo: item,
        bouncedText: text
      });
    } else {
      this.setState({ group_version: versions_info, appInfo: item }, () => {
        if (versions_info) {
          this.handleCloudsUpdate(versions_info[0].version);
        }
      });
    }
  };

  // 云更新
  handleCloudsUpdate = (chooseVersion) => {
    const { appInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/syncMarketAppDetail',
      payload: {
        enterprise_id: eid,
        body: {
          app_id: appInfo.app_id,
          app_versions: chooseVersion
        }
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.handleCancelDelete();
          notification.success({ message: '更新成功' });
          this.getApps();
        }
      }
    });
  };

  handleCreateAppModel = () => {
    notification.success({ message: '创建成功' });
    this.getApps();
    this.handleCancelAppModel();
  };

  handleCreateAppMarket = (ID) => {
    const { upAppMarket } = this.state;
    notification.success({ message: upAppMarket ? '编辑成功' : '创建成功' });
    this.getMarketsTab(ID);
    this.handleCancelAppMarket();
  };

  handleCancelAppModel = () => {
    this.setState({
      createAppModel: false,
      appInfo: null
    });
  };
  handleOpenCreateAppModel = () => {
    this.setState({
      createAppModel: true
    });
  };

  handleOpenUpAppMarket = () => {
    this.setState({
      upAppMarket: true
    });
  };

  handleOpencreateAppMarket = () => {
    this.setState({
      createAppMarket: true
    });
  };
  handleCancelAppMarket = () => {
    this.setState({
      createAppMarket: false,
      upAppMarket: false
    });
  };
  handleupDataAppModel = () => {
    notification.success({ message: '编辑成功' });
    this.getApps();
    this.handleCancelupDataAppModel();
  };

  handleOpenUpDataAppModel = (appInfo) => {
    this.setState({
      appInfo,
      upDataAppModel: true
    });
  };
  handleAppModel = (appInfo) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(
      routerRedux.push(`/enterprise/${eid}/shared/app/${appInfo.app_id}`)
    );
  };

  handleCancelupDataAppModel = () => {
    this.setState({
      appInfo: null,
      upDataAppModel: false
    });
  };
  showMarketAppDetail = (app) => {
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
  render() {
    const {
      match: {
        params: { eid }
      },
      upAppMarketLoading
    } = this.props;

    const {
      componentList,
      marketList,
      marketTab,
      localLoading,
      marketLoading,
      tagList,
      appInfo,
      visibles,
      bouncedText,
      appStoreAdmin: {
        isCreateApp,
        isEditApp,
        isDeleteApp,
        isImportApp,
        isExportApp,
        isCreateAppStore,
        isEditAppStore,
        isDeleteAppStore
      },
      activeTabKey,
      marketInfo,
      marketPag
    } = this.state;
    const tagLists = tagList && tagList.length > 0 && tagList;
    const accessActions =
      marketInfo &&
      marketInfo.access_actions &&
      marketInfo.access_actions.length > 0 &&
      marketInfo.access_actions;

    const isMarket = marketInfo && marketInfo.status == 1;
    const defaulAppImg = globalUtil.fetchSvg('defaulAppImg');
    const managementMenu = (info) => {
      const delApp = isDeleteApp && (
        <Menu.Item>
          <a
            onClick={() => {
              this.showOfflineApp(info);
            }}
          >
            删除应用模版
          </a>
        </Menu.Item>
      );

      const editorApp = isEditApp && (
        <Menu.Item>
          <a
            onClick={() => {
              this.handleOpenUpDataAppModel(info);
            }}
          >
            编辑应用模版
          </a>
        </Menu.Item>
      );
      const exportOperation = info &&
        info.versions_info &&
        info.versions_info.length > 0 && (
          <Menu.Item>
            <ExportOperation app={info} eid={eid} />
          </Menu.Item>
        );

      if (exportOperation || editorApp || delApp) {
        return (
          <Menu>
            {isExportApp && exportOperation}
            {editorApp}
            {delApp}
          </Menu>
        );
      }
      return null;
    };
    const operation = (
      <Col span={5} style={{ textAlign: 'right' }} className={styles.btns}>
        {isImportApp && (
          <Button style={{ margin: '0 14px 0 10px' }}>
            <Link to={`/enterprise/${eid}/shared/import`}>离线导入</Link>
          </Button>
        )}
        {isCreateApp && (
          <Button type="primary" onClick={this.handleOpenCreateAppModel}>
            创建应用模版
          </Button>
        )}
      </Col>
    );

    const marketOperation = (
      <div>
        {isDeleteAppStore && (
          <Button
            onClick={this.handleOpenDeleteAppMarket}
            style={{ marginRight: '22px' }}
          >
            删除
          </Button>
        )}
        {isEditAppStore && (
          <Button type="primary" onClick={this.handleOpenUpAppMarket}>
            编辑
          </Button>
        )}
      </div>
    );

    const noLocalMarket = (
      <div className={styles.noShared}>
        <img src={NoComponent} />
        <p>当前无应用模版，请选择方式添加</p>
        <div className={styles.btns}>
          {isCreateApp && (
            <Button type="primary" onClick={this.handleOpenCreateAppModel}>
              创建应用模版
            </Button>
          )}
          {isImportApp && (
            <Button type="primary">
              <Link to={`/enterprise/${eid}/shared/import`}>导入应用模版</Link>
            </Button>
          )}
        </div>
      </div>
    );

    const noCloudMarket = (
      <Empty
        style={{ marginTop: '120px' }}
        image="https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original"
        imageStyle={{
          height: 60
        }}
        description={
          <span>{!isMarket ? '市场未连接、暂无数据' : '暂无数据'}</span>
        }
      >
        {!isMarket && marketOperation}
      </Empty>
    );
    const localsContent = (
      <div>
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            marginTop: '4px'
          }}
        >
          <Col span={19} style={{ textAlign: 'left', display: 'flex' }}>
            <Search
              style={{ width: '250px' }}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearchLocal}
            />
            <div className={styles.serBox}>
              <Radio.Group
                className={styles.setRadioGroup}
                value={this.state.scope}
                onChange={this.onChangeRadio}
              >
                <Radio.Button value="enterprise">企业</Radio.Button>
                <Radio.Button value="team">团队</Radio.Button>
              </Radio.Group>
              {tagLists && <Divider type="vertical" />}
              {tagLists && (
                <Checkbox.Group
                  className={styles.setCheckboxGroup}
                  onChange={this.onChangeCheckbox}
                  value={this.state.tags}
                >
                  {tagLists.map((item, index) => {
                    const { name, tag_id: id } = item;
                    if (index > 4) {
                      return null;
                    }
                    return (
                      <Checkbox key={id} value={name}>
                        {name}
                      </Checkbox>
                    );
                  })}
                  <a
                    onClick={this.handleOpenEditorMoreTags}
                    style={{ float: 'right' }}
                  >
                    更多标签
                  </a>
                </Checkbox.Group>
              )}
            </div>
          </Col>
          {operation}
        </Row>
        {localLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : componentList && componentList.length > 0 ? (
          componentList.map((item) => {
            const {
              app_id: appId,
              pic,
              describe,
              app_name: appName,
              tags,
              versions_info: versionsInfo,
              dev_status: devStatus,
              install_number: installNumber
            } = item;
            return (
              <Lists
                key={appId}
                stylePro={{ marginBottom: '10px' }}
                Cols={
                  <div
                    className={styles.h70}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleAppModel(item);
                    }}
                  >
                    <Col span={3} style={{ display: 'flex' }}>
                      <div className={styles.lt}>
                        <p>
                          <Icon type="arrow-down" />
                          {installNumber}
                        </p>
                      </div>
                      <div className={styles.imgs}>
                        {pic ? <img src={pic} alt="" /> : defaulAppImg}
                      </div>
                    </Col>
                    <Col span={13} className={styles.tits}>
                      <div>
                        <p>
                          <a
                            onClick={(e) => {
                              e.stopPropagation();
                              this.showMarketAppDetail(item);
                            }}
                          >
                            {appName}
                          </a>
                        </p>
                        <p>
                          <Tooltip placement="topLeft" title={describe}>
                            {describe}
                          </Tooltip>
                        </p>
                      </div>
                    </Col>
                    <Col span={4} className={styles.status}>
                      <div>
                        {devStatus && (
                          <p className={styles.dev_status}>{devStatus}</p>
                        )}

                        {versionsInfo && versionsInfo.length > 0 ? (
                          <p className={styles.dev_version}>
                            {versionsInfo[versionsInfo.length - 1].version}
                          </p>
                        ) : (
                          <p className={styles.dev_version}>无版本</p>
                        )}
                      </div>
                    </Col>
                    <Col span={4} className={styles.tags}>
                      {tags &&
                        tags.length > 0 &&
                        tags.map((item, index) => {
                          const { tag_id: tagId, name } = item;
                          if (index > 2) {
                            return null;
                          }
                          return (
                            <div key={tagId} style={{ marginRight: '5px' }}>
                              {name}
                            </div>
                          );
                        })}
                      {tags && tags.length > 3 && (
                        <a
                          style={{ marginLeft: '5px' }}
                          onClick={() => {
                            this.handleOpenMoreTags(tags);
                          }}
                        >
                          更多
                        </a>
                      )}
                    </Col>
                  </div>
                }
                overlay={managementMenu(item)}
              />
            );
          })
        ) : (
          noLocalMarket
        )}

        <div style={{ textAlign: 'right' }}>
          <Pagination
            showQuickJumper
            current={this.state.page}
            pageSize={this.state.pageSize}
            total={Number(this.state.total)}
            onChange={this.onPageChangeApp}
          />
        </div>
      </div>
    );
    const marketContent = (
      <div>
        {isMarket && (
          <Row
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              marginTop: '4px'
            }}
          >
            <Col
              span={19}
              style={{
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div>
                市场已经正常连接，该平台具有&nbsp;
                {accessActions &&
                  accessActions.map((item, index) => {
                    return (
                      <a>
                        {fetchMarketMap(item)}
                        {index < accessActions.length - 1 && (
                          <Divider
                            type="vertical"
                            style={{ background: '#1890ff' }}
                          />
                        )}
                      </a>
                    );
                  })}
                &nbsp;应用权限
              </div>
              <Search
                style={{ width: '400px', marginLeft: '100px' }}
                placeholder="请输入名称进行搜索"
                onSearch={this.handleSearchMarket}
              />
            </Col>
            <Col
              span={5}
              style={{ textAlign: 'right' }}
              className={styles.btns}
            >
              {marketOperation}
            </Col>
          </Row>
        )}
        {marketLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : marketList && marketList.length > 0 ? (
          marketList.map((item) => {
            const {
              app_id: appId,
              logo,
              describe,
              app_name: appName,
              tags,
              versions,
              dev_status: devStatus,
              install_number: installNumber
            } = item;
            return (
              <Lists
                key={appId}
                stylePro={{ marginBottom: '10px' }}
                Cols={
                  <div className={styles.h70}>
                    <Col span={3} style={{ display: 'flex' }}>
                      <div className={styles.lt}>
                        <p>
                          <Icon type="arrow-down" />
                          {installNumber}
                        </p>
                      </div>
                      <div className={styles.imgs}>
                        {logo ? <img src={logo} alt="" /> : defaulAppImg}
                      </div>
                    </Col>
                    <Col span={13} className={styles.tits}>
                      <div>
                        <p>
                          <a
                            onClick={() => {
                              this.showMarketAppDetail(item);
                            }}
                          >
                            {appName}
                          </a>
                        </p>
                        <p>
                          <Tooltip placement="topLeft" title={describe}>
                            {describe}
                          </Tooltip>
                        </p>
                      </div>
                    </Col>
                    <Col span={4} className={styles.status}>
                      <div>
                        {devStatus && (
                          <p className={styles.dev_status}>{devStatus}</p>
                        )}

                        {versions && versions.length > 0 ? (
                          <p className={styles.dev_version}>
                            {versions[0].app_version}
                          </p>
                        ) : (
                          <p className={styles.dev_version}>无版本</p>
                        )}
                      </div>
                    </Col>
                    <Col span={4} className={styles.tags}>
                      {tags &&
                        tags.length > 0 &&
                        tags.map((item, index) => {
                          if (index > 2) {
                            return null;
                          }
                          return (
                            <div key={item} style={{ marginRight: '5px' }}>
                              {item}
                            </div>
                          );
                        })}
                      {tags && tags.length > 3 && (
                        <a
                          style={{ marginLeft: '5px' }}
                          onClick={() => {
                            this.handleOpenMoreTags(tags);
                          }}
                        >
                          更多
                        </a>
                      )}
                    </Col>
                  </div>
                }
              />
            );
          })
        ) : (
          noCloudMarket
        )}

        <div style={{ textAlign: 'right' }}>
          <Pagination
            showQuickJumper
            current={marketPag.page}
            pageSize={marketPag.pageSize}
            total={Number(marketPag.total)}
            onChange={this.onPageChangeAppMarket}
          />
        </div>
      </div>
    );
    return (
      <PageHeaderLayout
        title="应用市场管理"
        content="应用模型是指模型化、标准化的应用制品包，是企业数字资产的应用化产物，可以通过标准的方式安装到任何Rainbond平台或其他支持的云原生平台"
      >
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
        {this.state.moreTags && (
          <TagList
            title="查看标签"
            onOk={this.handleCloseMoreTags}
            onChangeCheckbox={this.onChangeCheckbox}
            onCancel={this.handleCloseMoreTags}
            tagLists={tagLists}
            seeTag={this.state.seeTag}
            checkedValues={this.state.tags}
            componentList={this.state.componentList}
            editorTags={this.state.editorTags}
          />
        )}
        {this.state.deleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            desc="确定要删除此应用模型吗?"
            subDesc="删除后其他人将无法安装此应用模型"
            title="删除应用模版"
            onCancel={this.handleCancelDelete}
          />
        )}
        {this.state.deleteAppMarket && (
          <ConfirmModal
            onOk={this.handleDeleteAppMarket}
            loading={this.state.deleteAppMarketLoading}
            subDesc="此操作不可恢复"
            desc={`确定要删除此${marketInfo.alias}吗?`}
            title={`删除${marketInfo.alias}`}
            onCancel={this.handleCloseDeleteAppMarket}
          />
        )}

        {this.state.createAppModel && (
          <CreateAppModels
            title="创建应用模版"
            eid={eid}
            onOk={this.handleCreateAppModel}
            onCancel={this.handleCancelAppModel}
          />
        )}

        {this.state.createAppMarket && (
          <AuthCompany
            eid={eid}
            title="添加应用商店"
            onCancel={this.handleCancelAppMarket}
            currStep={1}
          />
        )}
        {/* {this.state.createAppMarket && (
          <CreateAppMarket
            title="添加应用商店"
            eid={eid}
            loading={createAppMarketLoading}
            onOk={this.handleCreateAppMarket}
            onCancel={this.handleCancelAppMarket}
          />
        )} */}
        {this.state.upAppMarket && (
          <CreateAppMarket
            title="编辑应用商店连接信息"
            eid={eid}
            loading={upAppMarketLoading}
            marketInfo={marketInfo}
            onOk={this.handleCreateAppMarket}
            onCancel={this.handleCancelAppMarket}
          />
        )}
        {this.state.upDataAppModel && (
          <CreateAppModels
            title="编辑应用模版"
            eid={eid}
            appInfo={appInfo}
            onOk={this.handleupDataAppModel}
            onCancel={this.handleCancelupDataAppModel}
          />
        )}
        {visibles && (
          <DeleteApp
            appInfo={appInfo}
            bouncedText={bouncedText}
            onOk={this.handleOkBounced}
            onCancel={this.handleCancelDelete}
            onCheckedValues={this.onChangeBounced}
          />
        )}
        {this.state.showCloudMarketAuth && (
          <AuthCompany
            eid={eid}
            marketName={marketInfo.name}
            title="您在该云应用商店无安装权限，请登录获取授权"
            onCancel={() => {
              this.setState({ showCloudMarketAuth: false });
            }}
            currStep={2}
          />
        )}
        <Tabs
          activeKey={activeTabKey}
          className={styles.setTabs}
          onChange={this.onTabChange}
        >
          <TabPane
            tab={
              <span className={styles.verticalCen}>
                {globalUtil.fetchSvg('localMarket')}
                本地组件库
              </span>
            }
            key="local"
          >
            <div
              style={{
                display: 'block',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {localsContent}
            </div>
          </TabPane>
          {marketTab.map((item) => {
            const { ID, alias, name } = item;
            return (
              <TabPane
                tab={
                  <span className={styles.verticalCen}>
                    {globalUtil.fetchSvg('cloudMarket')}
                    {alias || name}
                  </span>
                }
                key={ID}
              >
                {marketContent}
              </TabPane>
            );
          })}
          {isCreateAppStore && (
            <TabPane
              tab={
                <Tooltip placement="top" title="添加应用市场">
                  <Icon type="plus" className={styles.addSvg} />
                </Tooltip>
              }
              key="add"
            />
          )}
        </Tabs>
      </PageHeaderLayout>
    );
  }
}

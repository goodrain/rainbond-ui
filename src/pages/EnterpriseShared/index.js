import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  Tabs,
  Radio,
  Input,
  Checkbox,
  Pagination,
  notification,
} from 'antd';
import { Link, routerRedux } from 'dva/router';
import NoComponent from '../../../public/images/noComponent.png';
import userUtil from '../../utils/user';
import Lists from '../../components/Lists';
import CreateAppModels from '../../components/CreateAppModels';
import DeleteApp from '../../components/DeleteApp';
import AppExporter from './AppExporter';
import rainbondUtil from '../../utils/rainbond';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeaderLayouts from '../../layouts/PageHeaderLayouts';

import styles from './index.less';

const { Search } = Input;

@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      pageSize: 10,
      total: 0,
      page: 1,
      teamList: [],
      componentList: [],
      exitTeamName: '',
      userTeamsLoading: false,
      adminer,
      tagList: [],
      tags: [],
      scope: 'enterprise',
      showExporterApp: false,
      appInfo: false,
      visibles: null,
      bouncedText: '',
      bouncedType: '',
      group_version: null,
      chooseVersion: null,
      deleteApp: false,
      showCloudApp: false,
      createAppModel: false,
      upDataAppModel: false,
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }

  load = () => {
    this.getApps();
    this.getTags();
  };

  handleSearchTeam = name => {
    this.setState(
      {
        page: 1,
        name,
      },
      () => {
        this.getApps();
      }
    );
  };

  getApps = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid },
      },
    } = this.props;
    const { page, page_size, name, scope, tags } = this.state;
    dispatch({
      type: 'market/fetchAppModels',
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        app_name: name,
        scope,
        page,
        page_size,
        tags,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            componentList: res.list,
            userTeamsLoading: false,
          });
        }
      },
    });
  };

  getTags = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'market/fetchAppModelsTags',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tagList: res.list,
          });
        }
      },
    });
  };

  onChangeRadio = e => {
    this.setState(
      {
        scope: e.target.value,
      },
      () => {
        this.getApps();
      }
    );
  };

  onChangeCheckbox = checkedValues => {
    this.setState(
      {
        tags: checkedValues,
      },
      () => {
        this.getApps();
      }
    );
  };

  showAppExport = appInfo => {
    this.setState({ appInfo, showExporterApp: true });
  };

  hideAppExport = () => {
    this.setState({ showExporterApp: false, appInfo: false });
  };
  setIsExporting = status => {
    this.setState({ is_exporting: status });
  };

  showOfflineApp = appInfo => {
    if (appInfo && appInfo.versions_info && appInfo.versions_info.length > 0) {
      this.setState({
        appInfo,
        visibles: true,
        group_version: appInfo.versions_info,
        bouncedText: '删除应用',
        bouncedType: 'delete',
      });
    } else {
      this.setState({
        appInfo,
        chooseVersion: appInfo.versions_info[0].version,
      });
    }
  };
  onChangeBounced = checkedValues => {
    this.setState({
      chooseVersion: checkedValues,
    });
  };

  handleOkBounced = values => {
    const { bouncedType } = this.state;
    this.setState(
      {
        chooseVersion: values.chooseVersion,
      },
      () => {
        if (bouncedType == 'delete') {
          this.setState({
            deleteApp: true,
          });
        } else {
          this.handleCloudsUpdate(values.chooseVersion);
        }
      }
    );
  };
  handleDeleteApp = () => {
    const { chooseVersion, appInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/deleteAppModel',
      payload: {
        enterprise_id: eid,
        app_id: appInfo.app_id,
        app_versions: chooseVersion,
      },
      callback: () => {
        notification.success({
          message: '删除成功',
        });
        this.handleCancelDelete();
        this.getApps();
      },
    });
  };

  handleCancelDelete = () => {
    this.setState({
      deleteApp: null,
      visibles: null,
      group_version: null,
      bouncedText: '',
      bouncedType: '',
      appInfo: false,
    });
  };

  handlePageChange = page => {
    this.state.page = page;
    this.getApps();
  };

  handleLoadAppDetail = (item, text) => {
    if (item.versions_info && item.versions_info.length > 0) {
      this.setState({
        visibles: true,
        group_version: item.versions_info,
        appInfo: item,
        bouncedText: text,
      });
    } else {
      this.setState(
        { group_version: item.versions_info, appInfo: item },
        () => {
          this.handleCloudsUpdate(item.versions_info[0].version);
        }
      );
    }
  };

  // 云更新
  handleCloudsUpdate = chooseVersion => {
    const { appInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/syncMarketAppDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        body: {
          enterprise_id: eid,
          app_id: appInfo.app_id,
          app_versions: chooseVersion,
        },
      },
      callback: data => {
        this.handleCancelDelete();
        notification.success({ message: '操作成功' });
        this.getApps();
      },
    });
  };

  handleCreateAppModel = () => {
    notification.success({ message: '创建成功' });
    this.getApps();
    this.handleCancelAppModel();
  };
  handleCancelAppModel = () => {
    this.setState({
      createAppModel: false,
      appInfo: null,
    });
  };
  handleOpenCreateAppModel = () => {
    this.setState({
      createAppModel: true,
    });
  };

  handleupDataAppModel = () => {
    notification.success({ message: '编辑成功' });
    this.handleCancelupDataAppModel();
  };

  handleOpenUpDataAppModel = appInfo => {
    this.setState({
      appInfo,
      upDataAppModel: true,
    });
  };

  handleCancelupDataAppModel = () => {
    this.setState({
      appInfo: null,
      upDataAppModel: false,
    });
  };

  render() {
    const {
      componentList,
      adminer,
      userTeamsLoading,
      tagList,
      appInfo,
      visibles,
      group_version,
      bouncedText,
      bouncedType,
    } = this.state;
    const {
      user,
      rainbondInfo,
      match: {
        params: { eid },
      },
    } = this.props;

    const managementMenu = appInfo => {
      const delApp = (
        <Menu.Item>
          <a
            onClick={() => {
              this.showOfflineApp(appInfo);
            }}
          >
            删除应用
          </a>
        </Menu.Item>
      );
      return (
        <Menu>
          {appInfo.source === 'market' &&
            rainbondUtil.cloudMarketEnable(rainbondInfo) && (
              <Menu.Item>
                <a
                  style={{ marginRight: 8 }}
                  onClick={() => {
                    this.handleLoadAppDetail(item, '云端更新');
                  }}
                >
                  云端更新
                </a>
              </Menu.Item>
            )}
          <Menu.Item>
            <a
              onClick={() => {
                this.handleOpenUpDataAppModel(appInfo);
              }}
            >
              编辑应用
            </a>
          </Menu.Item>
          <Menu.Item>
            <a
              onClick={() => {
                this.showAppExport(appInfo);
              }}
            >
              导出应用
            </a>
          </Menu.Item>

          {appInfo.enterprise_id === 'public'
            ? userUtil.isSystemAdmin(user) && delApp
            : userUtil.isCompanyAdmin(user) && delApp}
        </Menu>
      );
    };

    const addMenuApps = (
      <Menu>
        <Menu.Item>
          <a onClick={this.handleOpenCreateAppModel}>创建应用</a>
        </Menu.Item>
        <Menu.Item>
          <a>离线导入</a>
        </Menu.Item>
      </Menu>
    );

    const operation = (
      <Col span={4} style={{ textAlign: 'right' }} className={styles.btns}>
        {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
          <Button type="primary" style={{ marginRight: '22px' }}>
            <Link to={`/enterprise/${eid}/shared/cloudMarket`}>云端同步</Link>
          </Button>
        )}

        <Dropdown overlay={addMenuApps} placement="topCenter">
          <Button type="primary">
            <Icon type="plus" />
          </Button>
        </Dropdown>
      </Col>
    );
    const noShared = (
      <div className={styles.noShared}>
        <img src={NoComponent} />
        <p>当前无组件，请选择方式添加</p>
        <div className={styles.btns}>
          {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
            <Button
              type="primary"
              onClick={() => {
                this.setState({ showCloudApp: true });
              }}
            >
              云端同步
            </Button>
          )}

          <Button type="primary" onClick={this.onJoinTeam}>
            创建组件
          </Button>
          <Button type="primary" onClick={this.onJoinTeam}>
            离线导入
          </Button>
        </div>
      </div>
    );

    const sharedList = (
      <div>
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Col span={20} style={{ textAlign: 'left', display: 'flex' }}>
            <Search
              style={{ width: '396px' }}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearchTeam}
            />
            <div className={styles.serBox}>
              <div>
                <Radio.Group
                  onChange={this.onChangeRadio}
                  defaultValue="enterprise"
                >
                  <Radio.Button value="enterprise">企业</Radio.Button>
                  <Radio.Button value="team">团队</Radio.Button>
                </Radio.Group>
              </div>
              <div />
              <div>
                <Checkbox.Group
                  style={{ width: '100%' }}
                  onChange={this.onChangeCheckbox}
                >
                  {tagList &&
                    tagList.length > 0 &&
                    tagList.map(item => {
                      const { name, tag_id } = item;
                      return (
                        <Checkbox key={tag_id} value={tag_id}>
                          {name}
                        </Checkbox>
                      );
                    })}
                </Checkbox.Group>
              </div>
            </div>
          </Col>
          {operation}
        </Row>

        {componentList.map((item, index) => {
          const {
            app_id,
            pic,
            describe,
            app_name,
            tags,
            versions_info,
            dev_status,
          } = item;
          return (
            <Lists
              key={app_id}
              stylePro={{ marginBottom: '10px' }}
              Cols={
                <div className={styles.h70}>
                  <Col span={4} style={{ display: 'flex' }}>
                    <div
                      className={styles.lt}
                      onClick={() => {
                        this.handleLoadAppDetail(item);
                      }}
                    >
                      <p>
                        <Icon type="arrow-down" />
                        {index + 1}
                      </p>
                    </div>
                    <div className={styles.imgs}>
                      <img
                        src={
                          pic || require('../../../public/images/app_icon.jpg')
                        }
                        alt=""
                      />
                    </div>
                  </Col>
                  <Col span={8} className={styles.tits}>
                    <div>
                      <p>{app_name}</p>
                      <p>{describe}</p>
                    </div>
                  </Col>
                  <Col span={4} className={styles.status}>
                    <div>
                      {dev_status && <p>{dev_status || ''}</p>}
                      {/* <p>{dev_status || 'release'}</p> */}
                      {versions_info && versions_info.length > 0 && (
                        <p>{versions_info[0].version}</p>
                      )}
                    </div>
                  </Col>

                  <Col span={8} className={styles.tags}>
                    {tags.map(item => {
                      const { tag_id, name } = item;
                      return <div key={tag_id}>{name}</div>;
                    })}
                  </Col>
                </div>
              }
              overlay={managementMenu(item)}
            />
          );
        })}
      </div>
    );

    return (
      <PageHeaderLayouts
        title="共享应用模型库"
        content="应用模型是指模型化、标准化的应用制品包，是企业数字资产的应用化产物，可以通过标准的方式安装到任何Rainbond平台或其他支持的云原生平台。"
      >
        {this.state.showCloudApp && (
          <div className={styles.descText}>
            <Icon type="exclamation-circle" />
            当前市场不支持跨数据中心互联功能
          </div>
        )}
        {this.state.deleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            desc="确定要删除此应用吗?"
            subDesc="删除后其他人将无法安装此应用"
            title="删除应用"
            onCancel={this.handleCancelDelete}
          />
        )}

        {this.state.createAppModel && (
          <CreateAppModels
            title="创建应用"
            eid={eid}
            onOk={this.handleCreateAppModel}
            onCancel={this.handleCancelAppModel}
          />
        )}
        {this.state.upDataAppModel && (
          <CreateAppModels
            title="编辑应用"
            eid={eid}
            appInfo={appInfo}
            onOk={this.handleupDataAppModel}
            onCancel={this.handleCancelupDataAppModel}
          />
        )}

        {this.state.showExporterApp && (
          <AppExporter
            setIsExporting={this.setIsExporting}
            app={appInfo}
            onOk={this.hideAppExport}
            onCancel={this.hideAppExport}
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
        {userTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div
            style={{
              display: this.state.showCloudApp ? 'flex' : 'block',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transition: 'all .8s',
                width: this.state.showCloudApp ? '50%' : '100%',
                display: 'inline-block',
              }}
            >
              {sharedList}
            </div>
            {/* {noShared} */}
          </div>
        )}
      </PageHeaderLayouts>
    );
  }
}

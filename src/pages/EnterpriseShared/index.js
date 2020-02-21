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
import { routerRedux } from 'dva/router';
import NoComponent from '../../../public/images/noComponent.png';
import userUtil from '../../utils/user';
import Lists from '../../components/Lists';
import DeleteApp from '../../components/DeleteApp';
import AppExporter from './AppExporter';
import rainbondUtil from '../../utils/rainbond';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CloudApp from './CloudApp';

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
    const { dispatch, user } = this.props;
    const { page, page_size, name, scope, tags } = this.state;
    dispatch({
      type: 'global/fetchComponent',
      payload: {
        enterprise_id: user.enterprise_id,
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
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchComponentTags',
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
    if (appInfo.versions && appInfo.versions.length > 1) {
      this.setState({
        appInfo,
        visibles: true,
        group_version: appInfo.versions,
        bouncedText: '删除应用',
        bouncedType: 'delete',
      });
    } else {
      this.setState({
        appInfo,
        chooseVersion: appInfo.versions,
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
    const { dispatch, user } = this.props;
    console.log('appInfo', appInfo);
    dispatch({
      type: 'global/offlineMarketApp',
      payload: {
        enterprise_id: user.enterprise_id,
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
    });
  };

  handlePageChange = page => {
    this.state.page = page;
    this.getApps();
  };

  // 云更新
  handleCloudsUpdate = chooseVersion => {
    // const { group_version } = this.state;
    // this.props.dispatch({
    //   type: "global/syncMarketAppDetail",
    //   payload: {
    //     team_name: globalUtil.getCurrTeamName(),
    //     body: {
    //       group_key: group_version.group_key,
    //       group_version: chooseVersion,
    //       template_version: group_version.template_version
    //     }
    //   },
    //   callback: data => {
    //     this.setState({
    //       visibles: null,
    //       group_version: null,
    //       bouncedText: "",
    //       bouncedType: ""
    //     });
    //     notification.success({ message: "操作成功" });
    //     this.getApps();
    //   }
    // });
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
    const { user, rainbondInfo } = this.props;

    const managementMenu = appInfo => {
      const delApp = (
        <Menu.Item>
          <a
            href="javascript:;"
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
                  href="javascript:;"
                  onClick={() => {
                    // this.handleLoadAppDetail(item, '云端更新');
                  }}
                >
                  云端更新
                </a>
              </Menu.Item>
            )}

          <Menu.Item>
            <a
              href="javascript:;"
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

    const operation = (
      <Col span={4} style={{ textAlign: 'right' }} className={styles.btns}>
        {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
          <Button
            type="primary"
            style={{marginRight:'22px' }}
            onClick={() => {
              this.setState({ showCloudApp: true});
            }}
          >
            云端同步
          </Button>
        )}
        <Button type="primary" onClick={this.onJoinTeam}>
          <Icon type="plus" />
        </Button>
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
            versions,
            dev_status,
          } = item;
          return (
            <Lists
              key={app_id}
              stylePro={{ marginBottom: '10px' }}
              Cols={
                <div className={styles.h70}>
                  <Col span={4} style={{ display: 'flex' }}>
                    <div className={styles.lt}>
                      <p>
                        <Icon type="arrow-down" />
                        {index + 1}
                      </p>
                    </div>
                    <div className={styles.imgs}>
                      <img src={pic} alt="" />
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
                      <p>{dev_status || 'release'}</p>
                      <p>{versions && versions.length > 0 && versions[0]}</p>
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
      <PageHeaderLayout
        title="——"
        content="将当前平台和云应用市场进行互联，同步应用，插件，数据中心等资源应用下载完成后，方可在 从应用市场安装 直接安装"
      >
      
        {this.state.deleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            desc="确定要删除此应用吗?"
            subDesc="删除后其他人将无法安装此应用"
            title="删除应用"
            onCancel={this.handleCancelDelete}
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
          <div>
          <Icon type="exclamation-circle" />当前市场不支持跨数据中心互联功能
          </div>
            <div
              style={{
                transition: 'all .8s',
                width: this.state.showCloudApp ? '50%' : '100%',
                display: 'inline-block',
              }}
            >
              {sharedList}
            </div>
            {this.state.showCloudApp && (
              <CloudApp
                onSyncSuccess={() => {
                  this.handlePageChange(1);
                }}
                onClose={() => {
                  this.setState({ showCloudApp: false });
                }}
                dispatch={this.props.dispatch}
              />
            )}
            {/* {noShared} */}
          </div>
        )}
      </PageHeaderLayout>
    );
  }
}

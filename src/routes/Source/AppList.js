import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import {
  Card,
  List,
  Avatar,
  Button,
  Input,
  notification,
  Menu,
  Tooltip,
  Tag,
  Modal,
  Form,
  Checkbox
} from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import BasicListStyles from "../List/BasicList.less";
import globalUtil from "../../utils/global";
import rainbondUtil from "../../utils/rainbond";
import userUtil from "../../utils/user";
import AppImport from "../../components/AppImport";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import CloudApp from "./CloudApp";
import localMarketUtil from "../../utils/localMarket";
import AppExporter from "./AppExporter";

const FormItem = Form.Item;
const { Search } = Input;
const CheckboxGroup = Checkbox.Group;

@Form.create()
@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo
}))
class ExportBtn extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      docker_compose: null,
      rainbond_app: null,
      is_exporting: false,
      showExporterApp: false,
      showImportApp: true
    };
  }
  componentDidMount() {
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  download = (app_id, format) => {
    let aEle = document.querySelector("#down-a-element");
    if (!aEle) {
      aEle = document.createElement("a");
      aEle.setAttribute("download", "filename");
      document.body.appendChild(aEle);
    }
    const href = localMarketUtil.getAppExportUrl({
      team_name: globalUtil.getCurrTeamName(),
      app_id,
      format
    });
    aEle.href = href;
    if (document.all) {
      aEle.click();
    } else {
      const e = document.createEvent("MouseEvents");
      e.initEvent("click", true, true);
      aEle.dispatchEvent(e);
    }
  };
  showAppExport = () => {
    const app = this.props.app || {};
    this.setState({ showExporterApp: true });
  };

  hideAppExport = () => {
    this.setState({ showExporterApp: false });
  };

  appExport = format => {
    const app = this.props.app;
    const app_id = app.ID;
    this.props.dispatch({
      type: "market/appExport",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id,
        format
      },
      callback: data => {
        notification.success({ message: "操作成功，开始导出，请稍等！" });
        if (format === "rainbond-app") {
          this.setState({ is_rainbond_app_exporting: true });
        } else {
          this.setState({ is_docker_compose_exporting: true });
        }
        this.queryExport(format);
      }
    });
  };
  queryExport = type => {
    const item = this.props.app || {};
    this.props.dispatch({
      type: "market/queryExport",
      payload: {
        app_id: item.ID,
        team_name: globalUtil.getCurrTeamName(),
        body: {
          group_key: item.group_key,
          group_version: item.group_version_list
        }
      },
      callback: data => {
        // 点击导出平台应用
        if (type === "rainbond-app") {
          const rainbond_app = (data && data.bean.rainbond_app) || {};
          if (rainbond_app.status === "success") {
            this.setState({ is_rainbond_app_exporting: false });
            this.download(item.ID, type);
            return;
          }

          // 导出中
          if (rainbond_app.status === "exporting") {
            this.setState({ is_rainbond_app_exporting: true });
            if (this.mounted) {
              setTimeout(() => {
                this.queryExport(type);
              }, 5000);
            }
          }

          if (
            (rainbond_app.is_export_before === false ||
              rainbond_app.status === "failed") &&
            this.mounted
          ) {
            this.appExport(type);
          }

          // 点击导出compose
        } else {
          const docker_compose = (data && data.bean.docker_compose) || {};
          if (docker_compose.status === "success" && docker_compose.file_path) {
            this.setState({ is_docker_compose_exporting: false });
            this.download(item.ID, type);
            return;
          }
          // 导出中
          if (docker_compose.status === "exporting") {
            this.setState({ is_docker_compose_exporting: true });
            if (this.mounted) {
              setTimeout(() => {
                this.queryExport(type);
              }, 5000);
            }
          }
          if (
            (docker_compose.is_export_before === false ||
              docker_compose.status === "failed") &&
            this.mounted
          ) {
            this.appExport(type);
          }
        }
      }
    });
  };
  setIsExporting = status => {
    this.setState({ is_exporting: status });
  };
  render() {
    const app = this.props.app || {};
    const { rainbondInfo } = this.props;
    return (
      <Fragment>
        {rainbondUtil.exportAppEnable(rainbondInfo) && (
          <Tooltip title="导出后的文件可直接在Rainbond平台安装">
            <a
              onClick={this.showAppExport}
              style={{ marginRight: 8 }}
              href="javascript:;"
            >
              导出应用{this.state.is_exporting ? "(导出中)" : ""}
            </a>
          </Tooltip>
        )}
        {this.state.showExporterApp && (
          <AppExporter
            setIsExporting={this.setIsExporting}
            app={this.props.app}
            onOk={this.hideAppExport}
            onCancel={this.hideAppExport}
          />
        )}
      </Fragment>
    );
  }
}

@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo
}))
@Form.create()
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 10,
      app_name: "",
      apps: [],
      loading: true,
      total: 0,
      type: "",
      showOfflineApp: null,
      showCloudApp: false,
      importingApps: null,
      showImportApp: false,
      showMarketAppDetail: false,
      showApp: {},
      visibles: null,
      bouncedText: "",
      bouncedType: "",
      group_version: null,
      chooseVersion: null
    };
  }
  componentDidMount = () => {
    this.mounted = true;
    //this.queryImportingApp();
    this.getApps();
  };
  componentWillUnmount() {
    this.mounted = false;
  }
  getApps = () => {
    const datavisible = {};
    const dataquery = {};
    const dataexportTit = {};
    this.props.dispatch({
      type: "market/getMarketApp",
      payload: {
        app_name: this.state.app_name || "",
        scope: this.state.scope,
        page_size: this.state.pageSize,
        page: this.state.page
      },
      callback: data => {
        if (data) {
          this.setState({
            apps: data.list || [],
            total: data.total,
            visiblebox: datavisible,
            querydatabox: dataquery,
            exportTit: dataexportTit,
            importingList: data.list || [],
            loading: false
          });
        }
      }
    });
  };
  queryImportingApp = () => {
    this.props.dispatch({
      type: "market/queryImportingApp",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data && data.list && data.list.length) {
          this.setState({ importingApps: data.list });
          if (this.mounted) {
            setTimeout(() => {
              this.queryImportingApp();
            }, 6000);
          }
        } else {
          this.setState({ importingApps: null });
          this.getApps();
        }
      }
    });
  };
  handlePageChange = page => {
    this.state.page = page;
    this.getApps();
  };
  handleSearch = app_name => {
    this.setState(
      {
        app_name,
        page: 1
      },
      () => {
        this.getApps();
      }
    );
  };
  handleLoadAppDetail = (data, text) => {
    if (data.group_version_list && data.group_version_list.length > 1) {
      this.setState({ visibles: true, group_version: data, bouncedText: text });
    } else {
      this.setState({ group_version: data }, () => {
        this.handleCloudsUpdate(data.group_version_list);
      });
    }
  };

  handleCloudsUpdate = chooseVersion => {
    const { group_version } = this.state;

    this.props.dispatch({
      type: "global/syncMarketAppDetail",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        body: {
          group_key: group_version.group_key,
          group_version: chooseVersion,
          template_version: group_version.template_version
        }
      },
      callback: data => {
        this.setState({
          visibles: null,
          group_version: null,
          bouncedText: "",
          bouncedType: ""
        });
        notification.success({ message: "操作成功" });
        this.getApps();
      }
    });
  };
  handleTypeChange = e => {
    this.setState({ type: e.target.value, page: 1 }, () => {
      this.getApps();
    });
  };
  handleOfflineApp = () => {
    const app = this.state.showOfflineApp;
    const { group_version, chooseVersion } = this.state;
    let data = app ? app : group_version;

    this.props.dispatch({
      type: "global/offlineMarketApp",
      payload: {
        app_id: app.ID,
        group_key: data.group_key,
        group_version_list: chooseVersion
      },
      callback: () => {
        notification.success({
          message: "删除成功"
        });
        this.setState({
          visibles: null,
          group_version: null,
          bouncedText: "",
          bouncedType: ""
        });
        this.hideOfflineApp();
        this.getApps();
      }
    });
  };
  showOfflineApp = app => {
    if (app.group_version_list && app.group_version_list.length > 1) {
      this.setState({
        visibles: true,
        group_version: app,
        bouncedText: "删除应用",
        bouncedType: "delete"
      });
    } else {
      this.setState({
        showOfflineApp: app,
        chooseVersion: app.group_version_list
      });
    }
  };
  showImportApp = () => {
    this.setState({ showImportApp: true });
  };
  showMarketAppDetail = app => {
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
  hideImportApp = () => {
    this.setState({ showImportApp: false });
  };
  hideOfflineApp = () => {
    this.setState({ showOfflineApp: null });
  };
  handleCancelUpload = () => {
    this.setState({ showUpload: false });
  };
  handleCancelBatchImportList = () => {
    this.setState({ showBatchImportList: false });
    this.queryImportingApp();
    this.getApps();
  };
  handleUploadOk = () => {
    this.setState({ showUpload: false });
    this.queryImportingApp();
    this.handlePageChange(1);
  };
  handleCancelBatchImport = () => {
    this.setState({ showBatchImport: false });
  };
  handleBatchImportOk = data => {
    this.setState({
      showBatchImport: false,
      showBatchImportList: true,
      importNameList: data
    });
  };
  handleOKBatchImportList = () => {
    this.setState({ showBatchImportList: false });
    this.queryImportingApp();
    this.getApps();
  };
  handleShowImportApp = () => {
    this.setState({ showImportApp: true });
  };

  renderSubMenu = (item, querydata) => {
    const id = item.ID;
    const exportbox = querydata[id];
    const appquery = exportbox.rainbond_app;
    const composequery = exportbox.docker_compose;
    let apptext = "rainbond-app(点击导出)";
    let composetext = "docker_compose(点击导出)";
    let appurl = "javascript:;";
    let composeurl = "javascript:;";
    let appisSuccess = "none";
    let composeisSuccess = "none";
    const export_status = item.export_status;
    if (appquery) {
      //

      if (appquery.is_export_before) {
        if (appquery.status == "success") {
          apptext = "rainbond-app(点击下载)";
          appisSuccess = "success";
          appurl = appquery.file_path;
        } else if (appquery.status == "exporting") {
          apptext = "rainbond-app(导出中)";
          appisSuccess = "loading";
        } else {
          apptext = "rainbond-app(导出失败)";
        }
      } else {
        apptext = "rainbond-app(点击导出)";
      }
      //
      if (composequery.is_export_before) {
        if (composequery.status == "success") {
          composetext = "docker_compose(点击下载)";
          composeisSuccess = "success";
          composeurl = composequery.file_path;
        } else if (composequery.status == "exporting") {
          composetext = "docker_compose(导出中)";
          composeisSuccess = "loading";
        } else {
          composetext = "docker_compose(导出失败)";
        }
      } else {
        composetext = "docker_compose(点击导出)";
      }
      //

      //
    } else {
      composetext = "docker_compose(点击下载)";
      apptext = "rainbond-app(点击下载)";
    }

    return (
      <Menu onClick={this.handleMenuClick}>
        <Menu.Item key={`rainbond-app||${id}||${appisSuccess}`}>
          <a target="_blank" href={appurl} download="filename">
            {apptext}
          </a>
        </Menu.Item>
        <Menu.Item key={`docker-compose||${id}||${composeisSuccess}`}>
          <a target="_blank" href={composeurl} download="filename">
            {composetext}
          </a>
        </Menu.Item>
      </Menu>
    );
  };

  handleVisibleChange = (item, flag) => {
    const newvisible = this.state.visiblebox;
    const ID = item.ID;
    newvisible[ID] = flag;
    this.setState({ visiblebox: newvisible });
    this.queryExport(item);
  };

  handleOkBounced = () => {
    const { bouncedType } = this.state;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState(
          {
            chooseVersion: values.chooseVersion
          },
          () => {
            if (bouncedType == "delete") {
              this.setState({
                showOfflineApp: this.state.group_version,
                chooseVersion: values.chooseVersion
              });
            } else {
              this.handleCloudsUpdate(values.chooseVersion);
            }
          }
        );
      }
    });
  };

  onChangeBounced = checkedValues => {
    this.setState({
      chooseVersion: checkedValues
    });
  };

  render() {
    const { group_version } = this.state;
    const { rainbondInfo } = this.props;

    const extraContent = (
      <div className={BasicListStyles.extraContent}>
        {!this.state.showImportApp && (
          <Button value="test" onClick={this.handleShowImportApp}>
            离线导入应用
          </Button>
        )}
        {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
          <Button
            style={{ marginLeft: 16 }}
            type="primary"
            value="test"
            onClick={() => {
              this.setState({ showCloudApp: true });
            }}
          >
            云端同步
          </Button>
        )}
      </div>
    );

    const paginationProps = {
      pageSize: this.state.pageSize,
      total: this.state.total,
      current: this.state.page,
      onChange: pageSize => {
        this.handlePageChange(pageSize);
      }
    };

    const { getFieldDecorator, getFieldValue } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };

    return (
      <div
        className={BasicListStyles.standardList}
        style={{
          display: this.state.showCloudApp ? "flex" : "block",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            transition: "all .8s",
            transform: this.state.showImportApp
              ? "translate3d(0, 0, 0)"
              : "translate3d(0, 100%, 0)",
            marginBottom: 16
          }}
        >
          {this.state.showImportApp ? (
            <AppImport
              cancelImport={this.hideImportApp}
              onOK={this.hideImportApp}
            />
          ) : null}
        </div>
        <Card
          className={BasicListStyles.listCard}
          bordered={false}
          title={
            <div>
              {this.state.showCloudApp && <span>内部市场</span>}
              <Search
                className={BasicListStyles.extraContentSearch}
                placeholder="请输入名称进行搜索"
                onSearch={this.handleSearch}
              />
            </div>
          }
          style={{
            transition: "all .8s",
            width: this.state.showCloudApp ? "50%" : "100%",
            display: "inline-block"
          }}
          bodyStyle={{
            padding: "0 32px 40px 32px"
          }}
          extra={this.state.showCloudApp ? null : extraContent}
        >
          <List
            size="large"
            rowKey="ID"
            locale={{
              emptyText: (
                <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
                  暂无应用， 你可以
                  <br />
                  <br />
                  分享应用到内部市场
                  {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
                    <span>
                      或
                      <a
                        onClick={() => {
                          this.setState({ showCloudApp: true });
                        }}
                        href="javascript:;"
                      >
                        从云端同步
                      </a>
                    </span>
                  )}
                </p>
              )
            }}
            loading={this.state.loading}
            pagination={paginationProps}
            dataSource={this.state.apps}
            renderItem={(item, index) => {
              const itemID = item.ID;
              const querydata = this.state.querydatabox;
              const exportStatus = item.export_status;
              const exportText = this.state.exportTit[itemID];
              const renderItem = (
                <List.Item
                  actions={
                    this.state.showCloudApp
                      ? null
                      : [
                          item.is_complete ? (
                            <Fragment>
                              <ExportBtn app={item} />
                              {item.source === "market" &&
                                rainbondUtil.cloudMarketEnable(
                                  rainbondInfo
                                ) && (
                                  <a
                                    style={{ marginRight: 8 }}
                                    href="javascript:;"
                                    onClick={() => {
                                      this.handleLoadAppDetail(
                                        item,
                                        "云端更新"
                                      );
                                    }}
                                  >
                                    云端更新
                                  </a>
                                )}
                              {item.enterprise_id === "public"
                                ? userUtil.isSystemAdmin(
                                    this.props.currentUser
                                  ) && (
                                    <a
                                      href="javascript:;"
                                      onClick={() => {
                                        this.showOfflineApp(item);
                                      }}
                                    >
                                      删除
                                    </a>
                                  )
                                : userUtil.isCompanyAdmin(
                                    this.props.currentUser
                                  ) && (
                                    <a
                                      href="javascript:;"
                                      onClick={() => {
                                        this.showOfflineApp(item);
                                      }}
                                    >
                                      删除
                                    </a>
                                  )}
                            </Fragment>
                          ) : (
                            <a
                              href="javascript:;"
                              onClick={() => {
                                this.handleLoadAppDetail(item);
                              }}
                            >
                              下载应用
                            </a>
                          )
                        ]
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={
                          item.pic ||
                          require("../../../public/images/app_icon.jpg")
                        }
                        shape="square"
                        size="large"
                        onClick={() => {
                          this.showMarketAppDetail(item);
                        }}
                      />
                    }
                    title={
                      <a
                        style={{ color: "#1890ff" }}
                        href="javascript:;"
                        onClick={() => {
                          this.showMarketAppDetail(item);
                        }}
                      >
                        {item.group_name}
                        {item.is_official && "(官方推荐)"}
                      </a>
                    }
                    description={
                      <div>
                        <p>
                          版本:&nbsp;
                          {item.group_version_list &&
                            item.group_version_list.map((item, index) => {
                              return (
                                <Tag
                                  style={{ height: "17px", lineHeight: "16px" }}
                                  color="green"
                                  size="small"
                                  key={index}
                                >
                                  {" "}
                                  {item}
                                </Tag>
                              );
                            })}
                        </p>

                        {item.describe || "-"}
                      </div>
                    }
                  />
                </List.Item>
              );
              return renderItem;
            }}
          />
        </Card>
        <div
          style={{
            transition: "all .8s",
            transform: this.state.showCloudApp
              ? "translate3d(0, 0, 0)"
              : "translate3d(100%, 0, 0)",
            marginLeft: 8,
            width: "49%"
          }}
        >
          {this.state.visibles && (
            <Modal
              title={this.state.bouncedText}
              visible={this.state.visibles}
              onOk={this.handleOkBounced}
              onCancel={() => {
                this.setState({
                  visibles: null,
                  group_version: null,
                  bouncedText: "",
                  bouncedType: ""
                });
              }}
            >
              <Form onSubmit={this.handleOkBounced}>
                <FormItem
                  {...formItemLayout}
                  label={group_version && group_version.group_name + "版本"}
                >
                  {getFieldDecorator("chooseVersion", {
                    initialValue: group_version && [
                      group_version.group_version_list[0]
                    ],
                    rules: [
                      {
                        required: true,
                        message: "请选择版本"
                      }
                    ]
                  })(
                    <CheckboxGroup
                      options={
                        group_version && group_version.group_version_list
                      }
                      onChange={this.onChangeBounced}
                    />
                  )}
                </FormItem>
              </Form>
            </Modal>
          )}

          {this.state.showCloudApp ? (
            <CloudApp
              onSyncSuccess={() => {
                this.handlePageChange(1);
              }}
              onClose={() => {
                this.setState({ showCloudApp: false });
              }}
              dispatch={this.props.dispatch}
            />
          ) : null}
        </div>
        {this.state.showOfflineApp && (
          <ConfirmModal
            onOk={this.handleOfflineApp}
            desc="确定要删除此应用吗?"
            subDesc="删除后其他人将无法安装此应用"
            title="删除应用"
            onCancel={this.hideOfflineApp}
          />
        )}
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
      </div>
    );
  }
}

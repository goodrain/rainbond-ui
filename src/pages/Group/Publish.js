import React, { PureComponent, Fragment } from "react";
import { routerRedux, Link } from "dva/router";
import { connect } from "dva";
import { Table, Card, Button, Modal, Select, Form, notification } from "antd";
import ScrollerX from "../../components/ScrollerX";
import SelectStore from "../../components/SelectStore";
import {
  createEnterprise,
  createTeam,
  createApp
} from "../../utils/breadcrumb";
import { FormattedMessage, formatMessage } from "umi-plugin-react/locale";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";

@connect(({ list, loading, teamControl, enterprise }) => ({
  list,
  loading: loading.models.list,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
export default class AppPublishList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
      appDetail: {},
      page: 1,
      page_size: 10,
      total: 0,
      selectStoreShow: false,
    };
  }
  componentDidMount() {
    this.fetchAppDetail();
    this.fetchPublishRecoder();
  }

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: "groupControl/fetchGroupDetail",
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  onPageChange = (page ) => {
    this.setState({page: page},()=>{
      this.fetchPublishRecoder();
    })
  }

  fetchPublishRecoder = () => {
    this.setState({loading: true})
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    const { page, page_size } = this.state
    dispatch({
      type: "groupControl/fetchShareRecoders",
      payload: {
        team_name: teamName,
        app_id: appID,
        page,
        page_size,
      },
      callback: data => {
        if (data) {
          this.setState({recoders: data.list, loading: false})
        }
      }
    });
  };

  handleShare = (scope, target) => {
    const { teamName, regionName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/ShareGroup",
      payload: {
        team_name: teamName,
        group_id: appID,
        scope,
        target
      },
      callback: data => {
        this.continuePublish(data.bean.ID, data.bean.step)
      }
    });
  };

  onPublishLocal = () => {
    this.handleShare("", {});
  };

  onPublishStore = () => {
    this.setState({ selectStoreShow: true });
  };

  hideSelectStoreShow = () => {
    this.setState({ selectStoreShow: false });
  };

  handleSelectStore = (values) => {
    const selectStore = values.store_id;
    if (!selectStore) {
      notification.warning({message:"未选择正确的应用商店"})
    }
    this.handleShare("goodrain", {store_id: selectStore})
  }
  deleteRecord = (recordID) => {
    return 
  }

  cancelPublish = (recordID) => {
    if (recordID == undefined || recordID == "") {
      notification.warning({message:"参数异常"})
      return 
    }
    const { teamName } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/giveupShare",
      payload: {
        team_name: teamName,
        share_id: recordID
      },
      callback: data => {
        this.fetchPublishRecoder()
      }
    });
  }

  continuePublish = (recordID, step) => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    if (step === 1) {
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/apps/${appID}/share/${recordID}/one`
        )
      );
    }
    if (step === 2) {
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${regionName}/apps/${appID}/share/${recordID}/two`
        )
      );
    }
  }

  render() {
    let breadcrumbList = [];
    const {
      appDetail,
      loading,
      loadingDetail,
      page,
      page_size,
      total,
      selectStoreShow,
      recoders
    } = this.state;
    const { currentEnterprise, currentTeam, currentRegionName, dispatch } = this.props;
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        title={formatMessage({ id: "app.publish.title" })}
        content={formatMessage({ id: "app.publish.desc" })}
        extraContent={
          <div>
            <Button
              style={{ marginRight: 8 }}
              type="primary"
              onClick={this.onPublishLocal}
            >
              发布到共享库
            </Button>
            <Button style={{ marginRight: 8 }} onClick={this.onPublishStore}>
              发布到云应用商店
            </Button>
          </div>
        }
      >
        <Card loading={loading}>
          <ScrollerX sm={800}>
            <Table
              pagination={{
                current: page,
                pageSize: page_size,
                total: total,
                onChange: this.onPageChange
              }}
              dataSource={recoders || []}
              columns={[
                {
                  title: "发布模版名称",
                  dataIndex: "app_model_name",
                },
                {
                  title: "版本号(别名)",
                  dataIndex: "version",
                  align: "center",
                  render: (val, data) => {
                    if (val){
                      return (
                        <p style={{marginBottom: 0}}>
                          {val}({data.alias})
                        </p>
                      );
                    }
                  }
                },
                {
                  title: "发布范围",
                  dataIndex: "scope",
                  align: "center",
                  render: (val, data) => {
                    switch (val) {
                      case "":
                        return (
                          <Link
                            to={`/enterprise/${currentEnterprise.enterprise_id}/shared`}
                          >
                            共享库
                          </Link>
                        );
                      case "team":
                        return (
                          <Link
                            to={`/enterprise/${currentEnterprise.enterprise_id}/shared`}
                          >
                            共享库(团队)
                          </Link>
                        );
                      case "enterprise":
                        return (
                          <Link
                            to={`/enterprise/${currentEnterprise.enterprise_id}/shared`}
                          >
                            共享库(企业)
                          </Link>
                        );
                      default:
                        if (data.scope_target) {
                          return (
                            <p style={{marginBottom: 0}}>
                              应用商店({data.scope_target.store_name})
                            </p>
                          );
                        }
                        return <p style={{marginBottom: 0}}>应用商店</p>;
                    }
                  }
                },
                {
                  title: "发布时间",
                  align: "center",
                  dataIndex: "create_time",
                },
                {
                  title: "状态",
                  align: "center",
                  dataIndex: "status",
                },
                {
                  title: "操作",
                  width: "200px",
                  dataIndex: "dataIndex",
                  render: (val, data) => {
                    return (
                      <div>
                          <a
                            style={{ marginRight: "5px" }}
                            onClick={ ()=>{
                              this.continuePublish(data.record_id, data.step)
                            }}
                          >
                            继续发布
                          </a>
                          <a
                            style={{ marginRight: "5px" }}
                            onClick={ () => {this.cancelPublish(data.record_id)}}
                          >
                            取消发布
                          </a>
                          <a
                            style={{ marginRight: "5px" }}
                            onClick={ () => {this.deleteRecord(data.record_id)}}
                          >
                            删除
                          </a>
                      </div>)
                    }        
                }
              ]}
            />
          </ScrollerX>
        </Card>
        <SelectStore
          dispatch={dispatch}
          enterprise_id={currentEnterprise.enterprise_id}
          visible={selectStoreShow}
          onCancel={this.hideSelectStoreShow}
          onOk={this.handleSelectStore}
        />
      </PageHeaderLayout>
    );
  }
}

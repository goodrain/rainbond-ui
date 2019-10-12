import { Badge, Button, Card, notification, Table, Tag, Tooltip } from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import moment from "moment";
import React, { Fragment, PureComponent } from "react";
import ScrollerX from "../../components/ScrollerX";
import {
  batchReStart,
  batchStart,
  batchStop,
  batchMove,
  restart,
  start,
  stop
} from "../../services/app";
import appUtil from "../../utils/app";
import appStatusUtil from "../../utils/appStatus-util";
import globalUtil from "../../utils/global";
import styles from "./AppList.less";
import MoveGroup from "../../components/AppMoveGroup";
import BatchDelete from "../../components/BatchDelete";

@connect(
  ({ appControl, global }) => ({
    groups: global.groups,
  }),
  null,
  null,
  {
    pure: false
  }
)
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      apps: [],
      teamAction: {},
      current: 1,
      total: 0,
      pageSize: 10,
      moveGroupShow: false,
      batchDeleteApps: [],
      batchDeleteShow: false
    };
  }
  componentDidMount() {
    this.updateApp();
    document.querySelector('.ant-table-footer').setAttribute('style', 'position:absolute;background:#fff')
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    this.props.dispatch({
      type: "groupControl/clearApps"
    });
  }


  shouldComponentUpdate() {
    return true
  }

  updateApp = () => {
    this.loadApps();
    const { clearTime } = this.props
    this.timer = setInterval(() => {
      if (!clearTime) {
        this.loadApps();
      }
    }, 5000)
  }
  loadApps = () => {
    const { dispatch, form, index } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: "groupControl/fetchApps",
      payload: {
        team_name,
        region_name,
        group_id: this.props.groupId,
        page: this.state.current,
        page_size: 10
      },
      callback: data => {
        if (data&&data._code == 200) {
          this.setState({
            apps: data.list || [],
            teamAction: data.bean || {},
            total: data.total || 0
          });
        }
      }
    });
  };

  deleteData = () => {
    const { dispatch, form, index } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: "groupControl/fetchApps",
      payload: {
        team_name,
        region_name,
        group_id: this.props.groupId,
        page: this.state.current,
        page_size: 10
      },
      callback: data => {
        if (data&&data._code == 200) {
          this.setState({
            apps: data.list || [],
            teamAction: data.bean || {},
            total: data.total || 0
          }, () => {
            this.handleBatchDeletes()
            this.hideMoveGroup();
          });
        }
      }
    });
  };


  onSelectChange = (selectedRowKeys, selectedRow) => {
    this.setState({
      selectedRowKeys
    });
  };
  handleReStart = data => {
    restart({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: data.service_alias
    }).then(data => {
      if (data) {
        notification.success({
          message: "操作成功，重启中"
        });
      }
    });
  };
  handleStart = data => {
    start({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: data.service_alias
    }).then(data => {
      if (data) {
        notification.success({
          message: "操作成功，启动中"
        });
      }
    });
  };
  handleStop = data => {
    stop({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: data.service_alias
    }).then(data => {
      if (data) {
        notification.success({
          message: "操作成功，关闭中"
        });
      }
    });
  };
  getSelected() {
    const key = this.state.selectedRowKeys;
    const res = key.map(item => this.state.apps[item]);
    return res;
  }
  getSelectedKeys() {
    const selected = this.getSelected();
    return selected.map(item => item.service_id);
  }
  handleBatchRestart = () => {
    const ids = this.getSelectedKeys();
    batchReStart({
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids.join(",")
    }).then(data => {
      if (data) {
        notification.success({
          message: "批量重启中"
        });
      }
    });
  };
  handleBatchStart = () => {
    const ids = this.getSelectedKeys();
    batchStart({
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids.join(",")
    }).then(data => {
      if (data) {
        notification.success({
          message: "批量启动中"
        });
      }
    });
  };
  handleBatchStop = () => {
    const ids = this.getSelectedKeys();
    batchStop({
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids.join(",")
    }).then(data => {
      if (data) {
        notification.success({
          message: "批量关闭中"
        });
      }
    });
  };
  handleBatchDelete = () => {
    const apps = this.getSelected();
    this.setState({ batchDeleteApps: apps, batchDeleteShow: true });
  };
  hideBatchDelete = () => {
    //update menus data
    this.deleteData();
    this.updateGroupMenu()
  };
  handleBatchDeletes = () => {
    this.setState({ batchDeleteApps: [], batchDeleteShow: false, selectedRowKeys: [] });
  };
  updateGroupMenu = () => {
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
      }
    });
  }
  handleBatchMove = groupID => {
    const ids = this.getSelectedKeys();
    batchMove({
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids.join(","),
      move_group_id: groupID
    }).then(data => {
      if (data) {
        notification.success({
          message: "批量移动中"
        });
        this.hideBatchDelete();
      }
    });
  };
  hideMoveGroup = () => {
    this.setState({ moveGroupShow: false });
  };
  showBatchMove = () => {
    this.setState({ moveGroupShow: true });
  };
  // 是否可以批量重启
  canBatchRestart = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    const canotRestart = selectedRowKeys.filter(
      item => !appStatusUtil.canRestart(item)
    );
    return hasSelected;
  };
  // 是否可以批量启动
  canBatchStart = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    const canotStart = selectedRowKeys.filter(
      item => !appStatusUtil.canStart(item)
    );
    return hasSelected;
  };
  // 是否可以批量关闭
  canBatchStop = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    const canotStop = selectedRowKeys.filter(
      item => !appStatusUtil.canStop(item)
    );
    return hasSelected;
  };
  canBatchMove = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };
  canBatchDelete = () => {
    const selectedRowKeys = this.getSelected();
    const hasSelected = selectedRowKeys.length > 0;
    return hasSelected;
  };

  render() {
    const { apps, teamAction } = this.state;
    const { selectedRowKeys } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };
    const hasSelected = selectedRowKeys.length > 0;
    const pagination = {
      current: this.state.current,
      total: this.state.total,
      onChange: page => {
        this.setState(
          {
            current: page,
            selectedRowKeys: []
          },
          () => {
            this.loadApps();
          }
        );
      }
    };
    const columns = [
      {
        title: "组件名称",
        dataIndex: "service_cname",
        render: (val, data) => (
          <Link
            to={
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
              data.service_alias
              }/overview`}
          >
            {" "}
            {data.service_source && data.service_source == "third_party" ?
              <span>
                <Tooltip title={"第三方组件"}>
                  <span style={{ borderRadius: "50%", height: "20px", width: "20px", display: "inline-block", background: "#1890ff", verticalAlign: "top", marginRight: "3px" }}>
                    <span style={{ display: "block", color: "#FFFFFF", height: "20px", lineHeight: "20px", textAlign: "center" }}>3</span>
                  </span>
                  {val}
                </Tooltip>
              </span>
              :
              <span>{val}</span>
            }
            {" "}
          </Link>
        )
      },
      // {
      //   title: "应用类型",
      //   dataIndex: "service_type"
      // },
      {
        title: "内存",
        dataIndex: "min_memory",
        render: (val, data) => `${val}MB`
      },
      {
        title: "状态",
        dataIndex: "status_cn",
        render: (val, data) => (
            data.service_source && data.service_source == "third_party" ?
              <Badge
                status={appUtil.appStatusToBadgeStatus(data.status)}
                text={val=="运行中"?"健康":val=="运行异常"?"不健康":val=="已关闭"?"下线":val}
              /> :
              <Badge
                status={appUtil.appStatusToBadgeStatus(data.status)}
                text={val}
              />
        )
      },
      {
        title: "更新时间",
        dataIndex: "update_time",
        render: val => moment(val).format("YYYY-MM-DD HH:mm:ss")
      },
      {
        title: "操作",
        dataIndex: "action",
        render: (val, data) => (
          <Fragment>
            {" "}
            {appStatusUtil.canRestart(data) && (data.service_source && data.service_source != "third_party") ? (
              <a
                onClick={() => {
                  this.handleReStart(data);
                }}
                href="javascript:;"
                style={{
                  marginRight: 10
                }}
              >
                重启{" "}
              </a>
            ) : null}{" "}
            {appStatusUtil.canStart(data) && (data.service_source && data.service_source != "third_party") ? (
              <a
                onClick={() => {
                  this.handleStart(data);
                }}
                href="javascript:;"
                style={{
                  marginRight: 10
                }}
              >
                启动{" "}
              </a>
            ) : null}{" "}
            {appStatusUtil.canStop(data)&& (data.service_source && data.service_source != "third_party")  ? (
              <a
                onClick={() => {
                  this.handleStop(data);
                }}
                href="javascript:;"
              >
                关闭{" "}
              </a>
            ) : null}
          </Fragment>
        )
      }
    ];
    const footer = (<div className={styles.tableList} >
      <div className={styles.tableListOperator}>
        <Button
          disabled={!this.canBatchRestart()}
          onClick={this.handleBatchRestart}
        >
          批量重启{" "}
        </Button>{" "}
        <Button
          disabled={!this.canBatchStop()}
          onClick={this.handleBatchStop}
        >
          批量关闭{" "}
        </Button>{" "}
        <Button
          disabled={!this.canBatchStart()}
          onClick={this.handleBatchStart}
        >
          批量启动{" "}
        </Button>{" "}
        <Button
          disabled={!this.canBatchMove()}
          onClick={this.showBatchMove}
        >
          批量移动{" "}
        </Button>{" "}
        <Button
          disabled={!this.canBatchDelete()}
          onClick={this.handleBatchDelete}
        >
          批量删除{" "}
        </Button>{" "}
      </div>{" "}
    </div>)
    return (
      <div>
        <Card
          style={{
            minHeight: 400
          }}
          bordered={false}
          bodyStyle={{ padding: "10px 10px" }}
        // headStyle={{ borderBottom: "0px" ,float:"right"}}
        // title={}
        >

          <ScrollerX sm={750}>
            <Table
              pagination={pagination}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={apps || []}
              footer={() => footer}
              style={{ position: "relative" }}
            />

          </ScrollerX>{" "}
          {this.state.batchDeleteShow && (
            <BatchDelete
              batchDeleteApps={this.state.batchDeleteApps}
              onCancel={this.hideBatchDelete}
              onOk={this.hideBatchDelete}
            />
          )}
          {this.state.moveGroupShow && (
            <MoveGroup
              currGroupID={this.props.groupId}
              groups={this.props.groups}
              onOk={this.handleBatchMove}
              onCancel={this.hideMoveGroup}
            />
          )}

        </Card>
      </div>
    );
  }
}

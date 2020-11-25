import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification,
  Select,
  Input,
  Modal,
  message,
  Spin
} from "antd";
import globalUtil from "../../utils/global";
import { isNull } from "util";

const FormItem = Form.Item;
const Option = Select.Option;

const appRestore = {
  starting: "迁移中",
  success: "成功",
  failed: "失败"
};

@connect(({ user, global }) => ({ currUser: user.currentUser }))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      teamsData: [],
      regionData: [],
      teamsName: "",
      regionName: "",
      teamsAlias: "",
      regionAlias: "",
      backup_id: this.props.backupId,
      restore_id: "",
      showRestore: false,
      restore_status: "",
      isFinished: "",
      notRecovered_restore_id: ""
    };
    this.mount = false;
  }

  componentDidMount() {
    this.mount = true;
    var teams = this.props.currUser.teams;
    var teamsArr = [];
    teams.map(order => {
      var orderbox = {};
      orderbox["team_alias"] = order.team_alias;
      orderbox["team_name"] = order.team_name;
      orderbox["region"] = order.region;
      teamsArr.push(orderbox);
    });
    this.setState({ teamsData: teamsArr });
    this.queryIsFinished();
  }
  queryIsFinished = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "application/queryRestoreState",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.props.groupId,
        group_uuid: this.props.group_uuid
      },
      callback: data => {
        if (data) {
          this.setState({
            event_id: data.bean.data === null ? "" : data.bean.data.event_id,
            notRecovered_restore_id:
              data.bean.data === null ? "" : data.bean.data.restore_id
          });
        }
      }
    });
  };
  componentWillUnmount() {
    this.mount = false;
  }

  handleSubmit = e => {
    var teamsName = this.state.teamsName;
    var regionName = this.state.regionName;
    if (teamsName == "") {
      notification.warning({ message: "请选择迁移团队" });
      return;
    }
    if (regionName == "") {
      notification.warning({ message: "请选择迁移集群" });
      return;
    }
    this.props.dispatch({
      type: "application/migrateApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region: this.state.regionName,
        team: this.state.teamsName,
        backup_id: this.props.backupId,
        group_id: this.props.groupId,
        migrate_type: "migrate",
        event_id: this.state.event_id,
        notRecovered_restore_id: this.state.notRecovered_restore_id
      },
      callback: data => {
        // notification.success({message: "开始迁移应用",duration:'2'});
        if (data) {
          this.setState({ restore_id: data.bean.restore_id }, () => {
            this.queryMigrateApp();
          });
        }
      }
    });
  };

  //查询迁移状态
  queryMigrateApp = () => {
    if (!this.mount) return;
    this.props.dispatch({
      type: "application/queryMigrateApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        restore_id: this.state.restore_id,
        group_id: this.props.groupId
      },
      callback: data => {
        if (data) {
          this.setState({
            showRestore: true,
            restore_status: data.bean.status
          });
          if (data.bean.status == "success") {
            this.props.dispatch(
              routerRedux.push(
                `/team/${data.bean.migrate_team}/region/${
                  data.bean.migrate_region
                }/apps/${data.bean.group_id}`
              )
            );
            location.reload();
          }
          if (data.bean.status == "failed") {
            //this.props.onCancel && this.props.onCancel()
          }
          if (data.bean.status == "starting") {
            setTimeout(() => {
              this.queryMigrateApp();
            }, 2000);
          }
        }
      }
    });
  };

  handleTeamsChange = value => {
    const teamsData = this.state.teamsData;
    var regionList = [];
    teamsData.map(order => {
      if (order.team_name == value) {
        regionList = order.region;
      }
    });
    this.setState({ teamsName: value, regionData: regionList });
  };
  onRegionChange = value => {
    var regionData = this.state.regionData;
    this.setState({ regionName: value });
  };

  render() {
    const teamsData = this.state.teamsData || [];
    const regionData = this.state.regionData || [];
    const restoreStatus = this.state.restore_status;
    return (
      <Modal
        visible={true}
        onCancel={this.props.onCancel}
        onOk={this.handleSubmit}
        title="迁移"
        footer={
          this.state.showRestore
            ? [
                <Button key="back" onClick={this.props.onCancel}>
                  关闭
                </Button>
              ]
            : [
                <Button key="back" onClick={this.props.onCancel}>
                  关闭
                </Button>,
                <Button key="submit" type="primary" onClick={this.handleSubmit}>
                  迁移
                </Button>
              ]
        }
      >
        {this.state.showRestore ? (
          <div>
            {restoreStatus == "starting" ? (
              <div>
                <p style={{ textAlign: "center" }}>
                  <Spin />
                </p>
                <p style={{ textAlign: "center", fontSize: "14px" }}>
                  迁移中，请稍后(请勿关闭弹窗)
                </p>
              </div>
            ) : (
              ""
            )}
            {restoreStatus == "success" ? (
              <div>
                <p
                  style={{
                    textAlign: "center",
                    color: "#28cb75",
                    fontSize: "36px"
                  }}
                >
                  <Icon type="check-circle-o" />
                </p>
                <p style={{ textAlign: "center", fontSize: "14px" }}>
                  迁移成功
                </p>
              </div>
            ) : (
              ""
            )}
            {restoreStatus == "failed" ? (
              <div>
                <p
                  style={{
                    textAlign: "center",
                    color: "999",
                    fontSize: "36px"
                  }}
                >
                  <Icon type="close-circle-o" />
                </p>
                <p style={{ textAlign: "center", fontSize: "14px" }}>
                  迁移失败，请重新迁移
                </p>
              </div>
            ) : (
              ""
            )}
          </div>
        ) : (
          <div>
            <p>请选择迁移的团队和集群</p>
            <Select
              style={{ width: 120, marginRight: "10px" }}
              onSelect={this.handleTeamsChange}
              defaultValue="请选择团队"
            >
              {teamsData.map(order => {
                return (
                  <Option value={order.team_name}>{order.team_alias}</Option>
                );
              })}
            </Select>
            <Select
              style={{ width: 120 }}
              onSelect={this.onRegionChange}
              defaultValue="请选择集群"
            >
              {regionData.map(order => {
                return (
                  <Option value={order.team_region_name}>
                    {order.team_region_alias}
                  </Option>
                );
              })}
            </Select>
          </div>
        )}
      </Modal>
    );
  }
}

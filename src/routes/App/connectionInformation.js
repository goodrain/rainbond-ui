import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Card, Form, Button, Icon, Table, Tag, notification, Tooltip, Modal, Radio, Popconfirm, Switch, Input } from "antd";
import SetMemberAppAction from "../../components/SetMemberAppAction";
import ScrollerX from "../../components/ScrollerX";
import AddVarModal from "./setting/env";
import ConfirmModal from "../../components/ConfirmModal";
import globalUtil from "../../utils/global";


const FormItem = Form.Item;
import {
  getStatus,
  restart
} from '../../services/app';
const RadioGroup = Radio.Group;

@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    innerEnvs: appControl.innerEnvs,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    // tags: appControl.tags,
    appDetail: appControl.appDetail,
    teamControl,
    appControl,
  }),
  null,
  null,
  { withRef: true },
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
        showAddVar: false,
        showEditVar: null,
        deleteVar: null,
    };
  }
  componentDidMount() {
      this.fetchInnerEnvs();
  }

  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  onEditVar = (data) => {
    this.setState({ showEditVar: data });
  };
  onDeleteVar = (data) => {
    this.setState({ deleteVar: data });
  };
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  fetchInnerEnvs = () => {
    this.props.dispatch({
      type: "appControl/fetchInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
      },
    });
  };

  handleDeleteVar = () => {
    this.props.dispatch({
      type: "appControl/deleteEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: this.state.deleteVar.attr_name,
      },
      callback: () => {
        this.cancelDeleteVar();
        this.fetchInnerEnvs();
        notification.success({ message: "操作成功，需要更新才能生效" });
      },
    });
  };

  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };

  handleEditVar = (vals) => {
    this.props.dispatch({
      type: "appControl/editEvns",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name,
      },
      callback: () => {
        this.cancelEditVar();
        this.fetchInnerEnvs();
      },
    });
  };

  handleSubmitAddVar = (vals) => {
    this.props.dispatch({
      type: "appControl/addInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name,
      },
      callback: () => {
        this.handleCancelAddVar();
        this.fetchInnerEnvs();
      },
    });
  };


  render() {
   const {innerEnvs} = this.props;
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24,
          }}
          title="服务连接信息"
        >
          <ScrollerX sm={600}>
            <Table
              columns={[
                {
                  title: "变量名",
                  dataIndex: "attr_name",
                },
                {
                  title: "变量值",
                  dataIndex: "attr_value",
                  // width: "40%",
                },
                {
                  title: "说明",
                  dataIndex: "name",
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  render: (v, data) => (
                    <Fragment>
                      <a
                        href="javascript:;"
                        onClick={() => {
                          this.onDeleteVar(data);
                        }}
                      >
                        删除
                      </a>
                      {data.is_change ? (
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onEditVar(data);
                          }}
                        >
                          修改
                        </a>
                      ) : (
                          ""
                        )}
                    </Fragment>
                  ),
                },
              ]}
              pagination={false}
              dataSource={innerEnvs}
            />
          </ScrollerX>
          <div
            style={{
              textAlign: "right",
              paddingTop: 20,
            }}
          >
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" />添加变量
            </Button>
          </div>
        </Card>
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            isShowRestartTips={(onoffshow) => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
            isShowRestartTips={(onoffshow) => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除此变量吗？"
            subDesc="此操作不可恢复"
          />
        )}
      </Fragment>
    );
  }
}

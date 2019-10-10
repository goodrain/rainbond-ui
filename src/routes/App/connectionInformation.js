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
import { width } from "window-size";
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
    outerEnvs: appControl.outerEnvs,
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
      page:1,
      page_size:5,
      total:0,
    };
  }
  componentDidMount() {
    this.fetchOuterEnvs();
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
  fetchOuterEnvs = () => {
    const {page,page_size}= this.state;
    this.props.dispatch({
      type: "appControl/fetchOuterEnvs",
      payload: {
        page,
        page_size,
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        env_type: "outer"
      },
      callback: (res) => {
        if (res && res._code == 200) {
          this.setState({ total: res.bean.total });
        }
      }
    });
  };

  handleDeleteVar = () => {
    this.props.dispatch({
      type: "appControl/deleteEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: this.state.deleteVar.ID
      },
      callback: (res) => {
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchOuterEnvs();
        }
        this.cancelDeleteVar();
      },
    });
  };

  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };

  handleEditVar = (vals) => {
    const { showEditVar } = this.state;
    this.props.dispatch({
      type: "appControl/editEvns",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name,
      },
      callback: (res) => {
        this.fetchOuterEnvs();
        this.cancelEditVar();
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
        scope: "outer"
      },
      callback: (res) => {
        this.fetchOuterEnvs();
        this.handleCancelAddVar();
      },
    });
  };

  onTransfer = (data) => {
    this.setState({ transfer: data });
  };

  cancelTransfer = () => {
    this.setState({ transfer: null });
  };

  handleTransfer = () => {
    const { transfer } = this.state;
    this.props.dispatch({
      type: "appControl/putTransfer",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: transfer.ID,
        scope: transfer.scope == "inner" ? "outer" : "inner"
      },
      callback: (res) => {
        this.cancelTransfer();
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchOuterEnvs();
        }
      },
    });
  };

  onServiceInfoPageChange = (page) => {
    this.setState({
      page
    }, () => {
      this.fetchOuterEnvs()
    })
  }

  render() {
    const { page,page_size,total } = this.state;
    const { outerEnvs } = this.props;
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24,
          }}
          title="组件连接信息"
        >
          <ScrollerX sm={600}>
            <Table
              style={{ width: "100%", overflowX: "auto" }}
              columns={[
                {
                  title: "变量名",
                  dataIndex: "attr_name",
                  key: "1",
                  width: "30%",
                  render: (v) => (
                      <div style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}>{v}</div>
                  )
                },
                {
                  title: "变量值",
                  dataIndex: "attr_value",
                  key: "2",
                  width: "30%",
                  render: (v) => (
                      <div style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}>{v}</div>
                  )
                },
                {
                  title: "说明",
                  dataIndex: "name",
                  key: "3",
                  width: "25%",
                  render: (v) => (
                      <div style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}>{v}</div>
                  )
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  key: "4",
                  width: "15%",
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

                      {/* <Tooltip   title={<p>将此连接信息变量转换为<br/>环境变量</p>}>
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onTransfer(data);
                          }}
                          style={{ marginRight: "5px" }}
                        >
                          转移
                      </a>
                      </Tooltip> */}
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
              pagination={{
                current: page,
                pageSize:page_size,
                total,
                onChange: this.onServiceInfoPageChange,
              }}
              dataSource={outerEnvs}
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
        {
          this.state.transfer && (
            <ConfirmModal
              onOk={this.handleTransfer}
              onCancel={this.cancelTransfer}
              title="转移连接信息变量"
              desc="确定要将此连接信息变量转换为环境变量吗?"
              subDesc="此操作不可恢复"
            />
          )
        }
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

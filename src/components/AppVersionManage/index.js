/*
   应用版本管理
*/
import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { Link, Switch, Route } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Popconfirm,
  Icon,
  Menu,
  Input,
  Dropdown,
  Table,
  Modal,
  notification
} from "antd";
import {
  getRelationedApp,
  getUnRelationedApp,
  addRelationedApp,
  removeRelationedApp
} from "../../services/app";
import globalUtil from "../../utils/global";
import styles from "./index.less";

@connect()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      page_num: 1,
      page_size: 10,
      total: "",
      bean: "",
      loading: true,
    };
  }
  componentDidMount() {
    this.getVersionList();
  }
  handleRolback = data => {
    this.props.onRollback && this.props.onRollback(data);
  };

  componentWillReceiveProps(nextProps) {
    nextProps.showUpgrade == true && this.getVersionList("update");
  }

  getVersionList = update => {
    const { page_num, page_size } = this.state;
    update && this.props.setShowUpgrade();
    this.props.dispatch({
      type: "appControl/getAppVersionList",
      payload: {
        team_name: this.props.team_name,
        service_alias: this.props.service_alias,
        page_num,
        page_size
      },
      callback: data => {
        this.setState({
          list: data.list || [],
          bean: data.bean || "",
          buildTotal:data.total,
          loading: false,
          total: data.total
        });
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleDel = data => {
    this.props.dispatch({
      type: "appControl/delAppVersion",
      payload: {
        team_name: this.props.team_name,
        service_alias: this.props.service_alias,
        version_id: data.build_version
      },
      callback: data => {
        notification.success({
          message: "删除成功"
        });
        this.getVersionList();
      }
    });
  };
  onPageChange = page_num => {
    this.setState({ page_num, loading: true }, () => {
      this.getVersionList();
    });
  };
  render() {
    const { total, page_num, page_size, bean} = this.state;
    return (
      <Modal
        title={
          <span>构建版本信息</span>
        }
        width={1200}
        visible={true}
        onCancel={this.handleCancel}
        footer={[<Button onClick={this.handleCancel}>关闭</Button>]}
      >
        <div className={styles.tdPadding}>

            {bean.success_num && total && (
              <span className={styles.floatright}>
                成功率：<a>{(Math.round(Number(bean.success_num) / (total== "0" ? 1 : Number(total)) * 10000) / 100.00)+"%"}</a>
              </span>
            )}
             {bean.failure_num && (
              <span className={styles.floatright}>
                失败次数：<a>{Number(bean.failure_num)}</a>
              </span>
            )}
            {bean.success_num && (
              <span className={styles.floatright}>
                成功次数：<a>{Number(bean.success_num)}</a>
              </span>
            )}
            
          <Table
            // pagination = {false}
            loading={this.loading}
            pagination={{
              total: total,
              page_num: page_num,
              pageSize: page_size,
              onChange: this.onPageChange,
              current: page_num
            }}
            dataSource={this.state.list || []}
            columns={[
              {
                title: "版本",
                dataIndex: "build_version",
                width: 120,
                align: "left",
                render:(text,record)=>{
                 return (
                  text == bean.current_version ? (<span style={{color:"#2593fb"}}>{`${text}(当前版本)`}</span>):(<span>{text}</span>)
                 )
                }
              },
              {
                title: "构建人",
                dataIndex: "build_user",
                width: 100,
                align: "center"
              },
              {
                title: "构建时间",
                dataIndex: "create_time",
                width: 100,
                align: "left"
              },
              {
                title: "构建类型",
                dataIndex: "kind",
                width: 120,
                align: "center"
              },
              {
                title: "提交信息",
                dataIndex: "commit_msg",
                width: 150,
                align: "center"
              },
              {
                title: "镜像/源码地址",
                dataIndex: "repo_url",
                width: 100,
                align: "left",
                render: (v, data) => {
                  return data.repo_url || data.image_url;
                }
              },
              {
                title: "构建状态",
                dataIndex: "status",
                width: 100,
                align: "center",
                render: v => {
                  var map = {
                    success: "成功",
                    failed: "失败",
                    timeout: "超时"
                  };
                  return map[v] || v;
                }
              },
              {
                title: "操作",
                dataIndex: "group_name",
                width: 100,
                align: "center",
                render: (v, data) => {
                  return (
                    <Fragment>
                      {data.upgrade_or_rollback == 1 ? (
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.handleRolback(data);
                          }}
                        >
                          升级
                        </a>
                      ) : data.upgrade_or_rollback == -1 ? (
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.handleRolback(data);
                          }}
                        >
                          回滚
                        </a>
                      ) : (
                        ""
                      )}
                      <Popconfirm
                        title="确定要删除此版本吗?"
                        onConfirm={() => {
                          this.handleDel(data);
                        }}
                      >
                        <a href="javascript:;">删除</a>
                      </Popconfirm>
                    </Fragment>
                  );
                }
              }
            ]}
          />
        </div>
      </Modal>
    );
  }
}

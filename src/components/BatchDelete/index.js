import React, { PureComponent } from "react";
import { Button, Modal, Table, Row, Col } from "antd";
import { batchDelete, reDelete } from "../../services/app";
import globalUtil from "../../utils/global";

/*转移到其他应用组*/
export default class MoveGroup extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      batchDeleteApps: this.props.batchDeleteApps,
      apps: this.props.batchDeleteApps.map(item => {
        if (item) {
          return {
            service_id: item.service_id,
            service_cname: item.service_cname,
            msg: "正在删除",
            status: 0
          };
        }
      }),
      confirm: false
    };
  }
  handleDelete = () => {
    this.setState({ confirm: true });
    let ids = this.props.batchDeleteApps.map(item => {

      return item.service_id;
    });
    batchDelete({
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: ids.join(",")
    }).then(data => {
      if (data) {
        this.setState({ apps: data.list });
      }
    });
  };


  reDelete = service_id => {
    reDelete({
      team_name: globalUtil.getCurrTeamName(),
      service_id: service_id
    }).then(data => {
      if (data) {
        let newapps = [];
        this.state.apps.map(item => {
          if (item.service_id == service_id) {
            item.status = 200;
            item.msg = "删除成功";
          }
          newapps.push(item);
        });
        this.setState({ apps: newapps });
      }
    });
  };
  render() {
    return (
      <Modal
        title="确认批量删除"
        visible={true}
        width={600}
        onCancel={this.props.onCancel}
        footer={<Button onClick={this.props.onCancel}>完成</Button>}
      >
        {this.state.confirm ? (
          <Table
            dataSource={this.state.apps || []}
            columns={[
              {
                title: "组件名称",
                dataIndex: "service_cname"
              },
              {
                title: "反馈信息",
                dataIndex: "msg"
              },
              {
                title: "操作",
                dataIndex: "action",
                render: (v, data) => {
                  if (data.status == 412) {
                    return (
                      <a
                        target="_blank"
                        onClick={() => {
                          this.reDelete(data.service_id);
                        }}
                      >
                        确认删除
                      </a>
                    );
                  }
                  if (data.status == 409) {
                    return "请先关闭组件";
                  }
                  if (data.status == 200) {
                    return "已删除";
                  }
                }
              }
            ]}
          />
        ) : (
          <div style={{ textAlign: "center" }}>
            <p>{this.state.apps&&this.state.apps.length&&this.state.apps[0]!=undefined?"即将删除以下组件":"请刷新数据后删除"}</p>
            <Row>
              {this.state.apps.map(item => {
                if(item==undefined)return null
                return (
                  <Col
                    span={8}
                    key={"col" + item.service_id}
                    style={{ overflow: "auto" }}
                  >
                    <p key={item.service_id}>{item.service_cname}</p>
                  </Col>
                );
              })}
            </Row>
           { this.state.apps&&this.state.apps.length&&this.state.apps[0]!=undefined?<Button type="primary" onClick={this.handleDelete}>
              确实批量删除
            </Button>:""}
          </div>
        )}
      </Modal>
    );
  }
}

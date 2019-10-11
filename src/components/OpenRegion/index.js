import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Button, Table, Modal, notification, Card } from "antd";
import { unOpenRegion } from "../../services/team";
import globalUtil from "../../utils/global";

//开通数据中心
@connect(({ user, global }) => ({
  currUser: user.currentUser,
  enterprise: global.enterprise
}))
class OpenRegion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      regions: []
    };
  }
  componentDidMount() {
    this.getUnRelationedApp();
    this.props.dispatch({
      type: "global/getEnterpriseInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: () => {}
    });
  }
  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({
        message: "请选择要开通的数据中心"
      });
      return;
    }

    this.props.onSubmit && this.props.onSubmit(this.state.selectedRowKeys);
  };
  getUnRelationedApp = () => {
    unOpenRegion({
      team_name: globalUtil.getCurrTeamName()
    }).then(data => {
      if (data) {
        this.setState({ regions: data.list || [] });
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  render() {
    const mode = this.props.mode || "modal";
    const { enterprise } = this.props;
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys: selectedRows.map(item => {
            return item.region_name;
          })
        });
      }
    };

    if (mode === "modal") {
      return (
        <Modal
          title="开通数据中心"
          width={600}
          visible={true}
          onOk={this.handleSubmit}
          onCancel={this.handleCancel}
        >
          {this.state.regions.length == 0 &&
            enterprise &&
            !enterprise.is_enterprise && (
              <div style={{ width: "100%", textAlign: "center" }}>
                <a href="https://www.goodrain.com/info.html" target="_blank">
                  多云管理功能请咨询企业服务
                </a>
              </div>
            )}
          <Table
            size="small"
            pagination={false}
            dataSource={this.state.regions || []}
            rowSelection={rowSelection}
            columns={[
              {
                title: "数据中心",
                dataIndex: "region_alias"
              },
              {
                title: "简介",
                dataIndex: "desc"
              }
            ]}
          />
        </Modal>
      );
    }

    return (
      <Card title="当前团队没有数据中心，请先开通">
        <Table
          size="small"
          pagination={false}
          dataSource={this.state.regions || []}
          rowSelection={rowSelection}
          columns={[
            {
              title: "数据中心",
              dataIndex: "region_alias"
            },
            {
              title: "简介",
              dataIndex: "desc"
            }
          ]}
        />
        <div style={{ textAlign: "right", paddingTop: 16 }}>
          <Button type="primary" onClick={this.handleSubmit}>
            开通
          </Button>
        </div>
      </Card>
    );
  }
}

export default OpenRegion;

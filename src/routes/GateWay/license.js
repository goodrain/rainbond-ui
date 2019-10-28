import React, { Component } from "react";
import { routerRedux, Link } from "dva/router";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import LicenseDrawer from "../../components/LicenseDrawer";
import { Row, Col, Button, Table, Card, notification, Typography } from "antd";
import { connect } from "dva";
import userUtil from "../../utils/user";
import globalUtil from "../../utils/global";

const { Paragraph } = Typography;

@connect(({ user }) => ({ currUser: user.currentUser }))
class Control extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleDrawer: false,
      licenseList: [],
      licenseLoading: true,
      page_num: 1,
      page_size: 10,
      total: "",
      editData: "",
      id: ""
    };
  }
  rowKey = (record, index) => index;
  componentWillMount() {
    const { currUser, dispatch } = this.props;
    // 不是系统管理员
    // if (!userUtil.isSystemAdmin(currUser) && !userUtil.isCompanyAdmin(currUser)) {
    //   this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Exception/403`));
    //   return null;
    // }
    this.load();
  }
  /**查询证书 */
  load = () => {
    const { page_num, page_size, total } = this.state;
    this.props.dispatch({
      type: "gateWay/fetchAllLicense",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_num,
        page_size
      },
      callback: data => {
        if (data) {
          this.setState({
            licenseList: data.list,
            total: data.bean.nums,
            editData: "",
            licenseLoading: false
          });
        }
      }
    });
  };
  handleCick = () => {
    this.setState({ visibleDrawer: true });
  };
  handleClose = () => {
    this.setState({ visibleDrawer: false, editData: "" });
  };
  /**添加证书 */
  handleOk = values => {
    const { editData } = this.state;
    if (!editData) {
      this.props.dispatch({
        type: "gateWay/addLicense",
        payload: {
          alias: values.alias,
          private_key: values.private_key,
          certificate: values.certificate,
          certificate_type: values.certificate_type,
          team_name: globalUtil.getCurrTeamName()
        },
        callback: data => {
          if (data && data._code == 200) {
            notification.success({ message: "添加成功" });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
            });
          }
        }
      });
    } else {
      this.props.dispatch({
        type: "gateWay/editLicense",
        payload: {
          alias: values.alias,
          private_key: values.private_key,
          certificate: values.certificate,
          certificate_type: values.certificate_type,
          team_name: globalUtil.getCurrTeamName(),
          certifiate_id: this.state.id
        },
        callback: data => {
          if (data && data._code == 200) {
            notification.success({ message: data ? "修改成功" : "修改失败" });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
            });
          }
        }
      });
    }
  };
  /**删除证书 */
  handleDelete = record => {
    this.props.dispatch({
      type: "gateWay/deleteLicense",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        certifiate_id: record.id
      },
      callback: data => {
        notification.success({
          message: (data && data.msg_show) || "删除成功"
        });
        this.load();
      }
    });
  };
  /**编辑 */
  handleEdit = record => {
    this.props.dispatch({
      type: "gateWay/queryDetail",
      payload: {
        certifiate_id: record.id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            visibleDrawer: true,
            editData: data.bean,
            id: data.bean.id
          });
        }
      }
    });
  };
  saveForm = form => {
    this.form = form;
    if (this.state.editData && this.form) {
      this.form.setFieldsValue(this.state.editData);
    }
  };
  /**更新证书 */
  handleUpdate = record => {
    console.log(record);
  };
  onPageChange = pageNumber => {
    this.setState({ licenseLoading: true });
    this.setState({ page_num: pageNumber }, () => {
      this.load();
    });
  };

  render() {
    const columns = [
      {
        title: "证书名称",
        dataIndex: "alias",
        key: "alias",
        align: "center",
        width: "12%"
      },
      {
        title: "证书地址",
        dataIndex: "issued_to",
        key: "issued_to",
        align: "center",
        width: "25%",
        render: issued_to => {
          return (
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: true
              }}
            >
              {issued_to &&
                issued_to.map(item => {
                  return (
                    <Row key={item}>
                      <Paragraph copyable>{item}</Paragraph>
                    </Row>
                  );
                })}
            </Paragraph>
          );
        }
      },
      {
        title: "过期时间",
        dataIndex: "end_data",
        key: "end_data",
        align: "center",
        width: "20%",
        render: (end_data, record) => {
          return (
            <div
              style={{
                color: record.has_expired ? "red" : " rgba(0, 0, 0, 0.65)"
              }}
            >
              {end_data}
            </div>
          );
        }
      },
      {
        title: "证书类型",
        dataIndex: "certificate_type",
        key: "certificate_type",
        align: "center",
        width: "13%"
      },
      {
        title: "证书来源",
        dataIndex: "issued_by",
        key: "issued_by",
        align: "center",
        width: "15%"
      },
      {
        title: "操作",
        dataIndex: "action",
        key: "action",
        align: "center",
        width: "15%",
        render: (text, record, index) => {
          return (
            <span>
              <a
                style={{ marginRight: "10px" }}
                onClick={this.handleEdit.bind(this, record)}
              >
                编辑
              </a>
              {record.issued_by.includes("第三方签发") ? (
                ""
              ) : (
                <a
                  style={{ marginRight: "10px" }}
                  onClick={this.handleUpdate.bind(this, record)}
                >
                  更新
                </a>
              )}
              <a onClick={this.handleDelete.bind(this, record)}>删除</a>
            </span>
          );
        }
      }
    ];
    const { page_num, page_size, total, licenseList } = this.state;
    return (
      <PageHeaderLayout
        title="证书管理"
        breadcrumbList={[
          {
            title: "首页",
            icon: "home"
          },
          {
            title: "应用网关",
            icon: "folder-open"
          },
          {
            title: "证书管理",
            icon: "laptop"
          }
        ]}
      >
        <Row>
          <Button
            type="primary"
            icon="plus"
            style={{ float: "right", marginBottom: "10px" }}
            onClick={this.handleCick}
          >
            添加证书
          </Button>
        </Row>
        <Card bodyStyle={{ padding: "0" }}>
          <Table
            pagination={{
              total: total,
              page_num: page_num,
              pageSize: page_size,
              onChange: this.onPageChange,
              current: page_num
            }}
            rowKey={this.rowKey}
            dataSource={licenseList}
            columns={columns}
            loading={this.state.licenseLoading}
          />
        </Card>
        {this.state.visibleDrawer && (
          <LicenseDrawer
            ref={this.saveForm}
            visible={this.state.visibleDrawer}
            onClose={this.handleClose}
            onOk={values => {
              this.handleOk(values);
            }}
            editData={this.state.editData}
          />
        )}
      </PageHeaderLayout>
    );
  }
}

export default Control;

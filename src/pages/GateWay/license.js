import {
  Button,
  Card,
  notification,
  Popconfirm,
  Row,
  Table,
  Typography
} from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import LicenseDrawer from '../../components/LicenseDrawer';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';

const { Paragraph } = Typography;

@connect(({ user, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
class Control extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleDrawer: false,
      licenseList: [],
      licenseLoading: true,
      page: 1,
      pageSize: 10,
      total: '',
      editData: '',
      id: '',
      operationPermissions: this.handlePermissions('queryCertificateInfo')
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    } else {
      this.load();
    }
  }

  onPageChange = pageNumber => {
    this.setState({ licenseLoading: true });
    this.setState({ page: pageNumber }, () => {
      this.load();
    });
  };

  rowKey = (record, index) => index;

  /** 查询证书 */
  load = () => {
    const { page, pageSize } = this.state;
    this.props.dispatch({
      type: 'gateWay/fetchAllLicense',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_num: page,
        page_size: pageSize
      },
      callback: data => {
        if (data && data.status_code === 200) {
          this.setState({
            licenseList: data.list,
            total: data.bean.nums,
            editData: '',
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
    this.setState({ visibleDrawer: false, editData: '' });
  };
  /** 添加证书 */
  handleOk = values => {
    const { editData } = this.state;
    if (!editData) {
      this.props.dispatch({
        type: 'gateWay/addLicense',
        payload: {
          alias: values.alias,
          private_key: values.private_key,
          certificate: values.certificate,
          certificate_type: values.certificate_type,
          team_name: globalUtil.getCurrTeamName()
        },
        callback: data => {
          if (data && data.status_code === 200) {
            notification.success({ message: '添加成功' });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
            });
          }
        }
      });
    } else {
      this.props.dispatch({
        type: 'gateWay/editLicense',
        payload: {
          alias: values.alias,
          private_key: values.private_key,
          certificate: values.certificate,
          certificate_type: values.certificate_type,
          team_name: globalUtil.getCurrTeamName(),
          certifiate_id: this.state.id
        },
        callback: data => {
          if (data && data.status_code === 200) {
            notification.success({ message: data ? '修改成功' : '修改失败' });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
            });
          }
        }
      });
    }
  };
  /** 删除证书 */
  handleDelete = record => {
    this.props.dispatch({
      type: 'gateWay/deleteLicense',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        certifiate_id: record.id
      },
      callback: data => {
        if (data && data.status_code === 200) {
          notification.success({
            message: (data && data.msg_show) || '删除成功'
          });
          this.load();
        }
      }
    });
  };
  /** 编辑 */
  handleEdit = record => {
    this.props.dispatch({
      type: 'gateWay/queryDetail',
      payload: {
        certifiate_id: record.id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data && data.status_code === 200) {
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
  /** 更新证书 */
  handleUpdate = record => {
    console.log(record);
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const {
      page,
      pageSize,
      total,
      licenseList,
      operationPermissions: { isCreate, isEdit, isDelete }
    } = this.state;
    const columns = [
      {
        title: '证书名称',
        dataIndex: 'alias',
        key: 'alias',
        align: 'center',
        width: '12%'
      },
      {
        title: '证书地址',
        dataIndex: 'issued_to',
        key: 'issued_to',
        align: 'center',
        width: '25%',
        render: data => {
          return (
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: true
              }}
              style={{ margin: 0 }}
            >
              {data &&
                data.map(item => {
                  return (
                    <Row key={item}>
                      <Paragraph style={{ margin: 0 }} copyable>
                        {item}
                      </Paragraph>
                    </Row>
                  );
                })}
            </Paragraph>
          );
        }
      },
      {
        title: '过期时间',
        dataIndex: 'end_data',
        key: 'end_data',
        align: 'center',
        width: '20%',
        render: (data, record) => {
          return (
            <div
              style={{
                color: record.has_expired ? 'red' : ' rgba(0, 0, 0, 0.65)'
              }}
            >
              {data}
            </div>
          );
        }
      },
      {
        title: '证书类型',
        dataIndex: 'certificate_type',
        key: 'certificate_type',
        align: 'center',
        width: '13%'
      },
      {
        title: '证书来源',
        dataIndex: 'issued_by',
        key: 'issued_by',
        align: 'center',
        width: '15%'
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        align: 'center',
        width: '15%',
        render: (_, record) => {
          return (
            <span>
              {isEdit && (
                <a
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    this.handleEdit(record);
                  }}
                >
                  编辑
                </a>
              )}

              {!record.issued_by.includes('第三方签发') && isEdit && (
                <a
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    this.handleUpdate(record);
                  }}
                >
                  更新
                </a>
              )}

              {isDelete && (
                <Popconfirm
                  title="确认要删除吗？"
                  onConfirm={() => {
                    this.handleDelete(record);
                  }}
                >
                  <a>删除</a>
                </Popconfirm>
              )}
            </span>
          );
        }
      }
    ];
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '网关管理' });
    return (
      <PageHeaderLayout
        title="证书管理"
        breadcrumbList={breadcrumbList}
        content="TLS证书管理，支持服务端证书，支持展示证书过期时间"
      >
        <Row>
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ float: 'right', marginBottom: '10px' }}
              onClick={this.handleCick}
            >
              添加证书
            </Button>
          )}
        </Row>
        <Card bodyStyle={{ padding: '0' }}>
          <Table
            pagination={{
              total,
              page_num: page,
              pageSize,
              onChange: this.onPageChange,
              current: page
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

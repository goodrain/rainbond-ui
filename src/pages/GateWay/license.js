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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
            notification.success({ message: formatMessage({id:'notification.success.add'}) });
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
            notification.success({ message: data ? formatMessage({id:'notification.success.change'}) : formatMessage({id:'notification.error.change'}) });
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
            message: (data && data.msg_show) || formatMessage({id:'notification.success.delete'})
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
        title: formatMessage({id: 'teamGateway.certificate.table.name'}),
        dataIndex: 'alias',
        key: 'alias',
        align: 'center',
        width: '12%'
      },
      {
        title: formatMessage({id: 'teamGateway.certificate.table.address'}),
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
        title: formatMessage({id: 'teamGateway.certificate.table.time'}),
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
        title: formatMessage({id: 'teamGateway.certificate.table.type'}),
        dataIndex: 'certificate_type',
        key: 'certificate_type',
        align: 'center',
        width: '13%'
      },
      {
        title: formatMessage({id: 'teamGateway.certificate.table.source'}),
        dataIndex: 'issued_by',
        key: 'issued_by',
        align: 'center',
        width: '15%'
      },
      {
        title: formatMessage({id: 'teamGateway.certificate.table.operate'}),
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
                 {formatMessage({id: 'teamGateway.certificate.table.edit'})}
                </a>
              )}

              {!record.issued_by.includes('第三方签发') && isEdit && (
                <a
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    this.handleUpdate(record);
                  }}
                >
                  {formatMessage({id: 'teamGateway.certificate.table.update'})}
                </a>
              )}

              {isDelete && (
                <Popconfirm
                  title="确认要删除吗？"
                  onConfirm={() => {
                    this.handleDelete(record);
                  }}
                >
                  <a>{formatMessage({id: 'teamGateway.certificate.table.delete'})}</a>
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
    breadcrumbList.push({ title: formatMessage({id: 'teamGateway.strategy.manage'}) });
    return (
      <PageHeaderLayout
        title={formatMessage({id: 'teamGateway.certificate.title'})}
        breadcrumbList={breadcrumbList}
        content={formatMessage({id: 'teamGateway.certificate.desc'})}
      >
        <Row>
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ float: 'right', marginBottom: '10px' }}
              onClick={this.handleCick}
            >
              {formatMessage({id: 'teamGateway.certificate.btn.add'})}
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

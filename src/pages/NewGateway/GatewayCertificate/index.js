import {
  Button,
  Card,
  notification,
  Popconfirm,
  Row,
  Table,
  Typography,
  Modal,
  Form,
  Icon,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import copy from 'copy-to-clipboard';
import CodeMirror from 'react-codemirror';
import LicenseDrawer from '../../../components/LicenseDrawer';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../../utils/breadcrumb';
import globalUtil from '../../../utils/global';
import pageheaderSvg from '../../../utils/pageHeaderSvg';
import roleUtil from '../../../utils/role';

const { Paragraph } = Typography;
@Form.create()

@connect(({ user, teamControl, enterprise, global }) => ({
  currUser: user.currentUser,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  isBoxShadow: global.isBoxShadow,
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
      gatewayShow: false,
      batchGateway: false,
      name: '',
    };
  }
  componentWillMount() {
    this.fetchPipePipeline();
    this.handleBatchGateWay();
    this.load();
  }

  onPageChange = (pageNumber, pageSize) => {
    this.setState({ licenseLoading: true });
    this.setState({ page: pageNumber, pageSize }, () => {
      this.load();
    });
  };

  fetchPipePipeline = (eid) => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list) {
          res.list.map(item => {
            if (item.name == "rainbond-gateway-base") {
              this.setState({
                gatewayShow: true
              })
            }
          })
        }
      }
    })
  }
  handleBatchGateWay = () => {
    const { dispatch, currUser } = this.props
    const regionName = globalUtil.getCurrRegionName()
    dispatch({
      type: 'gateWay/getBatchGateWay',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: regionName
      },
      callback: res => {
        if (res && res.list) {
          if (res.list.length > 0) {
            this.setState({
              batchGateway: true
            })
          }
        }
      }
    })
  }

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
    this.setState({ visibleDrawer: true, isGatewayInfo: false });
  };
  handleClose = () => {
    this.setState({ visibleDrawer: false, editData: '' });
  };
  handleApiGatewayCert = (values, type) => {
    this.props.dispatch({
      type: 'gateWay/handleApiGatewayCert',
      payload: {
        alias: values.alias,
        teamName: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data && data.status_code === 200) {
          if (type == 'add') {
            notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
            });
          } else {
            notification.success({ message: data ? formatMessage({ id: 'notification.success.change' }) : formatMessage({ id: 'notification.error.change' }) });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
            });
          }
        }
      }
    });
  }
  deleteApiGatewayCert = (values) => {
    this.props.dispatch({
      type: 'gateWay/deleteApiGatewayCert',
      payload: {
        alias: values.alias,
        teamName: globalUtil.getCurrTeamName()
      }
    });
  }
  /** 添加证书 */
  handleOk = values => {
    const { editData } = this.state;

    if (!editData) {
      this.setState({
        name: values.alias
      })
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
            setTimeout(() => {
              this.handleApiGatewayCert(values, 'add')
            }, 500);
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
            setTimeout(() => {
              this.handleApiGatewayCert(values, 'edit')
            }, 500);
          }
        }
      });
    }
  };
  /** 删除证书 */
  handleDelete = record => {
    // this.deleteApiGatewayCert(record)
    this.props.dispatch({
      type: 'gateWay/deleteLicense',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        certifiate_id: record.id
      },
      callback: data => {
        if (data && data.status_code === 200) {
          notification.success({
            message: (data && data.msg_show) || formatMessage({ id: 'notification.success.delete' })
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
            id: data.bean.id,
            isGatewayInfo: data.bean.certificate_type == "gateway" ? true : false
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
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      form,
      isBoxShadow,
      permission: {
        isCreate,
        isDelete,
        isEdit
      }
    } = this.props;
    const {
      page,
      pageSize,
      total,
      licenseList,
      batchGateway,
      gatewayShow,
      name,
      isGatewayInfo
    } = this.state;
    const bool = batchGateway && gatewayShow
    const { getFieldDecorator, setFieldsValue } = form;
    const columns = [
      {
        title: formatMessage({ id: 'teamGateway.certificate.table.name' }),
        dataIndex: 'alias',
        key: 'alias',
        align: 'center',
        width: '12%'
      },
      {
        title: formatMessage({ id: 'teamGateway.certificate.table.address' }),
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
        title: formatMessage({ id: 'teamGateway.certificate.table.time' }),
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
      // {
      //   title: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.Gateway' }),
      //   dataIndex: 'certificate_type',
      //   key: 'certificate_type',
      //   align: 'center',
      //   width: '13%',
      //   render: (data, record) => {
      //     if (data == "gateway") {
      //       return <p>{formatMessage({ id: 'teamGateway.control.table.GatewayApi' })}</p>
      //     } else {
      //       return <p>{data}</p>
      //     }
      //   }
      // },
      {
        title: formatMessage({ id: 'teamGateway.certificate.table.source' }),
        dataIndex: 'issued_by',
        key: 'issued_by',
        align: 'center',
        width: '15%'
      },
      {
        title: formatMessage({ id: 'teamGateway.certificate.table.operate' }),
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
                  {formatMessage({ id: 'teamGateway.certificate.table.edit' })}
                </a>
              )}

              {!record.issued_by.includes('第三方签发') && isEdit && (
                <a
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    this.handleUpdate(record);
                  }}
                >
                  {formatMessage({ id: 'teamGateway.certificate.table.update' })}
                </a>
              )}

              {isDelete && (
                <Popconfirm
                  title={formatMessage({ id: 'teamGateway.strategy.table.type.detele' })}
                  onConfirm={() => {
                    this.handleDelete(record);
                  }}
                >
                  <a>{formatMessage({ id: 'teamGateway.certificate.table.delete' })}</a>
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
    breadcrumbList.push({ title: formatMessage({ id: 'teamGateway.strategy.manage' }) });
    const str = `    - allowedRoutes:\n        namespaces:\n          from: All\n      name: https\n      port: 443\n      protocol: HTTPS\n      tls:\n        certificateRefs:\n          - group: ''\n            kind: Secret\n            name: ${name}\n        mode: Terminate\n`
    return (
      <div
      //   title={formatMessage({ id: 'teamGateway.certificate.title' })}
      //   breadcrumbList={breadcrumbList}
      //   content={formatMessage({ id: 'teamGateway.certificate.desc' })}
      //   titleSvg={pageheaderSvg.getSvg('certificateSvg', 18)}
      >
        <Card
          extra={
            isCreate && (
              <Button
                type="primary"
                icon="plus"
                style={{ float: 'right' }}
                onClick={this.handleCick}
              >
                {formatMessage({ id: 'teamGateway.certificate.btn.add' })}
              </Button>
            )
          }
          style={{ borderRadius: 5 }}
          // id={isBoxShadow ? 'box-shadow' : 'border-color'}
          bodyStyle={{ padding: '0' }}
        >
          <Table
            pagination={{
              total,
              pageSize,
              onChange: this.onPageChange,
              current: page,
              total: total,
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onShowSizeChange: this.onPageChange,
              hideOnSinglePage: total<=10
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
            isGateway={bool || isGatewayInfo}
          />
        )}
      </div>
    );
  }
}

export default Control;

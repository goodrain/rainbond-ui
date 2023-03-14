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
import LicenseDrawer from '../../components/LicenseDrawer';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import roleUtil from '../../utils/role';

const { Paragraph } = Typography;
@Form.create()

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
      operationPermissions: this.handlePermissions('queryCertificateInfo'),
      gatewayShow: false,
      batchGateway: false,
      name: '',
      moduleShow: false
    };
  }
  componentWillMount() {
    this.fetchPipePipeline();
    this.handleBatchGateWay();
    const { dispatch, } = this.props;
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

  fetchPipePipeline = (eid) => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'teamControl/fetchPipePipeline',
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
    this.setState({ visibleDrawer: true, isGatewayInfo:false });
  };
  handleClose = () => {
    this.setState({ visibleDrawer: false, editData: '' });
  };
  /** 添加证书 */
  handleOk = values => {
    const { editData } = this.state;
    if (!editData) {
      this.setState({
        name:values.alias
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
            notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
            this.setState({ visibleDrawer: false }, () => {
              this.load();
              this.setState({
                moduleShow: values.certificate_type == "gateway" ? true : false
              })
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
            notification.success({ message: data ? formatMessage({ id: 'notification.success.change' }) : formatMessage({ id: 'notification.error.change' }) });
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
  onCancel = () =>{
    this.setState({
      moduleShow: false
    })
  }
  goPath =(str) =>{
    const {currUser, dispatch} = this.props;
    if(currUser.is_enterprise_admin){
      dispatch(
        routerRedux.push(
          `/enterprise/${currUser.enterprise_id}/extension`
        )
      )
    }else{
      notification.warning({
        message: formatMessage({id:'teamGateway.license.noAuthority'})
      });
    }


  }
  render() {
    const { currentEnterprise, currentTeam, currentRegionName, form } = this.props;
    const {
      page,
      pageSize,
      total,
      licenseList,
      operationPermissions: { isCreate, isEdit, isDelete },
      batchGateway,
      gatewayShow,
      name,
      moduleShow,
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
      {
        title: formatMessage({ id: 'teamGateway.DrawerGateWayAPI.Gateway' }),
        dataIndex: 'certificate_type',
        key: 'certificate_type',
        align: 'center',
        width: '13%',
        render: (data, record) => {
          if (data == "gateway") {
            return <p>{formatMessage({ id: 'teamGateway.control.table.GatewayApi' })}</p>
          } else {
            return <p>{data}</p>
          }
        }
      },
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
                  title={formatMessage({id:'teamGateway.license.delete'})}
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
    const str = `    - name: https\n      protocol: HTTPS\n      port: 443n\n      tls:\n        certificateRefs:\n          - kind: Secret\n            group: ""\n            name: ${name}\n`
    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'teamGateway.certificate.title' })}
        breadcrumbList={breadcrumbList}
        content={formatMessage({ id: 'teamGateway.certificate.desc' })}
        titleSvg={pageheaderSvg.getSvg('certificateSvg', 18)}
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
          style={{
            borderRadius: 5,
            boxShadow: 'rgb(36 46 66 / 16%) 1px 2px 5px 0px',
          }}
          bodyStyle={{ padding: '0' }}
        >
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
            isGateway={bool || isGatewayInfo}
          />
        )}
        <Modal
          title="Basic Modal"
          visible={moduleShow}
          onOk={()=>this.goPath(str)}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" onClick={this.onCancel}>
              {formatMessage({id:'teamGateway.license.later'})}
            </Button>,
            <Button key="submit" type="primary"onClick={()=>this.goPath(str)}>
              {formatMessage({id:'teamGateway.license.now'})}
            </Button>,
          ]}
        >
          <p>{formatMessage({id:'teamGateway.license.go'})} <strong> {formatMessage({id:'teamGateway.license.path'})}</strong></p>
          <p>{formatMessage({id:'teamGateway.license.find'})} <strong>（{name}）</strong>{formatMessage({id:'teamGateway.license.file'})}</p>
          <p>{formatMessage({id:'teamGateway.license.in'})} <span style={{color:'red'}}><strong>spec.listeners</strong></span> {formatMessage({id:'teamGateway.license.add'})}
          <Tooltip placement="right" title={formatMessage({id:'teamGateway.license.copy'})}>
          <Icon
            style={{color:"blue",fontSize:16}}
            type="copy"
            onClick={() => {
              copy(str);
              notification.success({ message: formatMessage({id:'notification.success.copy'}) });
            }}
          />
          </Tooltip>
          </p>

          <CodeMirror
            value={str}
            options={{
              mode: { name: 'yaml', json: true },
              lineNumbers: true,
              theme: 'seti',
              lineWrapping: true,
              smartIndent: true,
              matchBrackets: true,
              showCursorWhenSelecting: true,
              scrollbarStyle:null,
              height: 500
            }}
          />
        </Modal>
      </PageHeaderLayout>
    );
  }
}

export default Control;

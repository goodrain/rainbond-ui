/* eslint-disable no-unused-vars */
import ConfirmModal from '@/components/ConfirmModal';
import {
  Button,
  Card,
  Icon,
  Modal,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import globalUtil from '../../utils/global';
import InfoConnectModal from '../InfoConnectModal';
import Search from '../Search';
import TcpDrawerForm from '../TcpDrawerForm';
import styles from './index.less';

@connect(({ user, global, loading, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  groups: global.groups,
  currentTeam: teamControl.currentTeam,
  currentEnterprise: enterprise.currentEnterprise,
  addTcpLoading: loading.effects['gateWay/querydomain_port']
}))
export default class TcpTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      toDeleteHttp: false,
      deleteLoading: false,
      TcpDrawerVisible: false,
      page_num: 1,
      page_size: 10,
      total: '',
      tcp_search: '',
      dataList: [],
      innerEnvs: [],
      informationConnectVisible: false,
      editInfo: '',
      values: '',
      whetherOpenForm: false,
      tcpLoading: true,
      visibleModal: false,
      agreement: {},
      NotHttpConnectInfo: [],
      tcpType: ''
    };
  }
  componentWillMount() {
    this.load();
  }
  onPageChange = page_num => {
    this.setState({ page_num }, () => {
      this.load();
    });
  };

  load = () => {
    const { appID } = this.props;
    if (appID) {
      this.loadAPPTCPRule();
    } else {
      this.loadTeamTCPRule();
    }
  };
  loadTeamTCPRule = () => {
    const { dispatch, currentTeam } = this.props;
    const { page_num, page_size, tcp_search } = this.state;
    dispatch({
      type: 'gateWay/queryTcpData',
      payload: {
        team_name: currentTeam.team_name,
        page_num,
        page_size,
        search_conditions: tcp_search
      },
      callback: data => {
        if (data) {
          this.setState({
            dataList: data.list,
            loading: false,
            total: data.bean.total,
            tcpLoading: false
          });
        }
      }
    });
  };
  loadAPPTCPRule = () => {
    const { dispatch, currentTeam, currentEnterprise, appID } = this.props;
    const { page_num, page_size, tcp_search } = this.state;
    dispatch({
      type: 'gateWay/queryAppTcpData',
      payload: {
        team_name: currentTeam.team_name,
        enterprise_id: currentEnterprise.enterprise_id,
        page_num,
        page_size,
        app_id: appID,
        search_conditions: tcp_search
      },
      callback: data => {
        if (data) {
          this.setState({
            dataList: data.list,
            loading: false,
            total: data.bean.total,
            tcpLoading: false
          });
        }
      }
    });
  };
  handleClick = () => {
    this.setState({ TcpDrawerVisible: true });
  };
  handleClose = () => {
    this.setState({ TcpDrawerVisible: false, editInfo: '' });
  };
  rowKey = (record, index) => index;

  /** 获取连接信息 */
  handleConectInfo = record => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/fetchEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({
            innerEnvs: data.list || [],
            informationConnectVisible: true
          });
        }
      }
    });
    this.setState({ InfoConnectModal: true });
  };
  handleCancel = () => {
    this.setState({ informationConnectVisible: false });
  };
  handleToDeleteHttp = val => {
    this.setState({
      toDeleteHttp: val
    });
  };
  handleDeleteLoading = deleteLoading => {
    this.setState({
      deleteLoading
    });
  };
  handleDelete = () => {
    this.handleDeleteLoading(true);
    const { dispatch } = this.props;
    const { toDeleteHttp: values } = this.state;
    dispatch({
      type: 'gateWay/deleteTcp',
      payload: {
        service_id: values.service_id,
        tcp_rule_id: values.tcp_rule_id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        notification.success({
          message: (data && data.msg_show) || formatMessage({id:'notification.success.delete'})
        });
        this.handleToDeleteHttp(false);
        this.handleDeleteLoading(false);
        this.reload();
      }
    });
  };
  reload() {
    this.setState(
      {
        page_num: 1
      },
      () => {
        this.load();
      }
    );
  }
  handleSearch = value => {
    this.setState(
      {
        tcp_search: value,
        page_num: 1
      },
      () => {
        this.load();
      }
    );
  };
  handleOk = (values, obj) => {
    const { dispatch } = this.props;
    const { editInfo, end_point, tcpType } = this.state;
    if (obj && obj.whether_open) {
      values.whether_open = true;
    }
    if (!editInfo) {
      dispatch({
        type: 'gateWay/addTcp',
        payload: {
          values,
          team_name: globalUtil.getCurrTeamName()
        },
        callback: data => {
          if (data && data.bean.is_outer_service == false) {
            this.setState({
              values
            });
            this.whether_open(values);
            return;
          }
          if (data && data._condition == 400) {
            notification.warning({ message: data.msg_show });
            return null;
          }
          if (data) {
            notification.success({ message: data.msg_show || formatMessage({id:'notification.success.add'}) });
          }
          this.setState({
            TcpDrawerVisible: false
          });
          this.reload();
        }
      });
    } else {
      // let end_points= `${values.end_point.ip}:${values.end_point.port}`.replace(/\s+/g, "")
      const end_pointArr = editInfo.end_point.split(':');
      values.default_port = end_pointArr[1];
      values.end_point.port == end_pointArr[1]
        ? (values.type = tcpType)
        : (values.type = 1);
      dispatch({
        type: 'gateWay/editTcp',
        payload: {
          values,
          team_name: globalUtil.getCurrTeamName(),
          tcp_rule_id: editInfo.tcp_rule_id
        },
        callback: data => {
          data
            ? notification.success({ message: data.msg_show || formatMessage({id:'notification.success.edit'}) })
            : notification.warning({ message: formatMessage({id:'notification.error.edit'}) });
          this.setState({
            TcpDrawerVisible: false,
            editInfo: false
          });
          this.load();
        }
      });
    }
  };
  whether_open = () => {
    this.setState({
      whetherOpenForm: true
    });
    const { values } = this.state;
    // this.handleOk(values, { whether_open: true })
  };
  handleEdit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/queryDetail_tcp',
      payload: {
        tcp_rule_id: values.tcp_rule_id,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            editInfo: data.bean,
            TcpDrawerVisible: true,
            tcpType: values.type,
            end_point: values.end_point
          });
        }
      }
    });
  };
  resolveOk = () => {
    this.setState(
      {
        whetherOpenForm: false
      },
      () => {
        const { values } = this.state;
        this.handleOk(values, { whether_open: true });
      }
    );
  };
  handleCancel_second = () => {
    this.setState({ whetherOpenForm: false });
  };
  saveForm = form => {
    this.form = form;
    const { editInfo } = this.state;
  };
  openService = record => {
    this.props.dispatch({
      type: 'appControl/openPortOuter',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias,
        port: record.container_port,
        action: 'only_open_outer'
      },
      callback: () => {
        this.load();
      }
    });
  };
  resolveNotHttp = record => {
    const { dispatch } = this.props;
    dispatch({
      type: 'gateWay/fetchEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_alias
      },
      callback: data => {
        if (data) {
          const dataList = data.list.filter(item => {
            // !item.attr_name.endsWith("_HOST") || !item.attr_name.endsWith("_PORT");
            return (
              !item.attr_name.endsWith('_HOST') &&
              !item.attr_name.endsWith('_PORT')
            );
          });
          this.setState({
            visibleModal: true,
            agreement: record,
            NotHttpConnectInfo: dataList || []
          });
        }
      }
    });
  };
  handeModalCancel = () => {
    this.setState({
      visibleModal: false
    });
  };
  showConnectInfo = infoArr => {
    return (
      <Table
        rowKey={this.rowKey}
        className={styles.tdPadding}
        columns={[
          {
            title: '变量名',
            dataIndex: 'attr_name',
            key: 'attr_name',
            align: 'center',
            render: (text) =>{
              return <div className={styles.valueStyle}>
                        {text}
                     </div>
            }
          },
          {
            title: '变量值',
            dataIndex: 'attr_value',
            key: 'attr_value',
            align: 'center',
            render: (text) =>{
              return <div className={styles.valueStyle}>
                        {text}
                     </div>
            }
          },
          {
            title: '说明',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            render: (text) =>{
              return <div className={styles.valueStyle}>
                      {text}
                    </div>
            }
          }
        ]}
        pagination={false}
        dataSource={infoArr}
        bordered={false}
      />
    );
  };
  render() {
    const {
      appID,
      operationPermissions: { isCreate, isEdit, isDelete },
      currUser
    } = this.props;
    const { region } = currUser.teams[0];
    const currentRegion = region.filter(item => {
      return item.team_region_name == globalUtil.getCurrRegionName();
    });
    const {
      total,
      page_num,
      page_size,
      toDeleteHttp,
      deleteLoading,
      dataList,
      innerEnvs,
      informationConnectVisible,
      TcpDrawerVisible,
      whetherOpenForm,
      visibleModal,
      tcpType,
      agreement
    } = this.state;
    const columns = [
      {
        title: formatMessage({id: 'teamGateway.strategy.table.end_point'}),
        dataIndex: 'end_point',
        key: 'end_point',
        align: 'left',
        render: (text, record) => {
          let str = text;
          if (
            str.indexOf('0.0.0.0') > -1 &&
            currentRegion &&
            currentRegion.length > 0
          ) {
            str = str.replace(/0.0.0.0/g, currentRegion[0].tcpdomain);
          }
          return record.protocol == 'http' || record.protocol == 'https' ? (
            <a href={`http://${str.replace(/\s+/g, '')}`} target="blank">
              {text}
            </a>
          ) : (
            <a
              href="javascript:void(0)"
              onClick={this.resolveNotHttp.bind(this, record)}
            >
              {text}
            </a>
          );
        }
        // width: "25%",
      },
      {
        title: formatMessage({id: 'teamGateway.strategy.table.type'}),
        dataIndex: 'type',
        key: 'type',
        align: 'center',
        // width: "10%",
        render: (text, record, index) => {
          return text == '0' ? <span>{formatMessage({id: 'teamGateway.strategy.table.type.default'})}</span> : <span>{formatMessage({id: 'teamGateway.strategy.table.type.custom'})}</span>;
        }
      },
      {
        title: formatMessage({id: 'teamGateway.strategy.table.protocol'}),
        dataIndex: 'protocol',
        key: 'protocol',
        align: 'center'
        // width: "10%",
      },
      {
        title: formatMessage({id: 'teamGateway.strategy.table.group_name'}),
        dataIndex: 'group_name',
        key: 'group_name',
        align: 'center',
        render: (text, record) => {
          return record.is_outer_service == 0 &&
            record.service_source != 'third_party' ? (
              <a href="javascript:void(0)" disabled>
              {text}
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                record.group_id
              }/`}
            >
              {text}
            </Link>
          );
        }
      },
      {
        title: formatMessage({id: 'teamGateway.strategy.table.service_cname'}),
        dataIndex: 'container_port',
        key: 'container_port',
        align: 'center',
        // width: "10%",
        render: (text, record) => {
          return record.is_outer_service == 0 &&
            record.service_source != 'third_party' ? (
              <a href="javascript:void(0)" disabled>
              {record.service_cname}({text})
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                record.service_alias
              }/port`}
            >
              {record.service_cname}({text})
            </Link>
          );
        }
      },
      {
        title: formatMessage({id: 'teamGateway.strategy.table.operate'}),
        dataIndex: 'action',
        key: 'action',
        align: 'center',
        // width: "20%",
        render: (_, record) => {
          return record.is_outer_service == 1 ||
            record.service_source == 'third_party' ? (
              <div>
              {isEdit && (
                <a
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    this.handleConectInfo(record);
                  }}
                >
                  {formatMessage({id: 'teamGateway.strategy.table.type.joinMsg'})}
                </a>
              )}
              {isEdit && (
                <a
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    this.handleEdit(record);
                  }}
                >
                  {formatMessage({id: 'teamGateway.strategy.table.edit'})}
                </a>
              )}
              {isDelete && (
                <a
                  onClick={() => {
                    this.handleToDeleteHttp(record);
                  }}
                >
                  {formatMessage({id: 'teamGateway.strategy.table.delete'})}
                </a>
              )}
            </div>
          ) : (
            <Tooltip
              placement="topLeft"
              title={formatMessage({id: 'teamGateway.strategy.table.type.tooltip.onclick'})}
              arrowPointAtCenter
            >
              <div>
                {isDelete && (
                  <a
                    style={{ marginRight: '10px' }}
                    onClick={() => {
                      this.handleToDeleteHttp(record);
                    }}
                  >
                   {formatMessage({id: 'teamGateway.strategy.table.delete'})}
                  </a>
                )}
                {isEdit && (
                  <a
                    style={{ marginRight: '10px' }}
                    onClick={() => {
                      this.openService(record);
                    }}
                  >
                    {formatMessage({id: 'teamGateway.strategy.table.type.open'})}
                  </a>
                )}
              </div>
            </Tooltip>
          );
        }
      }
    ];

    return (
      <div>
        {toDeleteHttp && (
          <ConfirmModal
            onOk={this.handleDelete}
            loading={deleteLoading}
            title={formatMessage({id: 'confirmModal.delete.strategy.title'})}
            subDesc={formatMessage({id: 'confirmModal.delete.strategy.subDesc'})}
            desc={formatMessage({id: 'confirmModal.delete.strategy.desc'})}
            onCancel={() => {
              this.handleToDeleteHttp(false);
            }}
          />
        )}

        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            marginBottom: '20px'
          }}
        >
          <Search onSearch={this.handleSearch} appID={appID} />
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ position: 'absolute', right: '0' }}
              onClick={this.handleClick}
              loading={this.props.addTcpLoading}
            >
            {formatMessage({id: 'teamGateway.strategy.btn.add'})}
            </Button>
          )}
        </Row>
        <Card bodyStyle={{ padding: '0' }}>
          <Table
            rowKey={this.rowKey}
            pagination={{
              total,
              page_num,
              pageSize: page_size,
              onChange: this.onPageChange,
              current: page_num
            }}
            dataSource={dataList}
            columns={columns}
            loading={this.state.tcpLoading}
          />
        </Card>
        {TcpDrawerVisible && (
          <TcpDrawerForm
            visible={TcpDrawerVisible}
            onClose={this.handleClose}
            editInfo={this.state.editInfo}
            onOk={this.handleOk}
            ref={this.saveForm}
            tcpType={tcpType}
            appID={appID}
          />
        )}
        {informationConnectVisible && (
          <InfoConnectModal
            visible={informationConnectVisible}
            dataSource={innerEnvs}
            onCancel={this.handleCancel}
          />
        )}
        {whetherOpenForm && (
          <Modal
            title="确认要添加吗？"
            visible={this.state.whetherOpenForm}
            onOk={this.resolveOk}
            onCancel={this.handleCancel_second}
            footer={[
              <Button type="primary" size="small" onClick={this.resolveOk}>
                确定
              </Button>
            ]}
            zIndex={9999}
          >
            <p>您选择的组件未开启外部访问，是否自动打开并添加此访问策略？</p>
          </Modal>
        )}

        {visibleModal && (
          <Modal
            title="访问信息"
            width="800px"
            visible={visibleModal}
            footer={null}
            onCancel={this.handeModalCancel}
          >
            <ul className={styles.ul}>
              {agreement.protocol == 'tcp' || agreement.protocol == 'udp' ? (
                <li style={{ fontWeight: 'bold' }}>
                  您当前的访问协议是{agreement.protocol}
                </li>
              ) : (
                <li style={{ fontWeight: 'bold' }}>
                  您当前的访问协议是{agreement.protocol},打开MySQL客户端访问
                </li>
              )}

              <li>
                推荐访问地址&nbsp;
                <a href="javascript:void(0)" style={{ marginRight: '10px' }}>
                  {agreement.end_point.indexOf('0.0.0.0') > -1 &&
                  currentRegion &&
                  currentRegion.length > 0
                    ? agreement.end_point.replace(
                        /0.0.0.0/g,
                        currentRegion[0].tcpdomain
                      )
                    : agreement.end_point.replace(/\s+/g, '')}
                </a>
                <CopyToClipboard
                  text={
                    agreement.end_point.indexOf('0.0.0.0') > -1 &&
                    currentRegion &&
                    currentRegion.length > 0
                      ? agreement.end_point.replace(
                          /0.0.0.0/g,
                          currentRegion[0].tcpdomain
                        )
                      : agreement.end_point.replace(/\s+/g, '')
                  }
                  onCopy={() => {
                    notification.success({ message: formatMessage({id:'notification.success.copy'}) });
                  }}
                >
                  <Button size="small" type="primary">
                    <Icon type="copy" />
                    复制
                  </Button>
                </CopyToClipboard>
              </li>
              {this.showConnectInfo(this.state.NotHttpConnectInfo)}
            </ul>
          </Modal>
        )}
      </div>
    );
  }
}

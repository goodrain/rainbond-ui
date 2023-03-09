/* eslint-disable react/no-unused-state */
/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import ConfirmModal from '@/components/ConfirmModal';
import {
  Button,
  Card,
  Icon,
  Modal,
  notification,
  Row,
  Table,
  Tooltip,
  Tabs
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatHTMLMessage, formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import globalUtil from '../../utils/global';
import DrawerForm from '../DrawerForm';
import DrawerGateWayAPI from '../DrawerGateWayAPI';
import InfoConnectModal from '../InfoConnectModal';
import ParameterForm from '../ParameterForm';
import RoutingRule from '../RoutingRule'
import Search from '../Search';
import styles from './index.less';

const { TabPane } = Tabs;
@connect(({ user, global, loading, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  groups: global.groups,
  currentTeam: teamControl.currentTeam,
  currentEnterprise: enterprise.currentEnterprise,
  addHttpLoading: loading.effects['appControl/fetchCertificates']
}))
export default class index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      page_num: 1,
      page_size: 10,
      total: '',
      instances: '0',
      drawerGateWayApi: false,
      gateWayAPIList: [],
      editGateWayApiInfo: ''
    };
  }
  componentWillMount() {
    this.load();
  }
  onPageChangeApi = page_num => {
    this.setState({ page_num, loading: true }, () => {
      this.load();
    });
  };
  load = () => {
    const { appID } = this.props;
    if (appID) {
      this.handleGateWayAPI(appID);
    } else {
      this.handleGateWayAPI();
    }
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

  handleClickGateWayApi = () => {
    this.setState({ drawerGateWayApi: true, type: "add" });
  };
  handleCloseGateWayApi = () => {
    this.setState({ drawerGateWayApi: false, editInfo: '' });
  };
  handleOkGateWayApi = (val, namespace, type) => {
    this.setState({
      loading:true
    },()=>{
      if(type == "add"){
        this.addDetailGateWayApi(val, namespace)
      }else{
        this.editDetailGateWayApi(val, namespace)
      }
    })
  }
  editDetailGateWayApi = (val, namespace) =>{
    const { dispatch } = this.props
    const teamName = globalUtil.getCurrTeamName()
    const { editName } = this.state
    dispatch({
      type: 'gateWay/editDetailGateWayApi',
      payload: {
        team_name: teamName,
        app_id: val.group_id || '',
        gateway_name: val.gateway_class_name,
        gateway_namespace: namespace,
        hosts: val.hosts,
        rules: val.rules,
        section_name:val.section_name,
        name: editName
      },
      callback: res => {
        if (res) {
          this.setState({
            drawerGateWayApi: false,
            editInfo: '',
            loading:false
          },()=>{
            notification.success({
              message: formatMessage({id:'notification.success.modified'})
            });
            this.handleGateWayAPI()
          });
        }
      },
      handleError: data =>{
        this.setState({
          drawerGateWayApi: false,
          editInfo: '',
          loading:false
        },()=>{
          notification.error({
            message: formatMessage({id:'notification.error.change'})
          });
          this.handleGateWayAPI()
        });
      }
    })
  }
  addDetailGateWayApi = (val, namespace) =>{
    const { dispatch } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'gateWay/addDetailGateWayApi',
      payload: {
        team_name: teamName,
        app_id: val.group_id || '',
        gateway_name: val.gateway_class_name,
        gateway_namespace: namespace,
        hosts: val.hosts,
        rules: val.rules,
        section_name:val.section_name
      },
      callback: res => {
        if (res) {
          this.setState({
            drawerGateWayApi: false,
            editInfo: '',
            loading:false
          },()=>{
            notification.success({
              message: formatMessage({id:'notification.success.add'})
            });
            this.handleGateWayAPI()
          });
        }
      },
      handleError: data =>{
        this.setState({
          drawerGateWayApi: false,
          editInfo: '',
          loading:false
        },()=>{
          notification.error({
            message: formatMessage({id:'notification.error.add'})
          });
          this.handleGateWayAPI()
        });
      }
    })
  }

  callback = (key) => {
    this.setState({
      instances: key,
    })
  }
  handleGateWayAPI = (appID) => {
    const { dispatch } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'gateWay/getGateWayApiList',
      payload: {
        team_name: teamName,
        app_id: appID || ''
      },
      callback: res => {
        this.setState({
          gateWayAPIList: res.list,
          loading:false
        })
      }
    })
  }
  handleEditGateWayAPI = values => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'gateWay/queryDetailGateWayApi',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: appID || '',
        name: values.name
      },
      callback: data => {
        if (data) {
          this.setState({
            editGateWayApiInfo: data.bean,
            drawerGateWayApi: true,
            type: 'edit',
            editName: values.name
          });
        }
      }
    });
  };
  handleDeleteGateWayAPI = values => {
    const { dispatch, appID } = this.props;
    this.setState({
      loading:true
    })
    dispatch({
      type: 'gateWay/deleteGateWayApi',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        name: values.name
      },
      callback: data => {
        if (data) {
          this.setState({
            loading:false
          },()=>{
            this.handleGateWayAPI(appID)
          })
        }
      }
    });
  };
  render() {
    const {
      operationPermissions,
      appID,
      operationPermissions: { isCreate, isEdit, isDelete }
    } = this.props;
    const {
      loading,
      total,
      page_num,
      page_size,
      drawerGateWayApi,
      gateWayAPIList,
      editGateWayApiInfo,
      type
    } = this.state;
    const columnsGateWay = [
      {
        title: formatMessage({id:'teamGateway.DrawerGateWayAPI.name'}),
        dataIndex: 'name',
        key: 'name',
        align: 'left',
        render: (text, record) => {
          return <span>{text}</span>
        }
      },
      {
        title: formatMessage({id:'teamGateway.DrawerGateWayAPI.hosts'}),
        dataIndex: 'hosts',
        key: 'hosts',
        align: 'center',
        render: text => {
          return text.map((item) => {
            return <span>{item}</span>
          })
        }
      },
      {
        title: formatMessage({id:'teamGateway.DrawerGateWayAPI.Gateway'}),
        dataIndex: 'gateway_class_name',
        key: 'gateway_class_name',
        align: 'center',
        render: (text, record) => {
          return <span>{text}</span>
        }
      },
      {
        title: formatMessage({ id: 'teamGateway.strategy.table.operate' }),
        dataIndex: 'action',
        key: 'action',
        align: 'center',
        width: 150,
        render: (data, record) => {
          return (
            <div>
              {isEdit && (
                <a
                  onClick={() => {
                    this.handleEditGateWayAPI(record);
                  }}
                >
                  {formatMessage({ id: 'teamGateway.strategy.table.edit' })}
                </a>
              )}
              {isDelete && (
                <a
                  onClick={() => {
                    this.handleDeleteGateWayAPI(record);
                  }}
                >
                  {formatMessage({ id: 'teamGateway.strategy.table.delete' })}
                </a>
              )}
            </div>
          )
        }
      }
    ];
    return (
      <div>
        <Card style={{ padding: '0px', border: 'none' }} className={styles.pluginCard}>
          <Tabs defaultActiveKey="0" onChange={this.callback} destroyInactiveTabPane className={styles.tabsStyle}>
            <TabPane tab='HTTP' key='0' >
              <Row
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '60px',
                  marginBottom: '10px',
                  padding: '10px',
                  background: 'rgb(250, 251, 252)',
                  borderRadius: '5px',
                  boxShadow: 'rgb(36 46 66 / 16%) 1px 2px 5px 0px'
                }}
              >
                {isCreate && (
                  <Button
                    type="primary"
                    icon="plus"
                    style={{ position: 'absolute', right: '10px' }}
                    onClick={this.handleClickGateWayApi}
                  >
                    {formatMessage({ id: 'teamGateway.strategy.btn.add' })}
                  </Button>
                )}
              </Row>
              <Table
                dataSource={gateWayAPIList}
                columns={columnsGateWay}
                loading={loading}
                size="default"
                rowKey={this.rowKey}
                pagination={total > 10 ? {
                  total,
                  page_num,
                  pageSize: page_size,
                  onChange: this.onPageChangeApi,
                  current: page_num
                } : false}
              />
            </TabPane>
          </Tabs>
        </Card>

        {drawerGateWayApi && (
          <DrawerGateWayAPI
            groups={this.props.groups}
            visible={drawerGateWayApi}
            onClose={this.handleCloseGateWayApi}
            onOk={this.handleOkGateWayApi}
            ref={this.saveForm}
            appID={appID}
            editInfo={type == "add" ? null : editGateWayApiInfo}
          />
        )}
      </div>
    );
  }
}
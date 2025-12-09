import {
  Alert,
  Button,
  Card,
  Col,
  Icon,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import AddVolumes from '../../components/AddOrEditVolume';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import NoPermTip from '../../components/NoPermTip';
import RelyComponentModal from '../../components/RelyComponentModal';
import DirectoryPersistence from '../../components/DirectoryPersistence/index'
import ScrollerX from '../../components/ScrollerX';
import { addMnt, getMnt } from '../../services/app';
import globalUtil from '../../utils/global';
import { getVolumeTypeShowName } from '../../utils/utils';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import cookie from '@/utils/cookie';

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    volumes: appControl.volumes,
    appBaseInfo: appControl.baseInfo,
    appDetail: appControl.appDetail,
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: null,
      showAddRelation: false,
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      editor: null,
      volumeOpts: [],
      relyComponent: false,
      relyComponentList: [],
      page: 1,
      pageSize: 5,
      mntPage: 1,
      mntPageSize: 5,
      mntTotal: 0,
      DirectoryPersistenceShow: false,
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }

  componentDidMount() {
    this.fetchVolumeOpts();
    this.loadMntList();
    this.fetchVolumes();
    this.fetchBaseInfo();
  }
  onDeleteMnt = mnt => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onEditVolume = data => {
    this.setState({ showAddVar: data, editor: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  getVolumeTypeShowName = volume_type => {
    const { volumeOpts, language } = this.state;    
    return getVolumeTypeShowName(volumeOpts, volume_type, language);
  };
  handleOpenRelyComponent = relyComponentList => {
    this.setState({
      relyComponent: true,
      relyComponentList
    });
  };
  handleCloseRelyComponent = () => {
    this.setState({
      relyComponent: false,
      relyComponentList: []
    });
  };
  fetchVolumes = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        is_config: false
      }
    });
  };
  fetchVolumeOpts = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumeOpts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({
            volumeOpts: data.list || []
          });
        }
      }
    });
  };
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  loadMntList = () => {
    const { mntPage, mntPageSize, mntTotal } = this.state
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: mntPage,
      page_size: mntPageSize,
      volume_type: ['share-file', 'memoryfs', 'local'],
      type: 'mnt'
    }).then(data => {
      if (data) {
        this.setState({
          mntList: data.list || [],
          mntTotal: data.total || 0
        });
      }
    });
  };
  handleAddVar = () => {
    this.setState({
      showAddVar: {
        new: true
      }
    });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: null, editor: null });
  };
  handleSubmitAddVar = vals => {
    this.fetchBaseInfo();
    const { editor } = this.state;
    if (editor) {
      this.props.dispatch({
        type: 'appControl/editorVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          ID: editor.ID
        },
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVar();
          this.props.onshowRestartTips(true);
          this.remindInfo();
        }
      });
    } else {
      this.props.dispatch({
        type: 'appControl/addVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVar();
          this.props.onshowRestartTips(true);
          this.remindInfo();
        }
      });
    }
  };

  remindInfo = () => {
    const { appBaseInfo } = this.props;
    if (
      appBaseInfo &&
      appBaseInfo.extend_method &&
      globalUtil.isStateComponent(appBaseInfo.extend_method)
    ) {
      notification.warning({
        message: (
          <div>
            {formatMessage({ id: 'notification.warn.state' })}
            <br />
            {formatMessage({ id: 'notification.warn.restart' })}

          </div>
        )
      });
    } else {
      notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
    }
  };
  showAddRelation = () => {
    this.loadMntList();
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.loadMntList();
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddMnt = mnts => {
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      body: mnts
    }).then(data => {
      if (data) {
        this.handleCancelAddRelation();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleDeleteVolume = () => {
    this.props.dispatch({
      type: 'appControl/deleteVolume',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        volume_id: this.state.toDeleteVolume.ID
      },
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        this.props.onshowRestartTips(true);
      }
    });
  };
  handleDeleteMnt = () => {
    this.props.dispatch({
      type: 'appControl/deleteMnt',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        dep_vol_id: this.state.toDeleteMnt.dep_vol_id
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        this.props.onshowRestartTips(true);
      }
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isStorage },
    } = this.props;
    return isStorage;
  }
  // 检查组件是否处于可操作状态
  isComponentOperational() {
    const { status } = this.props;
    if (!status || !status.status) {
      return false;
    }
    // 以下状态不允许操作文件管理
    const disabledStatuses = ['undeploy', 'closed', 'abnormal', 'stopping', 'starting', 'deploying', 'upgrade'];
    return !disabledStatuses.includes(status.status);
  }
  // 获取不可操作时的提示信息
  getDisabledTooltip() {
    const { status } = this.props;
    if (!status || !status.status) {
      return formatMessage({ id: 'componentOverview.body.mnt.status.unknown' });
    }
    const statusMessageKeys = {
      'undeploy': 'componentOverview.body.mnt.status.undeploy',
      'closed': 'componentOverview.body.mnt.status.closed',
      'abnormal': 'componentOverview.body.mnt.status.abnormal',
      'stopping': 'componentOverview.body.mnt.status.stopping',
      'starting': 'componentOverview.body.mnt.status.starting',
      'deploying': 'componentOverview.body.mnt.status.deploying',
      'upgrade': 'componentOverview.body.mnt.status.upgrade'
    };
    const messageKey = statusMessageKeys[status.status] || 'componentOverview.body.mnt.status.default';
    return formatMessage({ id: messageKey });
  }
  handleMountFormat = (key) => {
    const obj = {
      '/lun': 'LUN',
      '/disk': '磁盘',
      '/cdrom': '光盘',
      '/filesystems': '文件系统',
    }
    return obj[key] || '-'
  }
  onPageChange = (page, pageSize) => {
    this.setState({
      page: page,
      pageSize: pageSize
    });
  }
  onMntPageChange = (page, pageSize) => {
    this.setState({
      mntPage: page,
      mntPageSize: pageSize
    });
  }
  DirectoryPersistenceShow = (val) => {
    const { volumesArr } = this.state;
    volumesArr && volumesArr.map(item => {
      if (item.volume_name == val.volume_name) {        
        this.setState({
          hostPath: item.volume_path,
          volumeName: item.volume_name
        })
      }
    })
    this.setState({
      DirectoryPersistenceShow: !this.state.DirectoryPersistenceShow,
      volume_path: val.volume_path,
      hostPath: val.volume_path,
      isType: val.volume_type == 'alicloud-disk-efficiency' ? true : false
    })
  }
  render() {
    const { mntList, relyComponent, relyComponentList, DirectoryPersistenceShow, volume_path, hostPath, isType, volumeName } = this.state;
    
    const { volumes, method, appDetail } = this.props;
    if (!this.canView()) return <NoPermTip />;
    const columns = [
      {
        title: formatMessage({ id: 'Vm.createVm.Storagename' }),
        dataIndex: 'volume_name'
      },
      {
        title: formatMessage({ id: 'Vm.createVm.Storagetype' }),
        dataIndex: 'volume_path',
        render: (text, record) => {
          return <span>{this.handleMountFormat(text)}</span>;
        }
      },
      {
        title: formatMessage({ id: 'Vm.createVm.capacity' }),
        dataIndex: 'volume_capacity',
        render: (text, record) => {
          if (text == 0) {
            return <span>{formatMessage({ id: 'appOverview.no_limit' })}</span>;
          }
          return <span>{text}GB</span>;
        }
      },
      {
        title: formatMessage({ id: 'Vm.createVm.status' }),
        dataIndex: 'status',
        render: (text, record) => {
          if (text == 'not_bound') {
            return <span style={{ color: 'red' }}>{formatMessage({ id: 'status.not_mount' })}</span>;
          }
          return <span style={{ color: 'green' }}>{formatMessage({ id: 'status.mounted' })}</span>;
        }
      },
      {
        title: formatMessage({ id: 'Vm.createVm.handle' }),
        dataIndex: 'action',
        render: (val, data) => {
          return (
            <div>
              <a
                onClick={() => {
                  this.onDeleteVolume(data);
                }}
                href="javascript:;"
              >
                {formatMessage({ id: 'componentOverview.body.mnt.deldete' })}
              </a>
              <a
                onClick={() => {
                  this.onEditVolume(data);
                }}
                href="javascript:;"
                style={{
                  marginLeft: '8px'
                }}
              >
                {formatMessage({ id: 'componentOverview.body.mnt.edit' })}
              </a>
            </div>
          );
        }
      }
    ];
    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message={formatMessage({ id: 'componentOverview.body.mnt.Alert.message' })}
              type="info"
              style={{
                marginBottom: 24
              }}
            />
          </Col>
        </Row>
        {method != 'vm' ?
          <Card
            style={{
              marginBottom: 24
            }}
            title={<span>  {formatMessage({ id: 'componentOverview.body.mnt.save_setting' })}</span>}
            extra={
              <Button onClick={this.handleAddVar}>
                <Icon type="plus" />
                {/* 添加存储 */}
                {formatMessage({ id: 'componentOverview.body.mnt.add_storage' })}
              </Button>
            }
          >
            <ScrollerX sm={650}>
              <Table
                pagination={{
                  current: this.state.page,
                  pageSize: this.state.pageSize,
                  total: Number(volumes.length),
                  onChange: this.onPageChange,
                  onShowSizeChange: this.onPageChange,
                  showQuickJumper: true,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                  pageSizeOptions: ['5', '10', '20', '30'],
                  hideOnSinglePage: Number(volumes.length) <= 5
                }}
                rowKey={(record, index) => index}
                columns={[
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.volume_name' }),
                    dataIndex: 'volume_name',
                    render: (text, item) => {
                      return (
                        <span
                          style={{
                            cursor: 'pointer',
                            color: item.dep_services && '#1890ff'
                          }}
                          onClick={() => {
                            if (item.dep_services) {
                              this.handleOpenRelyComponent(item.dep_services);
                            }
                          }}
                        >
                          {text}
                        </span>
                      );
                    }
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.volume_path' }),
                    dataIndex: 'volume_path'
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.volume_type' }),
                    dataIndex: 'volume_type',
                    render: text => {
                      return <span>{this.getVolumeTypeShowName(text)}</span>;
                    }
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.volume_capacity' }),
                    dataIndex: 'volume_capacity',
                    render: text => {
                      if (text == 0) {
                        return <span>{formatMessage({ id: 'componentOverview.body.mnt.unlimited' })}</span>;
                      }
                      return <span>{text}GB</span>;
                    }
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.status' }),
                    dataIndex: 'status',
                    render: text => {
                      if (text == 'not_bound') {
                        return <span style={{ color: 'red' }}>{formatMessage({ id: 'componentOverview.body.mnt.unmounted' })}</span>;
                      }
                      return <span style={{ color: 'green' }}>{formatMessage({ id: 'componentOverview.body.mnt.mounted' })}</span>;
                    }
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.action' }),
                    dataIndex: 'action',
                    render: (v, data) => {
                      const isOperational = this.isComponentOperational();
                      const tooltipTitle = !isOperational ? this.getDisabledTooltip() : '';
                      return (
                        <div>
                          <a
                            onClick={() => {
                              this.onDeleteVolume(data);
                            }}
                            href="javascript:;"
                          >
                            {formatMessage({ id: 'componentOverview.body.mnt.deldete' })}
                          </a>
                          <a
                            onClick={() => {
                              this.onEditVolume(data);
                            }}
                            href="javascript:;"
                            style={{
                              marginLeft: '8px'
                            }}
                          >
                            {formatMessage({ id: 'componentOverview.body.mnt.edit' })}
                          </a>
                          {data.status != 'not_bound' && data.volume_type != 'nfs' &&
                            <Tooltip title={!isOperational ? tooltipTitle : ''}>
                              <a
                                onClick={() => {
                                  if (isOperational) {
                                    this.DirectoryPersistenceShow(data);
                                  }
                                }}
                                href="javascript:;"
                                style={{
                                  color: !isOperational ? '#999999' : '',
                                  cursor: !isOperational ? 'not-allowed' : 'pointer',
                                  marginLeft: '8px',
                                  opacity: !isOperational ? 0.6 : 1
                                }}
                              >
                                {formatMessage({ id: 'componentOverview.body.DirectoryPersistence.file' })}
                              </a>
                            </Tooltip>
                          }
                        </div>
                      );
                    }
                  }
                ]}
                dataSource={volumes}
              />
            </ScrollerX>
          </Card> :
          <Card
            style={{
              marginBottom: 24
            }}
            title={<span>  {formatMessage({ id: 'componentOverview.body.mnt.save_setting' })}</span>}
            extra={
              <Button onClick={this.handleAddVar}>
                <Icon type="plus" />
                {/* 添加存储 */}
                {formatMessage({ id: 'componentOverview.body.mnt.add_storage' })}
              </Button>
            }
          >
            <ScrollerX sm={650}>
              <Table rowKey={(record, index) => index} pagination={false} dataSource={volumes} columns={columns} />
            </ScrollerX>
          </Card>
        }
        {method != 'vm' &&
          <Card
            title={<span> {formatMessage({ id: 'componentOverview.body.mnt.share' })} </span>}
            extra={
              <Tooltip title={appDetail?.service?.extend_method === "state_multiple" ? '有状态组件不允许挂载其他组件存储' : ''}>
                <Button onClick={this.showAddRelation} disabled={appDetail?.service?.extend_method === "state_multiple"}>
                  <Icon type="plus" />
                  {formatMessage({ id: 'componentOverview.body.mnt.mount' })}
                </Button>
              </Tooltip>
            }
          >
            <ScrollerX sm={850}>
              <Table
                pagination={
                  {
                    current: this.state.mntPage,
                    pageSize: this.state.mntPageSize,
                    total: Number(this.state.mntTotal),
                    onChange: this.onMntPageChange,
                    onShowSizeChange: this.onMntPageChange,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                    pageSizeOptions: ['5', '10', '20', '30'],
                    hideOnSinglePage: Number(this.state.mntTotal) <= 5
                  }
                }
                rowKey={(record, index) => index}
                columns={[
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.local_vol_path' }),
                    dataIndex: 'local_vol_path',
                    key: '1',
                    width: '20%',
                    render: data => (
                      <Tooltip title={data}>
                        <span
                          style={{
                            wordBreak: 'break-all',
                            wordWrap: 'break-word'
                          }}
                        >
                          {data}
                        </span>
                      </Tooltip>
                    )
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.dep_vol_name' }),
                    dataIndex: 'dep_vol_name',
                    key: '2',
                    width: '15%',
                    render: data => (
                      <Tooltip title={data}>
                        <span
                          style={{
                            wordBreak: 'break-all',
                            wordWrap: 'break-word'
                          }}
                        >
                          {data}
                        </span>
                      </Tooltip>
                    )
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.dep_vol_path' }),
                    dataIndex: 'dep_vol_path',
                    key: '3',
                    width: '15%',
                    render: data => (
                      <Tooltip title={data}>
                        <span
                          style={{
                            wordBreak: 'break-all',
                            wordWrap: 'break-word'
                          }}
                        >
                          {data}
                        </span>
                      </Tooltip>
                    )
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.dep_vol_type' }),
                    dataIndex: 'dep_vol_type',
                    key: '4',
                    width: '10%',
                    render: text => {
                      return <span>{this.getVolumeTypeShowName(text)}</span>;
                    }
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.dep_app_name' }),
                    dataIndex: 'dep_app_name',
                    key: '5',
                    width: '10%',
                    render: (v, data) => (
                      <Link
                        to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id
                          }/overview?type=components&componentID=${data.dep_app_alias}&tab=overview`
                        }
                      >
                        {v}
                      </Link>
                    )
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.dep_app_group' }),
                    dataIndex: 'dep_app_group',
                    key: '6',
                    width: '15%',
                    render: (v, data) => (
                      <Link
                        to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id
                          }/overview`}
                      >
                        {v}
                      </Link>
                    )
                  },
                  {
                    title: formatMessage({ id: 'componentOverview.body.mnt.action' }),
                    dataIndex: 'action',
                    key: '7',
                    width: '15%',
                    render: (v, data) => (
                      <a
                        onClick={() => {
                          this.onDeleteMnt(data);
                        }}
                        href="javascript:;"
                      >
                        {formatMessage({ id: 'componentOverview.body.mnt.unmount' })}
                      </a>
                    )
                  }
                ]}
                dataSource={mntList}
              />
            </ScrollerX>
          </Card>
        }
        {this.state.showAddVar && (
          <AddVolumes
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
            volumeOpts={this.state.volumeOpts}
            editor={this.state.editor}
            method={method}
          />
        )}
        {this.state.showAddRelation && (
          <AddRelationMnt
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
            volume_type={['share-file', 'memoryfs', 'local']}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title={<FormattedMessage id='confirmModal.deldete.Unmount.title' />}
            desc={<FormattedMessage id='confirmModal.deldete.Unmount.desc' />}
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title={<FormattedMessage id='confirmModal.deldete.storage.title' />}
            desc={<FormattedMessage id='confirmModal.deldete.storage.desc' />}
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
        {relyComponent && (
          <RelyComponentModal
            title={<FormattedMessage id='componentOverview.body.RelyComponentModal.title' />}
            relyComponentList={relyComponentList}
            onCancel={this.handleCloseRelyComponent}
            onOk={this.handleCloseRelyComponent}
          />
        )}
        {DirectoryPersistenceShow &&
          <DirectoryPersistence
            isShow={this.DirectoryPersistenceShow}
            appAlias={this.props.appAlias}
            volumePath={volume_path}
            hostPath={hostPath}
            isType={true}
            volumeName={volumeName}
          />
        }
      </Fragment>
    );
  }
}

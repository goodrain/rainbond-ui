import { Alert, Button, Card, Col, Icon, notification, Row, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import AddVolumes from '../../components/AddOrEditVolume';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import DirectoryPersistence from '../../components/DirectoryPersistence';
import NoPermTip from '../../components/NoPermTip';
import RelyComponentModal from '../../components/RelyComponentModal';
import ScrollerX from '../../components/ScrollerX';
import { addMnt, getMnt } from '../../services/app';
import cookie from '@/utils/cookie';
import handleAPIError from '@/utils/error';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import { getVolumeTypeShowName } from '../../utils/utils';

@connect(
  ({ appControl }) => ({
    volumes: appControl.volumes,
    appBaseInfo: appControl.baseInfo,
    appDetail: appControl.appDetail
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
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
      language: cookie.get('language') === 'zh-CN'
    };
  }

  componentDidMount() {
    this.fetchVolumeOpts();
    this.loadMntList();
    this.fetchVolumes();
    this.fetchBaseInfo();
  }

  getVolumeTypeShowName = volume_type => {
    const { volumeOpts, language } = this.state;
    return getVolumeTypeShowName(volumeOpts, volume_type, language);
  };

  onDeleteMnt = mnt => this.setState({ toDeleteMnt: mnt });

  onDeleteVolume = data => this.setState({ toDeleteVolume: data });

  onEditVolume = data => this.setState({ showAddVar: data, editor: data });

  onCancelDeleteVolume = () => this.setState({ toDeleteVolume: null });

  handleOpenRelyComponent = relyComponentList => {
    this.setState({ relyComponent: true, relyComponentList });
  };

  handleCloseRelyComponent = () => {
    this.setState({ relyComponent: false, relyComponentList: [] });
  };

  fetchVolumes = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        is_config: false
      },
      handleError: err => handleAPIError(err)
    });
  };

  fetchVolumeOpts = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchVolumeOpts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ volumeOpts: data.list || [] });
        }
      },
      handleError: err => handleAPIError(err)
    });
  };

  fetchBaseInfo = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      handleError: err => handleAPIError(err)
    });
  };

  loadMntList = () => {
    const { mntPage, mntPageSize } = this.state;
    const { appAlias } = this.props;
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appAlias,
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
    }).catch(handleAPIError);
  };
  handleAddVar = () => {
    this.setState({ showAddVar: { new: true } });
  };

  handleCancelAddVar = () => {
    this.setState({ showAddVar: null, editor: null });
  };

  handleSubmitAddVar = vals => {
    this.fetchBaseInfo();
    const { editor } = this.state;
    const { dispatch, appAlias, onshowRestartTips } = this.props;

    const handleSuccess = () => {
      this.fetchVolumes();
      this.handleCancelAddVar();
      onshowRestartTips(true);
      this.remindInfo();
    };

    if (editor) {
      dispatch({
        type: 'appControl/editorVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          ID: editor.ID
        },
        callback: handleSuccess,
        handleError: err => handleAPIError(err)
      });
    } else {
      dispatch({
        type: 'appControl/addVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          ...vals
        },
        callback: handleSuccess,
        handleError: err => handleAPIError(err)
      });
    }
  };

  remindInfo = () => {
    const { appBaseInfo } = this.props;
    if (appBaseInfo?.extend_method && globalUtil.isStateComponent(appBaseInfo.extend_method)) {
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
    const { appAlias, onshowRestartTips } = this.props;
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appAlias,
      body: mnts
    }).then(data => {
      if (data) {
        this.handleCancelAddRelation();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        onshowRestartTips(true);
      }
    }).catch(handleAPIError);
  };

  handleDeleteVolume = () => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    const { toDeleteVolume } = this.state;
    dispatch({
      type: 'appControl/deleteVolume',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        volume_id: toDeleteVolume.ID
      },
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  handleDeleteMnt = () => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    const { toDeleteMnt } = this.state;
    dispatch({
      type: 'appControl/deleteMnt',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        dep_vol_id: toDeleteMnt.dep_vol_id
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        onshowRestartTips(true);
      },
      handleError: err => handleAPIError(err)
    });
  };

  cancelDeleteMnt = () => this.setState({ toDeleteMnt: null });

  canView = () => {
    const { componentPermissions: { isStorage } } = this.props;
    return isStorage;
  };

  isComponentOperational = () => {
    const { status } = this.props;
    if (!status?.status) return false;
    const disabledStatuses = ['undeploy', 'closed', 'abnormal', 'stopping', 'starting', 'deploying', 'upgrade'];
    return !disabledStatuses.includes(status.status);
  };

  getDisabledTooltip = () => {
    const { status } = this.props;
    if (!status?.status) {
      return formatMessage({ id: 'componentOverview.body.mnt.status.unknown' });
    }
    const statusMessageKeys = {
      undeploy: 'componentOverview.body.mnt.status.undeploy',
      closed: 'componentOverview.body.mnt.status.closed',
      abnormal: 'componentOverview.body.mnt.status.abnormal',
      stopping: 'componentOverview.body.mnt.status.stopping',
      starting: 'componentOverview.body.mnt.status.starting',
      deploying: 'componentOverview.body.mnt.status.deploying',
      upgrade: 'componentOverview.body.mnt.status.upgrade'
    };
    const messageKey = statusMessageKeys[status.status] || 'componentOverview.body.mnt.status.default';
    return formatMessage({ id: messageKey });
  };

  handleMountFormat = key => {
    const formatMap = {
      '/lun': 'LUN',
      '/disk': '磁盘',
      '/cdrom': '光盘',
      '/filesystems': '文件系统'
    };
    return formatMap[key] || '-';
  };

  onPageChange = (page, pageSize) => {
    this.setState({ page, pageSize });
  };

  onMntPageChange = (page, pageSize) => {
    this.setState({ mntPage: page, mntPageSize: pageSize });
  };

  DirectoryPersistenceShow = val => {
    const { DirectoryPersistenceShow: isShow, volumesArr } = this.state;
    let newHostPath = val.volume_path;
    let newVolumeName = val.volume_name;

    if (volumesArr) {
      volumesArr.forEach(item => {
        if (item.volume_name === val.volume_name) {
          newHostPath = item.volume_path;
          newVolumeName = item.volume_name;
        }
      });
    }

    this.setState({
      DirectoryPersistenceShow: !isShow,
      volume_path: val.volume_path,
      hostPath: newHostPath,
      isType: val.volume_type === 'alicloud-disk-efficiency',
      volumeName: newVolumeName
    });
  };
  getVmColumns = () => [
    {
      title: formatMessage({ id: 'Vm.createVm.Storagename' }),
      dataIndex: 'volume_name'
    },
    {
      title: formatMessage({ id: 'Vm.createVm.Storagetype' }),
      dataIndex: 'volume_path',
      render: text => <span>{this.handleMountFormat(text)}</span>
    },
    {
      title: formatMessage({ id: 'Vm.createVm.capacity' }),
      dataIndex: 'volume_capacity',
      render: text => (
        text === 0
          ? <span>{formatMessage({ id: 'appOverview.no_limit' })}</span>
          : <span>{text}GB</span>
      )
    },
    {
      title: formatMessage({ id: 'Vm.createVm.status' }),
      dataIndex: 'status',
      render: text => (
        text === 'not_bound'
          ? <span style={{ color: 'red' }}>{formatMessage({ id: 'status.not_mount' })}</span>
          : <span style={{ color: 'green' }}>{formatMessage({ id: 'status.mounted' })}</span>
      )
    },
    {
      title: formatMessage({ id: 'Vm.createVm.handle' }),
      dataIndex: 'action',
      render: (_, data) => (
        <div>
          <a onClick={() => this.onDeleteVolume(data)} href="javascript:;">
            {formatMessage({ id: 'componentOverview.body.mnt.deldete' })}
          </a>
          <a
            onClick={() => this.onEditVolume(data)}
            href="javascript:;"
            style={{ marginLeft: 8 }}
          >
            {formatMessage({ id: 'componentOverview.body.mnt.edit' })}
          </a>
        </div>
      )
    }
  ];

  getMntColumns = () => {
    const wordBreakStyle = { wordBreak: 'break-all', wordWrap: 'break-word' };
    return [
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.local_vol_path' }),
        dataIndex: 'local_vol_path',
        key: '1',
        width: '20%',
        render: data => (
          <Tooltip title={data}>
            <span style={wordBreakStyle}>{data}</span>
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
            <span style={wordBreakStyle}>{data}</span>
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
            <span style={wordBreakStyle}>{data}</span>
          </Tooltip>
        )
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.dep_vol_type' }),
        dataIndex: 'dep_vol_type',
        key: '4',
        width: '10%',
        render: text => <span>{this.getVolumeTypeShowName(text)}</span>
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.dep_app_name' }),
        dataIndex: 'dep_app_name',
        key: '5',
        width: '10%',
        render: (v, data) => (
          <Link
            to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id}/overview?type=components&componentID=${data.dep_app_alias}&tab=overview`}
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
            to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${data.dep_group_id}/overview`}
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
        render: (_, data) => (
          <a onClick={() => this.onDeleteMnt(data)} href="javascript:;">
            {formatMessage({ id: 'componentOverview.body.mnt.unmount' })}
          </a>
        )
      }
    ];
  };

  render() {
    const {
      mntList, relyComponent, relyComponentList, DirectoryPersistenceShow,
      volume_path, hostPath, isType, volumeName, page, pageSize, mntPage, mntPageSize, mntTotal
    } = this.state;
    const { volumes, method, appDetail, appAlias } = this.props;

    if (!this.canView()) return <NoPermTip />;
    const volumeColumns = [
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.volume_name' }),
        dataIndex: 'volume_name',
        render: (text, item) => (
          <span
            style={{ cursor: 'pointer', color: item.dep_services && '#1890ff' }}
            onClick={() => item.dep_services && this.handleOpenRelyComponent(item.dep_services)}
          >
            {text}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.volume_path' }),
        dataIndex: 'volume_path'
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.volume_type' }),
        dataIndex: 'volume_type',
        render: text => <span>{this.getVolumeTypeShowName(text)}</span>
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.volume_capacity' }),
        dataIndex: 'volume_capacity',
        render: text => (
          text === 0
            ? <span>{formatMessage({ id: 'componentOverview.body.mnt.unlimited' })}</span>
            : <span>{text}GB</span>
        )
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.status' }),
        dataIndex: 'status',
        render: text => (
          text === 'not_bound'
            ? <span style={{ color: 'red' }}>{formatMessage({ id: 'componentOverview.body.mnt.unmounted' })}</span>
            : <span style={{ color: 'green' }}>{formatMessage({ id: 'componentOverview.body.mnt.mounted' })}</span>
        )
      },
      {
        title: formatMessage({ id: 'componentOverview.body.mnt.action' }),
        dataIndex: 'action',
        render: (_, data) => {
          const isOperational = this.isComponentOperational();
          const tooltipTitle = !isOperational ? this.getDisabledTooltip() : '';
          return (
            <div>
              <a onClick={() => this.onDeleteVolume(data)} href="javascript:;">
                {formatMessage({ id: 'componentOverview.body.mnt.deldete' })}
              </a>
              <a
                onClick={() => this.onEditVolume(data)}
                href="javascript:;"
                style={{ marginLeft: 8 }}
              >
                {formatMessage({ id: 'componentOverview.body.mnt.edit' })}
              </a>
              {data.status !== 'not_bound' && data.volume_type !== 'nfs' && (
                <Tooltip title={tooltipTitle}>
                  <a
                    onClick={() => isOperational && this.DirectoryPersistenceShow(data)}
                    href="javascript:;"
                    style={{
                      color: !isOperational ? '#999999' : '',
                      cursor: !isOperational ? 'not-allowed' : 'pointer',
                      marginLeft: 8,
                      opacity: !isOperational ? 0.6 : 1
                    }}
                  >
                    {formatMessage({ id: 'componentOverview.body.DirectoryPersistence.file' })}
                  </a>
                </Tooltip>
              )}
            </div>
          );
        }
      }
    ];

    const paginationConfig = {
      current: page,
      pageSize,
      total: volumes?.length || 0,
      onChange: this.onPageChange,
      onShowSizeChange: this.onPageChange,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: total => `共 ${total} 条`,
      pageSizeOptions: ['5', '10', '20', '30'],
      hideOnSinglePage: (volumes?.length || 0) <= 5
    };

    const mntPaginationConfig = {
      current: mntPage,
      pageSize: mntPageSize,
      total: mntTotal,
      onChange: this.onMntPageChange,
      onShowSizeChange: this.onMntPageChange,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: total => `共 ${total} 条`,
      pageSizeOptions: ['5', '10', '20', '30'],
      hideOnSinglePage: mntTotal <= 5
    };

    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message={formatMessage({ id: 'componentOverview.body.mnt.Alert.message' })}
              type="info"
              style={{ marginBottom: 24 }}
            />
          </Col>
        </Row>
        {method !== 'vm' ? (
          <Card
            style={{ marginBottom: 24 }}
            title={<span>{formatMessage({ id: 'componentOverview.body.mnt.save_setting' })}</span>}
            extra={
              <Button onClick={this.handleAddVar}>
                <Icon type="plus" />
                {formatMessage({ id: 'componentOverview.body.mnt.add_storage' })}
              </Button>
            }
          >
            <ScrollerX sm={650}>
              <Table
                pagination={paginationConfig}
                rowKey={(_, index) => index}
                columns={volumeColumns}
                dataSource={volumes}
              />
            </ScrollerX>
          </Card>
        ) : (
          <Card
            style={{ marginBottom: 24 }}
            title={<span>{formatMessage({ id: 'componentOverview.body.mnt.save_setting' })}</span>}
            extra={
              <Button onClick={this.handleAddVar}>
                <Icon type="plus" />
                {formatMessage({ id: 'componentOverview.body.mnt.add_storage' })}
              </Button>
            }
          >
            <ScrollerX sm={650}>
              <Table
                rowKey={(_, index) => index}
                pagination={false}
                dataSource={volumes}
                columns={this.getVmColumns()}
              />
            </ScrollerX>
          </Card>
        )}
        {method !== 'vm' && (
          <Card
            title={<span>{formatMessage({ id: 'componentOverview.body.mnt.share' })}</span>}
            extra={
              <Tooltip title={appDetail?.service?.extend_method === 'state_multiple' ? '有状态组件不允许挂载其他组件存储' : ''}>
                <Button
                  onClick={this.showAddRelation}
                  disabled={appDetail?.service?.extend_method === 'state_multiple'}
                >
                  <Icon type="plus" />
                  {formatMessage({ id: 'componentOverview.body.mnt.mount' })}
                </Button>
              </Tooltip>
            }
          >
            <ScrollerX sm={850}>
              <Table
                pagination={mntPaginationConfig}
                rowKey={(_, index) => index}
                columns={this.getMntColumns()}
                dataSource={mntList}
              />
            </ScrollerX>
          </Card>
        )}
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
            appAlias={appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
            volume_type={['share-file', 'memoryfs', 'local']}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title={<FormattedMessage id="confirmModal.deldete.Unmount.title" />}
            desc={<FormattedMessage id="confirmModal.deldete.Unmount.desc" />}
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title={<FormattedMessage id="confirmModal.deldete.storage.title" />}
            desc={<FormattedMessage id="confirmModal.deldete.storage.desc" />}
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
        {relyComponent && (
          <RelyComponentModal
            title={<FormattedMessage id="componentOverview.body.RelyComponentModal.title" />}
            relyComponentList={relyComponentList}
            onCancel={this.handleCloseRelyComponent}
            onOk={this.handleCloseRelyComponent}
          />
        )}
        {DirectoryPersistenceShow && (
          <DirectoryPersistence
            isShow={this.DirectoryPersistenceShow}
            appAlias={appAlias}
            volumePath={volume_path}
            hostPath={hostPath}
            isType
            volumeName={volumeName}
          />
        )}
      </Fragment>
    );
  }
}

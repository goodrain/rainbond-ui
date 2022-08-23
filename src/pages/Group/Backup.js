/* eslint-disable camelcase */
/* eslint-disable react/jsx-no-bind */
import {
  Alert,
  Button,
  Card,
  Form,
  Icon,
  Input,
  List,
  Modal,
  notification,
  Radio,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import apiconfig from '../../../config/api.config';
import ConfirmModal from '../../components/ConfirmModal';
import styles from '../../components/CreateTeam/index.less';
import ImportBackup from '../../components/ImportBackup';
import MigrationBackup from '../../components/MigrationBackup';
import RestoreBackup from '../../components/RestoreBackup';
import ScrollerX from '../../components/ScrollerX';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import logSocket from '../../utils/logSocket';
import roleUtil from '../../utils/role';
import sourceUtil from '../../utils/source-unit';
import userUtil from '../../utils/user';

const { TextArea } = Input;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@connect(({ user }) => ({ currUser: user.currentUser }))
class BackupStatus extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      map: {
        starting: '备份中',
        success: '备份成功',
        failed: '备份失败'
      }
    };
    this.timer = null;
  }
  componentDidMount() {
    const { data } = this.props;
    if (data.status === 'starting') {
      this.createSocket();
      this.startLoopStatus();
    }
  }
  componentWillUnmount() {
    this.stopLoopStatus();
    if (this.logSocket) {
      this.logSocket.destroy();
    }
    this.logSocket = null;
  }

  getSocketUrl = () => {
    return userUtil.getCurrRegionSoketUrl(this.props.currUser);
  };

  createSocket() {
    this.logSocket = new logSocket({
      url: this.getSocketUrl(),
      eventId: this.props.data.event_id,
      onMessage: msg => {
        // console.log(msg);
      }
    });
  }

  startLoopStatus() {
    this.props.dispatch({
      type: 'application/fetchBackupStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        backup_id: this.props.data.backup_id,
        group_id: this.props.group_id
      },
      callback: data => {
        if (data) {
          const { bean } = data;
          if (bean.status === 'starting') {
            this.timer = setTimeout(() => {
              this.startLoopStatus();
            }, 10000);
          } else if (this.props.onEnd) {
            this.props.onEnd();
          }
        }
      }
    });
  }
  stopLoopStatus() {
    clearTimeout(this.timer);
  }
  render() {
    const data = this.props.data || {};
    return (
      <span>
        {this.state.map[data.status]}
        {data.status === 'starting' && (
          <Icon style={{ marginLeft: 8 }} type="loading" spin />
        )}
      </span>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@Form.create()
class Backup extends PureComponent {
  state = {};
  onOk = e => {
    e.preventDefault();
    const { form, onOk, warningText } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const obj = fieldsValue;
      if (warningText) {
        obj.force = true;
      }
      if (onOk) {
        onOk(obj);
      }
    });
  };
  render() {
    const {
      data = {},
      form,
      is_configed,
      componentList,
      warningText,
      onCancel,
      loading = false
    } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const cloudBackupTip = is_configed
      ? '备份到云端存储上，可实现跨集群迁移'
      : '需要企业管理员在企业设置中配置 OSS 云对象存储';
    return (
      <Modal
        title="新增备份"
        visible
        className={styles.TelescopicModal}
        onOk={this.onOk}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.onOk} loading={loading}>
            {warningText ? '强制备份' : '确定'}
          </Button>
        ]}
      >
        <Form layout="horizontal">
          <Form.Item {...formItemLayout} label={<span>备份方式</span>}>
            {getFieldDecorator('mode', {
              initialValue: is_configed
                ? data.mode || 'full-online'
                : 'full-offline',
              rules: [{ required: true, message: '要创建的应用还没有名字' }]
            })(
              <RadioGroup>
                <Tooltip title={cloudBackupTip}>
                  <RadioButton disabled={!is_configed} value="full-online">
                    云端备份
                  </RadioButton>
                </Tooltip>
                <Tooltip title="备份到当前集群本地，不能跨集群迁移">
                  <RadioButton value="full-offline">本地备份</RadioButton>
                </Tooltip>
              </RadioGroup>
            )}
          </Form.Item>
          <Form.Item {...formItemLayout} label="备份说明">
            {getFieldDecorator('note', {
              initialValue: data.note || '',
              rules: [{ required: true, message: '请写入备份说明' }]
            })(<TextArea placeholder="请写入备份说明" />)}
          </Form.Item>

          {warningText && (
            <div>
              <Alert message={warningText} type="warning" />
              <List
                size="small"
                style={{ margin: '10px 0' }}
                header={
                  <h6 style={{ marginBottom: '0', fontSize: '15px' }}>
                    组件名称
                  </h6>
                }
                // footer={<div>Footer</div>}
                bordered
                dataSource={componentList}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, global, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  groups: global.groups || [],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      total: 0,
      pageSize: 6,
      showBackup: false,
      showMove: false,
      showDel: false,
      showRecovery: false,
      showImport: false,
      backup_id: '',
      appDetail: {},
      is_configed: null,
      group_uuid: '',
      warningText: '',
      componentList: [],
      operationPermissions: this.handlePermissions('queryAppInfo'),
      loading: false,
      deleteLoading: false
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isBackup }
    } = this.state;
    if (!isBackup) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  componentDidMount() {
    this.fetchAppDetail();
    this.fetchBackup();
  }
  onBackup = () => {
    this.setState({ showBackup: true });
  };
  getGroupId = () => {
    const { params } = this.props.match;
    return params.appID;
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  fetchBackup = () => {
    const { teamName, appID } = this.props.match.params;
    this.props.dispatch({
      type: 'application/fetchBackup',
      payload: {
        team_name: teamName,
        group_id: appID,
        page: this.state.page,
        page_size: this.state.pageSize
      },
      callback: data => {
        if (data) {
          this.setState({
            list: data.list || [],
            total: data.total,
            is_configed: data.bean.is_configed
          });
        }
      }
    });
  };

  cancelBackup = () => {
    this.setState({
      showBackup: false,
      warningText: '',
      componentList: [],
      loading: false
    });
  };
  cancelLoading = () => {
    this.setState({
      loading: false
    });
  };
  handleBackup = data => {
    this.setState({
      loading: true
    });
    this.props.dispatch({
      type: 'application/backup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        ...data
      },
      callback: () => {
        this.cancelBackup();
        this.fetchBackup();
      },
      handleError: res => {
        if (res && res.data && res.data.code) {
          const { code } = res.data;
          if (code === 4122 || code === 4121) {
            this.setState({
              warningText:
                code === 4122
                  ? '备份有异常 ：组件使用了自定义存储，是否强制备份'
                  : '备份有异常 ：有状态组件未停止，是否强制备份',
              componentList: res.data.data.list || []
            });
          } else if (res.data.msg_show) {
            notification.warning({ message: res.data.msg_show });
          }
        }
        this.cancelLoading();
      }
    });
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };
  // 倒入备份
  toAdd = () => {
    this.setState({ showImport: true });
  };
  handleImportBackup = () => {
    notification.success({
      message: '备份已导入',
      duration: 2
    });
    this.setState({ showImport: false });
    this.fetchBackup();
  };
  cancelImportBackup = () => {
    this.setState({ showImport: false });
    this.fetchBackup();
  };
  // 恢复应用备份
  handleRecovery = data => {
    this.setState({
      showRecovery: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid
    });
  };
  handleRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: '' });
    this.fetchBackup();
  };
  cancelRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: '' });
    this.fetchBackup();
  };
  // 迁移应用备份
  handleMove = data => {
    this.setState({
      showMove: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid,
      moveBackupMode: data.mode
    });
  };
  handleMoveBackup = () => {
    this.setState({ showMove: false });
  };
  cancelMoveBackup = () => {
    this.setState({ showMove: false, backup_id: '' });
  };
  // 导出应用备份

  handleExport = data => {
    const exportURl = `${
      apiconfig.baseUrl
    }/console/teams/${globalUtil.getCurrTeamName()}/groupapp/${this.getGroupId()}/backup/export?backup_id=${
      data.backup_id
    }`;
    window.open(exportURl);
    notification.success({
      message: '备份导出中',
      duration: 2
    });
  };
  // 删除应用备份
  handleDel = data => {
    this.setState({ showDel: true, backup_id: data.backup_id });
  };
  handleDelete = () => {
    this.setState({
      deleteLoading: true
    });
    this.props.dispatch({
      type: 'application/delBackup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        backup_id: this.state.backup_id
      },
      callback: data => {
        if (data) {
          notification.success({
            message: '删除成功',
            duration: 2
          });
          this.cancelDelete();
          this.fetchBackup();
        }
      }
    });
  };
  cancelDelete = () => {
    this.setState(
      { showDel: false, backup_id: '', deleteLoading: false },
      () => {
        this.fetchBackup();
      }
    );
  };
  jumpToAllbackup = () => {
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/allbackup`
      )
    );
  };

  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const { regionName } = this.props.match.params;
    const {
      appDetail,
      loadingDetail,
      list = [],
      operationPermissions: { isMigrate, isImport, isExport },
      loading,
      deleteLoading
    } = this.state;
    const columns = [
      {
        title: formatMessage({id: 'appBackups.table.backupsTime'}),
        dataIndex: 'create_time'
      },
      {
        title: formatMessage({id: 'appBackups.table.backupsPerson'}),
        dataIndex: 'user'
      },
      {
        title: formatMessage({id: 'appBackups.table.backupsPattern'}),
        dataIndex: 'mode',
        render: val => {
          const map = {
            'full-online': formatMessage({id: 'appBackups.table.backupsPattern.cloud'}),
            'full-offline': formatMessage({id: 'appBackups.table.backupsPattern.local'})
          };
          return map[val] || '';
        }
      },
      {
        title: formatMessage({id: 'appBackups.table.packetSize'}),
        dataIndex: 'backup_size',
        render: val => {
          return sourceUtil.unit(val, 'Byte');
        }
      },
      {
        title: formatMessage({id: 'appBackups.table.status'}),
        dataIndex: 'status',
        render: (val, data) => {
          return (
            <BackupStatus
              onEnd={this.fetchBackup}
              group_id={this.getGroupId()}
              data={data}
            />
          );
        }
      },
      {
        title: formatMessage({id: 'appBackups.table.comment'}),
        dataIndex: 'note'
      },
      {
        title: formatMessage({id: 'appBackups.table.operate'}),
        dataIndex: 'action',
        render: (_, data) => {
          const isSuccess = data.status === 'success';
          const migrateSuccess = isMigrate && isSuccess;
          const exportSuccess =
            data.mode === 'full-online' && isSuccess && isExport;
          const box = (text, fun) => {
            return (
              <a
                style={{ marginRight: '5px' }}
                onClick={() => {
                  this[fun](data);
                }}
              >
                {text}
              </a>
            );
          };
          return (
            <div>
              {migrateSuccess && (
                <Fragment>
                  {box(formatMessage({id: 'appBackups.table.btn.recover'}), 'handleRecovery')}
                  {box(formatMessage({id: 'appBackups.table.btn.removal'}), 'handleMove')}
                </Fragment>
              )}
              {exportSuccess && box(formatMessage({id: 'appBackups.table.btn.export'}), 'handleExport')}
              {box(formatMessage({id: 'appBackups.table.btn.delete'}), 'handleDel')}
            </div>
          );
        }
      }
    ];

    let breadcrumbList = [];

    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    return (
      <PageHeaderLayout
        loading={loadingDetail}
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'appBackups.title'})}
        content={
          <p>
            {formatMessage({id: 'appBackups.desc'})}
          </p>
        }
        extraContent={
          <div>
            <Button
              style={{ marginRight: 8 }}
              type="primary"
              onClick={this.onBackup}
            >
              {formatMessage({id: 'appBackups.btn.addBackups'})}
            </Button>
            {isImport && (
              <Button style={{ marginRight: 8 }} onClick={this.toAdd}>
                {formatMessage({id: 'appBackups.btn.importBackups'})}
              </Button>
            )}
            <Button onClick={this.jumpToAllbackup}>
              {formatMessage({id: 'appBackups.btn.allBackups'})}
            </Button>
          </div>
        }
      >
        <Card>
          <ScrollerX sm={800}>
            <Table
              rowKey={data => {
                return data.backup_id;
              }}
              pagination={{
                current: this.state.page,
                total: this.state.total,
                pageSize: this.state.pageSize,
                onChange: page => {
                  this.setState({ page }, () => {
                    this.fetchBackup();
                  });
                }
              }}
              columns={columns}
              dataSource={list}
            />
          </ScrollerX>
        </Card>

        {this.state.showBackup && (
          <Backup
            warningText={this.state.warningText}
            componentList={this.state.componentList}
            is_configed={this.state.is_configed}
            onOk={this.handleBackup}
            onCancel={this.cancelBackup}
            loading={loading}
          />
        )}
        {this.state.showMove && (
          <MigrationBackup
            onOk={this.handleMoveBackup}
            onCancel={this.cancelMoveBackup}
            backupId={this.state.backup_id}
            groupId={this.getGroupId()}
            currentRegion={regionName}
            mode={this.state.mode}
            group_uuid={this.state.group_uuid}
            moveBackupMode={this.state.moveBackupMode}
          />
        )}
        {this.state.showRecovery && (
          <RestoreBackup
            onOk={this.handleRecoveryBackup}
            onCancel={this.cancelRecoveryBackup}
            propsParams={this.props.match.params}
            backupId={this.state.backup_id}
            group_uuid={this.state.group_uuid}
            groupId={this.getGroupId()}
          />
        )}
        {this.state.showImport && (
          <ImportBackup
            onReLoad={this.handleImportBackup}
            onCancel={this.cancelImportBackup}
            backupId={this.state.backup_id}
            groupId={this.getGroupId()}
          />
        )}
        {this.state.showDel && (
          <ConfirmModal
            backupId={this.state.backup_id}
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
            title="删除备份"
            desc="确定要删除此备份吗？"
            subDesc="此操作不可恢复"
            deleteLoading={deleteLoading}
          />
        )}
      </PageHeaderLayout>
    );
  }
}

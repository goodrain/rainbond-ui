/* eslint-disable react/sort-comp */
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  notification,
  Spin,
  Select,
  Radio,
  Table,
  Tag,
  Popconfirm,
  Icon,
  Modal,
  Alert
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import dateUtil from '../../utils/date-util';
import styles from './Index.less';

const { Option } = Select;
const RadioGroup = Radio.Group;

/**
 * 数据库备份页面组件
 * 功能：
 * 显示和编辑备份设置
 * 手动备份
 * 管理备份列表
 */

@connect(
  ({ user, appControl, kubeblocks }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    clusterDetail: kubeblocks.clusterDetail,
    backupRepos: kubeblocks.backupRepos,
    backupList: kubeblocks.backupList
  }),
  null,
  null,
  { pure: false, withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      editBackupInfo: false, // 是否处于编辑状态
      backupSchedule: '', // 备份周期：hour/day/week
      backupStartDay: '', // 备份开始日期（周）
      backupStartHour: '', // 备份开始小时
      backupStartMinute: '', // 备份开始分钟
      backupRetentionTime: '', // 备份保留时间
      backupRetentionUnit: 'day', // 备份保留单位
      termination_policy: '', // 删除策略
      backupRepo: '', // 备份仓库名称
      restoreVisible: false, // 恢复确认弹窗显示状态
      selectedBackupName: '', // 选中要恢复的备份名称
      restoring: false // 恢复操作进行中
    };

  }
  componentDidMount() {
    this.fetchBackupRepos();
    this.initFromClusterDetail();
    this.fetchBackupList();

    this.backupListTimer = setInterval(() => {
      this.fetchBackupList();
    }, 60000);
  }

  // 当 props.clusterDetail 变化时，只在非编辑状态下重新初始化界面状态
  componentDidUpdate(prevProps) {
    if (prevProps.clusterDetail !== this.props.clusterDetail && !this.state.editBackupInfo) {
      this.initFromClusterDetail();
    }
  }

  componentWillUnmount() {
    if (this.backupListTimer) {
      clearInterval(this.backupListTimer);
    }
  }

  fetchBackupRepos = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();

    dispatch({
      type: 'kubeblocks/fetchBackupRepos',
      payload: {
        team_name,
        region_name
      },
      handleError: (err) => { }
    });
  };

  /**
   * 获取备份列表
   */
  fetchBackupList = () => {
    const { dispatch, appDetail } = this.props;
    if (!appDetail || !appDetail.service || !appDetail.service.service_id) {
      return;
    }

    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const service_id = appDetail.service.service_id;

    dispatch({
      type: 'kubeblocks/fetchBackupList',
      payload: {
        team_name,
        region_name,
        service_id
      },
      handleError: (err) => { }
    });
  };

  /**
   * 从集群详情初始化备份配置
   */
  initFromClusterDetail = () => {
    const { clusterDetail } = this.props;
    if (!clusterDetail || !clusterDetail.backup) {
      this.setState({
        backupSchedule: '',
        backupStartDay: '',
        backupStartHour: '',
        backupStartMinute: '',
        backupRetentionTime: '',
        backupRepo: '',
        termination_policy: ''
      });
      return;
    }

    const { backup } = clusterDetail;
    const { schedule, retentionPeriod, backupRepo } = backup;

    // 解析备份周期：将 API 返回的 frequency 转换为前端使用的 cycle
    let backupSchedule = '';
    if (schedule && schedule.frequency) {
      switch (schedule.frequency) {
        case 'hourly':
          backupSchedule = 'hour';
          break;
        case 'daily':
          backupSchedule = 'day';
          break;
        case 'weekly':
          backupSchedule = 'week';
          break;
        default:
          backupSchedule = '';
      }
    }

    const backupStartHour = schedule && schedule.hour ? schedule.hour.toString().padStart(2, '0') : '';
    const backupStartMinute = schedule && schedule.minute ? schedule.minute.toString().padStart(2, '0') : '';
    const backupStartDay = schedule && schedule.dayOfWeek ? schedule.dayOfWeek.toString() : '';

    let backupRetentionTime = '';
    if (retentionPeriod) {
      const match = retentionPeriod.match(/(\d+)d/);
      if (match) {
        backupRetentionTime = parseInt(match[1], 10);
      }
    }

    // 更新组件状态，只设置有值的字段
    this.setState({
      backupSchedule: backupSchedule,
      backupStartDay,
      backupStartHour,
      backupStartMinute,
      backupRetentionTime,
      backupRepo: backupRepo || '',
      termination_policy: ''
    });
  };

  /**
   * 处理备份仓库变更
   */
  handleBackupRepoChange = (value) => {
    this.setState({ backupRepo: value });
    const { form } = this.props;
    form.setFieldsValue({ backupRepo: value });
  };

  /**
   * 处理备份周期变更
   */
  handleBackupScheduleChange = (e) => {
    this.setState({ backupSchedule: e.target.value });
    const { form } = this.props;
    form.setFieldsValue({ backupSchedule: e.target.value });
  };

  /**
   * 处理删除策略变更
   */
  handleTerminationPolicyChange = (e) => {
    this.setState({ termination_policy: e.target.value });
    const { form } = this.props;
    form.setFieldsValue({ termination_policy: e.target.value });
  };

  /**
   * 保存备份配置
   */
  handleSaveBackupConfig = () => {
    const { form, dispatch, appDetail } = this.props;
    const { backupSchedule, backupStartDay, backupStartHour, backupStartMinute, backupRetentionTime, backupRepo, termination_policy } = this.state;

    form.validateFields(['backupRepo', 'backupSchedule', 'backupRetention'], (err) => {
      if (err) return;

      if (!backupRepo) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.repo_required' }) });
        return;
      }
      if (!backupSchedule) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.cycle_required' }) });
        return;
      }
      if (!backupRetentionTime) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.retention_required' }) });
        return;
      }
      if (backupSchedule === 'week') {
        if (!backupStartDay && backupStartDay !== 0 && backupStartDay !== '0') {
          notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.startTime_week_required' }) });
          return;
        }
      }
      if (backupSchedule === 'day' || backupSchedule === 'week') {
        if (!backupStartHour && backupStartHour !== 0 && backupStartHour !== '0') {
          notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.startTime_hour_required' }) });
          return;
        }
      }
      if (backupStartMinute === '' || backupStartMinute === undefined || backupStartMinute === null) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.startTime_minute_required' }) });
        return;
      }

      let frequency = 'daily';
      switch (backupSchedule) {
        case 'hour':
          frequency = 'hourly';
          break;
        case 'day':
          frequency = 'daily';
          break;
        case 'week':
          frequency = 'weekly';
          break;
        default:
          frequency = 'daily';
      }

      const schedule = {
        frequency,
        hour: parseInt(backupStartHour, 10) || 0,
        minute: parseInt(backupStartMinute, 10) || 0
      };
      if (backupSchedule === 'week') {
        schedule.dayOfWeek = parseInt(backupStartDay, 10);
      }

      const serviceId = appDetail?.service?.service_id;
      if (!serviceId) {
        notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.service_not_ready' }) });
        return;
      }

      const backupConfig = {
        backupRepo,
        schedule,
        retentionPeriod: `${backupRetentionTime}d`,
        terminationPolicy: termination_policy || 'Delete',
        rbdService: { service_id: serviceId }
      };

      this.setState({ loading: true });
      dispatch({
        type: 'kubeblocks/updateBackupConfig',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          region_name: globalUtil.getCurrRegionName(),
          service_id: serviceId,
          body: backupConfig
        },
        callback: (res) => {
          this.setState({ loading: false });
          if (res && res.status_code === 200) {
            notification.success({ message: formatMessage({ id: 'notification.success.save' }) });
            this.setState({ editBackupInfo: false });
            this.fetchBackupList();
          } else {
            const msg = (res && res.msg_show) || formatMessage({ id: 'notification.error.save' });
            notification.error({ message: msg });
          }
        },
        handleError: (e) => {
          this.setState({ loading: false });
        }
      });
    });
  };

  /**
   * 取消编辑
   * 重新从集群详情初始化配置，恢复到只读状态
   */
  handleCancelEdit = () => {
    this.initFromClusterDetail();
    this.setState({ editBackupInfo: false });
  };


  /**
   * 手动备份
   * 触发手动备份操作
   */
  handleManualBackup = () => {
    const { dispatch, appDetail } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const service_id = appDetail.service.service_id;

    dispatch({
      type: 'kubeblocks/createManualBackup',
      payload: { team_name, region_name, service_id },
      callback: (res) => {
        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'kubeblocks.database.backup.manual.success' })
          });
          this.fetchBackupList();
        } else {
          const msg = (res && res.msg_show) ||
            formatMessage({ id: 'kubeblocks.database.backup.manual.failed' });
          notification.error({ message: msg });
        }
      },
      handleError: (err) => {
        const msg = (err && err.data && err.data.msg_show) ||
          formatMessage({ id: 'kubeblocks.database.backup.manual.failed' });
        notification.error({ message: msg });
      }
    });
  };

  /**
   * 删除备份
   * 删除指定的备份记录
   * @param {String} backupName - 要删除的备份名称
   */
  handleDeleteBackup = (backupName) => {
    const { dispatch, appDetail } = this.props;
    if (!appDetail || !appDetail.service || !appDetail.service.service_id) {
      notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.delete.service_incomplete' }) });
      return;
    }

    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const service_id = appDetail.service.service_id;

    // 保持loading状态
    this.setState({ loading: true });

    dispatch({
      type: 'kubeblocks/deleteBackups',
      payload: {
        team_name,
        region_name,
        service_id,
        backups: [backupName]
      },
      callback: (res) => {
        this.setState({ loading: false });
        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'kubeblocks.database.backup.delete.success' })
          });
          // model 已经自动更新了状态，但为了保险起见也手动刷新一次
          this.fetchBackupList();
        } else {
          const msg = (res && res.msg_show) ||
            formatMessage({ id: 'kubeblocks.database.backup.delete.failed' });
          notification.error({ message: msg });
        }
      },
      handleError: (err) => {
        this.setState({ loading: false });
        const msg = (err && err.data && err.data.msg_show) ||
          formatMessage({ id: 'kubeblocks.database.backup.delete.failed' });
        notification.error({ message: msg });
        // 如果删除失败，手动刷新确保数据一致性
        this.fetchBackupList();
      }
    });
  };

  /**
   * 显示恢复确认弹窗
   */
  handleShowRestoreConfirm = (backupName) => {
    this.setState({
      restoreVisible: true,
      selectedBackupName: backupName
    });
  };

  /**
   * 取消恢复操作
   */
  handleCancelRestore = () => {
    this.setState({
      restoreVisible: false,
      selectedBackupName: ''
    });
  };

  /**
   * 执行从备份恢复操作
   * 调用API创建新的集群，原集群保持不变
   */
  handleConfirmRestore = () => {
    const { dispatch, appDetail } = this.props;
    const { selectedBackupName } = this.state;

    if (!appDetail || !appDetail.service || !appDetail.service.service_alias) {
      notification.error({ message: formatMessage({ id: 'kubeblocks.database.backup.restore.service_incomplete' }) });
      return;
    }

    this.setState({ restoring: true });

    dispatch({
      type: 'kubeblocks/restoreFromBackup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail.service.service_alias,
        body: { backup_name: selectedBackupName }
      },
      callback: (res) => {
        this.setState({
          restoring: false,
          restoreVisible: false,
          selectedBackupName: ''
        });

        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'kubeblocks.database.backup.restore.success' }),
            duration: 4
          });
        } else {
          const msg = (res && res.msg_show) ||
            formatMessage({ id: 'kubeblocks.database.backup.restore.failed' });
          notification.error({ message: msg });
        }
      },
      handleError: (err) => {
        this.setState({
          restoring: false,
          restoreVisible: false,
          selectedBackupName: ''
        });
        const msg = (err && err.data && err.data.msg_show) ||
          formatMessage({ id: 'kubeblocks.database.backup.restore.request_failed' });
        notification.error({ message: msg });
      }
    });
  };

  render() {
    const { form, clusterDetail, backupRepos = [], backupList = [] } = this.props;
    const { getFieldDecorator } = form;
    const {
      loading,
      editBackupInfo,
      backupSchedule,
      backupStartDay,
      backupStartHour,
      backupStartMinute,
      backupRetentionTime,
      termination_policy,
      backupRepo,
      restoreVisible,
      selectedBackupName,
      restoring
    } = this.state;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 }
      }
    };

    const requiredLabel = (label) => (<span><span style={{ color: 'red' }}>*</span> {label}</span>);

    // 备份列表列定义
    const backupColumns = [
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.table.name' }),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.table.status' }),
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'Completed' ? 'green' : status === 'Failed' ? 'red' : 'blue'}>
            {status}
          </Tag>
        )
      },
      {
        title: formatMessage({ id: 'kubeblocks.database.backup.table.time' }),
        dataIndex: 'time',
        key: 'time',
        render: (t) => t ? dateUtil.format(t, 'yyyy-MM-dd hh:mm:ss') : '-'
      },
      {
        title: formatMessage({ id: 'button.operation' }),
        key: 'action',
        render: (text, record) => (
          <span>
            <Button
              type="link"
              size="small"
              icon="reload"
              style={{ color: '#1890ff', marginRight: 8 }}
              onClick={() => this.handleShowRestoreConfirm(record.name)}
              disabled={record.status !== 'Completed'}
            >
              {formatMessage({ id: 'kubeblocks.database.backup.restore.button' })}
            </Button>
            <Popconfirm
              title={formatMessage({ id: 'kubeblocks.database.backup.delete.confirm' })}
              onConfirm={() => this.handleDeleteBackup(record.name)}
              okText={formatMessage({ id: 'button.confirm' })}
              cancelText={formatMessage({ id: 'button.cancel' })}
            >
              <Button type="link" size="small" style={{ color: '#f5222d' }}>
                <Icon type="delete" /> {formatMessage({ id: 'button.delete' })}
              </Button>
            </Popconfirm>
          </span>
        )
      }
    ];

    if (!clusterDetail) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div>
        {/* 备份设置 */}
        <Card
          title={formatMessage({ id: 'kubeblocks.database.backup.page.title' })}
          extra={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {editBackupInfo ? (
                <div style={{ marginLeft: 10 }}>
                  <Button type="primary" style={{ marginRight: 10 }} onClick={this.handleSaveBackupConfig}>
                    {formatMessage({ id: 'appPublish.table.btn.confirm' })}
                  </Button>
                  <Button onClick={this.handleCancelEdit}>
                    {formatMessage({ id: 'appPublish.table.btn.cancel' })}
                  </Button>
                </div>
              ) : (
                <Button icon="edit" onClick={() => this.setState({ editBackupInfo: true })}>
                  {formatMessage({ id: 'componentOverview.body.tab.env.table.column.edit' })}
                </Button>
              )}
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Form layout="horizontal" hideRequiredMark>
            {/* 备份仓库 */}
            <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.repo_label' }))}>
              {getFieldDecorator('backupRepo', {
                initialValue: backupRepo || '',
                rules: [{ required: false }]
              })(
                <Select
                  placeholder={formatMessage({ id: 'kubeblocks.database.backup.repo_placeholder' })}
                  onChange={this.handleBackupRepoChange}
                  allowClear
                  disabled={!editBackupInfo}
                >
                  <Option value="">{formatMessage({ id: 'kubeblocks.database.backup.repo_none' })}</Option>
                  {backupRepos.map(repo => (
                    <Option key={repo.name} value={repo.name}>
                      {repo.displayName || repo.name}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>

            {backupRepo && (
              <>
                {/* 循环周期 */}
                <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.cycle_label' }))}>
                  {getFieldDecorator('backupSchedule', {
                    initialValue: backupSchedule || '',
                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.cycle_required' }) }]
                  })(
                    <RadioGroup onChange={this.handleBackupScheduleChange} disabled={!editBackupInfo}>
                      <Radio value="hour">{formatMessage({ id: 'kubeblocks.database.backup.cycle_hour' })}</Radio>
                      <Radio value="day">{formatMessage({ id: 'kubeblocks.database.backup.cycle_day' })}</Radio>
                      <Radio value="week">{formatMessage({ id: 'kubeblocks.database.backup.cycle_week' })}</Radio>
                    </RadioGroup>
                  )}
                </Form.Item>

                {/* 备份起始时间 */}
                <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.startTime_label' }))}>
                  {getFieldDecorator('backupStartTime', {
                    initialValue: {
                      day: backupStartDay || '',
                      hour: backupStartHour || '',
                      minute: backupStartMinute || ''
                    },
                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.startTime_required' }) }]
                  })(
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {backupSchedule === 'week' && (
                        <Select
                          value={backupStartDay || ''}
                          onChange={v => this.setState({ backupStartDay: v })}
                          style={{ width: 80, marginRight: 8 }}
                          disabled={!editBackupInfo}
                        >
                          <Option value="1">{formatMessage({ id: 'kubeblocks.database.backup.startTime_mon' })}</Option>
                          <Option value="2">{formatMessage({ id: 'kubeblocks.database.backup.startTime_tue' })}</Option>
                          <Option value="3">{formatMessage({ id: 'kubeblocks.database.backup.startTime_wed' })}</Option>
                          <Option value="4">{formatMessage({ id: 'kubeblocks.database.backup.startTime_thu' })}</Option>
                          <Option value="5">{formatMessage({ id: 'kubeblocks.database.backup.startTime_fri' })}</Option>
                          <Option value="6">{formatMessage({ id: 'kubeblocks.database.backup.startTime_sat' })}</Option>
                          <Option value="0">{formatMessage({ id: 'kubeblocks.database.backup.startTime_sun' })}</Option>
                        </Select>
                      )}
                      {(backupSchedule === 'day' || backupSchedule === 'week') && (
                        <>
                          <Select
                            value={backupStartHour || ''}
                            onChange={v => this.setState({ backupStartHour: v })}
                            style={{ width: 80, marginRight: 4 }}
                            disabled={!editBackupInfo}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <Option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </Option>
                            ))}
                          </Select>
                          <span style={{ marginRight: 8 }}>{formatMessage({ id: 'kubeblocks.database.backup.startTime_hour' })}</span>
                        </>
                      )}
                      <Select
                        value={backupStartMinute || ''}
                        onChange={v => this.setState({ backupStartMinute: v })}
                        style={{ width: 80, marginRight: 4 }}
                        disabled={!editBackupInfo}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <Option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </Option>
                        ))}
                      </Select>
                      <span>{formatMessage({ id: 'kubeblocks.database.backup.startTime_minute' })}</span>
                    </div>
                  )}
                </Form.Item>

                {/* 备份数据保留时间 */}
                <Form.Item {...formItemLayout} label={requiredLabel(formatMessage({ id: 'kubeblocks.database.backup.retention_label' }))}>
                  {getFieldDecorator('backupRetention', {
                    initialValue: backupRetentionTime || '',
                    rules: [{ required: true, message: formatMessage({ id: 'kubeblocks.database.backup.retention_required' }) }]
                  })(
                    <InputNumber
                      style={{ width: '120px' }}
                      min={1}
                      max={365}
                      value={backupRetentionTime || ''}
                      onChange={v => this.setState({ backupRetentionTime: v })}
                      placeholder={formatMessage({ id: 'kubeblocks.database.backup.retention_placeholder' })}
                      disabled={!editBackupInfo}
                    />
                  )}
                  <span style={{ marginLeft: 8, color: '#666' }}>{formatMessage({ id: 'kubeblocks.database.backup.retention_unit' })}</span>
                </Form.Item>
              </>
            )}
          </Form>
        </Card>

        {/* 备份列表 */}
        <Card
          title={formatMessage({ id: 'kubeblocks.database.backup.page.list.title' })}
          extra={
            <Button
              type="primary"
              icon="cloud-upload"
              onClick={this.handleManualBackup}
            >
              {formatMessage({ id: 'kubeblocks.database.backup.page.manual.button' })}
            </Button>
          }
        >
          <Table
            columns={backupColumns}
            dataSource={backupList}
            rowKey={(record) => record.name || record.time}
            pagination={false}
            loading={loading}
          />
        </Card>

        {/* 恢复确认弹窗 */}
        <Modal
          title={formatMessage({ id: 'kubeblocks.database.backup.restore.title' })}
          visible={restoreVisible}
          onCancel={this.handleCancelRestore}
          onOk={this.handleConfirmRestore}
          confirmLoading={restoring}
          okText={formatMessage({ id: 'kubeblocks.database.backup.restore.confirm' })}
          cancelText={formatMessage({ id: 'kubeblocks.database.backup.restore.cancel' })}
        >
          <div style={{ marginBottom: 16 }}>
            <Icon type="info-circle" style={{ color: '#1890ff', marginRight: 8 }} />
            <strong>{formatMessage({ id: 'kubeblocks.database.backup.restore.backup_name' })}：</strong>{selectedBackupName}
          </div>
          <Alert
            type="info"
            showIcon
            message={formatMessage({ id: 'kubeblocks.database.backup.restore.tip.title' })}
            description={formatMessage({ id: 'kubeblocks.database.backup.restore.tip.content' })}
            style={{ marginBottom: 16 }}
          />
        </Modal>
      </div>
    );
  }
}

import { Button, Card, Empty, Input, Modal, Select, Table, Tag, Tooltip, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import styles from './index.less';

const { Option } = Select;

@connect(({ vmTemplate, loading }) => ({
  list: vmTemplate.list,
  detail: vmTemplate.detail,
  loading: loading.effects['vmTemplate/fetchList']
}))
class VMTemplateCenter extends PureComponent {
  state = {
    keyword: '',
    detailVisible: false,
    selectedVersionId: null
  };

  componentDidMount() {
    this.fetchList();
  }

  fetchList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'vmTemplate/fetchList',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };

  openDetail = (record) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'vmTemplate/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        template_id: record.id
      },
      callback: res => {
        const detail = res && res.bean;
        this.setState({
          detailVisible: true,
          selectedVersionId: detail && detail.latest_ready_version_id
            ? detail.latest_ready_version_id
            : detail && detail.versions && detail.versions[0] && detail.versions[0].id
        });
      }
    });
  };

  closeDetail = () => {
    this.setState({
      detailVisible: false,
      selectedVersionId: null
    });
  };

  handleToggleTemplate = (record) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'vmTemplate/updateTemplate',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        template_id: record.id,
        disabled: !record.disabled
      },
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'notification.success.edit' })
        });
        this.fetchList();
        if (this.state.detailVisible && this.props.detail && this.props.detail.id === record.id) {
          this.openDetail(record);
        }
      }
    });
  };

  handleRetryVersion = (record, version) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'vmTemplate/retryVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        template_id: record.id,
        version_id: version.id
      },
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'Vm.template.center.retryStarted' })
        });
        this.fetchList();
        this.openDetail(record);
      }
    });
  };

  handleUseTemplate = (record, versionId) => {
    const { dispatch } = this.props;
    const versions = (record && record.versions) || [];
    const explicitVersion = versions.find(item => String(item.id) === String(versionId));
    if (explicitVersion && !explicitVersion.can_instantiate) {
      return;
    }
    if (!explicitVersion && !record.can_instantiate) {
      return;
    }
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    dispatch(routerRedux.push({
      pathname: `/team/${teamName}/region/${regionName}/create/vm`,
      query: {
        template_id: record.id,
        template_version_id: versionId || (record.latest_ready_version && record.latest_ready_version.id) || record.latest_version_id
      }
    }));
  };

  getFilteredList = () => {
    const { list = [] } = this.props;
    const { keyword } = this.state;
    if (!keyword) {
      return list;
    }
    const lowerKeyword = keyword.toLowerCase();
    return list.filter(item =>
      [item.name, item.status, item.source_service_id]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().indexOf(lowerKeyword) > -1)
    );
  };

  getCurrentVersion = () => {
    const { detail } = this.props;
    const { selectedVersionId } = this.state;
    const versions = (detail && detail.versions) || [];
    return versions.find(item => String(item.id) === String(selectedVersionId)) || versions[0];
  };

  renderSummaryLine = (label, value) => (
    <div>
      <div className={styles.summaryLabel}>{label}</div>
      <div>{value || '-'}</div>
    </div>
  );

  render() {
    const { loading, detail } = this.props;
    const { keyword, detailVisible, selectedVersionId } = this.state;
    const dataSource = this.getFilteredList();
    const currentVersion = this.getCurrentVersion();
    const currentVersionCanInstantiate = currentVersion ? !!currentVersion.can_instantiate : false;
    const columns = [
      {
        title: formatMessage({ id: 'Vm.template.center.name' }),
        dataIndex: 'name',
        key: 'name',
        width: 180
      },
      {
        title: formatMessage({ id: 'Vm.template.center.status' }),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: value => <Tag color={value === 'ready' ? 'green' : value === 'partial' ? 'orange' : 'blue'}>{value}</Tag>
      },
      {
        title: formatMessage({ id: 'Vm.template.center.latestVersion' }),
        key: 'latest_ready_version',
        width: 120,
        render: (_, record) => (record.latest_ready_version && record.latest_ready_version.version) || '-'
      },
      {
        title: formatMessage({ id: 'Vm.template.center.diskCount' }),
        dataIndex: 'disk_count',
        key: 'disk_count',
        width: 100,
      },
      {
        title: formatMessage({ id: 'Vm.template.center.sourceService' }),
        dataIndex: 'source_service_id',
        key: 'source_service_id',
        width: 180,
      },
      {
        title: formatMessage({ id: 'Vm.template.center.createdAt' }),
        dataIndex: 'create_time',
        key: 'create_time',
        width: 180,
      },
      {
        title: formatMessage({ id: 'Vm.template.center.actions' }),
        key: 'actions',
        width: 200,
        render: (_, record) => (
          <span>
            <a
              style={{
                color: record.can_instantiate ? undefined : '#bfbfbf',
                pointerEvents: record.can_instantiate ? undefined : 'none'
              }}
              onClick={() => this.handleUseTemplate(record)}
            >
              {formatMessage({ id: 'Vm.template.center.use' })}
            </a>
            <a style={{ marginLeft: 12 }} onClick={() => this.openDetail(record)}>
              {formatMessage({ id: 'Vm.template.center.detail' })}
            </a>
            <a style={{ marginLeft: 12 }} onClick={() => this.handleToggleTemplate(record)}>
              {record.disabled
                ? formatMessage({ id: 'Vm.template.center.enable' })
                : formatMessage({ id: 'Vm.template.center.disable' })}
            </a>
          </span>
        )
      }
    ];

    return (
      <div className={styles.page}>
        <Card bordered={false}>
          <div className={styles.toolbar}>
            <Input.Search
              value={keyword}
              onChange={e => this.setState({ keyword: e.target.value })}
              placeholder={formatMessage({ id: 'Vm.template.center.searchPlaceholder' })}
              style={{ width: 320 }}
            />
          </div>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={dataSource}
            columns={columns}
            locale={{
              emptyText: <Empty description={formatMessage({ id: 'Vm.template.center.empty' })} />
            }}
          />
        </Card>

        <Modal
          title={formatMessage({ id: 'Vm.template.center.modalTitle' })}
          visible={detailVisible}
          onCancel={this.closeDetail}
          footer={[
            <Button key="cancel" onClick={this.closeDetail}>
              {formatMessage({ id: 'button.cancel' })}
            </Button>,
            <Button
              key="use"
              type="primary"
              disabled={!detail || !currentVersionCanInstantiate}
              onClick={() => this.handleUseTemplate(detail, selectedVersionId)}
            >
              {formatMessage({ id: 'Vm.template.center.use' })}
            </Button>
          ]}
          width={760}
          destroyOnClose
        >
          {detail && currentVersion ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Select
                  value={String(selectedVersionId || currentVersion.id)}
                  style={{ width: 200 }}
                  onChange={value => this.setState({ selectedVersionId: value })}
                >
                  {(detail.versions || []).map(item => (
                    <Option key={item.id} value={String(item.id)}>
                      {item.version}
                    </Option>
                  ))}
                </Select>
                {currentVersion.status === 'failed' && (
                  <Button style={{ marginLeft: 12 }} onClick={() => this.handleRetryVersion(detail, currentVersion)}>
                    {formatMessage({ id: 'Vm.template.center.retry' })}
                  </Button>
                )}
              </div>
              <div className={styles.summary}>
                {this.renderSummaryLine(formatMessage({ id: 'Vm.template.center.name' }), detail.name)}
                {this.renderSummaryLine(formatMessage({ id: 'Vm.template.center.status' }), currentVersion.status)}
                {this.renderSummaryLine(formatMessage({ id: 'Vm.template.center.recoverability' }), currentVersion.recoverability)}
                {this.renderSummaryLine(formatMessage({ id: 'Vm.template.center.diskCount' }), currentVersion.disk_count)}
                {this.renderSummaryLine(formatMessage({ id: 'Vm.template.center.sourceService' }), currentVersion.source_service_alias || currentVersion.source_service_id)}
                {this.renderSummaryLine(formatMessage({ id: 'Vm.template.center.bootMode' }), currentVersion.boot_mode)}
              </div>
              <div className={styles.diskList}>
                <div className={styles.summaryLabel}>{formatMessage({ id: 'Vm.template.center.disks' })}</div>
                {(currentVersion.disks || []).map(item => (
                  <div className={styles.diskItem} key={item.disk_key}>
                    <span>{`${item.disk_name || item.disk_key} / ${item.disk_role}`}</span>
                    <span>
                      <Tag>{item.status}</Tag>
                      <Tooltip
                        title={item.content_restore_supported
                          ? formatMessage({ id: 'Vm.template.center.diskRestoreSupported' })
                          : formatMessage({ id: 'Vm.template.center.diskRestoreUnsupported' })}
                      >
                        <Tag color={item.content_restore_supported ? 'green' : 'orange'}>
                          {item.content_restore_supported
                            ? formatMessage({ id: 'Vm.template.center.restoreYes' })
                            : formatMessage({ id: 'Vm.template.center.restoreNo' })}
                        </Tag>
                      </Tooltip>
                    </span>
                  </div>
                ))}
              </div>
              {currentVersion.status === 'partial' && (
                <div style={{ marginTop: 16, color: '#d46b08' }}>
                  {formatMessage({ id: 'Vm.template.center.partialTip' })}
                </div>
              )}
              {currentVersion.status_message && (
                <div style={{ marginTop: 12, color: '#8d9bad' }}>
                  {currentVersion.status_message}
                </div>
              )}
            </div>
          ) : (
            <Empty description={formatMessage({ id: 'Vm.template.center.empty' })} />
          )}
        </Modal>
      </div>
    );
  }
}

export default VMTemplateCenter;

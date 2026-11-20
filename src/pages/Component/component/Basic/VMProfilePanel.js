import { Alert, Button, Card, Col, Form, Icon, InputNumber, Modal, Row, Select, Switch, Tag, Tooltip, notification } from 'antd';
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import {
  addKubernetes,
  deleteKubernetes,
  editKubernetes,
  getKubernetes,
  getPorts,
  setVMFixedPodIP
} from '../../../../services/app';
import { getVMCapabilities } from '../../../../services/createApp';
import { getNsResource } from '../../../../services/teamResource';
import handleAPIError from '../../../../utils/error';
import globalUtil from '../../../../utils/global';
import { readVMInternalAddress, buildVMPortManagementRoute, getVMNetworkRefreshKey, getVMNetworkStatus } from '../../vmNetworkHelpers';
import styles from './VMProfilePanel.less';

const { Option } = Select;
const NETWORK_RETRY_DELAYS = [2000, 5000, 10000, 30000];
const NETWORK_FAILURE_RETRIES = 3;
const NETWORK_STOPPED_STATUSES = ['closed', 'stopped', 'undeploy', 'failure', 'failed', 'build_fail', 'unusual', 'abnormal'];

const EMPTY_CAPABILITIES = {
  gpu_supported: false,
  usb_supported: false,
  gpu_resources: [],
  usb_resources: []
};

const MANAGED_VM_ATTRIBUTE_CONFIG = {
  vm_gpu_enabled: {
    name: 'vm_gpu_enabled',
    save_type: 'string'
  },
  vm_gpu_resources: {
    name: 'vm_gpu_resources',
    save_type: 'json'
  },
  vm_gpu_count: {
    name: 'vm_gpu_count',
    save_type: 'string'
  },
  vm_usb_enabled: {
    name: 'vm_usb_enabled',
    save_type: 'string'
  },
  vm_usb_resources: {
    name: 'vm_usb_resources',
    save_type: 'json'
  }
};

const ACCELERATION_UPSERT_ORDER = [
  'vm_gpu_resources',
  'vm_gpu_count',
  'vm_gpu_enabled',
  'vm_usb_resources',
  'vm_usb_enabled'
];

const ACCELERATION_DELETE_ORDER = [
  'vm_gpu_enabled',
  'vm_gpu_count',
  'vm_gpu_resources',
  'vm_usb_enabled',
  'vm_usb_resources'
];

export class VMProfilePanel extends PureComponent {
  state = {
    editing: false,
    saving: false,
    loadingEditor: false,
    vmCapabilities: EMPTY_CAPABILITIES,
    currentAttributes: {},
    runtimeDraft: null,
    clusterIP: '',
    networkStatus: 'loading',
    fixedIPUpdating: false
  };
  networkRequestGeneration = 0;
  networkRetryAttempt = 0;
  networkFailureCount = 0;
  networkRetryTimer = null;

  includesNetworkSection = () => !['acceleration', 'connections'].includes(this.props.section);

  componentDidMount() {
    this.mounted = true;
    if (this.includesNetworkSection()) this.fetchClusterIP();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.vmProfile !== this.props.vmProfile &&
      this.state.runtimeDraft &&
      !this.state.editing
    ) {
      this.setState({
        runtimeDraft: null
      });
    }
    if (!this.includesNetworkSection()) {
      if (prevProps.section !== this.props.section) {
        this.invalidateNetworkRead();
      }
      return;
    }
    if (prevProps.section !== this.props.section || prevProps.serviceAlias !== this.props.serviceAlias ||
        (this.networkReadContext && !this.isNetworkContextCurrent(this.networkReadContext)) ||
        getVMNetworkRefreshKey(prevProps) !== getVMNetworkRefreshKey(this.props)) {
      this.fetchClusterIP();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.invalidateNetworkRead();
  }

  getSourceLabel = (sourceType) => {
    const sourceMap = {
      public: 'Vm.createVm.public',
      url: 'Vm.createVm.add',
      upload: 'Vm.createVm.upload',
      existing: 'Vm.createVm.have',
      clone: 'Vm.createVm.clone'
    };
    return formatMessage({ id: sourceMap[sourceType] || 'Vm.assetCatalog.sourceUnknown' });
  };

  getDisplayValue = value => {
    if (value === 0) {
      return '0';
    }
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    return String(value);
  };

  renderEllipsis = (content, className) => {
    const displayValue = this.getDisplayValue(content);
    return (
      <Tooltip title={displayValue}>
        <span className={className}>{displayValue}</span>
      </Tooltip>
    );
  };

  renderLine = (label, value) => (
    <div className={styles.profileLine}>
      {this.renderEllipsis(label, styles.profileLineLabel)}
      {this.renderEllipsis(value, styles.profileLineValue)}
    </div>
  );

  renderTagValue = (enabled, values = []) => {
    if (!enabled) {
      const disabledText = formatMessage({ id: 'componentOverview.body.tab.overview.vmDisabled' });
      return (
        <Tooltip title={disabledText}>
          <Tag className={styles.profileTag}>{disabledText}</Tag>
        </Tooltip>
      );
    }
    if (!values || values.length === 0) {
      const enabledText = formatMessage({ id: 'componentOverview.body.tab.overview.vmEnabled' });
      return (
        <Tooltip title={enabledText}>
          <Tag color="gold" className={styles.profileTag}>{enabledText}</Tag>
        </Tooltip>
      );
    }
    return values.map(item => (
      <Tooltip key={item} title={item}>
        <Tag color="blue" className={styles.profileTag}>{item}</Tag>
      </Tooltip>
    ));
  };

  getRuntime = () => {
    const { vmProfile = {} } = this.props;
    const runtime = vmProfile.runtime || {};
    return this.state.runtimeDraft || runtime;
  };

  getNetworkContext = () => ({
    teamName: globalUtil.getCurrTeamName(),
    regionName: globalUtil.getCurrRegionName(),
    appId: globalUtil.getAppID() || this.props.appGroupId || '',
    serviceAlias: this.props.serviceAlias
  });

  isNetworkContextCurrent = context => {
    const current = this.getNetworkContext();
    return ['teamName', 'regionName', 'appId', 'serviceAlias'].every(key => current[key] === context[key]);
  };

  clearNetworkRetry = () => {
    if (this.networkRetryTimer !== null) clearTimeout(this.networkRetryTimer);
    this.networkRetryTimer = null;
  };

  invalidateNetworkRead = () => {
    this.clearNetworkRetry();
    this.networkRequestGeneration += 1;
    this.networkReadContext = null;
    this.networkRetryAttempt = 0;
    this.networkFailureCount = 0;
  };

  scheduleNetworkRetry = (result, context, isCurrent) => {
    if (!isCurrent() || !['service-pending', 'read-failed'].includes(result.status) ||
        !context.teamName || !context.regionName || !context.serviceAlias) return;
    this.networkFailureCount = result.status === 'read-failed' ? this.networkFailureCount + 1 : 0;
    if (this.networkFailureCount > NETWORK_FAILURE_RETRIES ||
        (result.status === 'service-pending' && NETWORK_STOPPED_STATUSES.includes(getVMNetworkStatus(this.props)))) return;
    const delay = NETWORK_RETRY_DELAYS[Math.min(this.networkRetryAttempt++, NETWORK_RETRY_DELAYS.length - 1)];
    this.networkRetryTimer = setTimeout(() => {
      if (!isCurrent()) return undefined;
      this.networkRetryTimer = null;
      return this.fetchClusterIP({ automatic: true });
    }, delay);
  };

  fetchClusterIP = async (options = {}) => {
    if (!this.includesNetworkSection()) return;
    this.clearNetworkRetry();
    if (options?.automatic !== true) {
      this.networkRetryAttempt = 0;
      this.networkFailureCount = 0;
    }
    const context = this.getNetworkContext();
    const runtimeKey = getVMNetworkRefreshKey(this.props);
    const generation = ++this.networkRequestGeneration;
    this.networkReadContext = context;
    const isCurrent = () => this.mounted && this.includesNetworkSection() &&
      generation === this.networkRequestGeneration && this.isNetworkContextCurrent(context) &&
      runtimeKey === getVMNetworkRefreshKey(this.props);
    if (!isCurrent()) return;
    if (options?.automatic !== true) this.setState({ clusterIP: '', networkStatus: 'loading' });
    let result;
    try {
      result = await readVMInternalAddress(context, { getPorts, getNsResource }, isCurrent);
    } catch (_) {
      result = { clusterIP: '', status: 'read-failed' };
    }
    if (result && isCurrent()) {
      this.setState({ clusterIP: result.clusterIP, networkStatus: result.status });
      this.scheduleNetworkRetry(result, context, isCurrent);
    }
  };

  handleConfigurePorts = () => {
    const route = buildVMPortManagementRoute({ ...this.getNetworkContext(), refresh: globalUtil.getRefresh() });
    if (route && this.props.dispatch) this.props.dispatch(routerRedux.push(route));
  };

  renderInternalAddress = () => {
    const { clusterIP, networkStatus } = this.state;
    const statusKeys = {
      loading: 'vmNetworkLoading',
      'no-inner-ports': 'vmNetworkNoInnerPorts',
      'service-pending': 'vmNetworkServicePending',
      'read-failed': 'vmNetworkReadFailed'
    };
    const value = clusterIP || formatMessage({
      id: `componentOverview.body.tab.overview.${statusKeys[networkStatus] || 'vmNetworkServicePending'}`
    });
    const route = buildVMPortManagementRoute(this.getNetworkContext());
    return <div className={styles.internalAddress} aria-live="polite">
      {this.renderLine(formatMessage({ id: 'componentOverview.body.tab.overview.vmClusterIP' }), value)}
      <div className={styles.internalAddressActions}>
        <Button size="small" type="link" disabled={!route} onClick={this.handleConfigurePorts}>
          <FormattedMessage id="componentOverview.body.tab.overview.vmNetworkConfigurePorts" />
        </Button>
        {['service-pending', 'read-failed'].includes(networkStatus) && <Button size="small" type="link" onClick={this.fetchClusterIP}>
          <FormattedMessage id="componentOverview.body.tab.overview.vmNetworkRetry" />
        </Button>}
      </div>
    </div>;
  };

  getInitialFormValues = (runtime = this.getRuntime()) => ({
    gpu_enabled: !!runtime.gpu_enabled,
    gpu_resources: runtime.gpu_resources || [],
    gpu_count: runtime.gpu_count || 1,
    usb_enabled: !!runtime.usb_enabled,
    usb_resources: runtime.usb_resources || []
  });

  setFormValues = (runtime = this.getRuntime()) => {
    const { form } = this.props;
    form.setFieldsValue(this.getInitialFormValues(runtime));
  };

  getManagedAttributeMap = (attributes = []) => {
    return attributes.reduce((acc, item) => {
      if (!MANAGED_VM_ATTRIBUTE_CONFIG[item.name]) {
        return acc;
      }
      acc[item.name] = item;
      return acc;
    }, {});
  };

  getResourceOptions = (capabilityResources = [], currentResources = []) => {
    return Array.from(new Set([...(capabilityResources || []), ...(currentResources || [])]));
  };

  normalizeAttributeValue = (value) => {
    if (Array.isArray(value)) {
      return JSON.stringify([...(value || [])].sort());
    }
    return String(value == null ? '' : value);
  };

  ensureMutationSuccess = (response) => {
    const code = response?.response_data?.code || response?.code;
    if (code === 200) {
      return response;
    }
    const error = new Error('vm runtime attribute mutation failed');
    error.data = response?.response_data || response || {};
    throw error;
  };

  handleFixedIPChange = checked => {
    const { vmProfile = {} } = this.props;
    const network = vmProfile.network || {};
    const podIP = network.current_pod_ip || vmProfile.current_pod_ip || '';
    if (checked && !podIP) {
      notification.warning({
        message: formatMessage({ id: 'componentOverview.body.tab.overview.vmFixedIPNoPodIP' })
      });
      return;
    }
    Modal.confirm({
      title: formatMessage({
        id: checked
          ? 'componentOverview.body.tab.overview.vmFixedIPEnableTitle'
          : 'componentOverview.body.tab.overview.vmFixedIPDisableTitle'
      }),
      content: formatMessage({
        id: checked
          ? 'componentOverview.body.tab.overview.vmFixedIPEnableContent'
          : 'componentOverview.body.tab.overview.vmFixedIPDisableContent'
      }, { ip: podIP || network.fixed_ip || '-' }),
      okText: formatMessage({
        id: checked
          ? 'componentOverview.body.tab.overview.vmFixedIPEnableConfirm'
          : 'componentOverview.body.tab.overview.vmFixedIPDisableConfirm'
      }),
      cancelText: formatMessage({ id: 'componentOverview.body.tab.overview.vmCancelEdit' }),
      onOk: () => this.submitFixedIPChange(checked)
    });
  };

  submitFixedIPChange = async enabled => {
    const { serviceAlias, onRefresh } = this.props;
    this.setState({ fixedIPUpdating: true });
    try {
      await setVMFixedPodIP({
        team_name: globalUtil.getCurrTeamName(),
        app_alias: serviceAlias,
        enabled
      }, handleAPIError);
      notification.success({
        message: formatMessage({
          id: enabled
            ? 'componentOverview.body.tab.overview.vmFixedIPEnableSuccess'
            : 'componentOverview.body.tab.overview.vmFixedIPDisableSuccess'
        })
      });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      handleAPIError(err);
    } finally {
      if (this.mounted) {
        this.setState({ fixedIPUpdating: false });
      }
    }
  };

  refreshProfile = async () => {
    const { onRefresh } = this.props;
    if (!onRefresh) {
      return null;
    }
    return onRefresh();
  };

  handleEdit = async () => {
    const { serviceAlias } = this.props;
    if (!serviceAlias || this.state.loadingEditor || this.state.saving) {
      return;
    }
    this.setState({
      loadingEditor: true
    });
    try {
      const [capabilityRes, attributeRes] = await Promise.all([
        getVMCapabilities({
          team_name: globalUtil.getCurrTeamName()
        }),
        getKubernetes({
          team_name: globalUtil.getCurrTeamName(),
          service_alias: serviceAlias
        })
      ]);
      const vmCapabilities = (capabilityRes && capabilityRes.bean) || EMPTY_CAPABILITIES;
      const currentAttributes = this.getManagedAttributeMap((attributeRes && attributeRes.list) || []);
      this.setState(
        {
          editing: true,
          loadingEditor: false,
          vmCapabilities,
          currentAttributes
        },
        () => {
          this.setFormValues();
        }
      );
    } catch (err) {
      this.setState({
        loadingEditor: false
      });
      handleAPIError(err);
    }
  };

  handleCancel = () => {
    this.setState(
      {
        editing: false,
        loadingEditor: false
      },
      () => {
        this.setFormValues();
      }
    );
  };

  validateRuntimeResources = (enabledField, messageId) => (_, value, callback) => {
    const { form } = this.props;
    if (!form.getFieldValue(enabledField)) {
      callback();
      return;
    }
    if (value && value.length > 0) {
      callback();
      return;
    }
    callback(new Error(formatMessage({ id: messageId })));
  };

  validateGPUCount = (_, value, callback) => {
    const { form } = this.props;
    if (!form.getFieldValue('gpu_enabled')) {
      callback();
      return;
    }
    const gpuResources = form.getFieldValue('gpu_resources') || [];
    const gpuCount = Number(value);
    if (!gpuCount || gpuCount < 1) {
      callback(new Error(formatMessage({ id: 'Vm.createVm.gpuCountRequired' })));
      return;
    }
    if (gpuCount > 1 && gpuResources.length > 1) {
      callback(
        new Error(formatMessage({ id: 'Vm.createVm.gpuCountSingleResourceOnly' }))
      );
      return;
    }
    callback();
  };

  buildDesiredAttributes = (fieldsValue) => {
    const attrs = {};
    if (fieldsValue.gpu_enabled) {
      attrs.vm_gpu_enabled = {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_gpu_enabled,
        attribute_value: 'true'
      };
      attrs.vm_gpu_resources = {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_gpu_resources,
        attribute_value: fieldsValue.gpu_resources || []
      };
      attrs.vm_gpu_count = {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_gpu_count,
        attribute_value: String(Number(fieldsValue.gpu_count) || 1)
      };
    }
    if (fieldsValue.usb_enabled) {
      attrs.vm_usb_enabled = {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_usb_enabled,
        attribute_value: 'true'
      };
      attrs.vm_usb_resources = {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_usb_resources,
        attribute_value: fieldsValue.usb_resources || []
      };
    }
    return attrs;
  };

  buildOperations = (currentAttributes, desiredAttributes, upsertOrder, deleteOrder = []) => {
    const operations = [];

    upsertOrder.forEach(name => {
      const current = currentAttributes[name];
      const desired = desiredAttributes[name];
      if (!desired) {
        return;
      }
      if (!current) {
        operations.push({
          type: 'create',
          name,
          attribute: desired
        });
        return;
      }
      if (
        current.save_type !== desired.save_type ||
        this.normalizeAttributeValue(current.attribute_value) !== this.normalizeAttributeValue(desired.attribute_value)
      ) {
        operations.push({
          type: 'update',
          name,
          attribute: desired
        });
      }
    });

    deleteOrder.forEach(name => {
      if (!currentAttributes[name] || desiredAttributes[name]) {
        return;
      }
      operations.push({
        type: 'delete',
        name
      });
    });

    return operations;
  };

  executeOperation = async (operation) => {
    const { serviceAlias } = this.props;
    const basePayload = {
      team_name: globalUtil.getCurrTeamName(),
      service_alias: serviceAlias
    };
    if (operation.type === 'create') {
      return this.ensureMutationSuccess(
        await addKubernetes({
          ...basePayload,
          attribute: operation.attribute
        })
      );
    }
    if (operation.type === 'update') {
      return this.ensureMutationSuccess(
        await editKubernetes({
          ...basePayload,
          value_name: operation.name,
          attribute: operation.attribute
        })
      );
    }
    return this.ensureMutationSuccess(
      await deleteKubernetes({
        ...basePayload,
        value_name: operation.name
      })
    );
  };

  handleSave = () => {
    const { form } = this.props;
    const { currentAttributes } = this.state;
    form.validateFields(async (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({
        saving: true
      });
      try {
        const desiredAttributes = this.buildDesiredAttributes(fieldsValue);
        const operations = this.buildOperations(
          currentAttributes,
          desiredAttributes,
          ACCELERATION_UPSERT_ORDER,
          ACCELERATION_DELETE_ORDER
        );
        for (let i = 0; i < operations.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await this.executeOperation(operations[i]);
        }
        const runtimeDraft = {
          ...this.getRuntime(),
          ...this.getInitialFormValues(fieldsValue)
        };
        this.setState(
          {
            editing: false,
            saving: false,
            currentAttributes: desiredAttributes,
            runtimeDraft
          },
          () => {
            notification.success({
              message: formatMessage({ id: 'componentOverview.body.tab.overview.vmRuntimeSaveSuccess' })
            });
          }
        );
        try {
          await this.refreshProfile();
        } catch (refreshError) {
          handleAPIError(refreshError);
        }
      } catch (saveError) {
        try {
          await this.refreshProfile();
        } catch (refreshError) {
          handleAPIError(refreshError);
        }
        this.setState({
          editing: false,
          saving: false,
          currentAttributes: {},
          runtimeDraft: null
        });
        notification.error({
          message: formatMessage({ id: 'componentOverview.body.tab.overview.vmRuntimeSaveFailed' })
        });
        handleAPIError(saveError);
      }
    });
  };

  renderEditor = (runtime) => {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    const { vmCapabilities } = this.state;
    const gpuEnabled = !!form.getFieldValue('gpu_enabled');
    const usbEnabled = !!form.getFieldValue('usb_enabled');
    const gpuResources = this.getResourceOptions(vmCapabilities.gpu_resources, runtime.gpu_resources);
    const usbResources = this.getResourceOptions(vmCapabilities.usb_resources, runtime.usb_resources);
    const canToggleGPU = vmCapabilities.gpu_supported || !!runtime.gpu_enabled;
    const canToggleUSB = vmCapabilities.usb_supported || !!runtime.usb_enabled;

    return (
      <Form layout="vertical">
        <Form.Item style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{formatMessage({ id: 'Vm.createVm.gpu' })}</span>
            {getFieldDecorator('gpu_enabled', {
              valuePropName: 'checked',
              initialValue: !!runtime.gpu_enabled
            })(
              <Switch disabled={!canToggleGPU && !gpuEnabled} />
            )}
          </div>
        </Form.Item>
        {gpuEnabled ? (
          <React.Fragment>
            <Form.Item label={formatMessage({ id: 'Vm.createVm.gpuResources' })}>
              {getFieldDecorator('gpu_resources', {
                initialValue: runtime.gpu_resources || [],
                rules: [
                  {
                    validator: this.validateRuntimeResources(
                      'gpu_enabled',
                      'Vm.createVm.gpuResourcesRequired'
                    )
                  }
                ]
              })(
                <Select
                  mode="multiple"
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'Vm.createVm.gpuResourcesPlaceholder' })}
                >
                  {gpuResources.map(resource => (
                    <Option key={resource} value={resource}>
                      {resource}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'Vm.createVm.gpuCount' })}>
              {getFieldDecorator('gpu_count', {
                initialValue: runtime.gpu_count || 1,
                rules: [{ validator: this.validateGPUCount }]
              })(
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: '100%' }}
                />
              )}
            </Form.Item>
          </React.Fragment>
        ) : null}

        <Form.Item style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{formatMessage({ id: 'Vm.createVm.usb' })}</span>
            {getFieldDecorator('usb_enabled', {
              valuePropName: 'checked',
              initialValue: !!runtime.usb_enabled
            })(
              <Switch disabled={!canToggleUSB && !usbEnabled} />
            )}
          </div>
        </Form.Item>
        {usbEnabled ? (
          <Form.Item label={formatMessage({ id: 'Vm.createVm.usbResources' })}>
            {getFieldDecorator('usb_resources', {
              initialValue: runtime.usb_resources || [],
              rules: [
                {
                  validator: this.validateRuntimeResources(
                    'usb_enabled',
                    'Vm.createVm.usbResourcesRequired'
                  )
                }
              ]
            })(
              <Select
                mode="multiple"
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'Vm.createVm.usbResourcesPlaceholder' })}
              >
                {usbResources.map(resource => (
                  <Option key={resource} value={resource}>
                    {resource}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        ) : null}

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message={formatMessage({ id: 'componentOverview.body.tab.overview.vmRuntimeSaveTip' })}
        />
      </Form>
    );
  };

  renderAssetCard = (standalone = false) => {
    const asset = this.props.vmProfile?.asset || {};
    return (
      <Card
        title={<FormattedMessage id="componentOverview.body.tab.overview.vmAssetInfo" />}
        bordered={standalone}
        className={standalone ? `${styles.profileCard} ${styles.sectionPanel}` : styles.profileCard}
        bodyStyle={{ flex: 1 }}
      >
        <div className={styles.profileCardContent}>
          {this.renderLine(formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetName' }), asset.display_name || asset.name)}
          {this.renderLine(
            formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetSource' }),
            this.getSourceLabel(asset.source_type)
          )}
          {this.renderLine(
            formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetArchFormat' }),
            `${asset.arch || '-'} / ${asset.format || '-'}`
          )}
          {asset.source_asset && this.renderLine(
            formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetParent' }),
            asset.source_asset.name
          )}
        </div>
      </Card>
    );
  };

  renderNetworkCard = (standalone = false) => {
    const { vmProfile = {} } = this.props;
    const network = vmProfile.network || {};
    const podIp = network.current_pod_ip || vmProfile.current_pod_ip || '';
    const fixedIPEnabled = !!network.fixed_ip_enabled;
    const fixedIP = fixedIPEnabled ? network.fixed_ip || podIp : '';
    const { clusterIP } = this.state;
    return (
      <Card
        title={<span>
          {this.props.networkTitle || <FormattedMessage id="componentOverview.body.tab.overview.vmNetworkInfo" />}
          <Tooltip trigger={['hover', 'focus']} title={formatMessage({ id: 'componentOverview.body.tab.overview.vmNetworkInfoHelp' })}>
            <span className={styles.networkHelp} role="button" tabIndex={0} aria-label={formatMessage({ id: 'componentOverview.body.tab.overview.vmNetworkInfoHelpLabel' })}><Icon type="question-circle" /></span>
          </Tooltip>
        </span>}
        bordered={standalone}
        className={standalone ? `${styles.profileCard} ${styles.sectionPanel}` : styles.profileCard}
        bodyStyle={{ flex: 1 }}
      >
        <div className={styles.profileCardContent}>
          {this.renderInternalAddress()}
          {podIp ? this.renderLine(
            formatMessage({ id: 'componentOverview.body.tab.overview.vmPodIP' }),
            podIp
          ) : null}
          {fixedIPEnabled ? this.renderLine(
            formatMessage({ id: 'componentOverview.body.tab.overview.vmFixedIP' }),
            fixedIP
          ) : null}
          <div className={styles.networkAction}>
            <span className={styles.networkActionLabel}>
              <FormattedMessage id="componentOverview.body.tab.overview.vmFixedIPSwitch" />
            </span>
            <Switch
              checked={fixedIPEnabled}
              loading={this.state.fixedIPUpdating}
              disabled={!podIp && !fixedIPEnabled}
              onChange={this.handleFixedIPChange}
            />
          </div>
          {!clusterIP && (
            <div className={styles.profileTip}>
              <FormattedMessage
                id={
                  fixedIPEnabled
                    ? 'componentOverview.body.tab.overview.vmFixedIPNetworkTip'
                    : 'componentOverview.body.tab.overview.vmNetworkTip'
                }
              />
            </div>
          )}
          {standalone && this.props.includeConnections && <div className={styles.networkConnections}>
            {this.renderVncAction()}
            {this.renderConnectionDetails()}
          </div>}
        </div>
      </Card>
    );
  };

  renderAccelerationCard = (standalone = false) => {
    const { editing, saving, loadingEditor } = this.state;
    const runtime = this.getRuntime();
    return (
      <Card
        title={<FormattedMessage id="componentOverview.body.tab.overview.vmAccelerationInfo" />}
        bordered={standalone}
        loading={loadingEditor}
        className={standalone ? `${styles.profileCard} ${styles.sectionPanel}` : styles.profileCard}
        bodyStyle={{ flex: 1 }}
        extra={
          editing ? (
            <div>
              <Button
                size="small"
                style={{ marginRight: 8 }}
                onClick={this.handleCancel}
                disabled={saving}
              >
                {formatMessage({ id: 'componentOverview.body.tab.overview.vmCancelEdit' })}
              </Button>
              <Button
                size="small"
                type="primary"
                loading={saving}
                onClick={this.handleSave}
              >
                {formatMessage({ id: 'componentOverview.body.tab.overview.vmSaveConfig' })}
              </Button>
            </div>
          ) : (
            <Button size="small" onClick={this.handleEdit} loading={loadingEditor}>
              {formatMessage({ id: 'componentOverview.body.tab.overview.vmEditConfig' })}
            </Button>
          )
        }
      >
        <div className={styles.profileCardContent}>
          {editing ? (
            this.renderEditor(runtime)
          ) : (
            <React.Fragment>
              <div className={styles.profileSection}>
                <div className={styles.profileSectionLabel}>
                  <FormattedMessage id="componentOverview.body.tab.overview.vmGpu" />
                </div>
                <div className={styles.profileTagGroup}>{this.renderTagValue(runtime.gpu_enabled, runtime.gpu_resources)}</div>
              </div>
              <div>
                <div className={styles.profileSectionLabel}>
                  <FormattedMessage id="componentOverview.body.tab.overview.vmUsb" />
                </div>
                <div className={styles.profileTagGroup}>{this.renderTagValue(runtime.usb_enabled, runtime.usb_resources)}</div>
              </div>
            </React.Fragment>
          )}
        </div>
      </Card>
    );
  };

  renderVncAction = () => {
    if (this.props.connectionUnavailableMessage) return null;
    const connections = this.props.vmProfile?.connections || {};
    return connections.vnc_url ? (
      <Button type="primary" size="small" href={connections.vnc_url} target="_blank">
        {formatMessage({ id: 'componentOverview.body.tab.overview.vmOpenVnc' })}
      </Button>
    ) : null;
  };

  renderConnectionDetails = () => {
    const asset = this.props.vmProfile?.asset || {};
    const connections = this.props.vmProfile?.connections || {};
    const { connectionUnavailableMessage } = this.props;
    return <div className={styles.profileCardContent}>
      {this.renderLine(
        formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetReferences' }),
        asset.reference_count
      )}
      {connectionUnavailableMessage || !connections.vnc_url ? (
        <div className={styles.profileCardAction}>
          <Tag>{connectionUnavailableMessage || <FormattedMessage id="componentOverview.body.tab.overview.vmConnectionPending" />}</Tag>
        </div>
      ) : null}
    </div>;
  };

  renderConnectionsCard = (standalone = false) => {
    return (
      <Card
        title={<FormattedMessage id="componentOverview.body.tab.overview.vmConnectionInfo" />}
        bordered={standalone}
        className={standalone ? `${styles.profileCard} ${styles.sectionPanel}` : styles.profileCard}
        bodyStyle={{ flex: 1 }}
        extra={this.renderVncAction()}
      >
        {this.renderConnectionDetails()}
      </Card>
    );
  };

  render() {
    if (this.props.section === 'network') return this.renderNetworkCard(true);
    if (this.props.section === 'acceleration') return this.renderAccelerationCard(true);
    if (this.props.section === 'connections') return this.renderConnectionsCard(true);
    return (
      <Card
        title={<FormattedMessage id="componentOverview.body.tab.overview.vmProfile" />}
        className={styles.profilePanel}
      >
        <Row gutter={12} type="flex">
          <Col xs={24} lg={12} className={styles.profileCol}>{this.renderAssetCard()}</Col>
          <Col xs={24} lg={12} className={styles.profileCol}>{this.renderNetworkCard()}</Col>
        </Row>
        <Row gutter={12} type="flex" className={styles.profileRow}>
          <Col xs={24} lg={12} className={styles.profileCol}>{this.renderAccelerationCard()}</Col>
          <Col xs={24} lg={12} className={styles.profileCol}>{this.renderConnectionsCard()}</Col>
        </Row>
      </Card>
    );
  }
}

export default Form.create()(connect(({ appControl }, ownProps) => {
  const detail = appControl?.appDetail;
  const service = detail?.service;
  return {
    appGroupId: service?.service_alias === ownProps.serviceAlias ? detail.group_id || service.group_id : ''
  };
})(VMProfilePanel));

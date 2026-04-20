import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Switch, Tag, notification } from 'antd';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { addKubernetes, deleteKubernetes, editKubernetes, getKubernetes } from '../../../../services/app';
import { getVMCapabilities } from '../../../../services/createApp';
import handleAPIError from '../../../../utils/error';
import globalUtil from '../../../../utils/global';

const { Option } = Select;

const EMPTY_CAPABILITIES = {
  gpu_supported: false,
  usb_supported: false,
  gpu_resources: [],
  usb_resources: []
};

const MANAGED_VM_ATTRIBUTE_CONFIG = {
  vm_network_mode: {
    name: 'vm_network_mode',
    save_type: 'string'
  },
  vm_network_name: {
    name: 'vm_network_name',
    save_type: 'string'
  },
  vm_fixed_ip: {
    name: 'vm_fixed_ip',
    save_type: 'string'
  },
  vm_gateway: {
    name: 'vm_gateway',
    save_type: 'string'
  },
  vm_dns_servers: {
    name: 'vm_dns_servers',
    save_type: 'string'
  },
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

const NETWORK_UPSERT_ORDER = [
  'vm_network_mode',
  'vm_network_name',
  'vm_fixed_ip',
  'vm_gateway',
  'vm_dns_servers'
];

const NETWORK_FORM_FIELDS = ['fixed_ip'];

class VMProfilePanel extends PureComponent {
  state = {
    editing: false,
    editingNetwork: false,
    saving: false,
    savingNetwork: false,
    loadingEditor: false,
    loadingNetworkEditor: false,
    vmCapabilities: EMPTY_CAPABILITIES,
    currentAttributes: {},
    currentNetworkAttributes: {},
    runtimeDraft: null
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.vmProfile !== this.props.vmProfile &&
      this.state.runtimeDraft &&
      !this.state.editing &&
      !this.state.editingNetwork
    ) {
      this.setState({
        runtimeDraft: null
      });
    }
  }

  getSourceLabel = (sourceType) => {
    const sourceMap = {
      public: 'Vm.createVm.public',
      url: 'Vm.createVm.add',
      upload: 'Vm.createVm.upload',
      existing: 'Vm.createVm.have',
      clone: 'Vm.createVm.clone',
      vm_export: 'Vm.export.sourceLabel'
    };
    return formatMessage({ id: sourceMap[sourceType] || 'Vm.assetCatalog.sourceUnknown' });
  };

  renderLine = (label, value) => (
    <div style={{ display: 'flex', marginBottom: 10 }}>
      <div style={{ width: 110, color: '#8d9bad' }}>{label}</div>
      <div style={{ flex: 1, wordBreak: 'break-all' }}>{value === 0 ? '0' : value || '-'}</div>
    </div>
  );

  renderTagValue = (enabled, values = []) => {
    if (!enabled) {
      return <Tag><FormattedMessage id="componentOverview.body.tab.overview.vmDisabled" /></Tag>;
    }
    if (!values || values.length === 0) {
      return <Tag color="gold"><FormattedMessage id="componentOverview.body.tab.overview.vmEnabled" /></Tag>;
    }
    return values.map(item => (
      <Tag key={item} color="blue">{item}</Tag>
    ));
  };

  getRuntime = () => {
    const { vmProfile = {} } = this.props;
    const runtime = vmProfile.runtime || {};
    return this.state.runtimeDraft || runtime;
  };

  getCurrentPodIP = () => {
    const { vmProfile = {} } = this.props;
    return vmProfile.current_pod_ip || '';
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

  getInitialNetworkFormValues = (runtime = this.getRuntime()) => ({
    fixed_ip: runtime.fixed_ip || this.getCurrentPodIP() || undefined
  });

  setNetworkFormValues = (runtime = this.getRuntime()) => {
    const { form } = this.props;
    form.setFieldsValue(this.getInitialNetworkFormValues(runtime));
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
          editingNetwork: false,
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

  handleEditNetwork = async () => {
    const { serviceAlias } = this.props;
    if (!serviceAlias || this.state.loadingNetworkEditor || this.state.savingNetwork) {
      return;
    }
    this.setState({
      loadingNetworkEditor: true
    });
    try {
      const attributeRes = await getKubernetes({
        team_name: globalUtil.getCurrTeamName(),
        service_alias: serviceAlias
      });
      const currentNetworkAttributes = this.getManagedAttributeMap((attributeRes && attributeRes.list) || []);
      this.setState(
        {
          editing: false,
          editingNetwork: true,
          loadingNetworkEditor: false,
          currentNetworkAttributes
        },
        () => {
          this.setNetworkFormValues();
        }
      );
    } catch (err) {
      this.setState({
        loadingNetworkEditor: false
      });
      handleAPIError(err);
    }
  };

  handleCancelNetwork = () => {
    this.setState(
      {
        editingNetwork: false,
        loadingNetworkEditor: false
      },
      () => {
        this.setNetworkFormValues();
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

  buildDesiredNetworkAttributes = (fieldsValue) => {
    const fixedIP = String(fieldsValue.fixed_ip || '').trim();
    return {
      vm_network_mode: {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_network_mode,
        attribute_value: 'fixed'
      },
      vm_network_name: {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_network_name,
        attribute_value: ''
      },
      vm_fixed_ip: {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_fixed_ip,
        attribute_value: fixedIP
      },
      vm_gateway: {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_gateway,
        attribute_value: ''
      },
      vm_dns_servers: {
        ...MANAGED_VM_ATTRIBUTE_CONFIG.vm_dns_servers,
        attribute_value: ''
      }
    };
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

  handleSaveNetwork = () => {
    const { form } = this.props;
    const { currentNetworkAttributes } = this.state;
    form.validateFields(NETWORK_FORM_FIELDS, async (err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({
        savingNetwork: true
      });
      try {
        const desiredAttributes = this.buildDesiredNetworkAttributes(fieldsValue);
        const operations = this.buildOperations(
          currentNetworkAttributes,
          desiredAttributes,
          NETWORK_UPSERT_ORDER
        );
        for (let i = 0; i < operations.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await this.executeOperation(operations[i]);
        }
        const runtimeDraft = {
          ...this.getRuntime(),
          network_mode: 'fixed',
          network_name: '',
          fixed_ip: String(fieldsValue.fixed_ip || '').trim(),
          gateway: '',
          dns_servers: ''
        };
        this.setState(
          {
            editingNetwork: false,
            savingNetwork: false,
            currentNetworkAttributes: desiredAttributes,
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
          editingNetwork: false,
          savingNetwork: false,
          currentNetworkAttributes: {},
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

  renderNetworkEditor = () => {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    const currentPodIP = this.getCurrentPodIP();

    return (
      <Form layout="vertical">
        <Form.Item label={formatMessage({ id: 'componentOverview.body.tab.overview.vmCurrentPodIP' })}>
          <div>{currentPodIP || '-'}</div>
        </Form.Item>
        <Form.Item label={formatMessage({ id: 'componentOverview.body.tab.overview.vmFixedIP' })}>
          {getFieldDecorator('fixed_ip', {
            initialValue: this.getInitialNetworkFormValues().fixed_ip,
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'Vm.createVm.fixedIPPlaceholder' })
              }
            ]
          })(
            <Input
              placeholder={formatMessage({ id: 'Vm.createVm.fixedIPPlaceholder' })}
            />
          )}
        </Form.Item>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message={formatMessage({ id: 'componentOverview.body.tab.overview.vmCurrentPodIPTip' })}
        />
      </Form>
    );
  };

  render() {
    const { vmProfile = {} } = this.props;
    const {
      editing,
      editingNetwork,
      saving,
      savingNetwork,
      loadingEditor,
      loadingNetworkEditor
    } = this.state;
    const asset = vmProfile.asset || {};
    const runtime = this.getRuntime();
    const latestExport = vmProfile.latest_export || {};
    const connections = vmProfile.connections || {};
    const currentPodIP = this.getCurrentPodIP();
    const canEditNetwork = !!(currentPodIP || runtime.fixed_ip);
    const networkActionText = runtime.fixed_ip
      ? 'componentOverview.body.tab.overview.vmUpdateFixedIP'
      : 'componentOverview.body.tab.overview.vmFixCurrentIP';
    const overviewColStyle = { display: 'flex' };
    const overviewCardStyle = {
      width: '100%',
      height: '100%',
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column'
    };
    const overviewCardBodyStyle = {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    };
    const overviewCardContentStyle = {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    };
    const overviewCardActionStyle = {
      marginTop: 'auto',
      paddingTop: 12
    };

    return (
      <Card
        title={<FormattedMessage id="componentOverview.body.tab.overview.vmProfile" />}
        style={{ margin: '12px 0', borderRadius: 12, overflow: 'hidden' }}
        bodyStyle={{ background: '#F0F2F5' }}
      >
        <Row gutter={16} type="flex">
          <Col xs={24} lg={12} style={overviewColStyle}>
            <Card
              title={<FormattedMessage id="componentOverview.body.tab.overview.vmAssetInfo" />}
              bordered={false}
              style={overviewCardStyle}
              bodyStyle={overviewCardBodyStyle}
            >
              <div style={overviewCardContentStyle}>
                {this.renderLine(formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetName' }), asset.display_name || asset.name)}
                {this.renderLine(
                  formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetSource' }),
                  this.getSourceLabel(asset.source_type)
                )}
                {this.renderLine(formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetStatus' }), asset.status)}
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
          </Col>
          <Col xs={24} lg={12} style={overviewColStyle}>
            <Card
              title={<FormattedMessage id="componentOverview.body.tab.overview.vmNetworkInfo" />}
              bordered={false}
              loading={loadingNetworkEditor}
              style={overviewCardStyle}
              bodyStyle={overviewCardBodyStyle}
              extra={
                editingNetwork ? (
                  <div>
                    <Button
                      size="small"
                      style={{ marginRight: 8 }}
                      onClick={this.handleCancelNetwork}
                      disabled={savingNetwork}
                    >
                      {formatMessage({ id: 'componentOverview.body.tab.overview.vmCancelEdit' })}
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      loading={savingNetwork}
                      onClick={this.handleSaveNetwork}
                    >
                      {formatMessage({ id: 'componentOverview.body.tab.overview.vmSaveConfig' })}
                    </Button>
                  </div>
                ) : canEditNetwork ? (
                  <Button size="small" onClick={this.handleEditNetwork} loading={loadingNetworkEditor}>
                    {formatMessage({ id: networkActionText })}
                  </Button>
                ) : null
              }
            >
              <div style={overviewCardContentStyle}>
                {editingNetwork ? (
                  this.renderNetworkEditor(runtime)
                ) : (
                  <React.Fragment>
                    {this.renderLine(
                      formatMessage({ id: 'componentOverview.body.tab.overview.vmNetworkMode' }),
                      runtime.network_mode || '-'
                    )}
                    {this.renderLine(
                      formatMessage({ id: 'componentOverview.body.tab.overview.vmNetworkName' }),
                      runtime.network_name
                    )}
                    {this.renderLine(
                      formatMessage({ id: 'componentOverview.body.tab.overview.vmCurrentPodIP' }),
                      currentPodIP
                    )}
                    {this.renderLine(
                      formatMessage({ id: 'componentOverview.body.tab.overview.vmFixedIP' }),
                      runtime.fixed_ip
                    )}
                    {this.renderLine(
                      formatMessage({ id: 'Vm.createVm.gateway' }),
                      runtime.gateway
                    )}
                    {this.renderLine(
                      formatMessage({ id: 'Vm.createVm.dnsServers' }),
                      runtime.dns_servers
                    )}
                    {this.renderLine(
                      formatMessage({ id: 'componentOverview.body.tab.overview.vmBootMode' }),
                      runtime.boot_mode
                    )}
                  </React.Fragment>
                )}
              </div>
            </Card>
          </Col>
        </Row>
        <Row gutter={16} type="flex" style={{ marginTop: 16 }}>
          <Col xs={24} lg={12} style={overviewColStyle}>
            <Card
              title={<FormattedMessage id="componentOverview.body.tab.overview.vmAccelerationInfo" />}
              bordered={false}
              loading={loadingEditor}
              style={overviewCardStyle}
              bodyStyle={overviewCardBodyStyle}
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
              <div style={overviewCardContentStyle}>
                {editing ? (
                  this.renderEditor(runtime)
                ) : (
                  <React.Fragment>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ color: '#8d9bad', marginBottom: 8 }}>
                        <FormattedMessage id="componentOverview.body.tab.overview.vmGpu" />
                      </div>
                      <div>{this.renderTagValue(runtime.gpu_enabled, runtime.gpu_resources)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#8d9bad', marginBottom: 8 }}>
                        <FormattedMessage id="componentOverview.body.tab.overview.vmUsb" />
                      </div>
                      <div>{this.renderTagValue(runtime.usb_enabled, runtime.usb_resources)}</div>
                    </div>
                  </React.Fragment>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12} style={overviewColStyle}>
            <Card
              title={<FormattedMessage id="componentOverview.body.tab.overview.vmConnectionInfo" />}
              bordered={false}
              style={overviewCardStyle}
              bodyStyle={overviewCardBodyStyle}
            >
              <div style={overviewCardContentStyle}>
                {this.renderLine(
                  formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetReferences' }),
                  asset.reference_count
                )}
                {this.renderLine(
                  formatMessage({ id: 'Vm.export.latest' }),
                  latestExport.name ? `${latestExport.display_name || latestExport.name} / ${latestExport.status || '-'}` : '-'
                )}
                <div style={overviewCardActionStyle}>
                  {connections.vnc_url ? (
                    <Button type="primary" size="small" href={connections.vnc_url} target="_blank">
                      {formatMessage({ id: 'componentOverview.body.tab.overview.vmOpenVnc' })}
                    </Button>
                  ) : (
                    <Tag><FormattedMessage id="componentOverview.body.tab.overview.vmConnectionPending" /></Tag>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  }
}

export default Form.create()(VMProfilePanel);

import { Button, Card, Col, Row, Tag } from 'antd';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

class VMProfilePanel extends PureComponent {
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

  render() {
    const { vmProfile = {} } = this.props;
    const asset = vmProfile.asset || {};
    const runtime = vmProfile.runtime || {};
    const latestExport = vmProfile.latest_export || {};
    const connections = vmProfile.connections || {};

    return (
      <Card
        title={<FormattedMessage id="componentOverview.body.tab.overview.vmProfile" />}
        style={{ margin: '12px 0', borderRadius: 12, overflow: 'hidden' }}
        bodyStyle={{ background: '#F0F2F5' }}
      >
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title={<FormattedMessage id="componentOverview.body.tab.overview.vmAssetInfo" />} bordered={false}>
              {this.renderLine(formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetName' }), asset.name)}
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
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<FormattedMessage id="componentOverview.body.tab.overview.vmNetworkInfo" />} bordered={false}>
              {this.renderLine(
                formatMessage({ id: 'componentOverview.body.tab.overview.vmNetworkMode' }),
                runtime.network_mode || '-'
              )}
              {this.renderLine(
                formatMessage({ id: 'componentOverview.body.tab.overview.vmNetworkName' }),
                runtime.network_name
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
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title={<FormattedMessage id="componentOverview.body.tab.overview.vmAccelerationInfo" />} bordered={false}>
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
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<FormattedMessage id="componentOverview.body.tab.overview.vmConnectionInfo" />} bordered={false}>
              {this.renderLine(
                formatMessage({ id: 'componentOverview.body.tab.overview.vmAssetReferences' }),
                asset.reference_count
              )}
              {this.renderLine(
                formatMessage({ id: 'Vm.export.latest' }),
                latestExport.name ? `${latestExport.name} / ${latestExport.status || '-'}` : '-'
              )}
              <div style={{ marginTop: 12 }}>
                {connections.vnc_url ? (
                  <Button type="primary" size="small" href={connections.vnc_url} target="_blank">
                    {formatMessage({ id: 'componentOverview.body.tab.overview.vmOpenVnc' })}
                  </Button>
                ) : (
                  <Tag><FormattedMessage id="componentOverview.body.tab.overview.vmConnectionPending" /></Tag>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  }
}

export default VMProfilePanel;

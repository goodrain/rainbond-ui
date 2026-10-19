import { Alert, Button, Descriptions, Empty, Input, Modal, Skeleton, Spin, Tag } from 'antd';
import moment from 'moment';
import React, { PureComponent } from 'react';
import overviewData from '../overviewData';
import styles from '../index.less';

export default class PlatformInfoModal extends PureComponent {
  state = {
    editing: false,
    authorizationCode: '',
    validationError: ''
  };

  componentDidUpdate(prevProps) {
    if (prevProps.visible && !this.props.visible) {
      this.setState({ editing: false, authorizationCode: '', validationError: '' });
    }
  }

  toggleEditor = () => {
    this.setState(state => ({
      editing: !state.editing,
      authorizationCode: '',
      validationError: ''
    }));
  };

  handleCodeChange = event => {
    this.setState({ authorizationCode: event.target.value, validationError: '' });
  };

  submitLicense = () => {
    const authorizationCode = this.state.authorizationCode.trim();
    if (!authorizationCode) {
      this.setState({ validationError: this.props.labels.authorizationRequired });
      return;
    }
    this.props.onUpdateLicense(authorizationCode, succeeded => {
      if (succeeded) {
        this.setState({ editing: false, authorizationCode: '', validationError: '' });
      }
    });
  };

  renderLicenseContent() {
    const { labels, license, requestStatus, requestError } = this.props;
    const plugins = (license && license.plugins) || [];
    const licenseStatus = overviewData.licenseState(license);
    if (!license && (requestStatus === 'idle' || requestStatus === 'loading')) {
      return <Skeleton active paragraph={{ rows: 3 }} />;
    }
    if (!license && requestStatus === 'error') {
      return <Alert type="warning" showIcon message={labels.licenseUnavailable} />;
    }
    if (requestStatus === 'empty') {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={labels.noLicense} />;
    }
    if (requestStatus === 'invalid') {
      return (
        <Alert
          type="error"
          showIcon
          message={labels.invalidLicense}
          description={requestError || labels.invalidReasonUnknown}
        />
      );
    }
    if (!license) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={labels.noLicense} />;
    }
    return (
      <React.Fragment>
        {requestStatus === 'error' ? (
          <Alert
            className={styles.licenseStatus}
            type="warning"
            showIcon
            message={labels.licenseUnavailable}
          />
        ) : null}
        <Alert
          className={styles.licenseStatus}
          type={licenseStatus.valid ? 'success' : 'error'}
          showIcon
          message={licenseStatus.valid ? labels.validLicense : labels.invalidLicense}
          description={licenseStatus.valid ? null : licenseStatus.reason || labels.invalidReasonUnknown}
        />
        <Descriptions column={3} size="small">
          <Descriptions.Item label={labels.company}>{license.company || '-'}</Descriptions.Item>
          <Descriptions.Item label={labels.expireAt}>
            {licenseStatus.valid
              ? licenseStatus.expireAt
                ? moment.unix(licenseStatus.expireAt).format('YYYY-MM-DD')
                : labels.unlimited
              : labels.notApplicable}
          </Descriptions.Item>
          <Descriptions.Item label={labels.clusterLimit}>
            {String(license.cluster_limit) === '-1' ? labels.unlimited : license.cluster_limit}
          </Descriptions.Item>
        </Descriptions>
        <h4 className={styles.allowedPluginTitle}>{labels.allowedPlugins}</h4>
        <div className={styles.allowedPlugins}>
          {plugins.length ? (
            plugins.map(plugin => <Tag key={plugin.plugin_id || plugin.name}>{plugin.name}</Tag>)
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={labels.noPlugins} />
          )}
        </div>
      </React.Fragment>
    );
  }

  render() {
    const {
      visible,
      onCancel,
      title,
      labels,
      platform,
      requestStatus,
      updating
    } = this.props;
    const { editing, authorizationCode, validationError } = this.state;
    return (
      <Modal visible={visible} title={title} onCancel={onCancel} footer={null} width={720}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label={labels.name}>{platform.name || '-'}</Descriptions.Item>
          <Descriptions.Item label={labels.version}>{platform.version || '-'}</Descriptions.Item>
          <Descriptions.Item label={labels.createdAt}>
            {platform.createdAt ? moment(platform.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={labels.enterpriseId}>{platform.enterpriseId}</Descriptions.Item>
        </Descriptions>
        <div className={styles.licenseHeader}>
          <h3>{labels.license}</h3>
          <Button type="link" onClick={this.toggleEditor} disabled={updating}>
            {editing ? labels.cancel : labels.updateLicense}
          </Button>
        </div>
        {editing ? (
          <div className={styles.licenseEditor}>
            <Input
              type="password"
              autoComplete="new-password"
              value={authorizationCode}
              placeholder={labels.authorizationPlaceholder}
              onChange={this.handleCodeChange}
              disabled={updating}
            />
            {validationError ? <span>{validationError}</span> : null}
            <Button type="primary" loading={updating} onClick={this.submitLicense}>
              {labels.save}
            </Button>
          </div>
        ) : null}
        <Spin spinning={requestStatus === 'loading'}>{this.renderLicenseContent()}</Spin>
      </Modal>
    );
  }
}

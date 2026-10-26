import { Alert, Button, Empty, Icon, Input, Modal, Skeleton } from 'antd';
import moment from 'moment';
import React, { PureComponent } from 'react';
import overviewData from '../overviewData';
import styles from '../index.less';

export default class PlatformInfoModal extends PureComponent {
  state = {
    editing: false,
    authorizationCode: '',
    validationError: '',
    submitting: false
  };

  submissionPending = false;

  componentDidUpdate(prevProps) {
    if (prevProps.visible && !this.props.visible) {
      this.submissionPending = false;
      this.setState({
        editing: false,
        authorizationCode: '',
        validationError: '',
        submitting: false
      });
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  isUpdating = () => this.props.updating || this.submissionPending;

  handleCancel = () => {
    if (this.isUpdating()) return;
    this.setState({
      editing: false,
      authorizationCode: '',
      validationError: ''
    });
    this.props.onCancel();
  };

  toggleEditor = () => {
    if (this.isUpdating()) return;
    this.setState((state) => ({
      editing: !state.editing,
      authorizationCode: '',
      validationError: ''
    }));
  };

  handleCodeChange = (event) => {
    this.setState({
      authorizationCode: event.target.value,
      validationError: ''
    });
  };

  submitLicense = () => {
    if (this.isUpdating()) return;
    const authorizationCode = this.state.authorizationCode.trim();
    if (!authorizationCode) {
      this.setState({
        validationError: this.props.labels.authorizationRequired
      });
      return;
    }
    this.submissionPending = true;
    this.setState({ submitting: true });
    this.props.onUpdateLicense(authorizationCode, (succeeded) => {
      this.submissionPending = false;
      if (this.unmounted) return;
      this.setState(
        succeeded
          ? {
              editing: false,
              authorizationCode: '',
              validationError: '',
              submitting: false
            }
          : { submitting: false }
      );
    });
  };

  formatQuota(value) {
    if (typeof value === 'boolean' || !overviewData.isNumber(value)) return '-';
    const count = Number(value);
    if (count === -1) return this.props.labels.unlimited;
    return Number.isInteger(count) && count > 0 ? count : '-';
  }

  renderLicenseContent() {
    const { labels, license, requestStatus } = this.props;
    const summary = overviewData.platformLicenseSummary(license, requestStatus);
    if (
      !requestStatus ||
      requestStatus === 'idle' ||
      requestStatus === 'loading'
    ) {
      return <Skeleton active paragraph={{ rows: 3 }} title={false} />;
    }
    if (requestStatus === 'error') {
      return (
        <Alert type="warning" showIcon message={labels.licenseUnavailable} />
      );
    }
    if (requestStatus === 'empty') {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={labels.noLicense}
        />
      );
    }
    if (requestStatus === 'invalid') {
      return (
        <Alert
          type="error"
          showIcon
          message={this.props.licenseLabel}
          description={labels.licenseDetailsUnavailable}
        />
      );
    }
    if (requestStatus !== 'success' || !license || license.valid !== true) {
      return (
        <Alert
          type={summary.level === 'warning' ? 'warning' : 'info'}
          showIcon
          message={this.props.licenseLabel}
          description={labels.licenseDetailsUnavailable}
        />
      );
    }
    const expiry = summary.expireAt ? moment.unix(summary.expireAt) : null;
    const fields = [
      { label: labels.company, value: license.company || '-' },
      {
        label: labels.expireAt,
        value: expiry && expiry.isValid() ? expiry.format('YYYY-MM-DD') : '-'
      },
      {
        label: labels.clusterLimit,
        value: this.formatQuota(license.cluster_limit)
      },
      { label: labels.nodeLimit, value: this.formatQuota(license.node_limit) }
    ];
    return (
      <dl className={styles.platformLicenseMetrics}>
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  renderPlugins() {
    const { labels, license, requestStatus } = this.props;
    const verified =
      requestStatus === 'success' && license && license.valid === true;
    const plugins =
      verified && Array.isArray(license.plugins)
        ? license.plugins.filter(
            (plugin) =>
              plugin &&
              typeof plugin === 'object' &&
              (plugin.name || plugin.plugin_id)
          )
        : [];
    const loading =
      !requestStatus || requestStatus === 'idle' || requestStatus === 'loading';
    return (
      <section
        className={styles.platformInfoCard}
        aria-labelledby="platform-info-plugins-title"
      >
        <div className={styles.platformInfoCardHeading}>
          <h3 id="platform-info-plugins-title">
            <Icon type="appstore" />
            {labels.allowedPlugins}
          </h3>
          {verified ? <span>{labels.pluginCount(plugins.length)}</span> : null}
        </div>
        {loading ? (
          <Skeleton active title={false} paragraph={{ rows: 2 }} />
        ) : verified ? (
          plugins.length ? (
            <ul className={styles.platformAllowedPluginGrid}>
              {plugins.map((plugin, index) => (
                <li key={`${plugin.plugin_id || plugin.name}-${index}`}>
                  <Icon
                    type={overviewData.pluginIcon({
                      ...plugin,
                      name: plugin.plugin_id || plugin.name,
                      alias: plugin.name
                    })}
                  />
                  <span>{plugin.name || plugin.plugin_id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={labels.noPlugins}
            />
          )
        ) : (
          <p className={styles.platformInfoHint}>
            <Icon type="lock" />
            {labels.pluginAuthorizationUnknown}
          </p>
        )}
      </section>
    );
  }

  render() {
    const {
      visible,
      title,
      labels,
      platform,
      runtimeSummary,
      licenseLabel,
      license,
      requestStatus,
      updating
    } = this.props;
    const {
      editing,
      authorizationCode,
      validationError,
      submitting
    } = this.state;
    const busy = updating || submitting;
    const summary = overviewData.platformLicenseSummary(license, requestStatus);
    const stateClasses = {
      healthy: styles.platformInfoHealthy,
      warning: styles.platformInfoWarning
    };
    const createdAt = platform.createdAt ? moment(platform.createdAt) : null;
    const hero = (
      <div className={styles.platformInfoHero}>
        <span className={styles.platformInfoHeroIcon}>
          <Icon type="cloud" />
        </span>
        <div>
          <span className={styles.platformInfoEyebrow}>{title}</span>
          <h2>{platform.name || 'Rainbond'}</h2>
          {runtimeSummary ? (
            <p
              className={`${styles.platformInfoRuntime} ${
                stateClasses[runtimeSummary.level] || ''
              }`}
            >
              <Icon
                type={
                  runtimeSummary.level === 'loading'
                    ? 'loading'
                    : runtimeSummary.level === 'warning'
                    ? 'exclamation-circle'
                    : runtimeSummary.level === 'healthy'
                    ? 'check-circle'
                    : 'info-circle'
                }
              />
              {runtimeSummary.label}
            </p>
          ) : null}
        </div>
      </div>
    );
    const footer = (
      <div className={styles.platformInfoFooter}>
        <Button
          disabled={busy}
          onClick={editing ? this.toggleEditor : this.handleCancel}
        >
          {editing ? labels.cancel : labels.close}
        </Button>
        <Button
          type="primary"
          icon="key"
          loading={busy}
          onClick={editing ? this.submitLicense : this.toggleEditor}
        >
          {editing ? labels.save : labels.updateLicense}
        </Button>
      </div>
    );
    return (
      <Modal
        className={styles.platformInfoModal}
        visible={visible}
        title={hero}
        onCancel={this.handleCancel}
        footer={footer}
        width={780}
        centered
        closable={!busy}
        maskClosable={!busy}
        keyboard={!busy}
      >
        <div className={styles.platformInfoColumns}>
          <section
            className={styles.platformInfoCard}
            aria-labelledby="platform-info-basic-title"
          >
            <div className={styles.platformInfoCardHeading}>
              <h3 id="platform-info-basic-title">
                <Icon type="info-circle" />
                {labels.basicInfo}
              </h3>
            </div>
            <dl className={styles.platformInfoDetails}>
              <div>
                <dt>{labels.name}</dt>
                <dd>{platform.name || '-'}</dd>
              </div>
              <div>
                <dt>{labels.version}</dt>
                <dd>{platform.version || '-'}</dd>
              </div>
              <div>
                <dt>{labels.createdAt}</dt>
                <dd>
                  {createdAt && createdAt.isValid()
                    ? createdAt.format('YYYY-MM-DD HH:mm')
                    : '-'}
                </dd>
              </div>
            </dl>
            <div className={styles.platformInfoEnterpriseId}>
              <span>{labels.enterpriseId}</span>
              <span>{platform.enterpriseId || '-'}</span>
            </div>
          </section>
          <section
            className={styles.platformInfoCard}
            aria-labelledby="platform-info-license-title"
          >
            <div className={styles.platformInfoCardHeading}>
              <h3 id="platform-info-license-title">
                <Icon type="safety-certificate" />
                {labels.license}
              </h3>
              <span
                className={`${styles.platformInfoLicenseBadge} ${
                  stateClasses[summary.level] || ''
                }`}
                aria-live="polite"
              >
                {summary.level === 'loading' ? <Icon type="loading" /> : null}
                {licenseLabel}
              </span>
            </div>
            {this.renderLicenseContent()}
          </section>
        </div>
        <section
          className={styles.platformInfoCard}
          aria-labelledby="platform-info-authorization-title"
        >
          <div className={styles.platformInfoCardHeading}>
            <h3 id="platform-info-authorization-title">
              <Icon type="key" />
              {labels.authorizationCode}
            </h3>
            <span>{labels.secureUpdate}</span>
          </div>
          {editing ? (
            <div className={styles.platformLicenseEditor}>
              <label htmlFor="platform-info-license-input">
                {labels.newAuthorizationCode}
              </label>
              <Input
                id="platform-info-license-input"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={authorizationCode}
                placeholder={labels.authorizationPlaceholder}
                onChange={this.handleCodeChange}
                onPressEnter={this.submitLicense}
                disabled={busy}
                aria-invalid={Boolean(validationError)}
                aria-describedby={
                  validationError
                    ? 'platform-info-license-error'
                    : 'platform-info-license-help'
                }
              />
              <p id="platform-info-license-help">
                {labels.authorizationPrivate}
              </p>
              {validationError ? (
                <span id="platform-info-license-error" role="alert">
                  {validationError}
                </span>
              ) : null}
            </div>
          ) : (
            <p className={styles.platformAuthorizationNotice}>
              <Icon type="lock" />
              <span>{labels.authorizationPrivate}</span>
            </p>
          )}
        </section>
        {this.renderPlugins()}
      </Modal>
    );
  }
}

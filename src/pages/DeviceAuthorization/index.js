/* eslint-disable compat/compat */
import { Alert, Button, Input, Modal, Spin, Typography } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { FormattedMessage, formatMessage } from 'umi';
import rainskillsAuthorizationAccess from '../../utils/rainskillsAuthorizationAccess';
import styles from './index.less';

const { Paragraph, Text, Title } = Typography;
const {
  isCurrentAccessRequest,
  resolveRainskillsAccessStatus
} = rainskillsAuthorizationAccess;
const USER_CODE_ALPHABET = '23456789BCDFGHJKMNPQRTVWXY';
const AGENT_ENTERPRISE_EDITION_URL = 'https://rainbond.feishu.cn/share/base/shrcnv2iqnRsNJM6Y3hN5VhTJvg';

function normalizeUserCode(value) {
  const significant = (value || '')
    .toUpperCase()
    .replace(/[^23456789BCDFGHJKMNPQRTVWXY]/g, '')
    .slice(0, 8);
  return significant.length > 4
    ? `${significant.slice(0, 4)}-${significant.slice(4)}`
    : significant;
}

@connect(({ deviceAuthorization, user }) => ({
  ...deviceAuthorization,
  currentUser: user.currentUser
}))
export default class DeviceAuthorization extends Component {
  constructor(props) {
    super(props);
    const params = new URLSearchParams(props.location.search || '');
    this.state = {
      userCode: normalizeUserCode(params.get('user_code') || ''),
      accessStatus: 'idle'
    };
    this.mounted = false;
    this.accessRequestId = 0;
  }

  componentDidMount() {
    this.mounted = true;
    const { dispatch, currentUser } = this.props;
    if (!currentUser) {
      dispatch({ type: 'user/fetchCurrent' });
    }
    if (this.state.userCode.length === 9) {
      this.inspectCode();
    }
    if (this.props.status === 'confirm') {
      this.checkAccess();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.status === 'confirm' &&
      (prevProps.status !== 'confirm' || prevProps.grant !== this.props.grant)
    ) {
      this.checkAccess();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.accessRequestId += 1;
    this.props.dispatch({ type: 'deviceAuthorization/reset' });
  }

  inspectCode = () => {
    const { userCode } = this.state;
    if (userCode.length !== 9) {
      return;
    }
    this.props.dispatch({
      type: 'deviceAuthorization/inspect',
      payload: { user_code: userCode }
    });
  };

  checkAccess = approve => {
    if (this.accessStatusRequestInFlight) {
      return;
    }
    const { dispatch } = this.props;
    const requestId = this.accessRequestId + 1;
    this.accessRequestId = requestId;
    this.accessStatusRequestInFlight = true;
    this.setState({ accessStatus: 'checking' });

    dispatch({
      type: 'rainskillsAccess/check',
      callback: (response, error) => {
        if (!isCurrentAccessRequest(this.mounted, requestId, this.accessRequestId)) {
          return;
        }
        this.accessStatusRequestInFlight = false;

        const accessStatus = resolveRainskillsAccessStatus(response, error);
        if (accessStatus === 'error') {
          this.setState({ accessStatus: 'error' });
          return;
        }

        if (accessStatus === 'denied') {
          this.setState(
            { accessStatus: 'denied' },
            this.showAccessRestrictedModal
          );
          return;
        }

        this.setState({ accessStatus: 'allowed' }, () => {
          if (approve && this.mounted && requestId === this.accessRequestId) {
            this.submitDecision('approve');
          }
        });
      },
    });
  };

  decide = decision => {
    if (decision === 'approve') {
      if (this.state.accessStatus !== 'allowed' || this.props.status === 'submitting') {
        return;
      }
      this.checkAccess(true);
      return;
    }
    this.accessRequestId += 1;
    this.accessStatusRequestInFlight = false;
    this.submitDecision(decision);
  };

  submitDecision = decision => {
    const { grant, dispatch } = this.props;
    dispatch({
      type: 'deviceAuthorization/decide',
      payload: { user_code: grant.user_code, decision }
    });
  };

  showAccessRestrictedModal = () => {
    Modal.confirm({
      title: formatMessage({ id: 'deviceAuthorization.access.restricted.title' }),
      content: formatMessage({ id: 'deviceAuthorization.access.restricted.detail' }),
      okText: formatMessage({ id: 'deviceAuthorization.access.restricted.enterprise' }),
      cancelText: formatMessage({ id: 'deviceAuthorization.access.restricted.acknowledge' }),
      onOk: () => {
        window.open(AGENT_ENTERPRISE_EDITION_URL, '_blank', 'noopener,noreferrer');
      },
    });
  };

  handleCodeChange = event => {
    this.setState({ userCode: normalizeUserCode(event.target.value) });
  };

  handleRetry = () => {
    this.accessRequestId += 1;
    this.accessStatusRequestInFlight = false;
    this.setState({ accessStatus: 'idle' });
    this.props.dispatch({ type: 'deviceAuthorization/reset' });
  };

  renderHeader() {
    return (
      <div className={styles.header}>
        <Title level={3}><FormattedMessage id="deviceAuthorization.title" /></Title>
        <Paragraph type="secondary">
          <FormattedMessage id="deviceAuthorization.subtitle" />
        </Paragraph>
      </div>
    );
  }

  renderEntry() {
    const { userCode } = this.state;
    return (
      <div className={styles.content}>
        <label className={styles.codeLabel} htmlFor="device-user-code">
          <Text strong><FormattedMessage id="deviceAuthorization.code.label" /></Text>
        </label>
        <Input
          id="device-user-code"
          autoFocus
          className={styles.codeInput}
          maxLength={9}
          placeholder="XXXX-XXXX"
          value={userCode}
          onChange={this.handleCodeChange}
          onPressEnter={this.inspectCode}
        />
        <Button type="primary" disabled={userCode.length !== 9} onClick={this.inspectCode}>
          <FormattedMessage id="deviceAuthorization.code.continue" />
        </Button>
      </div>
    );
  }

  renderConfirm() {
    const { grant, currentUser, status } = this.props;
    const { accessStatus } = this.state;
    const accessRestricted = accessStatus === 'denied';
    const accessError = accessStatus === 'error';
    return (
      <div className={styles.content}>
        <div className={styles.code}>{grant.user_code}</div>
        <dl className={styles.details}>
          <dt><FormattedMessage id="deviceAuthorization.client" /></dt>
          <dd>{grant.client_name}</dd>
          <dt><FormattedMessage id="deviceAuthorization.account" /></dt>
          <dd>{(currentUser && currentUser.nick_name) || '-'}</dd>
          <dt><FormattedMessage id="deviceAuthorization.permission" /></dt>
          <dd><FormattedMessage id="deviceAuthorization.permission.mcp" /></dd>
        </dl>
        <Alert
          className={styles.alert}
          type="warning"
          showIcon
          message={<FormattedMessage id="deviceAuthorization.confirm.warning" />}
        />
        {accessRestricted && (
          <Alert
            className={styles.alert}
            type="warning"
            showIcon
            message={<FormattedMessage id="deviceAuthorization.access.restricted.title" />}
            description={
              <div>
                <div><FormattedMessage id="deviceAuthorization.access.restricted.detail" /></div>
                <a href={AGENT_ENTERPRISE_EDITION_URL} target="_blank" rel="noopener noreferrer">
                  <FormattedMessage id="deviceAuthorization.access.restricted.enterprise" />
                </a>
              </div>
            }
          />
        )}
        {accessError && (
          <div>
            <Alert
              className={styles.alert}
              type="error"
              showIcon
              message={<FormattedMessage id="deviceAuthorization.access.error" />}
            />
            <Button className={styles.retry} onClick={() => this.checkAccess()}>
              <FormattedMessage id="deviceAuthorization.access.retry" />
            </Button>
          </div>
        )}
        <div className={styles.actions}>
          <Button disabled={status === 'submitting'} onClick={() => this.decide('deny')}>
            <FormattedMessage id="deviceAuthorization.deny" />
          </Button>
          <Button
            type="primary"
            loading={status === 'submitting' || accessStatus === 'checking'}
            disabled={status === 'submitting' || accessStatus !== 'allowed'}
            onClick={() => this.decide('approve')}
          >
            <FormattedMessage id="deviceAuthorization.approve" />
          </Button>
        </div>
      </div>
    );
  }

  renderResult(type) {
    return (
      <Alert
        className={styles.result}
        type={type === 'approved' ? 'success' : type === 'denied' ? 'info' : 'error'}
        showIcon
        message={<FormattedMessage id={`deviceAuthorization.result.${type}.title`} />}
        description={<FormattedMessage id={`deviceAuthorization.result.${type}.detail`} />}
      />
    );
  }

  renderBody() {
    const { status } = this.props;
    if (status === 'loading') {
      return <div className={styles.loading}><Spin /></div>;
    }
    if (status === 'confirm' || status === 'submitting') {
      return this.renderConfirm();
    }
    if (status === 'approved' || status === 'denied') {
      return this.renderResult(status);
    }
    if (status === 'error') {
      return (
        <div>
          {this.renderResult('error')}
          <Button className={styles.retry} onClick={this.handleRetry}>
            <FormattedMessage id="deviceAuthorization.retry" />
          </Button>
        </div>
      );
    }
    return this.renderEntry();
  }

  render() {
    return (
      <main className={styles.wrap}>
        {this.renderHeader()}
        {this.renderBody()}
      </main>
    );
  }
}

export { normalizeUserCode, USER_CODE_ALPHABET };

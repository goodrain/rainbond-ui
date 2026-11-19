/* eslint-disable compat/compat */
import { Alert, Button, Card, Spin, Typography } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { FormattedMessage, formatMessage } from 'umi';
import cookie from '../../utils/cookie';
import rainskillsAuthorizationAccess from '../../utils/rainskillsAuthorizationAccess';
import styles from './index.less';

const { Paragraph, Text } = Typography;
const {
  isCurrentAccessRequest,
  resolveRainskillsAccessStatus
} = rainskillsAuthorizationAccess;

const CALLBACK_PATTERN = /^http:\/\/127\.0\.0\.1:\d{2,5}(\/[\w\-./]*)?$/;
const AGENT_ENTERPRISE_EDITION_URL = 'https://rainbond.feishu.cn/share/base/shrcnv2iqnRsNJM6Y3hN5VhTJvg';

@connect(({ user, loading }) => ({
  currentUser: user.currentUser,
  loading: loading.effects['user/fetchCurrent'],
}))
export default class CliAuth extends Component {
  constructor(props) {
    super(props);
    const params = new URLSearchParams(props.location.search);
    this.state = {
      callback: params.get('callback') || '',
      state: params.get('state') || '',
      status: 'checkingAccess',
      errorMessage: '',
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
    this.checkAccess();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.accessRequestId += 1;
  }

  checkAccess = authorize => {
    const { dispatch } = this.props;
    const requestId = this.accessRequestId + 1;
    this.accessRequestId = requestId;
    this.setState({ status: 'checkingAccess', errorMessage: '' });

    dispatch({
      type: 'rainskillsAccess/check',
      callback: (response, error) => {
        if (!isCurrentAccessRequest(this.mounted, requestId, this.accessRequestId)) {
          return;
        }

        const accessStatus = resolveRainskillsAccessStatus(response, error);
        if (accessStatus === 'error') {
          this.setState({
            status: 'accessError',
            errorMessage: formatMessage({ id: 'cliAuth.access.error' }),
          });
          return;
        }

        if (accessStatus === 'denied') {
          this.setState({ status: 'accessDenied', errorMessage: '' });
          return;
        }

        if (authorize) {
          this.authorizeWithToken();
          return;
        }

        this.setState({ status: 'ready', errorMessage: '' });
      },
    });
  };

  isCallbackValid() {
    const { callback } = this.state;
    return CALLBACK_PATTERN.test(callback);
  }

  authorizeWithToken = () => {
    const { callback, state } = this.state;
    const token = cookie.get('token');
    if (!token) {
      this.setState({
        status: 'error',
        errorMessage: formatMessage({ id: 'cliAuth.error.noToken' }),
      });
      return;
    }
    this.setState({ status: 'sending', errorMessage: '' });

    // Top-level navigation to the loopback callback. fetch/XHR cannot reach
    // 127.0.0.1 from a public-IP page in modern Chrome regardless of CORS or
    // Private Network Access headers; navigation is exempt.
    const sep = callback.indexOf('?') >= 0 ? '&' : '?';
    const target =
      callback +
      sep +
      'token=' +
      encodeURIComponent(token) +
      '&state=' +
      encodeURIComponent(state);
    window.location.assign(target);
  };

  handleAuthorize = () => {
    if (this.state.status !== 'ready') {
      return;
    }
    this.checkAccess(true);
  };

  renderInvalid() {
    return (
      <Alert
        type="error"
        showIcon
        message={<FormattedMessage id="cliAuth.invalid.title" />}
        description={<FormattedMessage id="cliAuth.invalid.subtitle" />}
      />
    );
  }

  renderDone() {
    return (
      <Alert
        type="success"
        showIcon
        message={<FormattedMessage id="cliAuth.done.title" />}
        description={<FormattedMessage id="cliAuth.done.subtitle" />}
      />
    );
  }

  renderAccessDenied() {
    return (
      <Card bordered={false} className={styles.card}>
        <Alert
          type="warning"
          showIcon
          message={<FormattedMessage id="cliAuth.access.restricted.title" />}
          description={
            <div>
              <div><FormattedMessage id="cliAuth.access.restricted.detail" /></div>
              <a href={AGENT_ENTERPRISE_EDITION_URL} target="_blank" rel="noopener noreferrer">
                <FormattedMessage id="cliAuth.access.restricted.enterprise" />
              </a>
            </div>
          }
        />
      </Card>
    );
  }

  renderAccessError() {
    return (
      <Card bordered={false} className={styles.card}>
        <Alert
          type="error"
          showIcon
          message={<FormattedMessage id="cliAuth.access.error" />}
        />
        <Button style={{ marginTop: 16 }} onClick={() => this.checkAccess()}>
          <FormattedMessage id="cliAuth.access.retry" />
        </Button>
      </Card>
    );
  }

  renderForm() {
    const { currentUser } = this.props;
    const { callback, status, errorMessage } = this.state;
    return (
      <Card
        title={<FormattedMessage id="cliAuth.title" />}
        bordered={false}
        className={styles.card}
      >
        <Paragraph>
          <FormattedMessage id="cliAuth.description" />
        </Paragraph>

        <Alert
          type="warning"
          showIcon
          message={<FormattedMessage id="cliAuth.warning.title" />}
          description={<FormattedMessage id="cliAuth.warning.detail" />}
          style={{ marginBottom: 16 }}
        />

        <Paragraph>
          <Text strong>
            <FormattedMessage id="cliAuth.field.user" />
          </Text>
          {`：${(currentUser && currentUser.nick_name) || '-'}`}
        </Paragraph>
        <Paragraph>
          <Text strong>
            <FormattedMessage id="cliAuth.field.callback" />
          </Text>
          {`：`}
          <Text code>{callback}</Text>
        </Paragraph>

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
          />
        )}

        <Button
          type="primary"
          loading={status === 'sending'}
          disabled={status !== 'ready'}
          onClick={this.handleAuthorize}
        >
          <FormattedMessage id="cliAuth.button.authorize" />
        </Button>
      </Card>
    );
  }

  render() {
    const { loading } = this.props;
    const { status } = this.state;

    if (!this.isCallbackValid()) {
      return <div className={styles.wrap}>{this.renderInvalid()}</div>;
    }

    if (loading || status === 'checkingAccess') {
      return (
        <div className={styles.wrap}>
          <Spin />
        </div>
      );
    }

    if (status === 'done') {
      return <div className={styles.wrap}>{this.renderDone()}</div>;
    }

    if (status === 'accessDenied') {
      return <div className={styles.wrap}>{this.renderAccessDenied()}</div>;
    }

    if (status === 'accessError') {
      return <div className={styles.wrap}>{this.renderAccessError()}</div>;
    }

    return <div className={styles.wrap}>{this.renderForm()}</div>;
  }
}

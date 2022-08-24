import { Badge } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from './index.less';
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
  }
  state = {
    //   应用状态
    appState: {
      RUNNING: formatMessage({id:'ApplicationState.RUNNING'}),
      STARTING: formatMessage({id:'ApplicationState.STARTING'}),
      CLOSED: formatMessage({id:'ApplicationState.CLOSED'}),
      STOPPING: formatMessage({id:'ApplicationState.STOPPING'}),
      ABNORMAL: formatMessage({id:'ApplicationState.ABNORMAL'}),
      PARTIAL_ABNORMAL: formatMessage({id:'ApplicationState.PARTIAL_ABNORMAL'}),
      'not-configured': formatMessage({id:'ApplicationState.not-configured'}),
      unknown: formatMessage({id:'ApplicationState.unknown'}),
      deployed: formatMessage({id:'ApplicationState.deployed'}),
      superseded: formatMessage({id:'ApplicationState.superseded'}),
      failed: formatMessage({id:'ApplicationState.failed'}),
      uninstalled: formatMessage({id:'ApplicationState.uninstalled'}),
      uninstalling: formatMessage({id:'ApplicationState.uninstalling'}),
      'pending-install': formatMessage({id:'ApplicationState.pending-install'}),
      'pending-upgrade': formatMessage({id:'ApplicationState.pending-upgrade'}),
      'pending-rollback': formatMessage({id:'ApplicationState.pending-rollback'})
    },
    // 应用状态的标识颜色
    appStateColor: {
      RUNNING: 'success',
      STARTING: 'success',
      CLOSED: 'error',
      STOPPING: 'error',
      ABNORMAL: 'error',
      PARTIAL_ABNORMAL: 'error',
      unknown: 'error',
      deployed: 'success',
      superseded: 'success',
      failed: 'error',
      'pending-install': 'success',
      'pending-upgrade': 'success',
      'pending-rollback': 'success'
    },
  };
  render() {
    const { appStateColor, appState } = this.state;
    const { AppStatus } = this.props;
    return (
      <Fragment>
        <Badge
          className={styles.states}
          status={appStateColor[AppStatus] || 'default'}
          text={appState[AppStatus] || '闲置'}
        />
      </Fragment>
    );
  }
}

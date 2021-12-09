import { Badge } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import styles from './index.less';
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
  }
  state = {
    //   应用状态
    appState: {
      RUNNING: '运行中',
      STARTING: '启动中',
      CLOSED: '已关闭',
      STOPPING: '关闭中',
      ABNORMAL: '异常',
      PARTIAL_ABNORMAL: '部分异常',
      'not-configured': '未配置',
      unknown: '未知',
      deployed: '已部署',
      superseded: '可升级',
      failed: '失败',
      uninstalled: '已卸载',
      uninstalling: '卸载中',
      'pending-install': '安装中',
      'pending-upgrade': '升级中',
      'pending-rollback': '回滚中'
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

import React, { PureComponent } from 'react';
import { Modal, Select } from 'antd';
import { formatMessage } from '@/utils/intl';
import XTerm from '../../Component/WebConsole/xTerm';
import styles from '../detail.less';

const { Option } = Select;

class TerminalModal extends PureComponent {
  state = {
    selectedContainer: '',
  };

  componentDidMount() {
    this.syncContainer();
  }

  componentDidUpdate(prevProps) {
    const prevContainers = (prevProps.containers || []).join(',');
    const nextContainers = (this.props.containers || []).join(',');
    if (prevContainers !== nextContainers || prevProps.podName !== this.props.podName) {
      this.syncContainer();
    }
  }

  syncContainer = () => {
    const containers = this.props.containers || [];
    this.setState({ selectedContainer: containers[0] || '' });
  };

  render() {
    const { visible, onCancel, websocketURL, podName, namespace, containers } = this.props;
    const { selectedContainer } = this.state;

    return (
      <Modal
        visible={visible}
        onCancel={onCancel}
        footer={null}
        width={980}
        destroyOnClose
        title={formatMessage({ id: 'resourceCenter.common.webTerminal' })}
        bodyStyle={{ padding: 0 }}
      >
        <div className={styles.terminalToolbar}>
          <div className={styles.terminalInfo}>
            <span>{podName || '-'}</span>
            <span className={styles.terminalSeparator} />
            <span>{namespace || '-'}</span>
          </div>
          <Select
            value={selectedContainer}
            style={{ width: 220 }}
            size="small"
            onChange={value => this.setState({ selectedContainer: value })}
          >
            {(containers || []).map(container => (
              <Option key={container} value={container}>{container}</Option>
            ))}
          </Select>
        </div>
        {visible && websocketURL && podName && selectedContainer ? (
          <XTerm
            key={`${podName}-${selectedContainer}`}
            tenantID=""
            serviceID=""
            WebsocketURL={websocketURL}
            podName={podName}
            containerName={selectedContainer}
            namespace={namespace}
            height={560}
          />
        ) : (
          <div className={styles.terminalEmpty}>{formatMessage({ id: 'resourceCenter.terminal.empty', defaultMessage: '当前没有可连接的终端实例' })}</div>
        )}
      </Modal>
    );
  }
}

export default TerminalModal;

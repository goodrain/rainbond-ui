import { Button, Icon, Modal } from 'antd';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AgentEntryIcon from '../AgentEntryIcon';
import styles from './index.less';

class AgentAbnormalGuideModal extends PureComponent {
  static propTypes = {
    componentName: PropTypes.string,
    onSuppress: PropTypes.func.isRequired,
    onTroubleshoot: PropTypes.func.isRequired,
    visible: PropTypes.bool
  };

  static defaultProps = {
    componentName: '',
    visible: false
  };

  render() {
    const {
      componentName,
      onSuppress,
      onTroubleshoot,
      visible
    } = this.props;

    return (
      <Modal
        title={
          <div className={styles.agentGuideTitle}>
            <span className={styles.agentGuideIcon}>
              <Icon type="warning" theme="filled" />
            </span>
            {formatMessage({
              id: 'componentOverview.agent_abnormal_guide.title'
            })}
          </div>
        }
        visible={visible}
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button
            key="agent-troubleshoot"
            type="primary"
            className={styles.agentGuidePrimaryAction}
            onClick={onTroubleshoot}
          >
            <AgentEntryIcon />
            {formatMessage({
              id: 'componentOverview.agent_abnormal_guide.action'
            })}
          </Button>,
          <Button key="suppress-agent-guide" onClick={onSuppress}>
            {formatMessage({
              id: 'componentOverview.agent_abnormal_guide.suppress'
            })}
          </Button>
        ]}
        width={440}
        className={styles.agentGuideModal}
      >
        <div className={styles.agentGuideBody}>
          <div className={styles.agentGuideDescription}>
            {formatMessage(
              { id: 'componentOverview.agent_abnormal_guide.description' },
              { component: componentName || '-' }
            )}
          </div>
          <div className={styles.agentGuideCapabilities}>
            <span className={styles.agentGuideCapabilityLead}>
              {formatMessage({
                id: 'componentOverview.agent_abnormal_guide.capability_lead'
              })}
            </span>
            <span className={styles.agentGuideCapabilityItem}>
              <Icon type="check-circle" />
              {formatMessage({
                id: 'componentOverview.agent_abnormal_guide.capability_cause'
              })}
            </span>
            <span className={styles.agentGuideCapabilityItem}>
              <Icon type="check-circle" />
              {formatMessage({
                id: 'componentOverview.agent_abnormal_guide.capability_steps'
              })}
            </span>
            <span className={styles.agentGuideCapabilityItem}>
              <Icon type="check-circle" />
              {formatMessage({
                id: 'componentOverview.agent_abnormal_guide.capability_advice'
              })}
            </span>
          </div>
        </div>
      </Modal>
    );
  }
}

export default AgentAbnormalGuideModal;

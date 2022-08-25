/* eslint-disable prettier/prettier */
import { Button, Icon, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styless from '../CreateTeam/index.less';
import styles from './index.less';

class ConfirmModal extends PureComponent {
  render() {
    const {
      title,
      onOk,
      onCancel,
      desc,
      subDesc,
      loading = false,
      deleteLoading = false
    } = this.props;
    return (
      <Modal
        title={title}
        visible
        onOk={onOk}
        onCancel={onCancel}
        className={styless.TelescopicModal}
        footer={[
          <Button onClick={onCancel}> {formatMessage({id:'popover.cancel'})} </Button>,
          <Button
            type="primary"
            loading={loading || deleteLoading}
            disabled={this.props.disabled}
            onClick={onOk}
          >
            {formatMessage({id:'popover.confirm'})}
          </Button>
        ]}
      >
        <div className={styles.content}>
          <div className={styles.inner}>
            <span className={styles.icon}>
              <Icon type="exclamation-circle-o" />
            </span>
            <div className={styles.desc}>
              <p>{desc}</p>
              <p>{subDesc}</p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default ConfirmModal;

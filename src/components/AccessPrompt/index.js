import { Button, Form, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

@Form.create()
@connect()
class AccessPrompt extends PureComponent {
  render() {
    const { onCancel, title, data = {}, onOk, loading, isInstall } = this.props;
    return (
      <Modal
        title="提示"
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        confirmLoading={loading || false}
        footer={
          <div>
            {!isInstall && <Button onClick={onCancel}> 取消 </Button>}
            <Button
              type="primary"
              loading={loading}
              onClick={isInstall ? onCancel : onOk}
            >
              {isInstall ? '已知晓' : '确定'}
            </Button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>{title}</div>
      </Modal>
    );
  }
}

export default AccessPrompt;

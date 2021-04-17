import { Form, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';
import HelmForm from '../HelmForm';

@Form.create()
@connect()
class HelmAppMarket extends PureComponent {
  render() {
    const { onCancel, title, data = {}, onOk, loading, eid } = this.props;
    return (
      <Modal
        title={title}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        confirmLoading={loading || false}
        footer={null}
      >
        <HelmForm
          onCancel={onCancel}
          onOk={onOk}
          data={data}
          eid={eid}
          isEditor
        />
      </Modal>
    );
  }
}

export default HelmAppMarket;

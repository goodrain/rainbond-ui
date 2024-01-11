import Ansi from '@/components/Ansi';
import cloud from '@/utils/cloud';
import { Modal, Spin } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from '../../CreateTeam/index.less';
import istyles from './index.less';

@connect()
export default class ClusterCreationLog extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      createLog: '',
      showCreateLog: true
    };
  }
  componentDidMount() {
    this.queryCreateLog();
  }

  getLineHtml = (lineNumber, line) => {
    return (
      <div className={istyles.logline} key={lineNumber}>
        <a>{lineNumber}</a>
        <Ansi>{line}</Ansi>
      </div>
    );
  };

  queryCreateLog = () => {
    const { dispatch, eid, selectProvider, clusterID } = this.props;
    dispatch({
      type: 'cloud/queryCreateLog',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider,
        clusterID
      },
      callback: data => {
        if (data) {
          const content = data.content.split('\n');
          this.setState({ createLog: content, showCreateLog: false });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      }
    });
  };

  render() {
    const { title, onCancel } = this.props;
    const { createLog, showCreateLog } = this.state;
    return (
      <Modal
        title={title || <FormattedMessage id='enterpriseColony.ClusterProgressQuery.creat_log'/>}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
        width={1024}
        maskClosable={false}
        bodyStyle={{ background: '#000' }}
        footer={null}
      >
        <div className={istyles.cmd}>
          {showCreateLog ? (
            <div style={{ textAlign: 'center' }}>
              <Spin spinning className={istyles.customSpin} />
            </div>
          ) : (
            createLog &&
            createLog.length > 0 &&
            createLog.map((line, index) => {
              return this.getLineHtml(index + 1, line);
            })
          )}
        </div>
      </Modal>
    );
  }
}

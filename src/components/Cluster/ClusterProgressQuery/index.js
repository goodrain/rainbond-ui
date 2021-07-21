/* eslint-disable react/no-array-index-key */
import rainbondUtil from '@/utils/rainbond';
import { Alert, Button, Modal, Popover, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import modelstyles from '../../CreateTeam/index.less';
import ClusterCreationLog from '../ClusterCreationLog';
import styles from '../ShowKubernetesCreateDetail/index.less';

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
class ClusterProgressQuery extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showCreateLog: false
    };
  }
  queryCreateLog = () => {
    this.setState({ showCreateLog: true });
  };
  render() {
    const {
      onCancel,
      title,
      eid,
      selectProvider,
      providerName,
      steps,
      loading,
      complete,
      clusterID,
      msg,
      rainbondInfo
    } = this.props;
    const { showCreateLog } = this.state;
    let pending = '进行中';
    if (complete) {
      pending = false;
    }
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);

    return (
      <Modal
        title={title}
        visible
        maskClosable={false}
        width={600}
        onCancel={onCancel}
        className={modelstyles.TelescopicModal}
        footer={[
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        ]}
      >
        {showCreateLog && (
          <ClusterCreationLog
            eid={eid}
            clusterID={clusterID}
            selectProvider={selectProvider || providerName}
            onCancel={() => {
              this.setState({ showCreateLog: false });
            }}
          />
        )}
        <Row loading={loading} className={styles.box}>
          <Alert
            style={{ marginBottom: '16px' }}
            message={
              <span>
                {msg}
                {!enterpriseEdition && (
                  <Popover
                    placement="bottom"
                    content={
                      <img
                        alt="扫码加入社区钉钉群"
                        style={{ width: '200px' }}
                        title="扫码加入社区钉钉群"
                        src="https://www.rainbond.com/images/dingding-group.jpeg"
                      />
                    }
                    title={
                      <div style={{ textAlign: 'center' }}>
                        钉钉群号31096419
                      </div>
                    }
                  >
                    <Button type="link" style={{ padding: 0 }}>
                      钉钉群
                    </Button>
                    获取官方支持
                  </Popover>
                )}
              </span>
            }
            type="info"
            showIcon
          />
          <Timeline loading={loading} pending={pending}>
            {steps.map((item, index) => {
              const { Status, Title, Description, Message } = item;
              return (
                <Timeline.Item color={item.Color} key={`step${index}`}>
                  <h4>{Title}</h4>
                  <p>{Description}</p>
                  <p>{Message}</p>
                  {Status === 'failure' && (
                    <div>
                      <Button
                        type="link"
                        style={{ padding: 0 }}
                        onClick={this.queryCreateLog}
                      >
                        查看日志
                      </Button>
                    </div>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
          {complete && <span>已结束</span>}
        </Row>
      </Modal>
    );
  }
}

export default ClusterProgressQuery;

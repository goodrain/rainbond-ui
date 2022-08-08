/* eslint-disable react/no-array-index-key */
import rainbondUtil from '@/utils/rainbond';
import { Alert, Button, Modal, Popover, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import modelstyles from '../../CreateTeam/index.less';
import ClusterComponents from '../ClusterComponents';
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
      showCreateLog: false,
      isComponents: false
    };
  }
  queryCreateLog = () => {
    this.setState({ showCreateLog: true });
  };
  handleIsComponents = isComponents => {
    this.setState({
      isComponents
    });
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
      guideStep,
      handleNewbieGuiding,
      isLog = true,
      rainbondInfo
    } = this.props;
    const { showCreateLog, isComponents } = this.state;

    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const provider = selectProvider || providerName;
    const operators =
      steps &&
      steps.length &&
      steps.filter(item => item.Type === 'InitRainbondRegionOperator');
    const showComponentText =
      operators &&
      operators.length &&
      clusterID &&
      (provider === 'rke' || provider === 'custom');
    let pending = '进行中';
    if (complete) {
      pending = false;
    }
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
        {isComponents && (
          <ClusterComponents
            eid={eid}
            clusterID={clusterID}
            providerName={selectProvider || providerName}
            onCancel={() => {
              this.handleIsComponents(false);
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
                  <>
                    <a target="_blank" href="https://www.rainbond.com/community/support" style={{ padding: 0 }}>
                      钉钉群
                    </a>
                    获取官方支持
                  </>
                )}
              </span>
            }
            type="info"
            showIcon
          />
          {guideStep && guideStep !== 13 && handleNewbieGuiding
            ? handleNewbieGuiding({
                tit:
                  '请等待Rainbond集群服务初始化完成，你可以随时查看组件列表获取最新的服务启动状态',
                btnText: '已知晓',
                configName: 'clusterTheInitialization',
                showSvg: false,
                conPosition: { right: '-97px', top: '88px' },
                nextStep: 13
              })
            : ''}
          <Timeline
            loading={loading}
            pending={
              pending && (
                <div>
                  {pending}&nbsp;
                  {showComponentText ? (
                    <a onClick={() => this.handleIsComponents(true)}>
                      查看组件
                    </a>
                  ) : (
                    ''
                  )}
                </div>
              )
            }
          >
            {steps &&
              steps.length &&
              steps.map((item, index) => {
                const { Status, Title, Description, Message, reason } = item;
                return (
                  <Timeline.Item color={item.Color} key={`step${index}`}>
                    <h4>{Title}</h4>
                    <p>{Description}</p>
                    <p>{Message}</p>
                    {reason && reason === 'NamespaceBeingTerminated' && (
                      <Alert
                        style={{ marginBottom: '16px' }}
                        message="
                          命名空间 rbd-system 处于 terminating, 请待定删除完成.
                          或执行命令 curl
                          http://sh.rainbond.com/delete-ns-rbd-system.sh | bash
                          进行强制删除.
                      "
                        type="warning"
                        showIcon
                      />
                    )}
                    {isLog && Status === 'failure' && clusterID && (
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

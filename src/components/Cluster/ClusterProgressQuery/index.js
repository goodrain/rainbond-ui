/* eslint-disable react/no-array-index-key */
import rainbondUtil from '@/utils/rainbond';
import { Alert, Button, Modal, Popover, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
    let pending = `${formatMessage({id:'enterpriseColony.ClusterProgressQuery.hand'})}`;
    if (complete) {
      pending = false;
    }
    return (
      <Modal
        title={title}
        visible
        maskClosable={false}
        width={800}
        onCancel={onCancel}
        className={modelstyles.TelescopicModal}
        footer={[
          <Button type="primary" onClick={onCancel}>
            <FormattedMessage id='button.next'/>
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
                      <FormattedMessage id='enterpriseColony.ClusterProgressQuery.ding'/>
                    </a>
                    <FormattedMessage id='enterpriseColony.ClusterProgressQuery.support'/>
                  </>
                )}
              </span>
            }
            type="info"
            showIcon
          />
          {guideStep && guideStep !== 13 && handleNewbieGuiding
            ? handleNewbieGuiding({
                tit: formatMessage({id:'enterpriseColony.ClusterProgressQuery.state'}),
                btnText: formatMessage({id:'enterpriseColony.ClusterProgressQuery.Known'}),
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
                      <FormattedMessage id='enterpriseColony.ClusterProgressQuery.components'/>
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
                        message= {<FormattedMessage id='enterpriseColony.ClusterProgressQuery.name'/>}
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
                          <FormattedMessage id='enterpriseColony.ClusterProgressQuery.log'/>
                        </Button>
                      </div>
                    )}
                  </Timeline.Item>
                );
              })}
          </Timeline>
          {complete && <span><FormattedMessage id='enterpriseColony.ClusterProgressQuery.over'/></span>}
        </Row>
      </Modal>
    );
  }
}

export default ClusterProgressQuery;

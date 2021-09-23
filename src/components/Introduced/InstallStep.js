import { Button, Modal, Spin, Steps, Tabs } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import authorize from '../../assets/authorize.png';
import cluster from '../../assets/cluster.png';
import clusterColor from '../../assets/cluster_color.png';
import install from '../../assets/install.png';
import installColor from '../../assets/install_color.png';
import success from '../../assets/success.png';
import styles from '../CreateTeam/index.less';
import styless from './index.less';

const { Step } = Steps;
const { TabPane } = Tabs;
@connect()
export default class InstallStep extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      installType: 1,
      isAuthorize: false,
      authorizeLoading: true
    };
  }

  componentWillMount() {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (
            res.list.length > 0 &&
            res.list[0].access_key !== '' &&
            res.list[0].domain === 'rainbond'
          ) {
            this.setState({
              isAuthorize: true
            });
          }
          this.setState({ authorizeLoading: false });
        }
      }
    });
  }

  // Tab标签页切换
  onTabChange = value => {
    this.setState({ installType: value });
  };
  render() {
    const { onCancel, isCluster, onStartInstall, onViewInstance } = this.props;
    const { installType, isAuthorize, authorizeLoading } = this.state;
    return authorizeLoading ? (
      <Spin />
    ) : (
      <Modal
        width={600}
        centered
        keyboard={false}
        maskClosable={false}
        footer={false}
        visible
        className={styles.TelescopicModal}
        onOk={() => onCancel(true, installType)}
        onCancel={() => onCancel(false, installType)}
      >
        <h2 className={styless.initTitle}>
          {isCluster ? '恭喜你成功安装集群！' : '安装步骤'}
        </h2>
        <p style={{ textAlign: 'center' }}>
          {isCluster
            ? '第一个集群已经安装成功了，去安装应用'
            : '我们将引导您完成第一次应用安装，体验平台最基础的能力。'}
        </p>
        <div style={{ padding: '0px 90px' }}>
          <Tabs value={installType} onChange={this.onTabChange}>
            <TabPane tab="从应用市场安装应用" key="1">
              <Steps direction="vertical" current={isCluster ? 2 : 1}>
                <Step
                  title={
                    <span style={{ color: '#4D73B1', fontWeight: 'bold' }}>
                      获取授权
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isAuthorize ? success : authorize}
                    />
                  }
                  description={
                    <span style={{ color: '#000000A6' }}>
                      当前应用商店无安装权限，需要进行商店的授权
                    </span>
                  }
                />
                <Step
                  title={
                    <span
                      style={{
                        color: isAuthorize ? '#4D73B1' : '#000000A6',
                        fontWeight: 'bold'
                      }}
                    >
                      集群安装
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={
                        isCluster && isAuthorize
                          ? success
                          : isAuthorize
                          ? clusterColor
                          : cluster
                      }
                    />
                  }
                  description={
                    <span
                      style={{
                        color: isAuthorize ? '#000000A6' : '#00000073'
                      }}
                    >
                      当前暂无可用的计算资源，需要进行集群的安装
                    </span>
                  }
                />
                <Step
                  title={
                    <span
                      style={{
                        color:
                          isAuthorize && isCluster ? '#4D73B1' : '#000000A6',
                        fontWeight: 'bold'
                      }}
                    >
                      安装应用
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isAuthorize && isCluster ? installColor : install}
                    />
                  }
                  description={
                    <span style={{ color: '#00000073' }}>
                      需要可用的计算资源和商店的安装权限
                    </span>
                  }
                />
              </Steps>
            </TabPane>
            <TabPane tab="部署我自己的应用" key="2">
              <Steps direction="vertical" current={1}>
                <Step
                  title={
                    <span
                      style={{
                        color: '#4D73B1',
                        fontWeight: 'bold'
                      }}
                    >
                      集群安装
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isCluster ? success : clusterColor}
                    />
                  }
                  description={
                    <span style={{ color: '#000000A6' }}>
                      当前暂无可用的计算资源，需要进行集群的安装
                    </span>
                  }
                />
                <Step
                  title={
                    <span
                      style={{
                        color: isCluster ? '#4D73B1' : '#000000A6',
                        fontWeight: 'bold'
                      }}
                    >
                      安装应用
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isCluster ? installColor : install}
                    />
                  }
                  description={
                    <span
                      style={{ color: isCluster ? '#000000A6' : '#00000073' }}
                    >
                      进入团队，选择新增(源码、镜像、应用市场、第三方)
                    </span>
                  }
                />
              </Steps>
            </TabPane>
          </Tabs>
        </div>

        {isCluster ? (
          <p style={{ textAlign: 'center', padding: '16px 0' }}>
            <Button
              style={{ marginRight: '20px' }}
              onClick={() => onStartInstall(installType)}
              type="primary"
            >
              开始安装应用
            </Button>
            <Button onClick={() => onViewInstance()}>查看应用实例</Button>
          </p>
        ) : (
          <p style={{ textAlign: 'center', padding: '16px 0' }}>
            <Button onClick={() => onCancel(true, installType)} type="primary">
              马上开始
            </Button>
          </p>
        )}
      </Modal>
    );
  }
}

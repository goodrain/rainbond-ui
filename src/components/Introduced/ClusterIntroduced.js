import { Button, Col, Modal, Row } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from '../CreateTeam/index.less';
import styless from './index.less';

export default class ClusterIntroduced extends PureComponent {
  render() {
    const { onCancel, onOk } = this.props;

    return (
      <Modal
        width={600}
        centered
        keyboard={false}
        maskClosable={false}
        footer={false}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
      >
        <h2 className={styless.initTitle}>恭喜你成功安装集群！</h2>
        <p style={{ textAlign: 'center' }}>
          第一个集群已经安装成功了，去安装应用。
        </p>
        <Row style={{ display: 'flex', justifyContent: 'center' }}>
          <Col span={8}>
            <p style={{ textAlign: 'center' }}>
              <img
                alt="扫码加入社区钉钉群"
                style={{ width: '100%' }}
                title="扫码加入社区钉钉群"
                src="https://www.rainbond.com/images/dingding-group.jpeg"
              />
            </p>
          </Col>
          <Col span={10}>
            <p style={{ padding: '16px' }}>
              如果您对接计算资源遇到障碍，或希望了解DevOps流程、企业中台、2B应用交付、多云管理、行业云等需求场景的更多信息，请扫码加入用户社区钉钉群。
            </p>
          </Col>
        </Row>
        <p style={{ textAlign: 'center', padding: '16px 0' }}>
          <Button onClick={onOk} type="primary">
            开始安装应用
          </Button>
        </p>
      </Modal>
    );
  }
}

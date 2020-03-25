import React, { PureComponent } from 'react';
import { Modal, Button } from 'antd';
import { connect } from 'dva';
import styles from '../CreateTeam/index.less';

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class AppStore extends PureComponent {
  handleSubmit = () => {
    const { rainbondInfo, eid } = this.props;
    const domain =
      rainbondInfo && rainbondInfo.market_url && rainbondInfo.market_url.enable
        ? rainbondInfo.market_url.value
        : 'https://market.goodrain.com';
    const callback = window.location.href;
    const version =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const url = `${domain}/manage/jointcloud?join_id=${eid}&callback_url=${callback}&rbd_version=${version}`;
    window.location.href = url;
  };

  render() {
    const { onCancel } = this.props;
    return (
      <Modal
        title="绑定云端应用商店"
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            绑定
          </Button>,
        ]}
      />
    );
  }
}

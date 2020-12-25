/* eslint-disable no-useless-constructor */
import { connect } from 'dva';
import React from 'react';
import globalUtil from '../utils/global';
import styles from './UserLayout.less';

class OauthLayout extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    // 初始化 获取RainbondInfo信息
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: info => {
        if (info) {
          globalUtil.putLog(info);
        }
      }
    });
  }

  render() {
    const { rainbondInfo, children } = this.props;
    if (!rainbondInfo) {
      return null;
    }
    return <div className={styles.container}>{children}</div>;
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  nouse: global.nouse
}))(OauthLayout);

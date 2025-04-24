import React, { Component } from 'react';
import wechat from '../../../public/images/wechat.jpg';
import globalUtil from '../../utils/global';
import styles from './index.less';

export default class CustomerServiceFloat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false
    };
  }

  handleMouseEnter = () => {
    this.setState({ hover: true });
  };

  handleMouseLeave = () => {
    this.setState({ hover: false });
  };

  render() {
    const { hover } = this.state;
    return (
      <div className={styles.floatStyle}>
        <div
          className={styles.iconBox + (hover ? ' ' + styles.iconBoxHover : '')}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          {globalUtil.fetchSvg('serviceSvg', '#fff', 32)}
        </div>
        {hover && (
          <div
            className={styles.qrBox}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
          >
            <img src={wechat} alt="联系客服获取支持" className={styles.qrImgStyle} />
            <div style={{ marginTop: 8, color: '#333', fontSize: 14 }}>联系客服获取支持</div>
          </div>
        )}
      </div>
    );
  }
}


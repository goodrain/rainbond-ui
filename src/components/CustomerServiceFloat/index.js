import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import community from '../../../public/images/community.png';
import globalUtil from '../../utils/global';
import styles from './index.less';

export default class CustomerServiceFloat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      showDialog: true
    };
  }

  handleMouseEnter = () => {
    this.setState({ 
      hover: true,
      showDialog: false
    });
  };

  handleMouseLeave = () => {
    this.setState({ hover: false });
  };

  render() {
    const { hover, showDialog } = this.state;
    const { isSaas, customerServiceQrcode } = this.props;
    return (
      <div className={styles.floatStyle}>
      <div className={styles.dialogBox + (hover ? ' ' + styles.hidden : '')}>
        <div className={styles.dialogContent}>{formatMessage({ id: 'CustomerFloat.title' })}</div>
        <div className={styles.dialogArrow}></div>
      </div>
      
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
          <img src={isSaas ? customerServiceQrcode : community} alt={formatMessage({ id: 'CustomerFloat.title' })} className={styles.qrImgStyle} />
          <div style={{ marginTop: 8, color: '#333', fontSize: 14 }}> {isSaas ? formatMessage({ id: 'CustomerFloat.wechat_desc'}) : formatMessage({ id: 'CustomerFloat.community_desc'})} </div>
        </div>
      )}
    </div>
    );
  }
}


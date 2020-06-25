import React, { PureComponent } from 'react';
import { Modal, Button } from 'antd';
import ReactMarkdown from 'react-markdown';
import styles from './index.less';

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { app = {} } = this.props;
    this.state = {
      details: app.details,
      title: app.app_name,
    };
  }
  render() {
    const { app = {}, onOk, onCancel } = this.props;
    const { title, details } = this.state;
    return (
      <Modal
        visible
        onOk={onOk}
        onCancel={onCancel}
        footer={<Button onClick={onOk}>确定</Button>}
        title={title}
        width={700}
      >
        {app.logo ? (
          <div
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: details }}
          />
        ) : (
          <ReactMarkdown className={styles.markdown} source={details} />
        )}

        {!details && (
          <span>
            未编辑应用详情
            <a
              style={{ textAlign: 'center' }}
              target="_blank"
              href="https://t.goodrain.com"
            >
              更多应用制作请参阅社区用户文献
            </a>
          </span>
        )}
      </Modal>
    );
  }
}

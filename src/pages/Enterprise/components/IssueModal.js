import { Button, Icon, Modal } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../index.less';

export default class IssueModal extends PureComponent {
  render() {
    const { visible, title, items = [], onCancel, onOpen, labels } = this.props;
    return (
      <Modal visible={visible} title={title} footer={null} width={780} onCancel={onCancel}>
        <div className={styles.issueList}>
          {items.map(item => (
            <article className={styles.issueRow} key={item.key}>
              <span className={styles.issueIcon}>
                <Icon type={item.severity === 'critical' ? 'close-circle' : 'warning'} />
              </span>
              <div className={styles.issueContent}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>{item.owner}</small>
              </div>
              <Button type="link" onClick={() => onOpen(item)}>
                {labels.open} <Icon type="arrow-right" />
              </Button>
            </article>
          ))}
        </div>
      </Modal>
    );
  }
}

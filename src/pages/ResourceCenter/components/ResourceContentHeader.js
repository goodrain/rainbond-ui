import React, { PureComponent } from 'react';
import styles from '../index.less';

class ResourceContentHeader extends PureComponent {
  render() {
    const { meta } = this.props;

    return (
      <div className={styles.contentHeader}>
        <div>
          <h3 className={styles.contentTitle}>{meta.listTitle}</h3>
          <p className={styles.contentDescription}>{meta.listDescription}</p>
        </div>
      </div>
    );
  }
}

export default ResourceContentHeader;

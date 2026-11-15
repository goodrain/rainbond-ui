import React, { PureComponent } from 'react';
import { Icon, Popover } from 'antd';
import { t } from './messages';
import styles from './index.less';

export default class HelpLabel extends PureComponent {
  render() {
    const { label, help } = this.props;
    return (
      <span className={styles.helpLabel}>
        <span>{label}</span>
        <Popover
          title={label}
          content={<div className={styles.helpContent}>{t(help)}</div>}
          trigger={['hover', 'focus']}
          placement="topLeft"
        >
          <button
            type="button"
            className={styles.helpButton}
            aria-label={t('fieldHelp', { name: label })}
            onClick={event => event.stopPropagation()}
            onKeyPress={event => event.stopPropagation()}
          >
            <Icon type="question-circle" />
          </button>
        </Popover>
      </span>
    );
  }
}

import React from 'react';
import { Icon } from 'antd';
import styles from '../index.less';

function AsyncTextAction({ loading, danger, disabled, onClick, children, className = '' }) {
  const toneClassName = danger ? styles.resourceLinkDanger : styles.resourceLink;
  const disabledClassName = loading || disabled ? styles.resourceActionDisabled : '';
  const finalClassName = [styles.resourceActionText, toneClassName, disabledClassName, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={finalClassName}
      onClick={loading || disabled ? undefined : onClick}
    >
      {loading ? <Icon type="loading" /> : null}
      <span>{children}</span>
    </span>
  );
}

export default AsyncTextAction;

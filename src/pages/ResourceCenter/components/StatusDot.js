import React from 'react';
import { getResourceStatusMeta } from '../utils';
import styles from '../index.less';

const StatusDot = ({ status }) => {
  const { text, tone } = getResourceStatusMeta(status);
  const toneClass = tone === 'running'
    ? styles.statusDotRunning
    : tone === 'warning'
      ? styles.statusDotWarning
      : tone === 'error'
        ? styles.statusDotError
        : styles.statusDotDefault;

  return (
    <span className={`${styles.statusDot} ${toneClass}`}>
      <span className={styles.statusDotPoint} />
      <span>{text}</span>
    </span>
  );
};

export default StatusDot;

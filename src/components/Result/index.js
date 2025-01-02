import { Icon } from "antd";
import { Link } from 'dva/router';
import classNames from "classnames";
import React from "react";
import styles from "./index.less";

export default function Result({
  className,
  type,
  title,
  description,
  isGoBack,
  linkPath,
  extra,
  actions,
  ...restProps
}) {
  console.log(linkPath, 'linkPath')
  const iconMap = {
    error: <Icon className={styles.error} type="close-circle" />,
    success: <Icon className={styles.success} type="check-circle" />,
    warning: <Icon className={styles.warning} type="exclamation-circle" />,
    ing: <Icon className={`${styles.success} roundloading`} type="sync" />
  };
  const clsString = classNames(styles.result, className);
  return (
    <div className={clsString} {...restProps}>
      <div className={styles.icon}>{iconMap[type]}</div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {isGoBack && <Link to={linkPath}>去授权</Link>}
      {extra && <div className={styles.extra}>{extra}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

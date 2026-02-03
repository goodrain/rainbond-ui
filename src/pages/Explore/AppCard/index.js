import React from 'react';
import globalUtil from '../../../utils/global';
import styles from './index.less';

const AppCard = ({ app, onClick, variant = 'default' }) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(app);
    }
  };

  // 兼容两种数据结构
  const appName = app.name || app.app_name || '';
  const appDesc = app.desc || app.describe || '暂无描述';
  const appLogo = app.logo;

  // 获取版本号 - 兼容新旧两种结构
  const getVersion = () => {
    // 新结构: models[0].versions[0].appVersion
    if (app.models && app.models[0]?.versions?.[0]?.appVersion) {
      return `v${app.models[0].versions[0].appVersion}`;
    }
    // 旧结构: versions[0].app_version
    if (app.versions && app.versions.length > 0) {
      return `v${app.versions[0].app_version}`;
    }
    // maxVersion 字段
    if (app.maxVersion) {
      return `v${app.maxVersion}`;
    }
    return '';
  };

  const isCompact = variant === 'compact';
  const cardClassName = isCompact
    ? `${styles.appCard} ${styles.appCardCompact}`
    : styles.appCard;

  return (
    <div className={cardClassName} onClick={handleCardClick}>
      {isCompact ? (
        <div className={styles.appCardIconSimple}>
          {appLogo ? (
            <img src={appLogo} alt="" />
          ) : (
            globalUtil.fetchSvg('defaulAppImg')
          )}
        </div>
      ) : (
        <div className={styles.appCardIconWrapper}>
          {appLogo && (
            <div
              className={styles.appCardIconBg}
              style={{ backgroundImage: `url(${appLogo})` }}
            />
          )}
          <div className={styles.appCardIconOverlay} />
          <div className={styles.appCardIcon}>
            {appLogo ? (
              <img src={appLogo} alt="" />
            ) : (
              globalUtil.fetchSvg('defaulAppImg')
            )}
          </div>
        </div>
      )}
      <div className={styles.appCardName}>{appName}</div>
      <div className={styles.appCardVersion}>{getVersion()}</div>
      <div className={styles.appCardDesc}>{appDesc}</div>
    </div>
  );
};

export default AppCard;

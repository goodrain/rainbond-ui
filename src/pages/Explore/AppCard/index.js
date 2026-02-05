import React from 'react';
import globalUtil from '../../../utils/global';
import styles from './index.less';

const AppCard = ({ app, onClick, onInstall, type = 'market' }) => {
  const handleCardClick = () => {
    if (type === 'local' && onInstall) {
      // 本地组件库点击弹出安装弹窗
      onInstall(app);
    } else if (onClick) {
      // 外部市场点击进入详情
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

  return (
    <div className={styles.appCard} onClick={handleCardClick}>
      <div className={styles.appCardHeader}>
        <div className={styles.appCardIcon}>
          {appLogo ? (
            <img src={appLogo} alt="" />
          ) : (
            globalUtil.fetchSvg('defaulAppImg')
          )}
        </div>
        <div className={styles.appCardInfo}>
          <div className={styles.appCardName}>{appName}</div>
          <div className={styles.appCardVersion}>版本 {getVersion()}</div>
        </div>
      </div>
      <div className={styles.appCardDesc}>{appDesc}</div>
    </div>
  );
};

export default AppCard;

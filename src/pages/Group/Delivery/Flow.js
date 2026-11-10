import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { t } from './common';
import styles from './index.less';

export default class DeliveryFlow extends PureComponent {
  renderHeading = (number, title, help) => <header className={styles.flowHeading}>
    <div><span>{number}</span><h3>{t(title)}</h3></div><p>{t(help)}</p>
  </header>;
  render() {
    return <div className={styles.flow} role="img" aria-label={t('flowAccessible')}>
      <section className={styles.flowStage}>
        {this.renderHeading('01', 'simpleComponents', 'simpleComponentsHelp')}
        <div className={styles.flowVisual} aria-hidden="true"><svg className={styles.flowArtwork} viewBox="0 0 160 112" focusable="false">
          <rect className={styles.flowWindowBack} x="16" y="18" width="132" height="84" rx="9" />
          <rect className={styles.flowWindow} x="8" y="10" width="140" height="86" rx="9" />
          <path className={styles.flowWindowRule} d="M8 32 H148" />
          <circle className={styles.flowWindowDot} cx="23" cy="21" r="2.5" /><circle className={styles.flowWindowDot} cx="33" cy="21" r="2.5" /><circle className={styles.flowWindowDot} cx="43" cy="21" r="2.5" />
          <path className={styles.flowCode} d="M58 49 L43 63 L58 77 M99 49 L114 63 L99 77 M87 46 L71 80" />
        </svg></div>
      </section>
      <div className={styles.flowConnector} aria-hidden="true"><span /></div>
      <section className={styles.flowStage}>
        {this.renderHeading('02', 'simplePublish', 'simplePublishHelp')}
        <div className={styles.flowVisual} aria-hidden="true"><svg className={styles.flowArtwork} viewBox="0 0 160 112" focusable="false">
          <rect className={styles.flowSheetBack} x="25" y="8" width="112" height="84" rx="9" transform="rotate(-7 80 56)" />
          <rect className={styles.flowSheetMiddle} x="19" y="16" width="116" height="86" rx="9" transform="rotate(5 80 56)" />
          <rect className={styles.flowSheet} x="20" y="15" width="120" height="88" rx="9" />
          <rect className={styles.flowTile} x="62" y="34" width="14" height="14" rx="3" /><rect className={styles.flowTile} x="83" y="34" width="14" height="14" rx="3" />
          <rect className={styles.flowTile} x="62" y="55" width="14" height="14" rx="3" /><rect className={styles.flowTile} x="83" y="55" width="14" height="14" rx="3" />
          <rect className={styles.flowSheetLine} x="55" y="81" width="50" height="3" rx="1.5" /><rect className={styles.flowSheetLine} x="64" y="89" width="32" height="3" rx="1.5" />
        </svg></div>
      </section>
      <div className={styles.flowConnector} aria-hidden="true"><span /></div>
      <section className={styles.flowStage}>
        {this.renderHeading('03', 'simpleDelivery', 'simpleDeliveryHelp')}
        <ul className={styles.flowMethods}>
          {[['Team', 'team'], ['Market', 'shop'], ['Offline', 'export']].map(([method, icon]) => <li key={method}>
            <span className={styles.flowMethodIcon} aria-hidden="true"><Icon type={icon} /></span>
            <div><span className={styles.flowMethodCondition}>{t(`simple${method}Condition`)}</span>
              <strong>{t(`simple${method}Title`)}</strong><p>{t(`simple${method}Help`)}</p></div>
          </li>)}
        </ul>
      </section>
    </div>;
  }
}

import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

class GuideCarousel extends PureComponent {
  componentDidMount() {
    if (this.props.visible) {
      document.addEventListener('keydown', this.handleKeyDown);
      this.lockBodyScroll();
    }
  }

  componentDidUpdate(prevProps) {
    const { visible } = this.props;
    if (visible && !prevProps.visible) {
      document.addEventListener('keydown', this.handleKeyDown);
      this.lockBodyScroll();
    }
    if (!visible && prevProps.visible) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.unlockBodyScroll();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.unlockBodyScroll();
  }

  lockBodyScroll = () => {
    if (!this.originalBodyOverflow) {
      this.originalBodyOverflow = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';
  };

  unlockBodyScroll = () => {
    document.body.style.overflow = this.originalBodyOverflow || '';
  };

  handleKeyDown = e => {
    const { visible, onClose } = this.props;
    if (!visible) {
      return;
    }
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  handleClose = () => {
    const { onClose } = this.props;
    if (onClose) {
      onClose();
    }
  };

  stopPropagation = e => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  };

  renderIconContent = icon => {
    if (!icon) {
      return null;
    }
    if (typeof icon === 'string') {
      return <Icon type={icon} />;
    }
    return icon;
  };

  parseGuideItem = item => {
    if (!item) {
      return { title: '', description: '' };
    }
    if (typeof item === 'object') {
      return {
        title: item.title || '',
        description: item.description || ''
      };
    }
    const raw = String(item);
    const dividerIndex = raw.indexOf('：') > -1 ? raw.indexOf('：') : raw.indexOf(':');
    if (dividerIndex === -1) {
      return {
        title: raw,
        description: ''
      };
    }
    return {
      title: raw.slice(0, dividerIndex).trim(),
      description: raw.slice(dividerIndex + 1).trim()
    };
  };

  renderItems = (items = [], itemKey = '') => {
    if (!items.length) {
      return null;
    }
    return (
      <div className={styles.groupItemList}>
        {items.map((item, itemIndex) => {
          const parsed = this.parseGuideItem(item);
          return (
            <div key={`${itemKey}-${itemIndex}`} className={styles.groupItemCard}>
              <div className={styles.groupItemIndex}>
                {String(itemIndex + 1).padStart(2, '0')}
              </div>
              <div className={styles.groupItemContent}>
                <div className={styles.groupItemTitle}>{parsed.title}</div>
                {!!parsed.description && (
                  <div className={styles.groupItemDescription}>{parsed.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  renderGroup = (group, index) => {
    if (!group) {
      return null;
    }
    const {
      title,
      description,
      subTitle,
      items = [],
      titleIcon,
      titleHint,
      subTitleIcon,
      sections = []
    } = group;
    return (
      <div
        key={group.key || title || index}
        className={styles.groupCard}
      >
        {!!titleIcon && (
          <div className={styles.groupIconOnly}>
            <span className={styles.groupTitleIcon}>
              {this.renderIconContent(titleIcon)}
            </span>
          </div>
        )}
        {!!titleHint && <div className={styles.groupHint}>{titleHint}</div>}
        {!!sections.length ? (
          <div className={styles.groupSections}>
            {sections.map((section, sectionIndex) => (
              <div
                key={section.key || section.subTitle || sectionIndex}
                className={styles.groupSection}
              >
                {!!section.subTitle && (
                  <div className={styles.groupSubTitle}>
                    {!!section.subTitleIcon && (
                      <span className={styles.groupSubTitleIcon}>
                        {this.renderIconContent(section.subTitleIcon)}
                      </span>
                    )}
                    <span>{section.subTitle}</span>
                  </div>
                )}
                {!!section.items && !!section.items.length && (
                  this.renderItems(section.items, section.key || `${group.key || index}-${sectionIndex}`)
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            {!!subTitle && (
              <div className={styles.groupSubTitle}>
                {!!subTitleIcon && (
                  <span className={styles.groupSubTitleIcon}>
                    {this.renderIconContent(subTitleIcon)}
                  </span>
                )}
                <span>{subTitle}</span>
              </div>
            )}
            {!!items.length && (
              this.renderItems(items, group.key || index)
            )}
          </>
        )}
      </div>
    );
  };

  renderContent() {
    const { visible, title, description, groups = [] } = this.props;
    if (!visible) {
      return null;
    }

    return (
      <div className={styles.portalRoot}>
        <div className={styles.backdrop} />
        <div className={styles.dialogWrap} onClick={this.handleClose}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={this.stopPropagation}
          >
            <div className={styles.dialogHeader}>
              <button
                type="button"
                className={styles.closeButton}
                onClick={this.handleClose}
                aria-label={formatMessage({ id: 'button.close' })}
              >
                <Icon type="close" />
              </button>
            </div>
            <div className={styles.contentShell}>
              <div className={styles.heroBlock}>
                {!!title && <div className={styles.title}>{title}</div>}
                {!!description && <div className={styles.description}>{description}</div>}
              </div>
              <div className={styles.groupsRow}>
                {groups.map(this.renderGroup)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (typeof document === 'undefined') {
      return null;
    }
    return ReactDOM.createPortal(this.renderContent(), document.body);
  }
}

export default GuideCarousel;

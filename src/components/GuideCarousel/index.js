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

  renderAction = (action, position) => {
    if (!action || !action.subTitle) {
      return null;
    }

    return (
      <div className={`${styles.flowAction} ${position === 'right' ? styles.flowActionRight : styles.flowActionLeft}`}>
        {!!action.subTitleIcon && (
          <span className={styles.groupSubTitleIcon}>
            {this.renderIconContent(action.subTitleIcon)}
          </span>
        )}
        <span>{action.subTitle}</span>
      </div>
    )
  };

  renderLineLayout = group => {
    const centerIcon = group.centerIcon || group.titleIcon;

    return (
      <div className={styles.flowLayout}>
        <div className={`${styles.flowBranch} ${styles.flowBranchLeft}`}>
          <div className={styles.flowLineGroup}>
            <span className={styles.flowLineHorizontal} />
            <span className={styles.flowLineVertical} />
          </div>
          {this.renderAction(group.leftAction, 'left')}
        </div>
        <div className={styles.flowCenter}>
          {!!centerIcon && (
            <span className={styles.groupTitleIcon}>
              {this.renderIconContent(centerIcon)}
            </span>
          )}
        </div>
        <div className={`${styles.flowBranch} ${styles.flowBranchRight}`}>
          {this.renderAction(group.rightAction, 'right')}
          <div className={styles.flowLineGroup}>
            <span className={styles.flowLineVertical} />
            <span className={styles.flowLineHorizontal} />
          </div>
        </div>
      </div>
    );
  };

  renderGroup = (group, index) => {
    if (!group) {
      return null;
    }
    const {
      title,
      titleHint,
      layout
    } = group;
    return (
      <div
        key={group.key || title || index}
        className={styles.groupCard}
      >
        {!!titleHint && <div className={styles.groupHint}>{titleHint}</div>}
        {layout === 'line' && this.renderLineLayout(group)}
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

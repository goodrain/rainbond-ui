import React, { PureComponent } from 'react';

class ResourceBreadcrumbTitle extends PureComponent {
  render() {
    const { items = [], current, styles } = this.props;

    return (
      <span className={styles.pageHeaderBreadcrumbTrail}>
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            <button
              type="button"
              className={styles.pageHeaderBreadcrumbLink}
              onClick={item.onClick}
            >
              {item.label}
            </button>
            <span className={styles.pageHeaderBreadcrumbSeparator}>/</span>
          </React.Fragment>
        ))}
        <span className={styles.pageHeaderBreadcrumbCurrent}>{current}</span>
      </span>
    );
  }
}

export default ResourceBreadcrumbTitle;

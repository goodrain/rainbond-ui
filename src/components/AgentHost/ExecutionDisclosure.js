import React, { PureComponent } from 'react';
import { Icon } from 'antd';

/** Follow activity until the reader explicitly chooses an open/closed state. */
export default class ExecutionDisclosure extends PureComponent {
  state = {
    active: !!this.props.active,
    expanded:
      this.props.defaultExpanded !== undefined
        ? !!this.props.defaultExpanded
        : !!this.props.active,
    manuallyToggled: false
  };

  static getDerivedStateFromProps(props, state) {
    const active = !!props.active;
    if (active === state.active) return null;
    return {
      active,
      expanded:
        props.expanded !== undefined || state.manuallyToggled || props.followActivity === false
          ? state.expanded
          : active
    };
  }

  open = (afterOpen) => {
    if (this.props.expanded !== undefined) {
      if (this.props.onToggle) this.props.onToggle(true);
      return;
    }
    this.setState({ expanded: true, manuallyToggled: true }, () => {
      if (typeof afterOpen === 'function') afterOpen(this.content);
    });
  };

  toggle = (event) => {
    const expanded = !(this.props.expanded !== undefined ? this.props.expanded : this.state.expanded);
    if (this.props.expanded === undefined) this.setState({ expanded, manuallyToggled: true });
    if (this.props.onToggle) this.props.onToggle(expanded, event && event.currentTarget);
  };

  render() {
    const {
      id,
      className,
      toggleClassName,
      contentClassName,
      icon,
      title,
      extra,
      trailingChevron,
      children
    } = this.props;
    const expanded = this.props.expanded !== undefined ? this.props.expanded : this.state.expanded;
    return (
      <div className={className}>
        <button
          type="button"
          className={toggleClassName}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={this.toggle}
        >
          {!trailingChevron ? <Icon type={expanded ? 'down' : 'right'} /> : null}
          {icon}
          <span>{title}</span>
          {extra}
          {trailingChevron ? <Icon type={expanded ? 'down' : 'right'} /> : null}
        </button>
        {/* Keep reader choices in nested disclosures when the outer log closes. */}
        <div id={id} className={contentClassName} hidden={!expanded}
          ref={(element) => { this.content = element; }}>
          {children}
        </div>
      </div>
    );
  }
}

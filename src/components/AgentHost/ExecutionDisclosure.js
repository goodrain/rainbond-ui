import React, { PureComponent } from 'react';
import { Icon } from 'antd';

/** Follow activity until the reader explicitly chooses an open/closed state. */
export default class ExecutionDisclosure extends PureComponent {
  state = {
    active: !!this.props.active,
    expanded: !!this.props.active,
    manuallyToggled: false,
  };

  static getDerivedStateFromProps(props, state) {
    const active = !!props.active;
    if (active === state.active) return null;
    return {
      active,
      expanded: state.manuallyToggled ? state.expanded : active,
    };
  }

  toggle = () => {
    this.setState(state => ({ expanded: !state.expanded, manuallyToggled: true }));
  };

  render() {
    const { id, className, toggleClassName, contentClassName, icon, title, extra, children } = this.props;
    const { expanded } = this.state;
    return (
      <div className={className}>
        <button
          type="button"
          className={toggleClassName}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={this.toggle}
        >
          <Icon type={expanded ? 'down' : 'right'} />
          {icon}
          <span>{title}</span>
          {extra}
        </button>
        {/* Keep reader choices in nested disclosures when the outer log closes. */}
        <div id={id} className={contentClassName} hidden={!expanded}>{children}</div>
      </div>
    );
  }
}

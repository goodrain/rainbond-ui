import React, { Component } from 'react';

class VirtualList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollTop: 0,
      containerHeight: 0
    };
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.updateContainerHeight();
    window.addEventListener('resize', this.updateContainerHeight);
    if (this.props.autoScrollToBottom) {
      this.scrollToBottom();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.items.length !== this.props.items.length && this.props.autoScrollToBottom) {
      this.scrollToBottom();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateContainerHeight);
  }

  updateContainerHeight = () => {
    if (this.containerRef.current) {
      this.setState({
        containerHeight: this.containerRef.current.clientHeight
      });
    }
  };

  scrollToBottom = () => {
    if (this.containerRef.current) {
      const { items, itemHeight } = this.props;
      const maxScrollTop = Math.max(0, items.length * itemHeight - this.state.containerHeight);
      this.containerRef.current.scrollTop = maxScrollTop;
    }
  };

  handleScroll = (e) => {
    this.setState({ scrollTop: e.target.scrollTop });
  };

  render() {
    const { items, itemHeight, renderItem, className, style } = this.props;
    const { scrollTop, containerHeight } = this.state;

    const totalHeight = items.length * itemHeight;
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);
    const visibleItems = items.slice(startIndex, endIndex);

    return (
      <div
        ref={this.containerRef}
        className={className}
        style={{
          ...style,
          overflow: 'auto',
          position: 'relative'
        }}
        onScroll={this.handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: startIndex * itemHeight,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              return renderItem(item, actualIndex);
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default VirtualList;
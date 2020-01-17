import React from "react";
import { connect } from "dva";

class IsPubClund extends React.PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: "global/fetchIsPublic"
    });
  }
  render() {
    const { IsPubClund, children } = this.props;

    if (IsPubClund === null) {
      return null;
    }

    return children;
  }
}

export default connect(({ global }) => {
  return {
    IsPubClund: global.isPubCloud
  };
})(IsPubClund);

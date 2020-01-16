import React from "react";
import axios from "axios";
import { connect } from "dva";

class Index extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      inited: false,
    };
  }
  componentDidMount() {
    this.props.dispatch({
      type: "global/fetchRainbondInfo",
      callback: (info) => {
        if (info) {
          this.setState({ inited: true });
          this.putLog(info);
        }
      },
    });
  }
  putLog = (info) => {
    // Solemnly declare:
    // Collect active user information only from the user's browser and do not involve any sensitive data.
    if (!info) {
      return 
    }
    try {
      const defaultOptions = {
        credentials: "same-origin",
      };
      defaultOptions.url = "https://log.rainbond.com/log";
      defaultOptions.method = "post";
      defaultOptions.data = JSON.stringify({
        url: window.location.href, 
        eid: info.eid,
        e_name: info.enterprise_name,
        version: info.version,
        title: info.title,
      });
      axios(defaultOptions);
    } catch (e) {
    }
  };
  render() {
    const { rainbondInfo } = this.props;

    if (!rainbondInfo) {
      return null;
    }
    return this.props.children;
  }
}

export default connect(({ global }) => ({ rainbondInfo: global && global.rainbondInfo }))(Index);

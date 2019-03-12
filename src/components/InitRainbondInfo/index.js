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
        this.setState({ inited: true });
        this.putLog(info.eid || "", info.enterprise_name || "");
      },
    });
  }
  putLog = (eid, enterprise_name) => {
    try{
      const defaultOptions = {
        credentials: "same-origin",
      };
      defaultOptions.url = "https://log.rainbond.com/log";
      defaultOptions.method = "post";
      defaultOptions.data = JSON.stringify({ url: window.location.href, eid:eid, e_name:enterprise_name });
      defaultOptions.credentials = "same-origin";
      axios(defaultOptions);
    }catch(e){      
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

export default connect(({ global }) => ({ rainbondInfo: global.rainbondInfo }))(Index);

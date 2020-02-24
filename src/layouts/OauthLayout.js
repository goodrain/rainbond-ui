import React from "react";
import { connect } from "dva";
import styles from "./UserLayout.less";
import globalUtil from "../utils/global";

class OauthLayout extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    //初始化 获取RainbondInfo信息
    const {dispatch} = this.props;
    dispatch({
      type: "global/fetchRainbondInfo",
      callback: info => {
        if (info) {
          globalUtil.putLog(info)
        }
      }
    });
  }

  render() {
    const { rainbondInfo, nouse,children } = this.props;
    if (!rainbondInfo) {
      return null;
    }
    return (
        <div className={styles.container}>
          {children}
        </div>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  nouse: global.nouse
}))(OauthLayout);

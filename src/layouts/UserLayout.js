import React from "react";
import { Link } from "dva/router";
import { connect } from "dva";
import styles from "./UserLayout.less";
import globalUtil from "../utils/global";


class UserLayout extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    //初始化 获取RainbondInfo信息
    this.props.dispatch({
      type: "global/fetchRainbondInfo",
      callback: info => {
        if (info) {
          globalUtil.putLog(info)
        }
      }
    });
  }
  render() {
    const { rainbondInfo, nouse ,children } = this.props;
    if (!rainbondInfo) {
      return null;
    }
    return (
        <div className={styles.container}>
          <div className={styles.content}>
            {!nouse && (
              <div className={styles.top}>
                <div className={styles.header}>
                  <Link to="/">
                    <h1 className={styles.titles}>{rainbondInfo && rainbondInfo.enterprise_name ? rainbondInfo.enterprise_name: "Rainbond"}</h1>
                  </Link>
                </div>
                <div className={styles.desc}>
                  以企业云原生应用开发、架构、运维、共享、交付为核心的Kubernetes多云赋能平台
                </div>
              </div>
            )}
            <div>
               {children}
            </div>
          </div>
        </div>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  nouse: global.nouse,
}))(UserLayout);

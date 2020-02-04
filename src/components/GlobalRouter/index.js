import React, { PureComponent } from "react";
import { Icon } from "antd";
import styles from "./index.less";

export default class GlobalRouter extends PureComponent {
  constructor(props) {
    super(props);
  }

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };

  triggerResizeEvent = () => {
    // eslint-disable-line
    const event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, false);
    window.dispatchEvent(event);
  };

  render() {
    const { collapsed } = this.props;
    return (
      <div style={{ background: "#fff" }}>
        <Icon
          className={styles.trigger}
          type={collapsed ? "menu-unfold" : "menu-fold"}
          onClick={this.toggle}
        />
        <ul className={styles.triggerRouter}>
          <li>
            <Icon type="dashboard" />
            <div>总览</div>
          </li>
          <li>
            <Icon type="dashboard" />
            <div>组件库</div>
          </li>
          <li>
            <Icon type="dashboard" />
            <div>服务库</div>
          </li>
          <li>
            <Icon type="dashboard" />
            <div>团队</div>
          </li>
          <li>
            <Icon type="dashboard" />
            <div>设置</div>
          </li>
        </ul>
      </div>
    );
  }
}

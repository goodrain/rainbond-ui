import React, { PureComponent, createElement } from "react";
import PropTypes from "prop-types";
import { Button, Icon } from "antd";
import styles from "./index.less";
import { Link } from "../../../node_modules/dva/router";

// TODO: 添加逻辑

class EditableLinkGroup extends PureComponent {
  static propTypes = {
    links: PropTypes.array,
    onAdd: PropTypes.func,
    linkElement: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  };
  static defaultProps = {
    links: [],
    onAdd: () => {},
    linkElement: "a",
  };

  render() {
    const { links, linkElement, onAdd } = this.props;
    return (
      <div className={styles.linkGroup}>
        {links.map(link => (
          // createElement(linkElement, {
          //   key: `linkGroup-item-${link.id || link.title}`,
          //   to: link.href,
          //   href: link.href,
          // }, link.title)
          <Link to={link.href}>
            {link.icontype && <Icon style={{ marginRight: 8 }} type={link.icontype} />}
            {link.title}
          </Link>
        ))}
      </div>
    );
  }
}

export default EditableLinkGroup;

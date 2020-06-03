import React from "react";
import { Link } from "dva/router";
import { DefaultFooter } from "@ant-design/pro-layout";
import PageHeader from "../components/PageHeader";
import styles from "./PageHeaderLayout.less";
import rainbondUtil from "../utils/rainbond";

export default ({ children, wrapperClassName, top, ...restProps }) => (
  <div style={{ margin: "-24px -24px 0" }} className={wrapperClassName}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={styles.content}>{children}</div> : null}
    {rainbondUtil.isEnableDefaultFooter() && (
      <DefaultFooter
        copyright="© 2020 北京好雨科技有限公司"
        links={[
          {
            key: "price",
            href: "https://goodrain.goodrain.com/page/price",
            title: "价格",
            blankTarget: true
          },
          {
            key: "agreement",
            href: "https://goodrain.goodrain.com/page/agreement",
            title: "服务条款",
            blankTarget: true
          },
          {
            key: "sla",
            href: "https://goodrain.goodrain.com/page/sla",
            title: "服务SLA",
            blankTarget: true
          }
        ]}
      />
    )}
  </div>
);

import React from "react";
import { Spin } from "antd";

// loading components from code split
// https://umijs.org/plugin/umi-plugin-react.html#dynamicimport
export default () => (
  <div style={{ paddingTop: 100, textAlign: "center" ,background:' @rbd-background-color'}}>
    <Spin size="large" />
  </div>
);

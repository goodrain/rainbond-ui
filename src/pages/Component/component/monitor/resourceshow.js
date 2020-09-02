import React, { Fragment, PureComponent } from "react";
import CustomChart from "@/components/CustomChart";

export default class ResourceShow extends PureComponent {
  render() {
    return (
      <Fragment>
        <CustomChart
          RangeData={[
            "containerMem",
            "containerCpu",
            "containerNetR",
            "containerNetT"
          ]}
          moduleName="ResourceMonitoring"
        />
      </Fragment>
    );
  }
}

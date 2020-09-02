import React, { Fragment, PureComponent } from "react";
import CustomChart from "@/components/CustomChart";

export default class MonitorHistory extends PureComponent {
  render() {
    const { appAlias } = this.props;
    return (
      <Fragment>
        <CustomChart
          moduleName="PerformanceAnalysis"
          RangeData={["responseTime", "throughput", "numberOnline"]}
          appAlias={appAlias}
        />
      </Fragment>
    );
  }
}

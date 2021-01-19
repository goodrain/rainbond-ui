import CustomChart from '@/components/CustomChart';
import React, { Fragment, PureComponent } from 'react';

export default class ResourceShow extends PureComponent {
  render() {
    return (
      <Fragment>
        <CustomChart
          RangeData={[
            'containerMem',
            'containerCpu',
            'containerNetR',
            'containerNetT'
          ]}
          moduleName="ResourceMonitoring"
        />
      </Fragment>
    );
  }
}

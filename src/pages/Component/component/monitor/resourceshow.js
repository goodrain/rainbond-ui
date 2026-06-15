import CustomChart from '@/components/CustomChart';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';

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
          title={<FormattedMessage id='componentOverview.body.tab.monitor.monitoring' />}
        />
      </Fragment>
    );
  }
}

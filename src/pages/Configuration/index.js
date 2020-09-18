/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import ConfigurationHeader from './Header';
import ConfigurationTable from './Table';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
/* eslint react/no-array-index-key: 0 */

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
export default class Configuration extends PureComponent {
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match
    } = this.props;
    const { teamName, regionName, appID } = match.params;
    const parameter = {
      regionName,
      teamName,
      appID
    };
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    return (
      <ConfigurationHeader
        breadcrumbList={breadcrumbList}
      >
        <ConfigurationTable {...parameter} />
      </ConfigurationHeader>
    );
  }
}

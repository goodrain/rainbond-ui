import React, { Fragment } from 'react';
import SelectTeam from '../../components/SelectTeam';
import headerStype from '../../components/GlobalHeader/index.less';
import { Spin } from 'antd';
import { Link } from 'dva/router';

export default function TeamHeader(props) {
  const {
    teamName,
    currentEnterprise,
    currentTeam,
    currentRegion,
    nobleIcon,
    upDataHeader
  } = props;

  return (
    <div className={headerStype.itemBox}>
      {upDataHeader ? (
        <Spin size="large" />
      ) : (
        <div>
          <div className={headerStype.item}>
          {nobleIcon}
            <Link
              className={headerStype.itemlink}
              to={`/enterprise/${currentEnterprise.enterprise_id}/personal`}
            >
              {currentEnterprise && currentEnterprise.enterprise_alias}
            </Link>
            <span className={headerStype.itemseparator}>></span>
          </div>

          <SelectTeam
            active
            upDataHeader={upDataHeader}
            className={headerStype.select}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
          />
        </div>
      )}
    </div>
  );
}

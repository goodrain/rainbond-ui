import React, { Fragment } from 'react';
import SelectTeam from '../../components/SelectTeam';
import headerStype from '../../components/GlobalHeader/index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Spin } from 'antd';
import { Link } from 'dva/router';

export default function TeamHeader(props) {
  const {
    teamName,
    currentEnterprise,
    currentTeam,
    currentRegion,
    nobleIcon,
    upDataHeader,
    changeTeam
  } = props;
  return (
    <div className={headerStype.itemBox}>
      {upDataHeader ? (
        <Spin size="large" />
      ) : (
        <div className={headerStype.breadCrumb}>
          <div className={headerStype.item}>
          {nobleIcon}
            <Link
              className={headerStype.itemlink}
              to={`/enterprise/${currentEnterprise.enterprise_id}/personal`}
            >
              {/* {currentEnterprise && currentEnterprise.enterprise_alias} */}
            {formatMessage({id:'enterpriseTeamManagement.other.personal'})}
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
            changeTeam={changeTeam}
          />
        </div>
      )}
    </div>
  );
}

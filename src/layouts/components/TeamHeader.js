import React, { Fragment } from 'react';
import SelectTeam from '../../components/SelectTeam';
import headerStype from '../../components/GlobalHeader/index.less';
import { formatMessage } from '@/utils/intl';
import { Spin, Icon } from 'antd';
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
        <Spin size="small" />
      ) : (
        <div className={headerStype.breadCrumb}>
          <div style={{ padding: '0 4px', fontSize: 14, fontWeight: 600, color:'rgb(16 24 40/0.14)' }}>
            /
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

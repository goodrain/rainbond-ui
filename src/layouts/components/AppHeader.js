import { Icon, Spin } from 'antd';
import { Link } from 'dva/router';
import React from 'react';
import headerStype from '../../components/GlobalHeader/index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import SelectApp from '../../components/SelectApp';
import SelectComponent from '../../components/SelectComponent';
import SelectTeam from '../../components/SelectTeam';
import styles from './AppHeader.less';

export default function AppHeader(props) {
  const {
    teamName,
    currentEnterprise,
    currentTeam,
    currentRegion,
    appID,
    currentComponent,
    nobleIcon,
    upDataHeader,
    handleClick,
    changeTeam
  } = props;
  return (
    <div className={headerStype.itemBox}>
      {upDataHeader ? (
        <Spin size="large" />
      ) : (

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SelectTeam
            active={false}
            className={headerStype.select}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
            changeTeam={changeTeam}
          />
          <div style={{ padding: '0 6px' ,fontSize:14,fontWeight: 600}}>
              /
          </div>
          <SelectApp
            handleClick={handleClick}
            active={currentComponent == undefined}
            className={headerStype.select}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
            currentAppID={appID}
            currentComponent={currentComponent}
          />
        </div>
      )}
    </div>
  );
}

import { Spin } from 'antd';
import { Link } from 'dva/router';
import React from 'react';
import headerStype from '../../components/GlobalHeader/index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import SelectApp from '../../components/SelectApp';
import SelectComponent from '../../components/SelectComponent';
import SelectTeam from '../../components/SelectTeam';

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
        <div>
          <SelectTeam
            active={false}
            className={headerStype.select}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
            changeTeam={changeTeam}
          />
          <div className={headerStype.item}>
            <span className={headerStype.itemseparator}>></span>
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
          {currentComponent && (
            <div className={headerStype.item}>
              <span className={headerStype.itemseparator}>></span>
            </div>
          )}
          {currentComponent && (
            <SelectComponent
              active
              className={headerStype.select}
              teamName={teamName}
              currentEnterprise={currentEnterprise}
              currentTeam={currentTeam}
              currentRegion={currentRegion}
              currentAppID={appID}
              currentComponent={currentComponent}
            />
          )}
        </div>
      )}
    </div>
  );
}

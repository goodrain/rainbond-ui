import { Icon, Spin } from 'antd';
import { Link } from 'dva/router';
import React from 'react';
import headerStype from '../../components/GlobalHeader/index.less';
import { formatMessage } from '@/utils/intl';
import SelectApp from '../../components/SelectApp';
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
  // 获取地址栏 hash 中的 apps 参数
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf('?');
  const hashQuery = hashQueryIndex !== -1 ? hash.slice(hashQueryIndex + 1) : '';
  const urlParams = new URLSearchParams(hashQuery);
  const appsParam = urlParams.get('apps');
  
  return (
    <div className={headerStype.itemBox}>
      {upDataHeader ? (
        <Spin size="small" />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ padding: '0 6px', fontSize: 14, fontWeight: 600, color:'rgb(16 24 40/0.14)' }}>
            /
          </div>
          <SelectTeam
            active={false}
            className={headerStype.select}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
            changeTeam={changeTeam}
          />
          <div style={{ padding: '0 6px', fontSize: 14, fontWeight: 600 , color:'rgb(16 24 40/0.14)'}}>
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
            currentAppID={appID || appsParam}
            currentComponent={currentComponent}
          />
        </div>
      )}
    </div>
  );
}

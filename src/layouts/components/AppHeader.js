import React, { Fragment } from "react";
import { Icon, Button } from "antd";
import SelectApp from "../../components/SelectApp";
import SelectTeam from "../../components/SelectTeam";
import SelectComponent from "../../components/SelectComponent";
import headerStype from "../../components/GlobalHeader/index.less";
import { FormattedMessage } from "umi-plugin-react/locale";
import { Link } from "dva/router";

export default function TeamHeader(props) {
  const {
    teamName,
    currentEnterprise,
    currentTeam,
    currentRegion,
    regionName,
    appID,
    currentComponent,
    componentID
  } = props;

  return (
    <div className={headerStype.itemBox}>
      <div className={headerStype.item}>
        <Link
          className={headerStype.itemlink}
          to={`/enterprise/${currentEnterprise.enterprise_id}/index`}
        >
          {currentEnterprise && currentEnterprise.enterprise_alias}
        </Link>
        <span className={headerStype.itemseparator}>></span>
      </div>
      <SelectTeam
        active={false}
        className={headerStype.select}
        teamName={teamName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
      />
      <div className={headerStype.item}>
        <span className={headerStype.itemseparator}>></span>
      </div>
      <SelectApp
        active={currentComponent == undefined}
        className={headerStype.select}
        teamName={teamName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
        currentAppID={appID}
        currentComponent={currentComponent}
      />
      {currentComponent &&
        <div className={headerStype.item}>
          <span className={headerStype.itemseparator}>></span>
        </div>}
      {currentComponent &&
        <SelectComponent
          active={true}
          className={headerStype.select}
          teamName={teamName}
          currentEnterprise={currentEnterprise}
          currentTeam={currentTeam}
          currentRegion={currentRegion}
          currentAppID={appID}
          currentComponent={currentComponent}
        />}
    </div>
  );
}

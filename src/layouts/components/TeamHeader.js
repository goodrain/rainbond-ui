import React, { Fragment } from "react";
import SelectTeam from "../../components/SelectTeam";
import headerStype from "../../components/GlobalHeader/index.less";
import { Link } from "dva/router";

export default function TeamHeader(props) {
  const {
    teamName,
    currentEnterprise,
    currentTeam,
    currentRegion,
    regionName
  } = props;
  return (
    <div className={headerStype.itemBox}>
      <div 
        className={headerStype.item}
      >
        <Link className={headerStype.itemlink} to={`/enterprise/${currentEnterprise.enterprise_id}/index`}>{currentEnterprise && currentEnterprise.enterprise_alias}</Link>
        <span className={headerStype.itemseparator}>></span>
      </div>
      <SelectTeam
        active={true}
        className={headerStype.select}
        teamName={teamName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
      />
    </div>
  );
}

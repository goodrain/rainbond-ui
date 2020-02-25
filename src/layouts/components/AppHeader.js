import React, { Fragment } from "react";
import { Icon, Button } from "antd";
import SelectApp from "../../components/SelectApp";
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
  const link = (
    <Link to={`/team/${currentTeam.team_name}/region/${regionName}/index`}>
      <Button
        size="small"
        style={{
          float: "left",
          margin: "20px 0 20px 24px",
          background: "#1890ff",
          color: "#ffffff",
          border: "none"
        }}
      >
        <Icon type="left" />
        <FormattedMessage id="header.app.re" />
      </Button>
    </Link>
  );
  return (
    <div>
      {link}
      <SelectApp
        className={headerStype.select}
        teamName={teamName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
        currentAppID={appID}
      />
      <SelectComponent
        className={headerStype.select}
        teamName={teamName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
        currentAppID={appID}
        currentComponent={currentComponent}
      />
    </div>
  );
}

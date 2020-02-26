import React, { Fragment } from "react";
import { Icon, Button } from "antd";
import SelectTeam from "../../components/SelectTeam";
import SelectRegion from "../../components/SelectRegion";
import headerStype from "../../components/GlobalHeader/index.less";
import { FormattedMessage } from "umi-plugin-react/locale";
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
    <div>
      <Link to={`/enterprise/${currentEnterprise.enterprise_id}/index`}>
        <Button
          size="small"
          style={{
            float: "left",
            margin: "17px 0px 20px 24px",
            background: "#ffffff",
            color: "#333333",
            border: "none",
            padding: "0 8px",
            height: "30px"
          }}
        >
          <Icon type="left" />
          <FormattedMessage id="header.team.re" />
        </Button>
      </Link>
      <SelectTeam
        className={headerStype.select}
        teamName={teamName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
      />
      <SelectRegion
        className={headerStype.select}
        regionName={regionName}
        currentEnterprise={currentEnterprise}
        currentTeam={currentTeam}
        currentRegion={currentRegion}
      />
    </div>
  );
}

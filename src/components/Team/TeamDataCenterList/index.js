import React, { PureComponent } from "react";
import { connect } from "dva";
import { Card, Avatar } from "antd";
import moment from "moment";
import styles from "./index.less";
import teamUtil from "../../../utils/team";
import rainbondUtil from "../../../utils/rainbond";
import globalUtil from "../../../utils/global";
import userUtil from "../../../utils/user";
import OpenRegion from "../../OpenRegion";

@connect(({ teamControl, loading, user, global }) => ({
  regions: teamControl.regions,
  currUser: user.currentUser,
  projectLoading: loading.effects["project/fetchNotice"],
  activitiesLoading: loading.effects["activities/fetchList"],
  rainbondInfo: global.rainbondInfo
}))
export default class DatacenterList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      openRegion: false
    };
  }
  componentDidMount() {
    this.fetchRegions();
  }
  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };
  cancelOpenRegion = () => {
    this.setState({ openRegion: false });
  };
  handleOpenRegion = regions => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/openRegion",
      payload: {
        team_name,
        region_names: regions.join(",")
      },
      callback: () => {
        this.fetchRegions();
        this.props.dispatch({ type: "user/fetchCurrent" });
      }
    });
  };
  fetchRegions = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    dispatch({
      type: "teamControl/fetchRegions",
      payload: {
        team_name: teamName
      }
    });
  };
  render() {
    const { regions, currUser, projectLoading, rainbondInfo } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, teamName);
    return (
      <div>
        <Card
          className={styles.projectList}
          style={{
            marginBottom: 24
          }}
          title="已开通数据中心"
          bordered={false}
          extra={
            teamUtil.canAddRegion(team) &&
            rainbondUtil.openDataCenterStatusEnable(rainbondInfo) ? (
              <a href="javascript:;" onClick={this.onOpenRegion}>
                {" "}
                开通数据中心{" "}
              </a>
            ) : null
          }
          loading={projectLoading}
          bodyStyle={{
            padding: 0
          }}
        >
          {(regions || []).map(item => (
            <Card.Grid className={styles.projectGrid} key={item.ID}>
              <Card
                bodyStyle={{
                  padding: 0
                }}
                bordered={false}
              >
                <Card.Meta
                  title={
                    <div className={styles.cardTitle}>
                      <Avatar size="small" src={item.logo} />
                      <a href="javascript:;">{item.region_alisa}</a>
                    </div>
                  }
                  description={item.desc || "-"}
                />
                <div className={styles.projectItemContent}>
                  <span className={styles.datetime}>
                    开通于 {moment(item.create_time).format("YYYY年-MM月-DD日")}
                  </span>
                </div>
              </Card>
            </Card.Grid>
          ))}
          {!regions || !regions.length ? (
            <p
              style={{
                textAlign: "center",
                paddingTop: 20
              }}
            >
              暂无数据中心
            </p>
          ) : (
            ""
          )}
        </Card>
        {this.state.openRegion && (
          <OpenRegion
            onSubmit={this.handleOpenRegion}
            onCancel={this.cancelOpenRegion}
          />
        )}
      </div>
    );
  }
}

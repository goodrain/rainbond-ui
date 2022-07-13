import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Card } from "antd";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import UploadJarWarForm from "../../components/UploadYaml";
import TopUpHints from '../../components/TopUpHints';

@connect(({ user, global }) => ({ currUser: user.currentUser, groups: global.groups }))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      codeType: "Git",
      showUsernameAndPass: false,
      showKey: false,
      addGroup: false,
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = (vals) => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: "application/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
      },
      callback: (group) => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName(),
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            },
          });
        }
      },
    });
  };
  hideShowKey = () => {
    this.setState({ showKey: false });
  };

  handleSubmit = (value,event_id) => {
    const { form, dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const regionName = globalUtil.getCurrRegionName()
    dispatch({
        type: "createApp/createJarWarFormSubmit",
        payload: {
          region_name: regionName,
          team_name: teamName,
          event_id,
          ...value
        },
        callback: (data) => {
        //   const appAlias = data && data.bean.service_alias
        //   this.props.setPare(event_id);
        //   this.props.handleType && this.props.handleType === "Service" ? this.props.handleServiceGetData(appAlias):
        //   dispatch(
        //     routerRedux.push(
        //       `/team/${teamName}/region/${regionName}/create/create-check/${appAlias}?event_id=${event_id}`
        //     )
        //   );
        },
    });
  };
  render() {
          const image = decodeURIComponent( this.props.handleType && this.props.handleType === "Service" ? "" : (this.props.match.params.image || ""));
    return (
      <Card>
        <TopUpHints /> 
        <div className={styles.formWrap} style={{width:this.props.handleType && this.props.handleType === "Service" ? "auto" : "500px"}}>
          <UploadJarWarForm data={{ docker_cmd: image || "" }} onSubmit={this.handleSubmit} {...this.props}/>
        </div>
      </Card>
    );
  }
}

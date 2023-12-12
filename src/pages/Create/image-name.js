import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Card } from "antd";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import ImageNameForm from "../../components/ImageNameForm";
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
      localImageList: []
    };
  }
  componentDidMount(){
    this.handleGetImageRepositories()
  }
  handleGetImageRepositories = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'createApp/getImageRepositories',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            localImageList: data.list
          });
        }
      }
    })
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
  handleSubmit = (value) => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "createApp/createAppByDockerrun",
      payload: {
        team_name: teamName,
        image_type: "docker_image",
        ...value,
      },
      callback: (data) => {
        const appAlias = data && data.bean.service_alias;
        this.props.handleType && this.props.handleType === "Service" ? this.props.handleServiceGetData(appAlias):
        this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`));
      },
    });
  };
  render() {
          const image = decodeURIComponent(this.props.handleType && this.props.handleType === "Service" ? "" : (this.props.match.params.image || ""));
          const { localImageList } = this.state
    return (
      <Card>
        <TopUpHints />
        <div className={styles.formWrap} style={{width:this.props.handleType&&this.props.handleType==="Service"?"auto":"600px"}}>
          <ImageNameForm 
            localList={localImageList} 
            data={{ docker_cmd: image || "" }} 
            onSubmit={this.handleSubmit} 
            {...this.props}
          />
        </div>
      </Card>
    );
  }
}

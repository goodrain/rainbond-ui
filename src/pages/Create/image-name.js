import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Card } from "antd";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import roleUtil from '../../utils/newRole';
import ImageNameForm from "../../components/ImageNameForm";
import TopUpHints from '../../components/TopUpHints';

@connect(({ user, global }) => ({ 
  currUser: user.currentUser, 
  groups: global.groups,
  rainbondInfo: global.rainbondInfo,
}))
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
  componentDidMount() {
    const { rainbondInfo } = this.props
    const isSaas = rainbondInfo?.is_saas || false;
    if(!isSaas) {
      this.handleGetImageRepositories()
    }
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
        this.props.handleType && this.props.handleType === "Service" ? this.props.handleServiceGetData(appAlias) :
          this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`));
      },
    });
  };

  // 创建新应用
  installApp = (vals) => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    dispatch({
      type: 'application/addGroup',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_name: vals.group_name,
        k8s_app: vals.k8s_app,
        note: '',
      },
      callback: (res) => {
        if(res && res.group_id){
          roleUtil.refreshPermissionsInfo()
          vals.group_id = res.group_id
          this.handleSubmit(vals)
        }
      },
      handleError: () => {
        
      }
    })
  }

  handleInstallApp = (value) => {
    if(value.group_id){
      // 已有应用
      this.handleSubmit(value)
    } else {
      // 新建应用再创建组件
      this.installApp(value)
    }
  };
  render() {
    const image = decodeURIComponent(this.props.handleType && this.props.handleType === "Service" ? "" : (this.props.match?.params?.image || ""));
    const { localImageList } = this.state
    return (
      <Card bordered={this.props.handleType && this.props.handleType === 'Service' ? false : true}>
        <TopUpHints />
        <div className={styles.formWrap} style={{ width:"600px" }}>
          <ImageNameForm
            localList={localImageList}
            data={{ docker_cmd: image || "" }}
            onSubmit={this.handleInstallApp}
            {...this.props}
          />
        </div>
      </Card>
    );
  }
}

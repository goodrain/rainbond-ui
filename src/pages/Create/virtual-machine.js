import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification,
  Select,
  Input,
  Modal
} from "antd";
import styles from "./Index.less";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";
import ImageVirtualMachineForm from "../../components/ImageVirtualMachineForm";
import TopUpHints from '../../components/TopUpHints';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 9
  },
  wrapperCol: {
    span: 15
  }
};

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  groups: global.groups
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      codeType: "Git",
      showUsernameAndPass: false,
      showKey: false,
      addGroup: false,
      virtualMachineImage: []
    };
  }

  componentDidMount(){
    this.handleGetVirtualMachineImage()
  }

  handleGetVirtualMachineImage = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "createApp/getAppByVirtualMachineImage",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            virtualMachineImage: data.list
          });
        }
      }
    });
  }

  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = vals => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: "application/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: group => {
        if (group) {
          //获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };
  hideShowKey = () => {
    this.setState({ showKey: false });
  };
  handleSubmit = (value, event_id) => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "createApp/createAppByVirtualMachine",
      payload: {
        team_name: teamName,
        event_id,
        ...value
      },
      callback: data => {
        if (data) {
          const appAlias = data.bean.service_alias;
          this.props.handleType && this.props.handleType === "Service"
            ? this.props.handleServiceGetData(appAlias)
            : this.props.dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`
                )
              );
        }
      }
    });
  };
  render() {
    const image = decodeURIComponent(
      this.props.handleType && this.props.handleType === "Service"
        ? ""
        : this.props.match.params.image || ""
    );
    const { virtualMachineImage } = this.state
    return (
      <Card>
        <TopUpHints />
        <div
          className={styles.formWrap}
          style={{
            width:
              this.props.handleType && this.props.handleType === "Service"
                ? "auto"
                : "600px"
          }}
        >
          <ImageVirtualMachineForm
            data={{ docker_cmd: image || "" }}
            onSubmit={this.handleSubmit}
            {...this.props}
            isDemo={true}
            virtualMachineImage={virtualMachineImage}
          />
        </div>
      </Card>
    );
  }
}

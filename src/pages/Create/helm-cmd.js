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
  Modal,
  Alert
} from "antd";
import styles from "./Index.less";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";
import HelmCmdForm from "../../components/HelmCmdForm";
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
      errorShow: false,
      BtnLoading: false
    };
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
  handleSubmit = value => {
    const teamName = globalUtil.getCurrTeamName();
    const { dispatch } = this.props;
    this.setState({
      BtnLoading: true
    })
    dispatch({
      type: "createApp/installHelmAppCmd",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: value.group_id,
        command: value.docker_cmd
      },
      callback: res => {
        if (res) {
          const info = JSON.parse(res.bean)
          if (info.tgz) {
            dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${value.group_id}`
              )
            )
          }else{
          if (info && info.status) {
            const { chart } = info;
            this.handleCreateAppStore(chart)
            this.installHelmCmd(chart, value)
          } else {
            this.setState({
              errorShow: true,
              errorInfo: info.information
            })
          }
          }
        }
      },
      handleError: res => {
        this.setState({
          BtnLoading: false,
          errorShow: true,
          errorInfo: '安装失败！请检查命令行语句是否有误！'
        })
      }
    });
  };
  installHelmCmd = (chart, value) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'createApp/installApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: chart.app_model_id,
        is_deploy: true,
        app_version: chart.version,
        install_from_cloud: false,
        marketName: 'localApplication',
        group_id: value.group_id
      },
      callback: (res) => {
        if (res && res.status_code && res.status_code == 200) {
          this.setState({
            BtnLoading: false
          })
          notification.success({
            message: '安装成功',
          });
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${value.group_id}`
            )
          )
        }
      },
    })
  }
  handleCreateAppStore = (info) => {
    const { dispatch } = this.props;
        dispatch({
          type: 'market/addHelmAppStore',
          payload: { 
            enterprise_id: info.eid ,
            name : info.repo_name,
            url : info.repo_url,
            username: info.username,
            password: info.password,
          },
          callback: res => {
          },
   
        });
        dispatch({
          type: 'market/HelmwaRehouseAdd',
          payload: {
            repo_name: info.repo_name,
            repo_url: info.repo_url,
            username: info.username,
            password: info.password
          },
          callback: res => {
          }
        });
      }
  render() {
    const helm = decodeURIComponent(
      this.props.handleType && this.props.handleType === "Service"
        ? ""
        : this.props.match.params.image || ""
    );
    const { errorInfo, errorShow, BtnLoading } = this.state
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
          <HelmCmdForm
            data={{ docker_cmd: helm || "" }}
            onSubmit={this.handleSubmit}
            {...this.props}
            BtnLoading = { BtnLoading }
            errorShow = { errorShow }
            description = { errorInfo }
          />
        </div>
      </Card>
    );
  }
}

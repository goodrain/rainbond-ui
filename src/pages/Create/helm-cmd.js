import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
          const info = res.bean
          if (info.tgz) {
            window.history.go(0)
          }else{
          if (info && info.status) {
            const { chart } = info;
            const obj = {
              app_store_name: chart.repo_name,
              app_template_name: chart.chart_name,
              version: chart.version,
              overrides: chart.overrides,
            }
            window.sessionStorage.setItem('appinfo', JSON.stringify(obj))
            this.handleCreateAppStore(chart)
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${value.group_id}/helminstall?installPath=cmd`
              )
            );
          } else {
            this.setState({
              errorShow: true,
              BtnLoading: false,
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
          errorInfo: formatMessage({id:'teamOther.HelmCmdForm.error'})
        })
      }
    });
  };
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
        });
        dispatch({
          type: 'market/HelmwaRehouseAdd',
          payload: {
            repo_name: info.repo_name,
            repo_url: info.repo_url,
            username: info.username,
            password: info.password
          },
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

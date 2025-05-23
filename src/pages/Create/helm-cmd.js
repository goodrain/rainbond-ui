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
      BtnLoading: false,
      showaddStoreVisible: false,
    };
    this.sub = React.createRef();
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
  onRef = (ref) => {
      this.child = ref
  }
  handleSubmit = (value, isService) => {
    const teamName = globalUtil.getCurrTeamName();
    const { dispatch } = this.props;
    this.setState({
      BtnLoading: true
    })
    if(value.imagefrom == 'cmd'){
      dispatch({
        type: "market/HelmwaRehouseAddCom",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_id: value.group_id,
          command: value.helm_cmd
        },
        callback: res => {
          if (res) {
            const info = res.bean
            if (res && res.status_code == 200) {
              if (info.command == "install") {
                const obj = {
                  app_store_name: info.repo_name,
                  app_template_name: info.chart_name,
                  version: info.version,
                  overrides: info.overrides,
                }
                window.sessionStorage.setItem('appinfo', JSON.stringify(obj))
                this.handleCreateAppStore(info)
                dispatch(
                  routerRedux.push(
                    `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${value.group_id}/helminstall?installPath=cmd`
                  )
                );
              } else {
                this.addAppStore(info.repo_url, info.repo_name, this.props.currUser.enterprise_id)
                this.setState({
                  errorShow: false,
                  BtnLoading: false,
                })
              }
            } else {
              notification.error({
                message: info.msg_show
              });
              this.setState({
                errorShow: false,
                BtnLoading: false,
              })
            }
          }
        },
        handleError: err => {
          this.child.onlyShowStoreMoudle()
          notification.error({
            message: err.data.msg_show
          });
          this.setState({
            BtnLoading: false,
            errorShow: false,
          })
        }
      });
    }else{
      dispatch(
        routerRedux.push(
          `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${value.group_id}/helminstall?installPath=upload&event_id=${value.event_id}`
        )
      );
    }
   
  };
  addAppStore = (url, name, eid) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'market/addHelmAppStore',
      payload: { 
        enterprise_id: eid,
        url: url,
        name: name
       },
      callback: res => {
        notification.success({
          message: formatMessage({id:"notification.success.add"})
        });
      },
      handleError: res => {
      }
    });
    dispatch({
      type: 'market/HelmwaRehouseAdd',
      payload: {
        repo_name: name,
        repo_url: url,
      },
      callback: res => {
      }
    });
  };
  handleCreateAppStore = (info) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'market/HelmwaRehouseAdd',
      payload: {
        repo_name: info.repo_name,
        repo_url: info.repo_url,
        username: info.username || '',
        password: info.password || ''
      },
    });
  }
  render() {
    const helm = decodeURIComponent(
      this.props.handleType && this.props.handleType === "Service"
        ? ""
        : this.props.match.params.image || ""
    );
    const { errorInfo, errorShow, BtnLoading, showaddStoreVisible } = this.state
    return (
      <Card key={`${showaddStoreVisible}`} bordered={this.props.handleType && this.props.handleType === 'Service' ? false : true}>
        <TopUpHints />
        <div
          className={styles.formWrap}
          style={{
            width: "600px"
          }}
        >
          <HelmCmdForm
            onRef={this.onRef}
            data={{ docker_cmd: helm || "" }}
            onSubmit={this.handleSubmit}
            {...this.props}
            BtnLoading={BtnLoading}
            errorShow={errorShow}
            description={errorInfo}
            showaddStoreVisible={showaddStoreVisible}
          />
        </div>
      </Card>
    );
  }
}

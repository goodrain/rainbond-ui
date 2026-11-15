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
import { VmCreateWorkflow } from '../VirtualMachineDemo/Workflow';
import { isVmWorkflowDemoEnabled } from '../../utils/vmWorkflowDemo';
import TopUpHints from '../../components/TopUpHints';
import { assertNoVmPasswordPayload, resolveVmPasswordReaderOptions } from '../../utils/vmLoginCredentials';

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
  vmFormRef = React.createRef();
  mounted = false;
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
    this.mounted = true;
    this.handleGetVirtualMachineImage()
  }

  componentWillUnmount() {
    this.mounted = false;
    this.vmFormRef.current?.clearSshFields();
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
  handleSubmit = (value, event_id, requestOptions = {}) => {
    if (isVmWorkflowDemoEnabled()) return;
    const teamName = globalUtil.getCurrTeamName();
    const region = globalUtil.getCurrRegionName();
    const application = globalUtil.getAppID();
    const form = this.vmFormRef.current;
    const generation = form?.loginCredentialGeneration;
    const isActive = () => this.mounted && this.vmFormRef.current === form &&
      teamName === globalUtil.getCurrTeamName() && region === globalUtil.getCurrRegionName() &&
      application === globalUtil.getAppID() &&
      (value.login_method !== 'password' || form?.loginCredentialGeneration === generation);
    let boundOptions;
    try {
      assertNoVmPasswordPayload(value);
      boundOptions = resolveVmPasswordReaderOptions(requestOptions, value.group_id);
    } catch (_) { return; }
    if (!isActive()) return;
    this.props.dispatch({
      type: "createApp/createAppByVirtualMachine",
      payload: {
        team_name: teamName,
        event_id,
        ...value
      },
      isActive,
      readCredentials: boundOptions.readCredentials,
      passwordBootstrapSupported: boundOptions.passwordBootstrapSupported === true,
      callback: data => {
        if (!isActive()) return;
        if (data) {
          const appAlias = data.bean.service_alias;
          form?.clearSshFields();
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
    if (isVmWorkflowDemoEnabled()) return <VmCreateWorkflow {...this.props} />;
    const image = decodeURIComponent(
      this.props.handleType && this.props.handleType === "Service"
        ? ""
        : this.props.match.params.image || ""
    );
    const { virtualMachineImage } = this.state
    return (
      <Card bordered={this.props.handleType && this.props.handleType === 'Service' ? false : true}>
        <TopUpHints />
        <div
          className={styles.formWrap}
          style={{
            width:"600px"
          }}
        >
          <ImageVirtualMachineForm
            data={{ docker_cmd: image || "" }}
            onSubmit={this.handleSubmit}
            {...this.props}
            wrappedComponentRef={this.vmFormRef}
            isDemo={true}
            virtualMachineImage={virtualMachineImage}
            onRefreshVirtualMachineImage={this.handleGetVirtualMachineImage}
          />
        </div>
      </Card>
    );
  }
}

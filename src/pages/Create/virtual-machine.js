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
      virtualMachineImage: [],
      templatePreset: null
    };
  }

  componentDidMount(){
    this.handleGetVirtualMachineImage()
    this.handleLoadTemplatePreset();
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

  buildTemplatePreset = (detail, preferredVersionId) => {
    if (!detail) {
      return null;
    }
    const versions = detail.versions || [];
    const targetVersion = versions.find(item => String(item.id) === String(preferredVersionId))
      || versions.find(item => item.id === detail.latest_ready_version_id)
      || versions[0];
    if (!targetVersion) {
      return null;
    }
    return {
      id: targetVersion.root_asset_id || `template-${targetVersion.id}`,
      name: `${detail.name}-${targetVersion.version}`,
      source_type: 'vm_template',
      status: targetVersion.status,
      arch: targetVersion.arch,
      format: (targetVersion.disks && targetVersion.disks[0] && targetVersion.disks[0].format) || '',
      disk_count: targetVersion.disk_count,
      extra: {
        runtime_snapshot: targetVersion.runtime_snapshot || {}
      },
      template_id: detail.id,
      template_version_id: targetVersion.id
    };
  }

  handleLoadTemplatePreset = () => {
    const { dispatch, location } = this.props;
    const query = (location && location.query) || {};
    if (!query.template_id) {
      return;
    }
    dispatch({
      type: 'createApp/getVMTemplateDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        template_id: query.template_id
      },
      callback: data => {
        const detail = data && data.bean;
        const templatePreset = this.buildTemplatePreset(detail, query.template_version_id);
        if (!templatePreset) {
          return;
        }
        this.setState(prevState => {
          const exists = (prevState.virtualMachineImage || []).some(item => String(item.id) === String(templatePreset.id));
          return {
            templatePreset,
            virtualMachineImage: exists
              ? prevState.virtualMachineImage
              : [templatePreset].concat(prevState.virtualMachineImage || [])
          };
        });
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
            isDemo={true}
            virtualMachineImage={virtualMachineImage}
            templatePreset={this.state.templatePreset}
            onRefreshAssets={this.handleGetVirtualMachineImage}
          />
        </div>
      </Card>
    );
  }
}

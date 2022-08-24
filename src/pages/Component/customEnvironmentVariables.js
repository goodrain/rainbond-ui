import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Icon,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import AddStorage from '../../components/AddStorage';
import RelationMnt from '../../components/AddStorage/relationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import EnvironmentVariable from '../../components/EnvironmentVariable';
import NoPermTip from '../../components/NoPermTip';
import ScrollerX from '../../components/ScrollerX';
import { addMnt, getMnt } from '../../services/app';
import globalUtil from '../../utils/global';
import AddVarModal from './setting/env';


@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    innerEnvs: appControl.innerEnvs,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    appDetail: appControl.appDetail,
    teamControl,
    appControl,

    volumes: appControl.volumes,
    appBaseInfo: appControl.baseInfo
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: false,
      showEditVar: null,
      deleteVar: null,
      page: 1,
      page_size: 5,
      env_name: '',
      showAddVars: null,
      showAddRelation: false,
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      editor: null,
      isAttrNameList: []
    };
  }
  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.fetchInnerEnvs();
    this.loadMntList();
    this.fetchVolumes();
    this.fetchBaseInfo();
    // this.loadBuildSourceInfo();
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: 'appControl/clearTags' });
    dispatch({ type: 'appControl/clearPorts' });
    dispatch({ type: 'appControl/clearInnerEnvs' });
    dispatch({ type: 'appControl/clearStartProbe' });
    dispatch({ type: 'appControl/clearRunningProbe' });
    dispatch({ type: 'appControl/clearMembers' });
  }

  onDeleteVar = data => {
    this.setState({ deleteVar: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  onEditVolume = data => {
    this.setState({ showAddVars: data, editor: data });
  };

  onDeleteMnt = mnt => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  onEditVar = data => {
    this.setState({ showEditVar: data });
  };

  onTransfer = data => {
    this.setState({ transfer: data });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isEnv }
    } = this.props;
    return isEnv;
  }
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleSearch = env_name => {
    this.setState(
      {
        page: 1,
        env_name
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  // 变量信息
  fetchInnerEnvs = () => {
    const { page, page_size, env_name } = this.state;
    this.props.dispatch({
      type: 'appControl/fetchInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        page,
        page_size,
        env_name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const arr = [];
          if (res.list && res.list.length > 0) {
            res.list.map(item => {
              const isHidden = globalUtil.confirmEnding(
                `${item.attr_name}`,
                'PASS'
              );
              if (isHidden) {
                arr.push(item.ID);
              }
            });
          }
          this.setState({ isAttrNameList: arr });
        }
      }
    });
  };

  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: 'appControl/addInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.add'}) });
          this.fetchInnerEnvs();
          this.handleCancelAddVar();
        }
      }
    });
  };

  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  cancelTransfer = () => {
    this.setState({ transfer: null });
  };
  handleDeleteVar = () => {
    this.props.dispatch({
      type: 'appControl/deleteEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: this.state.deleteVar.ID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '删除成功' });
          this.fetchInnerEnvs();
        }
        this.cancelDeleteVar();
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleTransfer = () => {
    const { transfer } = this.state;
    this.props.dispatch({
      type: 'appControl/putTransfer',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: transfer.ID,
        scope: transfer.scope == 'inner' ? 'outer' : 'inner'
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '转移成功' });
          this.fetchInnerEnvs();
          this.cancelTransfer();
        }
      }
    });
  };

  handleEditVar = vals => {
    const { showEditVar } = this.state;
    this.props.dispatch({
      type: 'appControl/editEvns',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '编辑成功' });
          this.cancelEditVar();
          this.fetchInnerEnvs();
        }
      }
    });
  };

  fetchVolumes = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        is_config: true
      }
    });
  };
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  loadMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: 1,
      page_size: 1000,
      volume_type: ['config-file']
    }).then(data => {
      if (data) {
        this.setState({
          mntList: data.list || []
        });
      }
    });
  };
  handleAddVars = () => {
    this.setState({
      showAddVars: {
        new: true
      }
    });
  };
  handleCancelAddVars = () => {
    this.setState({ showAddVars: null, editor: null });
  };
  handleSubmitAddVars = vals => {
    const { editor } = this.state;
    if (editor) {
      this.props.dispatch({
        type: 'appControl/editorVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          mode: vals.mode,
          ID: editor.ID
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.fetchVolumes();
            this.handleCancelAddVars();
            notification.success({ message: '编辑成功' });
            this.props.onshowRestartTips(true);
          }
        }
      });
    } else {
      this.props.dispatch({
        type: 'appControl/addVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.fetchVolumes();
            this.handleCancelAddVars();
            notification.success({ message: formatMessage({id:'notification.success.add'}) });
            this.props.onshowRestartTips(true);
          }
        }
      });
    }
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddMnt = mnts => {
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      body: mnts
    }).then(data => {
      if (data) {
        this.handleCancelAddRelation();
        this.loadMntList();
        notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleDeleteVolume = () => {
    this.props.dispatch({
      type: 'appControl/deleteVolume',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        volume_id: this.state.toDeleteVolume.ID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '删除成功' });
          this.onCancelDeleteVolume();
          this.fetchVolumes();
          this.props.onshowRestartTips(true);
        }
      }
    });
  };
  handleDeleteMnt = () => {
    this.props.dispatch({
      type: 'appControl/deleteMnt',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        dep_vol_id: this.state.toDeleteMnt.dep_vol_id
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
        notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null });
  };

  AfterPassword = (isHidden, ID) => {
    const passwordShow = globalUtil.fetchSvg('passwordShow');
    const passwordHidden = globalUtil.fetchSvg('passwordHidden');
    return (
      <span
        onClick={() => {
          this.handlePassword(isHidden, ID);
        }}
      >
        {isHidden ? passwordHidden : passwordShow}
      </span>
    );
  };
  handlePassword = (isHidden, ID) => {
    const { isAttrNameList } = this.state;
    const arr = isAttrNameList;
    if (isHidden) {
      const index = arr.indexOf(ID);
      arr.splice(index, 1);
    } else {
      arr.push(ID);
    }
    this.setState({
      isAttrNameList: arr
    });
  };

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { mntList } = this.state;
    const { baseInfo, volumes } = this.props;
    const wraps = {
      wordBreak: 'break-all',
      wordWrap: 'break-word'
    };
    if (typeof baseInfo.build_upgrade !== 'boolean') {
      return null;
    }
    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message={<FormattedMessage id='componentOverview.body.tab.env.environmentVariable.message'/>}
              type="info"
              style={{
                marginBottom: 24
              }}
            />
          </Col>
        </Row>
        <Row>
          <EnvironmentVariable
            title={<FormattedMessage id='componentOverview.body.tab.env.environmentVariable.title'/>}
            type="Inner"
            appAlias={this.props.appAlias}
          />
          <Col span={12}>
            <Alert
              showIcon
              // eslint-disable-next-line no-template-curly-in-string
              message={<FormattedMessage id='componentOverview.body.tab.env.setting.message'/>}
              type="info"
              style={{
                marginBottom: 24
              }}
            />
          </Col>
        </Row>
        <Card
          style={{
            marginBottom: 24
          }}
          title={<span> <FormattedMessage id='componentOverview.body.tab.env.setting.title'/> </span>}
          extra={
            <Button onClick={this.handleAddVars}>
              <Icon type="plus" />
              <FormattedMessage id='componentOverview.body.tab.env.setting.add'/>
            </Button>
          }
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.volume_name'}),
                  dataIndex: 'volume_name'
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.volume_path'}),
                  dataIndex: 'volume_path'
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.mode'}),
                  dataIndex: 'mode'
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.setting.action'}),
                  dataIndex: 'action',
                  render: (v, data) => (
                    <div>
                      <a
                        onClick={() => {
                          this.onDeleteVolume(data);
                        }}
                        href="javascript:;"
                      >
                        <FormattedMessage id='componentOverview.body.tab.env.setting.delete'/>
                      </a>
                      <a
                        onClick={() => {
                          this.onEditVolume(data);
                        }}
                        href="javascript:;"
                      >
                        <FormattedMessage id='componentOverview.body.tab.env.setting.edit'/>
                      </a>
                    </div>
                  )
                }
              ]}
              dataSource={volumes}
            />
          </ScrollerX>
        </Card>
        <Card
          title={<span> <FormattedMessage id='componentOverview.body.tab.env.file.share'/> </span>}
          extra={
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              <FormattedMessage id='componentOverview.body.tab.env.file.mount'/>
            </Button>
          }
        >
          <ScrollerX sm={850}>
            <Table
              pagination={false}
              columns={[
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.file.localMount'}),
                  dataIndex: 'local_vol_path',
                  key: '1',
                  width: '20%',
                  render: data => (
                    <Tooltip title={data}>
                      <span style={wraps}>{data}</span>
                    </Tooltip>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.file.name'}),
                  dataIndex: 'dep_vol_name',
                  key: '2',
                  width: '15%',
                  render: data => (
                    <Tooltip title={data}>
                      <span style={wraps}>{data}</span>
                    </Tooltip>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.file.path'}),
                  dataIndex: 'dep_vol_path',
                  key: '3',
                  width: '20%',
                  render: data => (
                    <Tooltip title={data}>
                      <span style={wraps}>{data}</span>
                    </Tooltip>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.file.Component'}),
                  dataIndex: 'dep_app_name',
                  key: '4',
                  width: '15%',
                  render: (v, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.dep_app_alias
                      }/overview`}
                    >
                      {v}
                    </Link>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.file.Components'}),
                  dataIndex: 'dep_app_group',
                  key: '5',
                  width: '15%',
                  render: (v, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        data.dep_group_id
                      }`}
                    >
                      {v}
                    </Link>
                  )
                },
                {
                  title: formatMessage({id:'componentOverview.body.tab.env.file.action'}),
                  dataIndex: 'action',
                  key: '6',
                  width: '15%',
                  render: (v, data) => (
                    <a
                      onClick={() => {
                        this.onDeleteMnt(data);
                      }}
                      href="javascript:;"
                    >
                      <FormattedMessage id='componentOverview.body.tab.env.file.cancel'/>
                    </a>
                  )
                }
              ]}
              dataSource={mntList}
            />
          </ScrollerX>
        </Card>
        {this.state.showAddVars && (
          <AddStorage
            appBaseInfo={this.props.appBaseInfo}
            onCancel={this.handleCancelAddVars}
            onSubmit={this.handleSubmitAddVars}
            data={this.state.showAddVars}
            editor={this.state.editor}
            {...this.props}
          />
        )}
        {this.state.showAddRelation && (
          <RelationMnt
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
            volume_type={['config-file']}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="取消挂载共享配置文件"
            desc="确定要取消此挂载共享配置文件目录吗?"
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title="删除配置文件"
            desc="确定要删除此配置文件吗?"
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}

        {this.state.transfer && (
          <ConfirmModal
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title="转移环境变量"
            desc="确定要将此环境变量转换为组件连接信息变量吗?"
            subDesc=""
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除此变量吗？"
            subDesc="此操作不可恢复"
          />
        )}
      </Fragment>
    );
  }
}

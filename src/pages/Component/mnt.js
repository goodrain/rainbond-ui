import {
  Alert,
  Button,
  Card,
  Col,
  Icon,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import AddVolumes from '../../components/AddOrEditVolume';
import AddRelationMnt from '../../components/AddRelationMnt';
import ConfirmModal from '../../components/ConfirmModal';
import NoPermTip from '../../components/NoPermTip';
import RelyComponentModal from '../../components/RelyComponentModal';
import ScrollerX from '../../components/ScrollerX';
import { addMnt, getMnt } from '../../services/app';
import globalUtil from '../../utils/global';
import { getVolumeTypeShowName } from '../../utils/utils';

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    volumes: appControl.volumes,
    appBaseInfo: appControl.baseInfo
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: null,
      showAddRelation: false,
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      editor: null,
      volumeOpts: [],
      relyComponent: false,
      relyComponentList: []
    };
  }

  componentDidMount() {
    this.fetchVolumeOpts();
    this.loadMntList();
    this.fetchVolumes();
    this.fetchBaseInfo();
  }
  onDeleteMnt = mnt => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onEditVolume = data => {
    this.setState({ showAddVar: data, editor: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  getVolumeTypeShowName = volume_type => {
    const { volumeOpts } = this.state;
    return getVolumeTypeShowName(volumeOpts, volume_type);
  };
  handleOpenRelyComponent = relyComponentList => {
    this.setState({
      relyComponent: true,
      relyComponentList
    });
  };
  handleCloseRelyComponent = () => {
    this.setState({
      relyComponent: false,
      relyComponentList: []
    });
  };
  fetchVolumes = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumes',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        is_config: false
      }
    });
  };
  fetchVolumeOpts = () => {
    this.props.dispatch({
      type: 'appControl/fetchVolumeOpts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({
            volumeOpts: data.list || []
          });
        }
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
      volume_type: ['share-file', 'memoryfs', 'local'],
      type: 'mnt'
    }).then(data => {
      if (data) {
        this.setState({
          mntList: data.list || []
        });
      }
    });
  };
  handleAddVar = () => {
    this.setState({
      showAddVar: {
        new: true
      }
    });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: null, editor: null });
  };
  handleSubmitAddVar = vals => {
    this.fetchBaseInfo();
    const { editor } = this.state;
    if (editor) {
      this.props.dispatch({
        type: 'appControl/editorVolume',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          ID: editor.ID
        },
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVar();
          this.props.onshowRestartTips(true);
          this.remindInfo();
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
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVar();
          this.props.onshowRestartTips(true);
          this.remindInfo();
        }
      });
    }
  };

  remindInfo = () => {
    const { appBaseInfo } = this.props;
    if (
      appBaseInfo &&
      appBaseInfo.extend_method &&
      globalUtil.isStateComponent(appBaseInfo.extend_method)
    ) {
      notification.warning({
        message: (
          <div>
            有状态组件存储配置发生变化后
            <br />
            需要重启组件才能生效!
          </div>
        )
      });
    } else {
      notification.success({ message: '操作成功' });
    }
  };
  showAddRelation = () => {
    this.loadMntList();
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.loadMntList();
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
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
        notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
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
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isStorage }
    } = this.props;
    return isStorage;
  }
  render() {
    const { mntList, relyComponent, relyComponentList } = this.state;
    const { volumes } = this.props;
    if (!this.canView()) return <NoPermTip />;

    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message="存储配置发生变化后需要更新组件才能生效"
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
          title={<span> 存储设置 </span>}
          extra={
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" />
              添加存储
            </Button>
          }
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: '存储名称',
                  dataIndex: 'volume_name',
                  render: (text, item) => {
                    return (
                      <span
                        style={{
                          cursor: 'pointer',
                          color: item.dep_services && '#1890ff'
                        }}
                        onClick={() => {
                          if (item.dep_services) {
                            this.handleOpenRelyComponent(item.dep_services);
                          }
                        }}
                      >
                        {text}
                      </span>
                    );
                  }
                },
                {
                  title: '挂载路径',
                  dataIndex: 'volume_path'
                },
                {
                  title: '存储类型',
                  dataIndex: 'volume_type',
                  render: text => {
                    return <span>{this.getVolumeTypeShowName(text)}</span>;
                  }
                },
                {
                  title: '存储容量',
                  dataIndex: 'volume_capacity',
                  render: text => {
                    if (text == 0) {
                      return <span>不限制</span>;
                    }
                    return <span>{text}GB</span>;
                  }
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: text => {
                    if (text == 'not_bound') {
                      return <span style={{ color: 'red' }}>未挂载</span>;
                    }
                    return <span style={{ color: 'green' }}>已挂载</span>;
                  }
                },
                {
                  title: '操作',
                  dataIndex: 'action',
                  render: (v, data) => (
                    <div>
                      <a
                        onClick={() => {
                          this.onDeleteVolume(data);
                        }}
                        href="javascript:;"
                      >
                        删除
                      </a>
                      <a
                        onClick={() => {
                          this.onEditVolume(data);
                        }}
                        href="javascript:;"
                      >
                        编辑
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
          title={<span> 共享其他组件存储 </span>}
          extra={
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              挂载共享存储
            </Button>
          }
        >
          <ScrollerX sm={850}>
            <Table
              pagination={false}
              columns={[
                {
                  title: '本地挂载路径',
                  dataIndex: 'local_vol_path',
                  key: '1',
                  width: '20%',
                  render: data => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word'
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: '目标存储名称',
                  dataIndex: 'dep_vol_name',
                  key: '2',
                  width: '15%',
                  render: data => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word'
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: '目标挂载路径',
                  dataIndex: 'dep_vol_path',
                  key: '3',
                  width: '15%',
                  render: data => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word'
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: '目标存储类型',
                  dataIndex: 'dep_vol_type',
                  key: '4',
                  width: '10%',
                  render: text => {
                    return <span>{this.getVolumeTypeShowName(text)}</span>;
                  }
                },
                {
                  title: '目标所属组件',
                  dataIndex: 'dep_app_name',
                  key: '5',
                  width: '10%',
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
                  title: '目标组件所属应用',
                  dataIndex: 'dep_app_group',
                  key: '6',
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
                  title: '操作',
                  dataIndex: 'action',
                  key: '7',
                  width: '15%',
                  render: (v, data) => (
                    <a
                      onClick={() => {
                        this.onDeleteMnt(data);
                      }}
                      href="javascript:;"
                    >
                      取消挂载
                    </a>
                  )
                }
              ]}
              dataSource={mntList}
            />
          </ScrollerX>
        </Card>

        {this.state.showAddVar && (
          <AddVolumes
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
            volumeOpts={this.state.volumeOpts}
            editor={this.state.editor}
          />
        )}
        {this.state.showAddRelation && (
          <AddRelationMnt
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
            volume_type={['share-file', 'memoryfs', 'local']}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="取消挂载"
            desc="确定要取消此挂载目录吗?"
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title="删除存储目录"
            desc="确定要删除此存储目录吗?"
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
        {relyComponent && (
          <RelyComponentModal
            title="存储被依赖的组件"
            relyComponentList={relyComponentList}
            onCancel={this.handleCloseRelyComponent}
            onOk={this.handleCloseRelyComponent}
          />
        )}
      </Fragment>
    );
  }
}

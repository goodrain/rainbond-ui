import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import logSocket from '../../utils/logSocket';
import ConfirmModal from '../../components/ConfirmModal';
import MigrationBackup from '../../components/MigrationBackup';
import RestoreBackup from '../../components/RestoreBackup';
import sourceUtil from '../../utils/source-unit';
import userUtil from '../../utils/user';
import globalUtil from '../../utils/global';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  notification,
  Icon
} from 'antd';
import config from '../../config/config';

@connect(({ user, appControl }) => ({ currUser: user.currentUser }))
class BackupStatus extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      map: {
        starting: '备份中',
        success: '备份成功',
        failed: '备份失败'
      }
    }
    this.timer = null;
  }
  componentDidMount() {
    const data = this.props.data;
    if (data.status === 'starting') {
      this.createSocket();
      this.startLoopStatus();
    }

  }
  createSocket() {
    this.logSocket = new logSocket({
      url: this.getSocketUrl(),
      eventId: this.props.data.event_id,
      onMessage: (msg) => {
        console.log(msg)
      }
    })
  }
  componentWillUnmount() {
    this.stopLoopStatus();
    this.logSocket && this.logSocket.destroy();
    this.logSocket = null;
  }

  getSocketUrl = () => {
    return userUtil.getCurrRegionSoketUrl(this.props.currUser);
  }
  startLoopStatus() {
    this.props.dispatch({
      type: 'groupControl/fetchBackupStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        backup_id: this.props.data.backup_id,
        group_id: this.props.group_id
      },
      callback: (data) => {
        if (data) {
          const bean = data.bean;
          if (bean.status === 'starting') {
            this.timer = setTimeout(() => {
              this.startLoopStatus();
            }, 10000)
          } else {
            this.props.onEnd && this.props.onEnd();
          }
        }
      }
    })
  }
  stopLoopStatus() {
    clearTimeout(this.timer)
  }
  render() {
    const data = this.props.data || {};
    return (
      <span>{this.state.map[data.status]} {data.status === 'starting' && <Icon style={{ marginLeft: 8 }} type="loading" spin />}</span>
    )
  }
}

/**main */
@connect(({ user, global, groupControl }) => ({ groupDetail: groupControl.groupDetail || {}, currUser: user.currentUser, groups: global.groups || [] }))
class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      tableLoading: true,
      list: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      showMove: false,
      showDel: false,
      showDelBackup: false,
      showRecovery: false,
      backup_id: '',
      group_uuid: '',
      event_id: '',
      group_id: ''
    };
  }
  componentWillMount() {
    this.fetchAllBackup();
  }
  fetchAllBackup = () => {
    const { dispatch } = this.props;
    const { pageNum, pageSize } = this.state;
    dispatch({
      type: "groupControl/queryAllBackup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        pageNum,
        pageSize
      },
      callback: (data) => {
        if (data) {
          this.setState({
            list: data.list,
            tableLoading: false,
            total: data.total
          })
        }
      }
    })
  }
  onPageChange = (pageNum) => {
    this.setState({ pageNum, tableLoading: true }, () => {
      this.fetchAllBackup();
    })
  }
  handleMoveBackup = () => {
    this.setState({ showMove: false });
  }
  cancelMoveBackup = () => {
    this.setState({ showMove: false, backup_id: '', group_id: '' });
  }
  handleRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: '', group_id: '' });
  }
  cancelRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: '', group_id: '' });
  }

  // 删除应用备份
  handleDel = (data, e) => {
    this.setState({ showDel: true, backup_id: data.backup_id , group_id:data.group_id})
  }


  handleDelete = (e) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'groupControl/delBackup',
      payload: {
        team_name: team_name,
        group_id: this.state.group_id,
        backup_id: this.state.backup_id
      },
      callback: (data) => {
        notification.success({
          message: '删除成功',
          duration: '2'
        });
        this.cancelDelete();
      }
    })
  }
  cancelDelete = (e) => {
    this.setState({ showDel: false, backup_id: '' }, () => {
      this.fetchAllBackup();
    })
  }
  handleDelBackup = (data, e) => {
    this.setState({ showDelBackup: true, backup_id: data.backup_id , group_id:data.group_id })
  }

  // 应用失败记录删除
  handleDeleteBackup = (e) => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'groupControl/delFailureBackup',
      payload: {
        team_name: team_name,
        group_id: this.state.group_id,
        backup_id: this.state.backup_id
      },
      callback: (data) => {
        notification.success({
          message: '删除成功',
          duration: '2'
        });
        this.cancelDeleteBackup();
      }
    })
  }


  cancelDeleteBackup = (e) => {
    this.setState({ showDelBackup: false, backup_id: '' }, () => {
      this.fetchAllBackup();
    })
  }



  // 恢复应用备份
  handleRecovery = (data, e) => {
    this.setState({
      showRecovery: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid,
      group_id: data.group_id,
    });
  }
  // 迁移应用备份
  handleMove = (data, e) => {
    this.setState({
      showMove: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid,
      group_id: data.group_id
    });
  }
  // 导出应用备份
  handleExport = (data, e) => {
    var backup_id = data.backup_id;
    var team_name = globalUtil.getCurrTeamName()
    var group_id = data.group_id;
    var exportURl = config.baseUrl + '/console/teams/' + team_name + '/groupapp/' + group_id + '/backup/export?backup_id=' + backup_id
    window.open(exportURl);
    notification.success({
      message: '备份导出中',
      duration: '2'
    });
  }
  render() {
    const columns = [
      {
        title: '备份时间',
        dataIndex: 'create_time'
      }, {
        title: '备份人',
        dataIndex: 'user'
      }, {
        title: '备份模式',
        dataIndex: 'mode',
        render: (val, data) => {
          var map = {
            'full-online': '云端备份',
            'full-offline': '本地备份'
          }
          return map[val] || ''
        }
      }, {
        title: '包大小',
        dataIndex: 'backup_size',
        render: (val, data) => {
          return sourceUtil.unit(val, 'Byte');
        }
      }, {
        title: '状态',
        dataIndex: 'status',
        render: (val, data) => {
          return <BackupStatus onEnd={this.fetchAllBackup} group_id={data.group_id} data={data} />
        }
      },
      {
        title: '备份应用',
        dataIndex: 'group_name',
        render: (text, record) => {
          return (text.includes("已删除") ? <a href="" disabled>{text}</a> : <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${record.group_id}/`}>{text}</Link>)
        }
      },
      {
        title: '备注',
        dataIndex: 'note'
      }, {
        title: '操作',
        dataIndex: 'action',
        render: (val, data) => {
          return (
            <div>
              {
                (data.status == 'success') ?
                  <Fragment>
                    <a href="javascript:;" style={{ marginRight: '5px' }} onClick={this.handleRecovery.bind(this, data)}>恢复</a>
                    <a href="javascript:;" style={{ marginRight: '5px' }} onClick={this.handleMove.bind(this, data)}>迁移</a>
                    {data.mode == 'full-online' && <a href="javascript:;" style={{ marginRight: '5px' }} onClick={this.handleExport.bind(this, data)}>导出</a>}
                    {data.is_delete && <a href="javascript:;" style={{ marginRight: '5px' }} onClick={this.handleDelBackup.bind(this, data)}>删除</a>}
                  </Fragment>
                  : ''

              }
              {
                (data.status == 'failed') ?
                  <Fragment>
                    <a href="javascript:;" onClick={this.handleDel.bind(this, data)}>删除</a>
                  </Fragment>
                  : ''
              }
            </div>


          )
        }
      }
    ];
    const { tableLoading, pageNum, pageSize, total, list } = this.state;
    return (
      <PageHeaderLayout
        breadcrumbList={[{
          title: "首页",
          icon: "home"
        }, {
          title: "全部备份",
          icon: "folder-open"
        }]}
      >
        <Card>
          <Table
            rowKey={(data) => { return data.backup_id }}
            pagination={{
              total,
              pageSize,
              current: pageNum,
              onChange: this.onPageChange
            }}
            columns={columns}
            dataSource={list}
            loading={tableLoading}
          />
        </Card>
        {this.state.showMove && <MigrationBackup
          onOk={this.handleMoveBackup}
          onCancel={this.cancelMoveBackup}
          backupId={this.state.backup_id}
          group_uuid={this.state.group_uuid}
          groupId={this.state.group_id} />}
        {this.state.showRecovery && <RestoreBackup
          onOk={this.handleRecoveryBackup}
          onCancel={this.cancelRecoveryBackup}
          propsParams={this.props.match.params}
          backupId={this.state.backup_id}
          group_uuid={this.state.group_uuid}
          groupId={this.state.group_id} />}

        {this.state.showDel && <ConfirmModal
          backupId={this.state.backup_id}
          onOk={this.handleDelete}
          onCancel={this.cancelDelete}
          title="删除备份"
          desc="确定要删除此备份吗？"
          subDesc="此操作不可恢复" />}

        {this.state.showDelBackup && <ConfirmModal
          backupId={this.state.backup_id}
          onOk={this.handleDeleteBackup}
          onCancel={this.cancelDeleteBackup}
          title="删除备份"
          desc="确定要删除此备份吗？"
          subDesc="此操作不可恢复" />}

      </PageHeaderLayout>
    );
  }
}
export default Index;

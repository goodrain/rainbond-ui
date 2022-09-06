/* eslint-disable camelcase */
/* eslint-disable react/no-multi-comp */
import { Card, Icon, notification, Table } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import apiconfig from '../../../config/api.config';
import ConfirmModal from '../../components/ConfirmModal';
import MigrationBackup from '../../components/MigrationBackup';
import RestoreBackup from '../../components/RestoreBackup';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import logSocket from '../../utils/logSocket';
import sourceUtil from '../../utils/source-unit';
import userUtil from '../../utils/user';

@connect(({ user }) => ({ currUser: user.currentUser }))
class BackupStatus extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      map: {
        starting: formatMessage({id:'teamOther.AllBackup.Backup'}),
        success: formatMessage({id:'teamOther.AllBackup.success'}),
        failed: formatMessage({id:'teamOther.AllBackup.failed'})
      }
    };
    this.timer = null;
  }
  componentDidMount() {
    const { data } = this.props;
    if (data.status === 'starting') {
      this.createSocket();
      this.startLoopStatus();
    }
  }
  createSocket() {
    this.logSocket = new logSocket({
      url: this.getSocketUrl(),
      eventId: this.props.data.event_id,
      onMessage: msg => {
        console.log(msg);
      }
    });
  }
  componentWillUnmount() {
    this.stopLoopStatus();
    this.logSocket && this.logSocket.destroy();
    this.logSocket = null;
  }

  getSocketUrl = () => {
    return userUtil.getCurrRegionSoketUrl(this.props.currUser);
  };
  startLoopStatus() {
    this.props.dispatch({
      type: 'application/fetchBackupStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        backup_id: this.props.data.backup_id,
        group_id: this.props.group_id
      },
      callback: data => {
        if (data) {
          const { bean } = data;
          if (bean.status === 'starting') {
            this.timer = setTimeout(() => {
              this.startLoopStatus();
            }, 10000);
          } else {
            this.props.onEnd && this.props.onEnd();
          }
        }
      }
    });
  }
  stopLoopStatus() {
    clearTimeout(this.timer);
  }
  render() {
    const data = this.props.data || {};
    return (
      <span>
        {this.state.map[data.status]}{' '}
        {data.status === 'starting' && (
          <Icon style={{ marginLeft: 8 }} type="loading" spin />
        )}
      </span>
    );
  }
}

/** main */
@connect(({ user, global, application }) => ({
  groupDetail: application.groupDetail || {},
  currUser: user.currentUser,
  groups: global.groups || []
}))
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
      type: 'application/queryAllBackup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        pageNum,
        pageSize
      },
      callback: data => {
        if (data) {
          this.setState({
            list: data.list,
            tableLoading: false,
            total: data.total
          });
        }
      }
    });
  };
  onPageChange = pageNum => {
    this.setState({ pageNum, tableLoading: true }, () => {
      this.fetchAllBackup();
    });
  };
  handleMoveBackup = () => {
    this.setState({ showMove: false });
  };
  cancelMoveBackup = () => {
    this.setState({ showMove: false, backup_id: '', group_id: '' });
  };
  handleRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: '', group_id: '' });
    this.fetchAllBackup();
  };
  cancelRecoveryBackup = () => {
    this.setState({ showRecovery: false, backup_id: '', group_id: '' });
    this.fetchAllBackup();
  };

  // 删除应用备份
  handleDel = data => {
    this.setState({
      showDel: true,
      backup_id: data.backup_id,
      group_id: data.group_id
    });
  };

  handleDelete = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'application/delBackup',
      payload: {
        team_name,
        group_id: this.state.group_id,
        backup_id: this.state.backup_id
      },
      callback: () => {
        notification.success({
          message: formatMessage({id:'notification.success.delete'}),
          duration: '2'
        });
        this.cancelDelete();
        this.fetchAllBackup();
      }
    });
  };
  cancelDelete = () => {
    this.setState({ showDel: false, backup_id: '' }, () => {
      this.fetchAllBackup();
    });
  };
  handleDelBackup = data => {
    this.setState({
      showDelBackup: true,
      backup_id: data.backup_id,
      group_id: data.group_id
    });
  };

  // 应用失败记录删除
  handleDeleteBackup = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'application/delFailureBackup',
      payload: {
        team_name,
        group_id: this.state.group_id,
        backup_id: this.state.backup_id
      },
      callback: () => {
        notification.success({
          message: formatMessage({id:'notification.success.delete'}),
          duration: '2'
        });
        this.cancelDeleteBackup();
      }
    });
  };

  cancelDeleteBackup = () => {
    this.setState({ showDelBackup: false, backup_id: '' }, () => {
      this.fetchAllBackup();
    });
  };

  // 恢复应用备份
  handleRecovery = data => {
    this.setState({
      showRecovery: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid,
      group_id: data.group_id
    });
  };
  // 迁移应用备份
  handleMove = data => {
    this.setState({
      showMove: true,
      backup_id: data.backup_id,
      group_uuid: data.group_uuid,
      group_id: data.group_id,
      moveBackupMode: data.mode
    });
  };
  // 导出应用备份
  handleExport = data => {
    const { backup_id } = data;
    const team_name = globalUtil.getCurrTeamName();
    const { group_id } = data;
    const exportURl = `${apiconfig.baseUrl}/console/teams/${team_name}/groupapp/${group_id}/backup/export?backup_id=${backup_id}`;
    window.open(exportURl);
    notification.success({
      message: formatMessage({id:'status.app.backups.yolkStroke'}),
      duration: '2'
    });
  };
  render() {
    const columns = [
      {
        title: formatMessage({id:'teamOther.AllBackup.create_time'}),
        dataIndex: 'create_time'
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.user'}),
        dataIndex: 'user'
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.mode'}),
        dataIndex: 'mode',
        render: (val, data) => {
          const map = {
            'full-online': `${formatMessage({id:'teamOther.AllBackup.full-online'})}`,
            'full-offline': `${formatMessage({id:'teamOther.AllBackup.full-offline'})}`
          };
          return map[val] || '';
        }
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.backup_size'}),
        dataIndex: 'backup_size',
        render: (val, data) => {
          return sourceUtil.unit(val, 'Byte');
        }
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.state'}),
        dataIndex: 'status',
        render: (val, data) => {
          return (
            <BackupStatus
              onEnd={this.fetchAllBackup}
              group_id={data.group_id}
              data={data}
            />
          );
        }
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.app'}),
        dataIndex: 'group_name',
        render: (text, record) => {
          return text.includes('已删除') ? (
            <a href="" disabled>
              {text}
            </a>
          ) : (
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                record.group_id
              }/`}
            >
              {text}
            </Link>
          );
        }
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.remarks'}),
        dataIndex: 'note'
      },
      {
        title: formatMessage({id:'teamOther.AllBackup.operation'}),
        dataIndex: 'action',
        render: (val, data) => {
          return (
            <div>
              {data.status == 'success' ? (
                <Fragment>
                  <a
                    href="javascript:;"
                    style={{ marginRight: '5px' }}
                    onClick={this.handleRecovery.bind(this, data)}
                  >
                    {formatMessage({id:'teamOther.AllBackup.recovery'})}
                  </a>
                  <a
                    href="javascript:;"
                    style={{ marginRight: '5px' }}
                    onClick={this.handleMove.bind(this, data)}
                  >
                    {formatMessage({id:'teamOther.AllBackup.transfer'})}
                  </a>
                  {data.mode == 'full-online' && (
                    <a
                      href="javascript:;"
                      style={{ marginRight: '5px' }}
                      onClick={this.handleExport.bind(this, data)}
                    >
                      {formatMessage({id:'teamOther.AllBackup.export'})}
                    </a>
                  )}
                  {data.is_delete && (
                    <a
                      href="javascript:;"
                      style={{ marginRight: '5px' }}
                      onClick={this.handleDelBackup.bind(this, data)}
                    >
                      {formatMessage({id:'teamOther.AllBackup.delete'})}
                    </a>
                  )}
                </Fragment>
              ) : (
                ''
              )}
              {data.status == 'failed' ? (
                <Fragment>
                  <a
                    href="javascript:;"
                    onClick={this.handleDel.bind(this, data)}
                  >
                    {formatMessage({id:'teamOther.AllBackup.delete'})}
                  </a>
                </Fragment>
              ) : (
                ''
              )}
            </div>
          );
        }
      }
    ];
    const { tableLoading, pageNum, pageSize, total, list } = this.state;
    const { regionName } = this.props.match.params;
    return (
      <PageHeaderLayout
        title={formatMessage({id:'teamOther.AllBackup.records'})}
        content={formatMessage({id:'teamOther.AllBackup.all_records'})}
      >
        <Card>
          <Table
            rowKey={data => {
              return data.backup_id;
            }}
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
        {this.state.showMove && (
          <MigrationBackup
            onOk={this.handleMoveBackup}
            onCancel={this.cancelMoveBackup}
            backupId={this.state.backup_id}
            group_uuid={this.state.group_uuid}
            groupId={this.state.group_id}
            currentRegion={regionName}
            moveBackupMode={this.state.moveBackupMode}
          />
        )}
        {this.state.showRecovery && (
          <RestoreBackup
            onOk={this.handleRecoveryBackup}
            onCancel={this.cancelRecoveryBackup}
            propsParams={this.props.match.params}
            backupId={this.state.backup_id}
            group_uuid={this.state.group_uuid}
            groupId={this.state.group_id}
          />
        )}

        {this.state.showDel && (
          <ConfirmModal
            backupId={this.state.backup_id}
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
            title={formatMessage({ id: 'confirmModal.backup.title.delete' })}
            desc={formatMessage({ id: 'confirmModal.backup.delete.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
          />
        )}

        {this.state.showDelBackup && (
          <ConfirmModal
            backupId={this.state.backup_id}
            onOk={this.handleDeleteBackup}
            onCancel={this.cancelDeleteBackup}
            title={formatMessage({ id: 'confirmModal.backup.title.delete' })}
            desc={formatMessage({ id: 'confirmModal.backup.delete.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
export default Index;

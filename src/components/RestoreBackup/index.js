import {
  Button, Form,

  Icon,





  Modal, notification,
  Select,



  Spin
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';

const FormItem = Form.Item;
const { Option } = Select;

const appRestore = {
  starting: '迁移中',
  success: '成功',
  failed: '失败'
};

@connect(({ user, global }) => ({ currUser: user.currentUser }))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      backup_id: this.props.backupId,
      restore_id: '',
      showRestore: false,
      restore_status: '',
      new_group_id: '',
      isFinished: '',
      notRecovered_restore_id: '',
      restore: false,
      restoreUrl: ''
    };
    this.mount = false;
  }

  componentDidMount() {
    this.mount = true;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/queryRestoreState',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.props.groupId,
        group_uuid: this.props.group_uuid
      },
      callback: data => {
        if (data) {
          this.setState({
            isFinished: data.bean.is_finished,
            event_id: data.bean.data === null ? '' : data.bean.data.event_id,
            notRecovered_restore_id:
              data.bean.data === null ? '' : data.bean.data.restore_id
          });
        }
      }
    });
  }
  componentWillUnmount() {
    this.mount = false;
  }
  handleRestore = e => {
    const { propsParams, backupId, groupId, dispatch } = this.props;
    dispatch({
      type: 'application/migrateApp',
      payload: {
        team_name: propsParams && propsParams.teamName,
        region: propsParams && propsParams.regionName,
        team: propsParams && propsParams.teamName,
        backup_id: backupId,
        group_id: groupId,
        migrate_type: 'recover',
        event_id: this.state.event_id,
        notRecovered_restore_id: this.state.notRecovered_restore_id
      },
      callback: data => {
        // notification.success({message: "开始恢复中",duration:'2'});
        if (data) {
          this.setState({ restore_id: data.bean.restore_id }, () => {
            this.queryMigrateApp();
          });
        }
      }
    });
  };

  handleSubmit = e => {
    const { restore } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/delRestore',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.props.groupId,
        new_group_id: this.state.new_group_id
      },
      callback: data => {
        if (data) {
          notification.success({ message: '删除成功', duration: '2' });
          restore && this.JumpAddress();
          this.props.onCancel & this.props.onCancel();
        }
      }
    });
  };

  // 查询恢复情况
  queryMigrateApp = () => {
    if (!this.mount) return;
    const { restore_id } = this.state;
    const { propsParams, dispatch, groupId } = this.props;
    const team_name = propsParams && propsParams.teamName;
    const region_name = propsParams && propsParams.regionName;
    dispatch({
      type: 'application/queryMigrateApp',
      payload: {
        team_name,
        restore_id,
        group_id: groupId
      },
      callback: data => {
        if (data && data.bean) {
          const info = data.bean;
          this.setState({
            showRestore: true,
            restore_status: info.status,
            new_group_id: info.group_id
          });
          if (info.status == 'starting') {
            setTimeout(() => {
              this.queryMigrateApp();
            }, 2000);
          } else if (info.status == 'success') {
            this.setState({
              restore: true,
              restoreUrl: `/team/${team_name}/region/${region_name}/apps/${info.group_id}`
            });
          }
        }
      }
    });
  };

  JumpAddress = () => {
    const { dispatch, onCancel } = this.props;
    const { restoreUrl } = this.state;
    dispatch(routerRedux.push(restoreUrl));
  };

  render() {
    const { restore, restore_status, isFinished, showRestore } = this.state;
    const { onCancel } = this.props;

    if (isFinished === '') {
      return null;
    }
    return (
      <Modal
        visible
        onCancel={onCancel}
        title="恢复"
        footer={
          !showRestore
            ? [
                <Button key="back" onClick={onCancel}>
                关闭
                </Button>,
                <Button
                key="submit"
                type="primary"
                onClick={this.handleRestore}
              >
                  恢复
              </Button>
              ]
            : restore_status == 'success'
            ? [
                <Button key="back" onClick={this.JumpAddress}>
                关闭
                </Button>,
                <Button key="submit" type="primary" onClick={this.handleSubmit}>
                确认
                </Button>
              ]
            : [
                <Button key="back" onClick={onCancel}>
                关闭
                </Button>
              ]
        }
      >
        {showRestore ? (
          <div>
            {restore_status == 'starting' ? (
              <div>
                <p style={{ textAlign: 'center' }}>
                  <Spin />
                </p>
                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                  恢复中，请稍后(请勿关闭弹窗)
                </p>
              </div>
            ) : (
              ''
            )}
            {restore_status == 'success' ? (
              <div>
                <p
                  style={{
                    textAlign: 'center',
                    color: '#28cb75',
                    fontSize: '36px'
                  }}
                >
                  <Icon type="check-circle-o" />
                </p>
                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                  恢复成功，是否删除原备份？
                </p>
              </div>
            ) : (
              ''
            )}
            {restore_status == 'failed' ? (
              <div>
                <p
                  style={{
                    textAlign: 'center',
                    color: '999',
                    fontSize: '36px'
                  }}
                >
                  <Icon type="close-circle-o" />
                </p>
                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                  恢复失败，请重新恢复
                </p>
              </div>
            ) : (
              ''
            )}
          </div>
        ) : isFinished ? (
          <div>
            <p>您是否要恢复备份到当前集群?</p>
          </div>
        ) : (
          <div>
            <p>您当前应用未完全恢复，是否继续？</p>
          </div>
        )}
      </Modal>
    );
  }
}

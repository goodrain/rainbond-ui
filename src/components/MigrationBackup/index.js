/* eslint-disable react/jsx-indent */
import {
  Alert,
  Button,
  Col,
  Form,
  Icon,
  Modal,
  notification,
  Row,
  Select,
  Spin
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';

const { Option } = Select;

@connect(({ user }) => ({ currUser: user.currentUser }))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      teamsData: [],
      regionData: [],
      teamsName: '',
      regionName: '',
      restore_id: '',
      showRestore: false,
      restore_status: '',
      notRecovered_restore_id: ''
    };
    this.mount = false;
  }

  componentDidMount() {
    this.mount = true;
    this.setTeamList();
    this.queryIsFinished();
  }
  componentWillUnmount() {
    this.mount = false;
  }

  onRegionChange = value => {
    const { mode, currentRegion } = this.props;
    if (mode !== 'full-online' && value !== currentRegion) {
      notification.warning({
        message: formatMessage({id:'appBackups.table.pages.model.migration'})
      });
      return;
    }
    this.setState({ regionName: value });
  };

  setTeamList = () => {
    const { teams } = this.props.currUser;
    const teamsArr = [];
    teams.map(order => {
      const orderbox = {};
      orderbox.team_alias = order.team_alias;
      orderbox.team_name = order.team_name;
      orderbox.region = order.region;
      teamsArr.push(orderbox);
      return order;
    });
    this.setState({ teamsData: teamsArr });
  };
  handleSubmit = () => {
    const { mode, currentRegion } = this.props;
    const { regionName, teamsName } = this.state;
    if (teamsName === '') {
      notification.warning({ message: formatMessage({id:'notification.hint.migration.team'}) });
      return;
    }
    if (regionName === '') {
      notification.warning({ message: formatMessage({id:'notification.hint.migration.cluster'}) });
      return;
    }
    if (mode !== 'full-online' && regionName !== currentRegion) {
      notification.warning({
        message: formatMessage({id:'appBackups.table.pages.model.migration'})
      });
      return;
    }
    this.props.dispatch({
      type: 'application/migrateApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region: this.state.regionName,
        team: this.state.teamsName,
        backup_id: this.props.backupId,
        group_id: this.props.groupId,
        migrate_type: 'migrate',
        event_id: this.state.event_id,
        notRecovered_restore_id: this.state.notRecovered_restore_id
      },
      callback: data => {
        // notification.success({message: "开始迁移应用",duration:'2'});
        if (data) {
          this.setState({ restore_id: data.bean.restore_id }, () => {
            this.queryMigrateApp();
          });
        }
      }
    });
  };

  // 查询迁移状态
  queryMigrateApp = () => {
    if (!this.mount) return;
    this.props.dispatch({
      type: 'application/queryMigrateApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        restore_id: this.state.restore_id,
        group_id: this.props.groupId
      },
      callback: data => {
        if (data) {
          this.setState({
            showRestore: true,
            restore_status: data.bean.status
          });
          if (data.bean.status === 'success') {
            this.props.dispatch(
              routerRedux.push(
                `/team/${data.bean.migrate_team}/region/${data.bean.migrate_region}/apps/${data.bean.group_id}`
              )
            );
            window.location.reload();
          }
          if (data.bean.status === 'failed') {
            // this.props.onCancel && this.props.onCancel()
          }
          if (data.bean.status === 'starting') {
            setTimeout(() => {
              this.queryMigrateApp();
            }, 2000);
          }
        }
      }
    });
  };

  handleTeamsChange = value => {
    const { teamsData } = this.state;
    const { moveBackupMode, currentRegion } = this.props;
    let regionList = [];
    teamsData.map(order => {
      if (order.team_name === value) {
        if (moveBackupMode !== 'full-offline') {
          regionList = order.region;
        } else {
          regionList = order.region.filter(
            re => re.team_region_name === currentRegion
          );
        }
      }
      return order;
    });
    this.setState({
      teamsName: value,
      regionData: regionList,
      regionName: regionList.length > 0 ? regionList[0].team_region_name : ''
    });
  };

  queryIsFinished = () => {
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
            event_id: data.bean.data === null ? '' : data.bean.data.event_id,
            notRecovered_restore_id:
              data.bean.data === null ? '' : data.bean.data.restore_id
          });
        }
      }
    });
  };

  render() {
    const teamsData = this.state.teamsData || [];
    const regionData = this.state.regionData || [];
    const restoreStatus = this.state.restore_status;
    const { moveBackupMode } = this.props;
    return (
      <Modal
        visible
        onCancel={this.props.onCancel}
        onOk={this.handleSubmit}
        title={formatMessage({id:'appBackups.table.pages.migration.title'})}
        footer={
          this.state.showRestore
            ? [
                <Button key="back" onClick={this.props.onCancel}>
                  {formatMessage({id:'button.close'})}
                </Button>
              ]
            : [
                <Button key="back" onClick={this.props.onCancel}>
                  {formatMessage({id:'button.close'})}
                </Button>,
                <Button key="submit" type="primary" onClick={this.handleSubmit}>
                  {formatMessage({id:'button.migration'})}
                </Button>
              ]
        }
      >
        {this.state.showRestore ? (
          <div>
            {restoreStatus === 'starting' ? (
              <div>
                <p style={{ textAlign: 'center' }}>
                  <Spin />
                </p>
                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                  {formatMessage({id:'notification.hint.migration.loading.desc'})}
                </p>
              </div>
            ) : (
              ''
            )}
            {restoreStatus === 'success' ? (
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
                  {formatMessage({id:'notification.success.migration'})}
                </p>
              </div>
            ) : (
              ''
            )}
            {restoreStatus === 'failed' ? (
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
                  {formatMessage({id:'notification.error.migration'})}
                </p>
              </div>
            ) : (
              ''
            )}
          </div>
        ) : (
          <div>
            {moveBackupMode === 'full-offline' && (
              <Alert type="warning" message={formatMessage({id:'notification.hint.migration.warning.alert'})} />
            )}
            <p>{formatMessage({id:'appBackups.table.pages.migration.teamOrCluster'})}</p>
            <Row>
              <Col span={12}>
                <Select
                  style={{ width: '90%', marginRight: '10px' }}
                  onSelect={this.handleTeamsChange}
                  defaultValue={formatMessage({id:'placeholder.backup.select.team'})}
                >
                  {teamsData.map(order => {
                    return (
                      <Option value={order.team_name}>
                        {order.team_alias}
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col span={12}>
                <Select
                  style={{ width: '90%' }}
                  onSelect={this.onRegionChange}
                  value={this.state.regionName}
                >
                  {regionData.map(order => {
                    return (
                      <Option value={order.team_region_name}>
                        {order.team_region_alias}
                      </Option>
                    );
                  })}
                </Select>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    );
  }
}

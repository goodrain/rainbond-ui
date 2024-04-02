import { Card, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../../utils/global';
import AddImage from '../../AddImage';
import EditAdmin from '../../EditAdmin';
import ConfirmModal from '../../ConfirmModal';
import ScrollerX from '../../ScrollerX';
import TeamMemberTable from '../../TeamImageTable';

@connect(({ teamControl, loading }) => ({
  regions: teamControl.regions,
  currentTeam: teamControl.currentTeam,
  toMoveTeamLoading: loading.effects['teamControl/moveTeam']
}))
export default class MemberList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showAddMember: false,
      toDeleteMember: null,
      toMoveTeam: null,
      page: 1,
      pageSize: 8,
      total: 0,
      imageList:[]
    };
  }
  componentDidMount() {
    this.getInitializeVal()
  }
  getInitializeVal = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'teamControl/getAuthorizationMessage',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            imageList: data.list
          });
        }
      }
    })
  }
  onMoveTeam = member => {
    this.setState({ toMoveTeam: member });
  };
  onDelMember = member => {
    this.setState({ toDeleteMember: member });
  };
  onEditAction = member => {
    this.setState({ toEditAction: member });
  };
  hideMoveTeam = () => {
    this.setState({ toMoveTeam: null });
  };
  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };
  handleEditAction = data => {
    const { toEditAction } = this.state
    const { dispatch } = this.props
    dispatch({
      type: 'teamControl/editAuthorizationMessage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        secret_id: toEditAction.secret_id,
        username: data.username,
        password: data.password
      },
      callback: res => {
        if(res && res.response_data && res.response_data.code == 200){
          notification.success({
            message: formatMessage({ id: 'notification.success.change' })
          })
          this.getInitializeVal()
        }
        this.setState({
          toEditAction: null,
        })
      }
    })
  };
  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };
  handleAddMember = values => {
    const { dispatch } = this.props
    dispatch({
      type: 'teamControl/addAuthorizationMessage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        domain:values.domain,
        username:values.username,
        password:values.password
      },
      callback: res => {
        if(res  && res.response_data  &&  res.response_data.code == 200){
          notification.success({
            message: formatMessage({id:'notification.success.add'})
          })
          this.getInitializeVal()
        }
        this.setState({
          showAddMember:false,
        })
      }
    })
  };
  hideDelMember = () => {
    this.setState({ toDeleteMember: null });
  };
  handleDelMember = () => {
    const { toDeleteMember } =this.state
    const { dispatch } = this.props
    dispatch({
      type: 'teamControl/delAuthorizationMessage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        secret_id: toDeleteMember.secret_id
      },
      callback: res => {
        if(res && res.response_data && res.response_data.code == 200){
          notification.success({
            message: formatMessage({id:'notification.success.delete'})
          })
          this.getInitializeVal()
        }
        this.setState({
          toDeleteMember: null,
        })
      }
    })
  };
  render() {
    const {
      currentTeam,
      memberPermissions,
      toMoveTeamLoading,
      // memberPermissions: { isCreate, isAccess }
    } = this.props;
    const {
      page,
      pageSize,
      total,
      showAddMember,
      members,
      roles,
      toEditAction,
      toDeleteMember,
      toMoveTeam,
      imageList
    } = this.state;
    const isCreate = true;
    const isAccess = true;
    return (
      <div>
        <Card
          style={{
            marginBottom: 24
          }}
          bodyStyle={{
            paddingTop: 12
          }}
          title={formatMessage({id: 'teamManage.tabs.image'})}
          extra={
            isCreate && (
              <a href="javascript:;" onClick={this.showAddMember}>
                {formatMessage({id: 'teamManage.tabs.image.table.btn.add'})}
              </a>
            )
          }
        >
          <ScrollerX sm={600}>
            <TeamMemberTable
              memberPermissions={memberPermissions}
              team={currentTeam}
              onMoveTeam={this.onMoveTeam}
              onDelete={this.onDelMember}
              onEditAction={this.onEditAction}
              list={imageList}
            />
          </ScrollerX>
        </Card>
        {showAddMember && (
          <AddImage
            roles={roles}
            onOk={this.handleAddMember}
            onCancel={this.hideAddMember}
          />
        )}
        {toEditAction && (
          <EditAdmin
            roles={roles}
            data={toEditAction}
            onOk={this.handleEditAction}
            onCancel={this.hideEditAction}
          />
        )}
        {toDeleteMember && (
          <ConfirmModal
            onOk={this.handleDelMember}
            title={formatMessage({ id: 'confirmModal.image_warehouse.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.image_warehouse.desc' })}
            onCancel={this.hideDelMember}
          />
        )}
      </div>
    );
  }
}

import { Button, Empty, Icon, Menu, Spin, Tabs } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../../utils/global';
import roleUtil from '../../../utils/role';
import ConfirmModal from '../../ConfirmModal';
import cookie from '@/utils/cookie';
import styles from './index.less';
import PermissionsForm from './newPermissionsFrom';

const { Item } = Menu;
const { TabPane } = Tabs;

@connect(({ teamControl, loading, index }) => ({
  teamControl,
  activitiesLoading: loading.effects['activities/fetchList'],
  overviewInfo: index.overviewInfo
}))
export default class RoleList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showAddRole: false,
      roleList: [],
      rolesID: null,
      rolesLoading: true,
      permissions: null,
      permissionsLoading: true,
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    this.loadTeamRoles();
    this.loadPermissions();
  }
  onDelRole = item => {
    this.setState({ deleteRole: item });
  };

  showAddRole = () => {
    this.setState({ showAddRole: true });
  };
  hideAddRole = ID => {
    this.setState({ showAddRole: false });
    if (ID && typeof ID === 'number') {
      return this.loadTeamRoles(ID);
    }
  };

  handleDelRole = () => {
    this.props.dispatch({
      type: 'teamControl/removeRole',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        role_id: this.state.deleteRole.ID
      },
      callback: () => {
        this.hideDelRole();
        this.loadTeamRoles();
      }
    });
  };
  hideDelRole = () => {
    this.setState({ deleteRole: null });
  };

  loadTeamRoles = (rolesID = false) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamRoles',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          let ID = null;
          if (res.list && res.list.length > 0) {
            ID = res.list[0].ID;
          }
          this.setState({
            roleList: res.list,
            rolesID: rolesID || ID,
            rolesLoading: false
          });
        }
      }
    });
  };

  loadPermissions = () => {
    const { dispatch, overviewInfo } = this.props;
    dispatch({
      type: 'global/fetchPermissions',
      payload: {
        tenant_id: overviewInfo && overviewInfo.team_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            permissions: res.bean || [],
            permissionsLoading: false
          });
        }
      }
    });
  };

  selectKey = ({ key }) => {
    this.setState({
      rolesID: key
    });
  };

  render() {
    const {
      rolePermissions: { isCreate, isEdit, isDelete }
    } = this.props;
    const {
      roleList,
      rolesLoading,
      permissions,
      permissionsLoading,
      showAddRole,
      rolesID,
      deleteRole,
      language
    } = this.state;
    const roles = roleList && roleList.length > 0;
    return (
      <Fragment>
        <div className={styles.systemRoleWrapper}>
          <div className={styles.systemRole}>
            <div className={styles.systemRoleTitle}>
              {formatMessage({id: 'teamManage.tabs.role.title'})}
            </div>
            <Spin spinning={rolesLoading}>
              <div className={styles.systemRoleList}>
                {roles && (
                  <Menu
                    mode="inline"
                    selectedKeys={[`${rolesID}`]}
                    onClick={this.selectKey}
                    style={{
                      borderTop:'1px solid #e8e8e8'
                    }}
                  >
                    {roleList.map(item => {
                      const { ID, name } = item;
                      return (
                        <Item key={ID} className={styles.roleName}>
                          <div> {roleUtil.actionMap(name, language)}</div>
                          {isDelete && (
                            <Icon
                              type="delete"
                              onClick={() => {
                                this.onDelRole(item);
                              }}
                            />
                          )}
                        </Item>
                      );
                    })}
                  </Menu>
                )}
              </div>
            </Spin>
            <div className={styles.systemRoleBtn}>
              {!showAddRole && isCreate && (
                <Button type="primary" onClick={this.showAddRole}>
                  {formatMessage({id: 'teamManage.tabs.role.btn.add'})}
                </Button>
              )}
            </div>
          </div>
          <div className={styles.authSettingBody}>
            <Tabs defaultActiveKey="1">
              <TabPane tab={formatMessage({id: 'teamManage.tabs.role.list.permissions'})} key="1">
                {!roles && !permissionsLoading && !showAddRole ? (
                  <div className={styles.noRole}>
                    <Empty description={<span>{formatMessage({id: 'teamManage.tabs.role.null'})}</span>} />
                  </div>
                ) : (
                  <PermissionsForm
                    isEdit={isEdit}
                    isCreate={isCreate}
                    isAddRole={showAddRole}
                    onCancelAddRole={this.hideAddRole}
                    rolesID={rolesID}
                    roleList={roleList}
                    permissions={permissions}
                    permissionsLoading={permissionsLoading}
                  />
                )}
              </TabPane>
            </Tabs>
          </div>
        </div>

        {deleteRole && (
          <ConfirmModal
            onOk={this.handleDelRole}
            title={formatMessage({ id: 'confirmModal.role.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.role.desc' },{ deleteRole: deleteRole.name})}
            onCancel={this.hideDelRole}
          />
        )}
      </Fragment>
    );
  }
}

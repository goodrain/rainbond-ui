/* eslint-disable react/sort-comp */
import { Button, Form, Input, notification, Spin, Tree } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../../utils/global';
import roleUtil from '../../../utils/newRole';
import cookie from '@/utils/cookie';
import styles from './index.less';

const { TreeNode } = Tree;
const FormItem = Form.Item;

@Form.create()
@connect(({ teamControl, loading, user, global }) => ({
  teamControl,
  currUser: user.currentUser,
  activitiesLoading: loading.effects['activities/fetchList'],
  groups: global.groups,
}))
export default class RoleList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      rolePermissionItem: null,
      expandedKeys: [],
      autoExpandParent: true,
      checkedKeys: [],
      selectedKeys: [],
      loading: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      appKeys: ''
    };
  }
  componentDidMount() {
    const { rolesID, roleList } = this.props;
    if (rolesID) {
      this.loadTeamRolesPermissions(rolesID);
      this.handleRoleName(rolesID, roleList);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (
      (this.props.rolesID !== nextProps.rolesID && nextProps.rolesID) ||
      (this.props.isAddRole !== nextProps.isAddRole && !nextProps.isAddRole)
    ) {
      this.loadTeamRolesPermissions(nextProps.rolesID);
      this.handleRoleName(nextProps.rolesID, nextProps.roleList);
    }
    if (
      (this.props.isAddRole !== nextProps.isAddRole && nextProps.isAddRole) ||
      (!nextProps.rolesID && !nextProps.isAddRole)
    ) {
      this.handleResetRoleForm(nextProps.isAddRole);
    }
  }

  onExpand = expandedKeys => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    this.setState({
      expandedKeys,
      autoExpandParent: false
    });
  };

  onCheck = checkedKeys => {
    this.setState({ checkedKeys });
  };

  onSelect = selectedKeys => {
    this.setState({ selectedKeys });
  };
  handleResetRoleForm = () => {
    const { form } = this.props;
    this.setState({
      rolePermissionItem: null,
      expandedKeys: [],
      autoExpandParent: true,
      checkedKeys: [],
      selectedKeys: []
    });
    form.resetFields();
  };

  handleAddRole = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/createRole',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        name: values.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          return this.loadTeamRolesPermissions(res.bean.ID, true);
        }
        this.handleCloseLoading();
      }
    });
  };

  loadTeamRolesPermissions = (ID, isEditor = false) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamRolesPermissions',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        role_id: ID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const rolePermissions = (res.bean && res.bean.permissions) || null;
          if (rolePermissions) {
            this.handlePermissions(res.bean, isEditor);
          }
        }
      }
    });
  };

  handlePermissions = (rolePermissions, isEditor) => {
    const { permissions } = this.props;
    const { checkedKeys } = this.state;
    const arr = [];
    const rolePermissionItem = rolePermissions;
    if (permissions) {
      this.handlePermissionsSubmodels(
        permissions.team.sub_models,
        rolePermissionItem.permissions.team.sub_models,
        arr,
        false
      );
    }
    if (checkedKeys) {
      if (isEditor) {
        this.setState(
          {
            rolePermissionItem
          },
          () => {
            this.handleRolePermissions(rolePermissionItem);
          }
        );
      } else {
        this.setState({
          expandedKeys: arr,
          checkedKeys: arr,
          autoExpandParent: true
        });
      }
    }
  };

  handlePermissionsSubmodels = (data, roleData, arr) => {
    const { checkedKeys } = this.state;
    const { appKeys } = this.state;
    data.map(item => {
      roleData.map(items => {
        const keys = Object.keys(item)[0];
        const rolekeys = Object.keys(items)[0];
        const regex = /^app_\d+/;
        if (regex.test(keys)) {
          this.setState({
            appKeys: keys
          })
        }
        const regexs = /^app_/;
        const isApp = regexs.test(keys);
        if (keys === rolekeys) {
          if (item[keys].sub_models && item[keys].sub_models.length > 0) {
            return this.handlePermissionsSubmodels(
              item[keys].sub_models,
              items[rolekeys].sub_models,
              arr
            );
          }
          item[keys].perms.map(itemParent => {
            items[rolekeys].perms.map(itemchild => {
              const { code, name } = itemParent;
              const objKey = Object.keys(itemchild)[0];
              if (objKey === name) {
                if (itemchild[name]) {
                  isApp ? arr.push(`${appKeys}_${code}`) : arr.push(`${code}`);
                }
                if (checkedKeys) {
                  if (isApp) {
                    if (checkedKeys.includes(`${appKeys}_${code}`)) {
                      itemchild[name] = true;
                    } else {
                      itemchild[name] = false;
                    }
                  } else {
                    if (checkedKeys.includes(`${code}`)) {
                      itemchild[name] = true;
                    } else {
                      itemchild[name] = false;
                    }
                  }
                }
              }
            });
          });
        }
      });
    });
  };

  handleRoleName = (ID, roleList) => {
    const { language } = this.state
    if (roleList && roleList.length > 0) {
      const roles = roleList.filter(item => {
        return `${item.ID}` === `${ID}`;
      });

      if (roles && roles.length > 0) {
        const { setFieldsValue } = this.props.form;
        setFieldsValue({ name: roleUtil.actionMap(roles[0].name, language) });
      }
    }
  };

  handleEditRole = values => {
    const { dispatch, rolesID } = this.props;
    dispatch({
      type: 'teamControl/editRole',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        role_id: rolesID,
        name: values.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          return this.loadTeamRolesPermissions(res.bean.ID, true);
        }
        this.handleCloseLoading();
      }
    });
  };

  handleRolePermissions = values => {
    if (values) {
      const { dispatch, onCancelAddRole, isAddRole } = this.props;
      dispatch({
        type: 'teamControl/updateRolePermissions',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          role_id: values.role_id,
          permissions: values.permissions
        },
        callback: res => {
          if (res && res.status_code === 200) {
            onCancelAddRole(parseInt(res.bean.role_id));
            notification.success({
              message: isAddRole ? formatMessage({ id: 'notification.success.setUp' }) : formatMessage({ id: 'notification.success.edit' })
            });
          }
          this.handleCloseLoading();
        }
      });
    }
  };
  handleCloseLoading = () => {
    this.setState({
      loading: false
    });
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { isAddRole } = this.props;
        // const { rolePermissionItem } = this.state;
        this.setState({ loading: true }, () => {
          // if (rolePermissionItem) {
          //   this.handlePermissions(rolePermissionItem, true);
          // }
          if (isAddRole) {
            this.handleAddRole(values);
          } else {
            this.handleEditRole(values);
          }
        });
      }
    });
  };

  renderTreeNodes = (data, language, fatherArr = {}) =>
    data.map((item, index) => {
      const keys = Object.keys(item)[0];
      const regexs = /^app_\d+/;
      const showAppName = regexs.test(keys)
      const regex = /^app_/;
      const isApp = regex.test(keys);
      const treeKeys = Object.keys(fatherArr)[0] || ''
      if (item[keys].sub_models && item[keys].sub_models.length > 0) {
        const isAppGateway = keys == 'app_gateway_manage' ? true : false;
        return (
          <TreeNode key={keys + treeKeys} title={showAppName ? this.findApp(keys) : roleUtil.fetchAccessText(keys, language)}>
            {this.renderTreeNodes(item[keys].sub_models, language, isAppGateway ? fatherArr : data[index])}
          </TreeNode>
        )
      }
      return (
        <TreeNode key={keys + treeKeys} title={roleUtil.fetchAccessText(keys, language)}>
          {item[keys].perms.map(item2 => {
            if (isApp) {
              const treeKeys = Object.keys(fatherArr)[0]
              return <TreeNode key={treeKeys + '_' + item2.code} title={language ? item2.desc : item2.name} />;
            }
            return <TreeNode key={item2.code} title={language ? item2.desc : item2.name} />;
          })}
        </TreeNode>
      )
    });
  // 解析keys 找到对应的应用
  findApp = (keys) => {
    const { groups } = this.props;
    // 截取_后面的字符串
    var match = keys.match(/_(\d+)/);
    let appNames = '';
    (groups || []).map(item => {
      if (item.group_id == match[1]) {
        appNames = item.group_name;
      }
    });
    return appNames || keys;
  }
  handleSubmitButton = (loading, isAddRole) => {
    return (
      <Button loading={loading} type="primary" onClick={this.handleSubmit}>
        {isAddRole ? formatMessage({ id: 'teamManage.tabs.role.list.permissions.add' }) : formatMessage({ id: 'teamManage.tabs.role.list.permissions.edit' })}
      </Button>
    );
  };

  render() {
    const {
      form,
      permissions,
      permissionsLoading,
      isAddRole,
      onCancelAddRole,
      isEdit,
      isCreate
    } = this.props;
    const {
      expandedKeys,
      autoExpandParent,
      checkedKeys,
      selectedKeys,
      loading,
      language
    } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 14
        }
      }
    };
    return (
      <Form onSubmit={this.handleSubmit}>
        <Spin spinning={permissionsLoading}>
          <div className={styles.AuthModuleWrap}>
            <FormItem {...formItemLayout} label={formatMessage({ id: 'teamManage.tabs.role.list.permissions.roleName' })}>
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.roleName' })
                  },
                  { max: 32, message: formatMessage({ id: 'placeholder.max32' }) }
                ]
              })(<Input placeholder={formatMessage({ id: 'placeholder.roleName' })} />)}
            </FormItem>
            {permissions && (
              <FormItem {...formItemLayout} label={formatMessage({ id: 'teamManage.tabs.role.list.permissions.allot' })}>
                {getFieldDecorator('permissions', {
                  rules: [{ required: false, message: formatMessage({ id: 'placeholder.permissions' }) }]
                  // initialValue: '',
                })(
                  <Tree
                    className={styles.tree}
                    checkable
                    // 展开/收起节点时触发
                    onExpand={this.onExpand}
                    // （受控）展开指定的树节点
                    expandedKeys={expandedKeys}
                    // 是否自动展开父节点
                    autoExpandParent={autoExpandParent}
                    // 点击复选框触发
                    onCheck={this.onCheck}
                    // //受控）选中复选框的树节
                    checkedKeys={checkedKeys}
                    // //点击树节点触发
                    onSelect={this.onSelect}
                    // //（受控）设置选中的树节点
                    selectedKeys={selectedKeys}
                  >
                    {this.renderTreeNodes(permissions.team.sub_models, language)}
                  </Tree>

                )}
              </FormItem>
            )}
          </div>
        </Spin>

        <div className={styles.systemFormBtn}>
          {isAddRole && (
            <Button onClick={onCancelAddRole} style={{ marginRight: '20px' }}>
              {formatMessage({ id: 'teamManage.tabs.role.list.permissions.btn.cancel' })}
            </Button>
          )}
          {!isAddRole && isEdit && this.handleSubmitButton(loading, isAddRole)}
          {isCreate && isAddRole && this.handleSubmitButton(loading, isAddRole)}
        </div>
      </Form>
    );
  }
}

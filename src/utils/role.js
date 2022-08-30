import globalUtil from '../utils/global';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const actionMaps = {
  admin: formatMessage({id:'utils.role.admin'}),
  developer: formatMessage({id:'utils.role.developer'}),
  viewer: formatMessage({id:'utils.role.viewer'}),
  access: formatMessage({id:'utils.role.access'}),
  owner: formatMessage({id:'utils.role.owner'})
};
const roleMaps = {
  admin: formatMessage({id:'utils.role.roleMaps_admin'}),
  app_store: formatMessage({id:'utils.role.roleMaps_app_store'})
};
const AccessText = {
  component: formatMessage({id:'utils.role.component'}),
  app: formatMessage({id:'utils.role.app'}),
  gatewayRule: formatMessage({id:'utils.role.gatewayRule'}),
  certificate: formatMessage({id:'utils.role.certificate'}),
  plugin: formatMessage({id:'utils.role.plugin'}),
  teamMember: formatMessage({id:'utils.role.teamMember'}),
  teamRole: formatMessage({id:'utils.role.teamRole'}),
  teamRegion: formatMessage({id:'utils.role.teamRegion'}),
  app_config_group: formatMessage({id:'utils.role.app_config_group'}),
  teamRegistryAuth: formatMessage({id:'utils.role.teamRegistryAuth'})
};

let arr = [
  'isAccess',
  'isCreate',
  'isEdit',
  'isDelete',
  'isInstall',
  'isUninstall'
];
let targetArr = [
  'describe',
  'create',
  'edit',
  'delete',
  'install',
  'uninstall'
];
const operationArr = ['isStart', 'isStop', 'isUpdate', 'isConstruct'];
const targetOperationArr = ['start', 'stop', 'update', 'construct'];

export default {
  // 是否可以删除,
  canDel(role) {
    return !role.is_default;
  },
  canCreateComponent(currentTeamPermissionsInfo, dispatch) {
    const componentPermissions = this.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      'queryComponentInfo'
    );
    const App = this.queryAppInfo(currentTeamPermissionsInfo, 'create');
    const { isCreate, isConstruct } = componentPermissions;
    if (App && isCreate && isConstruct) {
      return true;
    }
    return globalUtil.withoutPermission(dispatch);
  },
  canCreateApp(currentTeamPermissionsInfo) {
    return this.queryAppInfo(currentTeamPermissionsInfo, 'create');
  },
  actionMap(name) {
    return actionMaps[name] || name;
  },
  roleMap(name) {
    return roleMaps[name] || name;
  },
  fetchAccessText(text) {
    return AccessText[text] || text;
  },
  querySpecifiedPermissionsInfo(data, type) {
    if (type === 'queryAppInfo') {
      arr = [
        ...arr,
        ...operationArr,
        ...[
          'isBackup',
          'isMigrate',
          'isRestore',
          'isShare',
          'isUpgrade',
          'isCopy',
          'isImport',
          'isExport'
        ]
      ];
      targetArr = [
        ...targetArr,
        ...targetOperationArr,
        ...[
          'backup',
          'migrate',
          'restore',
          'share',
          'upgrade',
          'copy',
          'import',
          'export'
        ]
      ];
    }

    if (type === 'queryComponentInfo') {
      arr = [
        ...arr,
        ...operationArr,
        ...[
          'isVisitWebTerminal',
          'isRestart',
          'isRollback',
          'isTelescopic',
          'isEnv',
          'isRely',
          'isStorage',
          'isPort',
          'isPlugin',
          'isSource',
          'isDeploytype',
          'isCharacteristic',
          'isHealth',
          'isServiceMonitor'
        ]
      ];

      targetArr = [
        ...targetArr,
        ...targetOperationArr,
        ...[
          'visit_web_terminal',
          'restart',
          'rollback',
          'telescopic',
          'env',
          'rely',
          'storage',
          'port',
          'plugin',
          'source',
          'deploy_type',
          'characteristic',
          'health',
          'service_monitor'
        ]
      ];
    }
    const obj = {};
    arr.map((item, index) => {
      obj[item] = this[type](data, targetArr[index]);
      return obj;
    });
    return obj;
  },
  queryTeamBasicInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'teamBasicInfo', targets);
  },
  queryAppInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'app', targets);
  },
  queryComponentInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'component', targets);
  },
  queryAppConfigGroupInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'app_config_group', targets);
  },
  queryControlInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'gatewayRule', targets);
  },
  queryCertificateInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'certificate', targets);
  },
  queryPluginInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'plugin', targets);
  },
  queryTeamMemberInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'teamMember', targets);
  },
  queryTeamRegionInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'teamRegion', targets);
  },
  queryTeamRolesInfo(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'teamRole', targets);
  },
  queryTeamRegistryAuth(data, targets) {
    return this.queryTeamUserPermissionsInfo(data, 'teamRegistryAuth', targets);
  },
  // team  permissions list
  queryTeamUserPermissionsInfo(permissionsInfo, moduleName, targets) {
    const results = [];
    if (permissionsInfo && moduleName && targets) {
      const teamInfo = permissionsInfo.team;
      if (moduleName === 'teamBasicInfo') {
        teamInfo.perms.map((item) => {
          const name = Object.keys(item)[0];
          if (name === targets) results.push(item[targets]);
        });
      } else {
        this.queryPermissionsChildren(
          teamInfo.sub_models,
          moduleName,
          targets,
          results
        );
      }
    }
    if (results.length > 0) {
      return results[0];
    }
    return false;
  },
  // eslint-disable-next-line consistent-return
  queryPermissionsChildren(data, moduleName, targets, results) {
    return data.map((item) => {
      const keys = Object.keys(item)[0];
      if (item[keys].sub_models && item[keys].sub_models.length > 0) {
        return this.renderTreeNodes(
          item[keys].sub_models,
          moduleName,
          targets,
          results
        );
      }
      if (keys === moduleName) {
        item[keys].perms.map((item2) => {
          const name = Object.keys(item2)[0];
          if (targets === name) {
            results.push(item2[targets]);
          }
        });
      }
    });
  }

  // team permissions
};

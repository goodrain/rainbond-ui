import globalUtil from '../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import userUtil from '../utils/user';
import Exception from '../components/Exception'

const actionMaps = {
    admin: '管理员',
    developer: '开发者',
    viewer: '观察者',
    access: '访问者',
    owner: '拥有者'
};
const En_actionMaps = {
    admin: 'Administrators',
    developer: 'Developer',
    viewer: 'Observer',
    access: 'Visitor',
    owner: 'Owner'
};
const roleMaps = {
    admin: formatMessage({ id: 'utils.role.roleMaps_admin' }),
};
const AccessText = {
    team_overview: '团队总览',
    team_app_create: '新建应用',
    team_app_manage: '应用管理',
    team_gateway_manage: '网关管理',
    team_plugin_manage: '插件管理',
    team_manage: '团队管理',
    app_overview: '应用总览',
    app_release: '应用发布',
    app_gateway_manage: '应用网关',
    app_upgrade: '应用升级',
    app_resources: '应用资源',
    app_config_group: '应用配置',
    route_manage: '路由管理',
    target_services: '目标服务',
    certificate: '证书管理',
    team_member: '成员管理',
    team_region: '集群管理',
    team_role: '角色管理',
    team_registry_auth: '镜像仓库授权管理',
    app_gateway_monitor: '网关监控',
    app_route_manage: '路由管理',
    app_target_services: '目标服务',
    app_certificate: '证书管理',
    team_gateway_monitor: '网关监控',
    team_route_manage: '路由管理',
    team_target_services: '目标服务',
    team_certificate: '证书管理',
    team_dynamic: '动态',
};
const En_AccessText = {
    team_overview: 'Team overview',
    team_app_create: 'Create application',
    team_app_manage: 'Application management',
    team_gateway_manage: 'Gateway management',
    team_plugin_manage: 'Plug-in management',
    team_manage: 'Team management',
    app_overview: 'Application overview',
    app_release: 'Application publishing',
    app_gateway_manage: 'Application gateway',
    app_upgrade: 'Application upgrade',
    app_resources: 'Application resource',
    app_config_group: 'Application management',
    route_manage: 'Route management',
    target_services: 'Target service',
    certificate: 'Certificate management',
    team_member: 'Member management',
    team_region: 'Cluster management',
    team_role: 'Role management',
    team_registry_auth: 'Image warehouse authorization management',
    app_gateway_monitor: 'Gateway monitoring',
    app_route_manage: 'Route management',
    app_target_services: 'Target service',
    app_certificate: 'Certificate management',
    team_gateway_monitor: 'Gateway monitoring',
    team_route_manage: 'Route management',
    team_target_services: 'Target service',
    team_certificate: 'Certificate management',
    team_dynamic: 'Dynamic',
};

// 定义菜单与权限属性的映射结构
const teamMenuPermissionsMap = {
    team_overview: 'isTeamOverview',//团队总览
    team_app_create: 'isTeamAppCreate',//新建应用
    team_gateway_monitor: 'isTeamGatewayMonitor',//网关监控
    team_route_manage: 'isTeamRouteManage',//路由管理
    team_target_services: 'isTeamTargetServices',//目标服务
    team_certificate: 'isTeamCertificate',//证书管理
    team_dynamic: 'isTeamDynamic',//动态
    team_region: 'isTeamRegion',//集群管理
    team_role: 'isTeamRole',//角色管理
    team_registry_auth: 'isTeamRegistryAuth',//镜像仓库授权管理
    team_plugin_manage: 'isTeamPluginManage',//插件管理
};

const appMenuPermissionsMap = {
    app_overview: 'isAppOverview', //应用总览
    app_release: 'isAppRelease',//应用发布
    app_upgrade: 'isAppUpgrade',//应用升级
    app_gateway_monitor: 'isAppGatewayMonitor',//网关监控
    app_route_manage: 'isAppRouteManage',//路由管理
    app_target_services: 'isAppTargetServices',//目标服务
    app_certificate: 'isAppCertificate',//证书管理
    app_resources: 'isAppResources',//应用资源
    app_config_group: 'isAppConfigGroup',//应用管理
};
export default {
    // 身份
    actionMap(name, bool) {
        var keys = ''
        Object.keys(actionMaps).map(item => {
            if (actionMaps[item] == name) {
                return keys = item
            }
        })
        if (bool) {
            return actionMaps[keys] || name;
        } else {
            return En_actionMaps[keys] || name;
        }
    },
    // 角色
    roleMap(name) {
        return roleMaps[name] || name;
    },
    // 权限翻译
    fetchAccessText(text, bool) {
        if (bool) {
            return AccessText[text] || text;
        } else {
            return En_AccessText[text] || text;
        }
    },
    // 获取权限对照数组
    queryReferencePermissionsInfo(type) {
        const defaultTargetArr = [
            'describe',
            'create',
            'edit',
            'delete',
            'install',
            'uninstall'
        ];
        const defaultTargetOperationArr = ['start', 'stop', 'update', 'construct', 'copy', 'restart'];
        switch (type) {
            // 团队级别权限特殊处理
            case 'team_overview':
                return ['describe', 'resource_limit','app_list']
                break;
            case 'team_app_create':
            case 'team_gateway_monitor':
            case 'app_gateway_monitor':
            case 'team_dynamic':
                return ['describe']
                break;
            // 应用级别特殊权限
            case 'app_release':
                return ['share', 'export', 'delete', 'describe']
                break;
            case 'app_upgrade':
                return ['app_model_list', 'upgrade_record', 'upgrade', 'rollback']
                break;
            // 组件与应用级别特殊权限
            case 'app_overview':
                return [
                    ...defaultTargetArr,
                    ...defaultTargetOperationArr,
                    ...[
                        'visit_web_terminal',
                        'service_monitor',
                        'telescopic',
                        'env',
                        'rely',
                        'storage',
                        'port',
                        'plugin',
                        'source',
                        'safety',
                        'other_setting'
                    ]
                ];
                break;
            default:
                return defaultTargetArr;
                break;
        }
    },
    // 获取处理对照数组
    queryDisposePermissionsInfo(type) {
        const defaultArr = [
            'isAccess',
            'isCreate',
            'isEdit',
            'isDelete',
            'isInstall',
            'isUninstall'
        ];
        const defaultOperationArr = ['isStart', 'isStop', 'isUpdate', 'isConstruct', 'isCopy', 'isRestart'];
        switch (type) {
            // 团队级别权限特殊处理
            case 'team_overview':
                return ['isAccess', 'isResourceLimit','isAppList']
                break;
            case 'team_app_create':
            case 'team_gateway_monitor':
            case 'app_gateway_monitor':
            case 'team_dynamic':
                return ['isAccess']
                break;
            // 应用级别特殊权限
            case 'app_release':
                return ['isShare', 'isExport', 'isDelete', 'isAccess']
                break;
            case 'app_upgrade':
                return ['isAppModelList', 'isUpgradeRecord', 'isUpgrade', 'isRollback']
                break;
            // 组件与应用级别特殊权限
            case 'app_overview':
                return [
                    ...defaultArr,
                    ...defaultOperationArr,
                    ...[
                        'isVisitWebTerminal',
                        'isServiceMonitor',
                        'isTelescopic',
                        'isEnv',
                        'isRely',
                        'isStorage',
                        'isPort',
                        'isPlugin',
                        'isSource',
                        'isSafety',
                        'isOtherSetting',
                    ]
                ];
                break;
            default:
                return defaultArr;
                break;
        }
    },
    /**
     * 获取权限映射表信息并进行处理
     *
     * @param {Object} data - 权限数据对象，包含团队或应用级别的权限信息
     * @param {string} module - 需要处理的目标模块名称
     * @param {string=} appid - （可选）应用ID，若提供，则查找对应应用的权限信息，否则查找团队级别的权限信息
     *
     * @returns {Object} - 返回一个对象，键为处理后的权限标识，值为对应的权限字典信息
    
     * 此函数首先调用queryDisposePermissionsInfo方法获取处理权限的动作列表（disposeActions），
     * 然后调用queryReferencePermissionsInfo方法获取权限对照数组（referencePermissions）。
     * 接着，遍历处理权限的动作列表，对每个动作调用handlePermissionsInfo方法，
       根据提供的module和appid获取对应权限字典信息，并将结果存入一个新的对象（permissionsObj）中，
       其中对象的键为处理权限的动作，值为该动作在目标模块下的权限字典详情。
     */
    queryPermissionsInfo(data, module, appid = '') {
        const disposeActions = this.queryDisposePermissionsInfo(module);
        const referencePermissions = this.queryReferencePermissionsInfo(module);
        const permissionsObj = {};

        disposeActions.forEach((item, index) => {
            permissionsObj[item] = this.handlePermissionsInfo(data, referencePermissions[index], module, appid);
        });

        return permissionsObj;
    },
    /**
     * 处理权限信息并获取指定模块和目标字典信息
     *
     * @param {Object} data - 权限数据对象，包含团队或应用级别的权限信息
     * @param {string} target - 需要查找的目标权限字典名称
     * @param {string} module - 需要查找的目标模块名称
     * @param {string=} appid - （可选）应用ID，若提供，则查找对应应用的权限信息，否则查找团队级别的权限信息
     *
     * @returns {Object|boolean} - 返回查找到的第一个匹配的权限字典信息，若未找到则返回false
     *
     * 此函数根据提供的appid参数决定查找团队还是应用级别的权限信息。
     * 如果appid存在，则先通过queryAppPermissionsInfo函数获取应用权限信息，再利用renderTreeNodes递归获取目标模块的权限信息，
     * 最后通过queryPermissionsChildren获取指定模块和目标字典的具体信息，并存入results数组。
     * 若appid不存在，则直接对团队权限数据进行类似操作。
     * 结束处理后，返回results数组中第一个（或唯一）找到的权限字典信息，若未找到任何匹配项，则返回false。
     */
    handlePermissionsInfo(data, target, module, appid = '') {
        const results = [];
        if (appid) {
            if (data && target && module) {
                const appInfo = this.queryAppPermissionsInfo(data, appid)
                const newAppInfo = this.renderTreeNodes(appInfo, module)
                this.queryPermissionsChildren(newAppInfo, module, target, results);
            }
        } else {
            if (data && target && module) {
                const teamInfo = this.renderTreeNodes(data, module)
                this.queryPermissionsChildren(teamInfo, module, target, results);
            }
        }
        return results.length > 0 ? results[0] : false;
    },

    /**
     * 获取相应app的权限信息
     *
     * @param {Object} data - 整体权限数据对象，通常包含一系列子模型
     * @param {string} appid - 需要查找的目标应用ID
     *
     * @returns {Object} - 返回与目标应用ID相对应的应用权限信息对象，若未找到则返回一个空对象 {}
     *
     * 此函数首先在整体权限数据对象的子模型中查找名为'team_app_manage'的部分，
     * 找到后，在'team_app_manage'的子模型中搜索与给定appid相匹配的应用权限信息，
     * 若找到匹配项，则返回该应用的权限信息对象；否则返回一个空对象。
     */
    queryAppPermissionsInfo(data, appid) {
        const appManagement = data.sub_models.find((model) => {
            const modelKey = Object.keys(model)[0];
            return modelKey === 'team_app_manage';
        });

        if (appManagement) {
            const appSubModels = appManagement.team_app_manage.sub_models;
            const targetApp = appSubModels.find((app) => Object.keys(app)[0] === appid);

            return targetApp ? targetApp[appid] : {};
        } else {
            return {};
        }
    },

    /**
     * 递归获取权限数组
     *
     * @param {Object[]} data - 权限数据结构，通常为一棵包含子模型（sub_models）的树形结构
     * @param {string} moduleName - 需要查找的目标权限模块名称
     *
     * @returns {Object[]|null} 返回与指定模块名称相符的权限数组，如果未找到，则返回null
     *
     * 此函数遍历给定的数据结构，逐层深入子模型直至找到与 moduleName 匹配的权限模块。
     * 当找到匹配项时，返回该模块所在层级的权限数组。若递归遍历完整棵树仍未找到匹配项，则返回null。
     */
    renderTreeNodes(data, moduleName) {
        const permissionsArr = data.sub_models || [];

        // 遍历当前层级的所有子模型
        for (let i = 0; i < permissionsArr.length; i++) {
            const item = permissionsArr[i];
            const keys = Object.keys(item)[0];

            // 如果当前节点的主键名称与目标模块名称相匹配，则直接返回当前层级的权限数组
            if (keys === moduleName) {
                return permissionsArr;
            }

            // 如果当前节点还包含子模型，并且子模型数量大于0，则递归查找
            if (item[keys].sub_models && item[keys].sub_models.length > 0) {
                const foundNode = this.renderTreeNodes(item[keys], moduleName);

                // 如果递归过程中找到了匹配的权限模块，则返回该模块的权限数组
                if (foundNode) {
                    return foundNode;
                }
            }
        }

        // 如果遍历完成仍没找到匹配的权限模块，则返回null
        return null;
    },

    /**
     * 处理权限信息并获取指定模块及目标权限的具体信息
     *
     * @param {Array<Object>} data - 权限数据列表，每个元素为一个包含模块名称及权限详细信息的对象
     * @param {string} moduleName - 需要检索的目标模块名称
     * @param {string} targets - 需要在目标模块中检索的具体权限名称
     * @param {Array<*>} results - 用于存储匹配到的权限详细信息的数组，函数执行结束后会填充相关数据
     *
     * @returns {void} 无返回值，而是通过修改传入的results参数来存储查找到的权限信息
     *
     * 此函数遍历给定的权限数据列表，查找与moduleName相匹配的模块，并在其中寻找与targets相匹配的权限详细信息。
     * 找到匹配项时，将该权限的详细信息推入results数组中。
     */
    queryPermissionsChildren(data, moduleName, targets, results) {
        return (data || []).map((item) => {
            const keys = Object.keys(item)[0];
            if (keys === moduleName) {
                item[keys].perms.map((item2) => {
                    const name = Object.keys(item2)[0];
                    if (targets === name) {
                        results.push(item2[targets]);
                    }
                });
            }
        });
    },
    /**
     * 通用权限获取方法
     *
     * @param {Object} menuMap - 菜单与权限属性的映射结构，键为菜单类型，值为权限对象上对应的属性名
     * @param {Object} data - 权限数据对象，包含各种菜单类型的权限信息
     * @param {string} appid - （可选）应用ID，默认为空字符串。在某些情况下可能需要根据应用ID获取特定应用的权限信息
     * @param {Function} permissionCheckStrategy - （可选）权限检查策略函数，默认为检查`.isAccess`属性是否存在。
     *                                         该函数接收一个菜单权限对象作为参数，并返回一个布尔值表示用户是否有该菜单的权限。
     *                                         对于特殊情况（如'app_upgrade'），可以通过传入自定义策略函数进行处理。
     *
     * @returns {Object} 返回一个对象，键为菜单类型对应的属性名，值为用户是否拥有该菜单的权限（布尔值）
     */
    queryMenuPermissionsInfo(menuMap, data, appid = '') {
        const obj = {};
        for (const [menuKey, propertyKey] of Object.entries(menuMap)) {
            const menuPermissions = this.queryPermissionsInfo(data, menuKey, appid);
            if (menuKey == 'app_upgrade') {
                obj[propertyKey] = menuPermissions?.isAppModelList || menuPermissions?.isUpgradeRecord || false;
            } else {
                obj[propertyKey] = menuPermissions?.isAccess || false;
            }
        }
        return obj;
    },
    /**
     * 根据团队或应用类型调用通用方法获取菜单权限
     *
     * @param {Object} data - 权限数据对象，包含各种菜单类型的权限信息
     * @param {'team'|'app'} type - 指定获取团队或应用的权限，取值只能为'team'或'app'
     * @param {string} appid - （可选）应用ID，默认为空字符串。当type为'app'时，可能需要根据应用ID获取特定应用的权限信息
     *
     * @returns {Object} 返回一个对象，键为菜单类型对应的属性名，值为用户是否拥有该菜单的权限（布尔值）
     *
     * 此方法根据传入的'type'参数自动选择合适的菜单权限映射表（teamMenuPermissionsMap或appMenuPermissionsMap），
     * 然后调用通用权限获取方法queryMenuPermissionsInfo，从而获取团队或应用的菜单权限信息。
     */
    queryTeamOrAppPermissionsInfo(data, type, appid = '') {
        return this.queryMenuPermissionsInfo(type == 'team' ? teamMenuPermissionsMap : appMenuPermissionsMap, data, appid);
    },
    // 没有权限
    noPermission() {
        return <Exception type={403} style={{ minHeight: 600, height: '80%' }} actions />
    },
    // 刷新权限信息
    refreshPermissionsInfo(appid = '', onlyRefresh = true, callback) {
        const { dispatch } = window.g_app._store;
        let info
        dispatch({
            type: 'user/fetchCurrent',
            callback: res => {
                if (res && res.bean) {
                    const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
                    dispatch({
                        type: 'teamControl/fetchCurrentTeamPermissions',
                        payload: team && team.tenant_actions
                    });
                    if (appid != '') {
                        info = this.queryPermissionsInfo(team?.tenant_actions?.team, 'app_overview', `app_${appid}`)
                        callback && callback(info)
                    } else {
                        info = team?.tenant_actions?.team
                    }
                }
            },
        });
        if (!onlyRefresh) {
            return info || {};
        }
    },
    // 新建应用后刷新信息

};




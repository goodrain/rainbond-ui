import request from '@/utils/request';
import apiconfig from '../../config/api.config';

/**
 * 获取 KubeBlocks 可创建的数据库类型
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {Function} handleError 错误处理回调
 */
export async function fetchKubeBlocksDatabaseTypes(params, handleError) {
    return request(
        `${apiconfig.baseUrl}/console/teams/${params.team_name}/regions/${params.region_name}/kubeblocks/supported_databases`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 获取 StorageClass 列表
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {Function} handleError 错误处理回调
 */
export async function fetchStorageClasses(params, handleError) {
    return request(
        `${apiconfig.baseUrl}/console/teams/${params.team_name}/regions/${params.region_name}/kubeblocks/storage_classes`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 获取 BackupRepo 列表
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {Function} handleError 错误处理回调
 */
export async function fetchBackupRepos(params, handleError) {
    return request(
        `${apiconfig.baseUrl}/console/teams/${params.team_name}/regions/${params.region_name}/kubeblocks/backup_repos`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 创建 KubeBlocks 数据库组件, 一次性完成
 * @param {Object} params - { team_name, region_name, config }
 * @param {String} params.team_name - 团队名称
 * @param {String} params.region_name - 区域名称
 * @param {Object} params.config - 数据库配置
 * @param {String} params.config.group_id - 应用ID
 * @param {String} params.config.database_type - 数据库类型
 * @param {String} params.config.service_cname - 数据库中文名称
 * @param {String} params.config.k8s_app - 数据库英文名称
 * @returns {Promise<Object>} 返回格式与标准组件部署完成后一致，包含 service_alias, group_id 等信息
 */
export async function createDatabaseCluster(params) {
    const { team_name, config } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/apps/kubeblocks`,
        {
            method: 'POST',
            data: config
        }
    );
}

/**
 * 获取组件 KubeBlocks 信息
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务ID
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { bean: { isKubeBlocksComponent: boolean, databaseType: string } }
 */
export async function getComponentKubeBlocksInfo(params, handleError) {
    return request(
        `${apiconfig.baseUrl}/console/teams/${params.team_name}/regions/${params.region_name}/kubeblocks/component/${params.service_id}/infos`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 获取 KubeBlocks 集群详情
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务ID
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 
 */
export async function getClusterDetail(params, handleError) {
    return request(
        `${apiconfig.baseUrl}/console/teams/${params.team_name}/regions/${params.region_name}/kubeblocks/clusters/${params.service_id}`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 伸缩 KubeBlocks Cluster
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Object} params.body request body：{ cpu, memory, storage, replicas, rbdService }
 */
export async function scaleCluster(params, handleError) {
    const { team_name, region_name, service_id, body } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}`,
        {
            method: 'put',
            data: body,
            handleError
        }
    );
}

/**
 * 更新集群备份配置
 * 仅变更 backupRepo / schedule / retentionPeriod / terminationPolicy
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Object} params.body request body：{ backupRepo, schedule, retentionPeriod, terminationPolicy }
 */
export async function updateBackupConfig(params, handleError) {
    const { team_name, region_name, service_id, body } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}/backup`,
        {
            method: 'put',
            data: body,
            handleError
        }
    );
}

/**
 * 创建手动备份
 * 触发 KubeBlocks 集群的手动备份操作，不需要额外参数
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { bean: { backup_id: string, status: string } }
 */
export async function createManualBackup(params, handleError) {
    const { team_name, region_name, service_id } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}/backups`,
        {
            method: 'post',
            handleError
        }
    );
}

/**
 * 获取 KubeBlocks 集群备份列表（分页）
 * 获取集群的备份记录，支持分页展示
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Number} params.page 页码（默认 1）
 * @param {Number} params.page_size 页面大小（默认 6）
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { status_code: 200, list: [], page: 1, total: 4 }
 */
export async function getBackupList(params, handleError) {
    const { team_name, region_name, service_id, page, page_size } = params;
    const queryParams = new URLSearchParams({
        page: page || 1,
        page_size: page_size || 6
    });

    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}/backups?${queryParams.toString()}`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 删除 KubeBlocks 集群备份
 * 删除指定的一个或多个备份记录
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Array<String>} params.backups 要删除的备份名称数组
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { list: [删除的备份名称列表] }
 */
export async function deleteBackups(params, handleError) {
    const { team_name, region_name, service_id, backups } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}/backups`,
        {
            method: 'delete',
            data: { backups },
            handleError
        }
    );
}

/**
 * 获取 KubeBlocks 集群参数（分页/搜索）
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Number} params.page 页码（默认 1）
 * @param {Number} params.page_size 页面大小（默认 6）
 * @param {String} [params.keyword] 关键字搜索（可选）
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { status_code: 200, list: [], page: 1, number: 4 }
 */
export async function getClusterParameters(params, handleError) {
    const { team_name, region_name, service_id, page, page_size, keyword } = params;
    const queryParams = new URLSearchParams({
        page: page || 1,
        page_size: page_size || 6
    });

    if (keyword) {
        queryParams.append('keyword', keyword);
    }

    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}/parameters?${queryParams.toString()}`,
        {
            method: 'get',
            handleError
        }
    );
}

/**
 * 批量更新 KubeBlocks 集群参数
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.region_name 区域名称
 * @param {String} params.service_id 服务 ID
 * @param {Object} params.body 请求体，格式: { changes: [{ name, value }, ...] }
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { status_code: 200, bean: { applied: [], invalids: [] } }
 */
export async function updateClusterParameters(params, handleError) {
    const { team_name, region_name, service_id, body } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/regions/${region_name}/kubeblocks/clusters/${service_id}/parameters`,
        {
            method: 'post',
            data: body,
            handleError
        }
    );
}

/**
 * 从 backup 恢复 cluster
 * @param {Object} params
 * @param {String} params.team_name 团队名称
 * @param {String} params.service_alias 服务别名 (AppBaseView 需要)
 * @param {Object} params.body 请求体，格式: { backup_name: {backup_name} }
 * @param {Function} handleError 错误处理回调
 * @returns {Promise<Object>} 返回格式: { status_code: 200, bean: { applied: [], invalids: [] } }
 */
export async function restoreClusterFromBackup(params, handleError) {
    const { team_name, service_alias, body } = params;
    return request(
        `${apiconfig.baseUrl}/console/teams/${team_name}/apps/${service_alias}/kubeblocks/restores`,
        {
            method: 'post',
            data: body,
            handleError
        }
    )
}
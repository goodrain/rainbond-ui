/*
    配置应用各个状态下的各种对应信息
*/
import { formatMessage } from '@/utils/intl';
const appStatusMap = {
  running: {
    statusCN: formatMessage({id:'utils.app.Operation'}),
    bgClass: 'bg-green',
    disabledAction: ['restart'],
    activeAction: ['stop', 'deploy', 'visit', 'manage_container'],
    iconUrl: '/static/www/img/appOutline/appOutline0.png',
  },
  starting: {
    statusCN: formatMessage({id:'utils.app.Starting'}),
    bgClass: 'bg-yellow',
    disabledAction: ['deploy', 'restart', 'visit', 'manage_container'],
    activeAction: ['stop'],
    iconUrl: '/static/www/img/appOutline/appOutline7.png',
  },
  checking: {
    statusCN: formatMessage({id:'utils.app.Testing'}),
    bgClass: 'bg-yellow',
    disabledAction: ['deploy', 'restart', 'visit', 'manage_container'],
    activeAction: ['stop'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  stoping: {
    statusCN: formatMessage({id:'utils.app.Closing'}),
    bgClass: 'bg-yellow',
    disabledAction: ['deploy', 'restart', 'stop', 'visit', 'manage_container'],
    activeAction: [],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  unusual: {
    statusCN: formatMessage({id:'utils.app.Error'}),
    bgClass: 'bg-red',
    disabledAction: ['visit', 'restart', 'manage_container'],
    activeAction: ['stop', 'deploy'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  closed: {
    statusCN: formatMessage({id:'utils.app.Closed'}),
    bgClass: 'bg-red',
    disabledAction: ['visit', 'stop', 'manage_container'],
    activeAction: ['restart', 'deploy'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  owed: {
    statusCN: formatMessage({id:'utils.app.Insufficient_balance'}),
    bgClass: 'bg-red',
    disabledAction: ['deploy', 'visit', 'restart', 'stop', 'manage_container'],
    activeAction: ['pay'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  Owed: {
    statusCN: formatMessage({id:'utils.app.Insufficient_balance'}),
    bgClass: 'bg-red',
    disabledAction: ['deploy', 'visit', 'restart', 'stop', 'manage_container'],
    activeAction: ['pay'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  expired: {
    statusCN: formatMessage({id:'utils.app.Trial_expired'}),
    bgClass: 'bg-red',
    disabledAction: ['visit', 'restart', 'deploy', 'stop', 'manage_container'],
    activeAction: ['pay'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  undeploy: {
    statusCN: formatMessage({id:'utils.app.Not_deployed'}),
    bgClass: 'bg-gray',
    disabledAction: ['restart', 'stop', 'visit', 'manage_container'],
    activeAction: ['deploy'],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
  unKnow: {
    statusCN: formatMessage({id:'utils.app.Unkonw'}),
    bgClass: 'bg-red',
    disabledAction: ['deploy', 'restart', 'stop', 'visit', 'manage_container'],
    activeAction: [],
    iconUrl: '/static/www/img/appOutline/appOutline1.png',
  },
};

/*

   应用详情bean 工具类

*/

const appUtil = {
  appStatusToBadgeStatus(status) {
    const map = {
      running: 'success',
      creating: 'default',
      starting: 'processing',
      checking: 'processing',
      stoping: 'processing',
      unusual: 'error',
      closed: 'error',
      owed: 'error',
      Owed: 'error',
      expired: 'error',
      undeploy: 'default',
      unKnow: 'error',
      succeeded: 'success'
    };
    return map[status] || map.unKnow;
  },
  getStatusMap(status) {
    return status ? appStatusMap[status] || appStatusMap.unKnow : appStatusMap;
  },
  // 根据应用status返回对应的中文描述
  getAppStatusCN(status) {
    const map = appStatusMap[status] || appStatusMap.unKnow;
    return map.statusCN;
  },
  // 根据应用status返回对应的css类
  getAppStatusClass(status) {
    const map = appStatusMap[status] || appStatusMap.unKnow;
    return map.bgClass;
  },
  // 根据当前应用状态， 返回互斥的操作状态
  getDisableActionByStatus(status) {
    const map = appStatusMap[status] || appStatusMap.unKnow;
    return map.disabledAction;
  },
  // 根据应用状态， 返回当前可以进行的操作
  getActiveActionByStatus(status) {
    const map = appStatusMap[status] || appStatusMap.unKnow;
    return map.activeAction;
  },
  // 是否已安装性能分析插件
  isInstalledPowerPlugin(appDetail) {
    return false;
  },
  // 获取权限数据
  getActions(appDetail) {
    return []
      .concat(appDetail.tenant_actions || [])
      .concat(appDetail.service_actions || []);
  },
  // 是否可以管理应用
  canManageApp(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service') > -1;
  },
  // 是否可以启动应用
  canStopApp(appDetail) {
    const activeAction = appDetail.tenant_actions || [];
    return activeAction.indexOf('stop_service') > -1;
  },
  // 是否可以启动应用
  canStartApp(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('start_service') > -1;
  },
  // 是否可以重启应用
  canRestartApp(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('restart_service') > -1;
  },
  // 是否可以删除
  canDelete(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('delete_service') > -1;
  },
  // 是否可以管理容器
  canManageContainter(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_container') > -1;
  },
  // 是否可以转移组
  canMoveGroup(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_group') > -1;
  },
  // 是否可以回滚
  canRollback(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('rollback_service') > -1;
  },
  // 是否可以部署应用
  canDeploy(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('deploy_service') > -1;
  },
  // 应用安装来源 source_code 源码 market 云市 docker_compose、docker_run、docker_image 镜像
  getInstallSource(appDetail) {
    return appDetail && appDetail.service && appDetail.service.service_source;
  },
  // 是否是云市安装的应用
  isMarketApp(appDetail) {
    const source = this.getInstallSource(appDetail);
    return source === 'market';
  },
  isMarketAppByBuildSource(buildSource) {
    return buildSource && buildSource.service_source === 'market';
  },
  isOauthByBuildSource(buildSource) {
    return !!(
      buildSource.code_from && buildSource.code_from.indexOf('oauth') > -1
    );
  },

  // 是否是镜像安装的应用
  isImageApp(appDetail) {
    const source = this.getInstallSource(appDetail);
    return (
      source === 'docker_compose' ||
      source === 'docker_run' ||
      source === 'docker_image'
    );
  },
  isImageAppByBuildSource(buildSource) {
    const source = buildSource && buildSource.service_source;
    return (
      source === 'docker_compose' ||
      source === 'docker_run' ||
      source === 'docker_image'
    );
  },
  // 是否是上传文件创建的应用
  isUploadFilesAppSource(buildSource) {
    const source = buildSource && buildSource.service_source;
    return source === 'package_build';
  },
  // 是否是源码创建的应用
  isCodeApp(appDetail) {
    const source = this.getInstallSource(appDetail);
    return source === 'source_code';
  },
  isCodeAppByBuildSource(buildSource) {
    const source = buildSource && buildSource.service_source;
    return source === 'source_code';
  },
  // 是否是dockerfile类型的应用
  // 获取源码创建应用的语言类型
  getLanguage(appDetail) {
    let language = appDetail && appDetail.service && appDetail.service.language || '';
    if (language) {
      language = language.replace(/\./, '').toLowerCase();
    }
    return language;
  },
  // 是否是java类型的语言
  isJava(appDetail) {
    const language = this.getLanguage(appDetail);
    return (
      language === 'java-war' ||
      language === 'java-jar' ||
      language === 'java-maven'
    );
  },
  // 是否是dockerfile类型的应用, dockerfile类型的应用也属于源码类型的应用
  isDockerfile(appDetail) {
    const language = this.getLanguage(appDetail);
    return language === 'dockerfile';
  },
  // 判断该应用是否创建完成
  isCreateComplete(appDetail) {
    const service = appDetail.service || {};
    return service.create_status === 'complete';
  },
  // 是否是Compose方式创建的应用
  isCreateFromCompose(appDetail) {
    const source = this.getInstallSource(appDetail);
    return source === 'docker_compose';
  },
  // 是否是源码创建的应用
  isCreateFromCode(appDetail) {
    const source = this.getInstallSource(appDetail);
    return source === 'source_code';
  },
  // 是否是自定义源码创建的应用
  isCreateFromCustomCode(appDetail) {
    const service = appDetail.service || {};
    return (
      this.isCreateFromCode(appDetail) && service.code_from === 'gitlab_manual'
    );
  },
  getCreateTypeCN(appDetail) {
    const source = this.getInstallSource(appDetail);
    const map = {
      source_code: formatMessage({id:'utils.app.Source'}),
      market: formatMessage({id:'utils.app.Yunshi'}),
      docker_compose: 'DockerCompose',
      docker_run: 'DockerRun',
      docker_image: formatMessage({id:'utils.app.image'}),
    };
    return map[source] || '';
  },
  getCreateTypeCNByBuildSource(buildSource) {
    const source = buildSource && buildSource.service_source;
    if (!source) {
      return '';
    }
    const map = {
      source_code: formatMessage({id:'utils.app.Source'}),
      market: buildSource.install_from_cloud ? formatMessage({id:'utils.app.store'}) : formatMessage({id:'utils.app.Local'}),
      docker_compose: 'DockerCompose',
      docker_run: 'DockerRun',
      docker_image: formatMessage({id:'utils.app.image'}),
      package_build: formatMessage({id:'utils.app.Local_file'})
    };
    return map[source] || '';
  },
  // 是否可以对应用添加成员，修改成员，及删除成员
  canManageAppMember(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_member_perms') > -1;
  },
  // 是否管理应用的设置页面
  canManageAppSetting(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_config') > -1;
  },
  // 是否管理应用插件页面
  canManageAppPlugin(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_plugin') > -1;
  },
  // 是否管理应用伸缩页面
  canManageAppExtend(appDetail) {
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_extend') > -1;
  },
  // 是否管理应用监控页面
  canManageAppMonitor(appDetail) {
    return true;
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_monitor') > -1;
  },
  // 是否管理应用日志页面
  canManageAppLog(appDetail) {
    return true;
    const activeAction = this.getActions(appDetail);
    return activeAction.indexOf('manage_service_log') > -1;
  },
};

export default appUtil;

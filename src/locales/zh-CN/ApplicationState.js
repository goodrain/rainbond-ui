
// 组件运行状态
const ApplicationState =    {
    'ApplicationState.RUNNING':'运行中',
    'ApplicationState.STARTING':'启动中',
    'ApplicationState.CLOSED':'已关闭',
    'ApplicationState.STOPPING':'关闭中',
    'ApplicationState.ABNORMAL':'异常',
    'ApplicationState.PARTIAL_ABNORMAL':'部分异常',
    'ApplicationState.not-configured':'未配置',
    'ApplicationState.unknown':'未知',
    'ApplicationState.deployed':'已部署',
    'ApplicationState.superseded':'可升级',
    'ApplicationState.failed':'失败',
    'ApplicationState.uninstalled':'已卸载',
    'ApplicationState.uninstalling':'卸载中',
    'ApplicationState.pending-install':'安装中',
    'ApplicationState.pending-upgrade':'升级中',
    'ApplicationState.pending-rollback':'回滚中',
}

export default Object.assign({}, ApplicationState);
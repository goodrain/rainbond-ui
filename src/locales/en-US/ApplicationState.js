
// 组件运行状态
const ApplicationState =    {
    'ApplicationState.RUNNING':'Running',
    'ApplicationState.STARTING':'Starting',
    'ApplicationState.CLOSED':'Closed',
    'ApplicationState.STOPPING':'Stopping',
    'ApplicationState.ABNORMAL':'Abnormal',
    'ApplicationState.PARTIAL_ABNORMAL':'Partial Abnormal',
    'ApplicationState.not-configured':'Not Configured',
    'ApplicationState.unknown':'Unknown',
    'ApplicationState.deployed':'Deployed',
    'ApplicationState.superseded':'Upgradable',
    'ApplicationState.failed':'Failed',
    'ApplicationState.uninstalled':'Uninstalled',
    'ApplicationState.uninstalling':'Uninstalling',
    'ApplicationState.pending-install':'Installation in progress',
    'ApplicationState.pending-upgrade':'Upgrading',
    'ApplicationState.pending-rollback':'Rolling back',
    'ApplicationState.leave_unused':'Unused',
    'ApplicationState.waiting':'Waiting',
    'ApplicationState.WAITING':'Waiting',

}

export default Object.assign({}, ApplicationState);
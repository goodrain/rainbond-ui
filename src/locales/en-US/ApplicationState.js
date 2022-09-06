
// 组件运行状态
const ApplicationState =    {
    'ApplicationState.RUNNING':'Running',
    'ApplicationState.STARTING':'Starting',
    'ApplicationState.CLOSED':'Closed',
    'ApplicationState.STOPPING':'Closing',
    'ApplicationState.ABNORMAL':'Abnormal',
    'ApplicationState.PARTIAL_ABNORMAL':'Partial abnormality',
    'ApplicationState.not-configured':'Not configured',
    'ApplicationState.unknown':'Nnknown',
    'ApplicationState.deployed':'Deployed',
    'ApplicationState.superseded':'Upgradable',
    'ApplicationState.failed':'Fail',
    'ApplicationState.uninstalled':'Uninstalled',
    'ApplicationState.uninstalling':'Uninstalling',
    'ApplicationState.pending-install':'Installation in progress',
    'ApplicationState.pending-upgrade':'Upgrading',
    'ApplicationState.pending-rollback':'Rolling back',
    'ApplicationState.leave_unused':'Unused',

}

export default Object.assign({}, ApplicationState);
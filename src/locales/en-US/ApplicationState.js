
// 组件运行状态
const ApplicationState =    {
    'ApplicationState.RUNNING':'In operation',
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
}

export default Object.assign({}, ApplicationState);
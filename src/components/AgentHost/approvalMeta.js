const RISK_META = {
  low: {
    label: '提示',
    color: 'blue',
    cardClass: 'approvalCardInfo'
  },
  medium: {
    label: '警告',
    color: 'orange',
    cardClass: 'approvalCardWarning'
  },
  high: {
    label: '危险',
    color: 'red',
    cardClass: 'approvalCardDanger'
  }
};

const SCOPE_META = {
  enterprise: {
    label: '企业级',
    color: 'purple'
  },
  team: {
    label: '团队级',
    color: 'blue'
  },
  app: {
    label: '应用级',
    color: 'cyan'
  },
  component: {
    label: '组件级',
    color: 'gold'
  },
  workflow: {
    label: '流程级',
    color: 'orange'
  }
};

function getApprovalRiskMeta(risk, levelLabel) {
  const normalizedRisk = risk && RISK_META[risk] ? risk : 'medium';
  const meta = RISK_META[normalizedRisk];

  return {
    label: levelLabel || meta.label,
    color: meta.color,
    cardClass: meta.cardClass
  };
}

function getApprovalScopeMeta(scope, scopeLabel) {
  if (!scope && !scopeLabel) {
    return {
      label: '',
      color: 'default'
    };
  }

  const meta = scope && SCOPE_META[scope] ? SCOPE_META[scope] : null;

  return {
    label: scopeLabel || (meta && meta.label) || '未分级',
    color: (meta && meta.color) || 'default'
  };
}

module.exports = {
  getApprovalRiskMeta,
  getApprovalScopeMeta
};

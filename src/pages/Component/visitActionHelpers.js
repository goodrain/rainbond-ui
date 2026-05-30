function shouldShowGenericVisitAction({ method, canVisit, isShowThirdParty, isAccess }) {
  if (!isAccess) {
    return false;
  }
  if (isShowThirdParty) {
    return true;
  }
  if (method === 'vm') {
    return false;
  }
  return !!canVisit;
}

function shouldShowWebTerminalAction({
  method,
  isVisitWebTerminal,
  isShowThirdParty,
  isShowKubeBlocksComponent
}) {
  if (method === 'vm') {
    return false;
  }
  if (isShowThirdParty || isShowKubeBlocksComponent) {
    return false;
  }
  return !!isVisitWebTerminal;
}

module.exports = {
  shouldShowGenericVisitAction,
  shouldShowWebTerminalAction
};

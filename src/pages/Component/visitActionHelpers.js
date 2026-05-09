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

module.exports = {
  shouldShowGenericVisitAction
};

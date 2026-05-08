function shouldViewportLock(snapshot = {}) {
  if (!snapshot) {
    return false;
  }

  const { currentUser, needLogin, location, agent } = snapshot;
  const isRouteHidden =
    !!location &&
    typeof location.pathname === 'string' &&
    (/^\/user(\/|$)/.test(location.pathname) ||
      /^\/oauth(\/|$)/.test(location.pathname) ||
      /^\/enterprise\/[^/]+\/shell(\/|$)/.test(location.pathname) ||
      /^\/team\/[^/]+\/region\/[^/]+\/components\/[^/]+\/webconsole(\/|$)/.test(
        location.pathname
      ));

  return !!(
    currentUser &&
    !needLogin &&
    !isRouteHidden &&
    agent &&
    agent.interactionLocked
  );
}

module.exports = {
  shouldViewportLock,
};

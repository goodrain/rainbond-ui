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
    agent.visible &&
    agent.interactionLocked &&
    // 冲突提示（另一个窗口在跑）必须可点击：此时全局遮罩会吞掉按钮点击。
    !agent.runConflict
  );
}

module.exports = {
  shouldViewportLock,
};

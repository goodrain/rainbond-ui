function normalizePanelWidth(width) {
  const numericWidth = Number(width);
  if (!Number.isFinite(numericWidth) || numericWidth <= 0) {
    return 0;
  }
  return Math.floor(numericWidth);
}

function getAgentViewportCssVars(options = {}) {
  const isPanelVisible = !!options.isPanelVisible;
  const panelConfig = options.panelConfig || {};
  const isPushMode = panelConfig.mode === 'push';
  const panelWidth =
    isPanelVisible && isPushMode
      ? normalizePanelWidth(panelConfig.width)
      : 0;

  return {
    '--agent-panel-width': `${panelWidth}px`,
  };
}

module.exports = {
  getAgentViewportCssVars,
};

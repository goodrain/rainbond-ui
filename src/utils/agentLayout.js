export function getAgentPanelConfig() {
  if (typeof window === 'undefined') {
    return {
      mode: 'push',
      width: 420,
    };
  }

  if (window.innerWidth < 768) {
    return {
      mode: 'overlay',
      width: window.innerWidth,
    };
  }

  return {
    mode: 'push',
    width: Math.min(Math.max(Math.floor(window.innerWidth * 0.25), 360), 640),
  };
}

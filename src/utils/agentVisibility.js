function isRainbondInfoAgentEnabled(rainbondInfo) {
  const config = rainbondInfo && rainbondInfo.show_ai_assistant;
  if (!config) {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(config, 'enable')) {
    return config.enable !== false;
  }
  return true;
}

module.exports = {
  isRainbondInfoAgentEnabled
};

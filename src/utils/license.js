export default {
  haveFeature(enableFeatures, feature) {
    if (!enableFeatures || enableFeatures.length === 0) {
      return false;
    }
    return enableFeatures.filter(item => item.code === feature).length > 0;
  }
};

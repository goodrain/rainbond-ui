const getK8sResources = infoList => {
  if (!infoList || !Array.isArray(infoList.k8s_resources)) {
    return [];
  }
  return infoList.k8s_resources;
};

const hasK8sResources = infoList => getK8sResources(infoList).length > 0;

module.exports = {
  getK8sResources,
  hasK8sResources
};

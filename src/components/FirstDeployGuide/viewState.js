export function createFirstDeployGuideViewTracker() {
  let viewed = false;

  return () => {
    if (viewed) {
      return false;
    }
    viewed = true;
    return true;
  };
}

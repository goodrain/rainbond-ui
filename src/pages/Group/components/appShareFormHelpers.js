const cloneShareService = item => ({
  ...item,
  extend_method_map: item.extend_method_map
    ? { ...item.extend_method_map }
    : item.extend_method_map,
  dep_service_map_list: Array.isArray(item.dep_service_map_list)
    ? item.dep_service_map_list.map(dep => ({ ...dep }))
    : [],
  service_connect_info_map_list: Array.isArray(item.service_connect_info_map_list)
    ? item.service_connect_info_map_list.map(config => ({ ...config }))
    : [],
  service_env_map_list: Array.isArray(item.service_env_map_list)
    ? item.service_env_map_list.map(config => ({ ...config }))
    : []
});

const DAEMONSET_NODE_SCALE_FIELDS = ['min_node', 'max_node', 'step_node'];
const DAEMONSET_NODE_SCALE_TIP = 'DaemonSet 类型资源不能设置节点步长';

const isDaemonSetComponent = item =>
  item &&
  (item.extend_method === 'daemonset' || item.service_type === 'daemonset');

const isNodeScalingDisabled = item => isDaemonSetComponent(item);

const isNodeScalingField = field => DAEMONSET_NODE_SCALE_FIELDS.includes(field);

const getNodeScalingDisabledTip = (item, field) =>
  isNodeScalingDisabled(item) && isNodeScalingField(field)
    ? DAEMONSET_NODE_SCALE_TIP
    : '';

const sanitizeExtendMethodMap = item => {
  if (!item || !item.extend_method_map || !isDaemonSetComponent(item)) {
    return;
  }
  DAEMONSET_NODE_SCALE_FIELDS.forEach(field => {
    delete item.extend_method_map[field];
  });
};

const collectShareServiceData = ({
  shareServiceList = [],
  selectedShareKeys = [],
  componentRefs = []
}) => {
  const shareServiceData = shareServiceList.map(cloneShareService);
  let componentFormHasError = false;

  componentRefs.forEach(app => {
    if (!app || !app.props || !app.props.form) {
      return;
    }
    const apptab = app.props.tab;
    let componentValues = null;
    app.props.form.validateFields((errs, val) => {
      if (errs) {
        componentFormHasError = true;
        return;
      }
      componentValues = val;
    });
    if (componentFormHasError || !componentValues) {
      return;
    }
    shareServiceData.forEach(option => {
      const ID = option.service_id;
      if (option.service_alias !== apptab) {
        return;
      }
      Object.keys(componentValues).forEach(index => {
        const indexarr = index.split('||');
        const firstInfo = indexarr && indexarr.length > 0 && indexarr[0];
        if (!firstInfo) {
          return;
        }
        const isConnect = firstInfo === 'connect';
        const isEnv = firstInfo === 'env';

        if (isConnect && indexarr[2] !== 'random') {
          option.service_connect_info_map_list.forEach(serapp => {
            if (
              serapp.attr_name === indexarr[1] &&
              String(ID) === String(indexarr[3])
            ) {
              serapp[indexarr[2]] = componentValues[index];
              serapp.is_change = true;
            }
          });
        }

        if (isEnv) {
          option.service_env_map_list.forEach(serapp => {
            if (
              serapp.attr_name === indexarr[1] &&
              String(ID) === String(indexarr[2])
            ) {
              serapp.attr_value = componentValues[index];
              serapp.is_change = true;
            }
          });
        }

        if (
          firstInfo === 'extend' &&
          option.extend_method_map &&
          String(ID) === String(indexarr[2])
        ) {
          if (
            isDaemonSetComponent(option) &&
            isNodeScalingField(indexarr[1])
          ) {
            return;
          }
          option.extend_method_map[indexarr[1]] = componentValues[index];
        }
      });
    });
  });

  shareServiceData.forEach(sanitizeExtendMethodMap);

  const selectedShareServices = [];
  selectedShareKeys.forEach(shareKey => {
    shareServiceData.forEach(option => {
      if (shareKey === option.service_share_uuid) {
        selectedShareServices.push(option);
      }
    });
  });

  return {
    componentFormHasError,
    shareServiceData,
    selectedShareServices
  };
};

module.exports = {
  collectShareServiceData,
  getNodeScalingDisabledTip,
  isDaemonSetComponent,
  isNodeScalingDisabled
};

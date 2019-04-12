/*
   应用健康检测模型util
*/

const appProbeUtil = {
  // 获取初始化等候时间, 单位秒
  getInitWaitTime(probeBean) {
    return probeBean.initial_delay_second;
  },
  // 获取检测间隔时间, 单位秒
  getIntervalTime(probeBean) {
    return probeBean.period_second;
  },
  // 获取检测超时时间, 单位秒
  getTimeoutTime(probeBean) {
    return probeBean.timeout_second;
  },
  // 获取连续检测成功次数
  getSuccessTimes(probeBean) {
    return probeBean.success_threshold;
  },
  // 获取连续检测失败次数
  getFailTimes(probeBean) {
    return probeBean.failure_threshold;
  },
  // 获取检测的接口
  getPort(probeBean) {
    return probeBean.port;
  },
  // 获取使用的探针协议
  getProtocol(probeBean) {
    return probeBean.scheme;
  },
  // 获取请求头，http协议下有效
  getHeaders(probeBean) {
    return probeBean.http_header;
  },
  // 获取路径，http协议下有效
  getPath(probeBean) {
    return probeBean.path;
  },

  // 获取检测类型中文描述
  getcnName(probeBean) {
    if (probeBean.mode === 'readiness') {
      return '启动时检测';
    }

    if (probeBean.mode === 'liveness') {
      return '运行时检测';
    }

    return '';
  },

  // 是否设置了启动时检测, 未设置则bean为空对象
  isStartProbeUsed(probeBean) {
    return (probeBean.mode === 'readiness'||probeBean.mode === 'liveness');
  },
  // 是否启用了启动时检测
  isStartProbeStart(probeBean) {
    return probeBean.is_used === true;
  },
  // 是否设置了运行时检测, 未设置则bean为空对象
  isRunningProbeUsed(probeBean) {
    return probeBean.mode === 'liveness';
  },
  // 是否启用了运行时检测
  isRunningProbeStart(probeBean) {
    return probeBean.is_used === true;
  },
  // 是否开启
  isUsed(probeBean) {
    return probeBean.is_used;
  },
};

export default appProbeUtil;

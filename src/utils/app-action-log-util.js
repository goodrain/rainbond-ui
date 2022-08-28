/*
  应用操作日志模型工具
*/
const actionCNMap = {
  deploy: '部署',
  restart: '启动',
  delete: '删除',
  stop: '关闭',
  HorizontalUpgrade: '水平升级',
  VerticalUpgrade: '垂直升级',
  callback: '回滚',
  create: '创建',
  own_money: '应用欠费关闭',
  expired: '应用过期关闭',
  'share-ys': '发布到云市',
  'share-yb': '发布到云帮',
  reboot: '应用重启',
  'git-change': '仓库地址修改',
  imageUpgrade: '应用更新'
};

const appActionLogUtil = {
  // 是否正在操作中
  isActioning(log) {
    return !!(
      log.final_status !== 'complete' &&
      log.final_status !== 'timeout' &&
      log.event_id
    );
  },
  // 获取操作的中文描述
  getActionCN(log) {
    return log.type_cn || '';
  },
  // 获取操作的结果状态中文描述
  getActionResultCN(log) {
    let status;
    const status_json = {
      success: '完成',
      failure: formatMessage({id:'notification.success.Failed'}),
      timeout: '超时',
      abnormal: '异常'
    };
    const final_status_json = {
      complate: '完成',
      timeout: '超时',
      failure: formatMessage({id:'notification.success.Failed'}),
      timeout: '超时'
    };

    if (log.final_status == 'complete') {
      status = status_json[log.status];
    } else if (log.final_status == 'timeout') {
      status = final_status_json[log.final_status];
    } else {
      status = '进行中';
    }

    return status;
  },
  // 获取操作的执行者
  getActionUser(log) {
    return log.user_name || '';
  },
  // 是否操作失败
  isFail(log) {
    return !!(this.isComplete(log) && log.status === 'failure');
  },
  // 是否操作超时
  isTimeout(log) {
    return !!(this.isComplete(log) && log.status === 'timeout');
  },
  // 是否操作成功
  isSuccess(log) {
    return !!(this.isComplete(log) && log.status === 'success');
  },
  // 是否操作完成，无论失败
  isComplete(log) {
    return log.final_status === 'complete';
  },
  // 获取失败信息
  getFailMessage(log) {
    return log.message || '';
  },
  // 获取版本提交者
  getCommitUser(log) {
    if (log.code_version) {
      return log.code_version.user;
    }
    return '';
  },
  // 获取代码版本
  getCodeVersion(log) {
    if (log.code_version) {
      return log.code_version.code_version;
    }
    return '';
  },

  // 获取版本提交说明
  getCommitLog(log) {
    if (log.code_version) {
      return log.code_version.commit;
    }
    return '';
  },
  // 是否部署的操作
  isDeploy(log) {
    return log.type === 'deploy';
  },
  // 是否显示版本commit信息
  isShowCommitInfo(log) {
    return this.isDeploy(log) && log.code_version;
  },
  // 当前操作是否可以回滚
  canRollback(log) {
    return !!(
      !this.isFail(log) &&
      this.isDeploy(log) &&
      log.code_version &&
      log.code_version.rollback
    );
  },
  // 获取回滚的版本
  getRollbackVersion(log) {
    return log;
  },
  // 获取操作的时间
  getActionTime(log) {
    return (log.start_time || '').split(' ')[1];
  },
  // 获取操作的日期
  getActionDate(log) {
    return (log.start_time || '').split(' ')[0];
  },
  // 获取操作的日期时间
  getActionDateTime(log) {
    return log.start_time || '';
  }
};
export default appActionLogUtil;

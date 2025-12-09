/*
  应用操作日志模型工具
*/
import { formatMessage } from '@/utils/intl';
const actionCNMap = {
  deploy: formatMessage({id:'utils.app-action-log-util.deploy'}),
  restart: formatMessage({id:'utils.app-action-log-util.restart'}),
  delete: formatMessage({id:'utils.app-action-log-util.delete'}),
  stop: formatMessage({id:'utils.app-action-log-util.stop'}),
  HorizontalUpgrade: formatMessage({id:'utils.app-action-log-util.HorizontalUpgrade'}),
  VerticalUpgrade: formatMessage({id:'utils.app-action-log-util.VerticalUpgrade'}),
  callback: formatMessage({id:'utils.app-action-log-util.callback'}),
  create: formatMessage({id:'utils.app-action-log-util.create'}),
  own_money: formatMessage({id:'utils.app-action-log-util.own_money'}),
  expired: formatMessage({id:'utils.app-action-log-util.expired'}),
  'share-ys': formatMessage({id:'utils.app-action-log-util.share-ys'}),
  'share-yb': formatMessage({id:'utils.app-action-log-util.share-yb'}),
  reboot: formatMessage({id:'utils.app-action-log-util.reboot'}),
  'git-change': formatMessage({id:'utils.app-action-log-util.git-change'}),
  imageUpgrade: formatMessage({id:'utils.app-action-log-util.imageUpgrade'})
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
      success: formatMessage({id:'utils.app-action-log-util.deploy'}),
      failure: formatMessage({id:'utils.app-action-log-util.failure'}),
      timeout: formatMessage({id:'utils.app-action-log-util.timeout'}),
      abnormal: formatMessage({id:'utils.app-action-log-util.abnormal'})
    };
    const final_status_json = {
      complate: formatMessage({id:'utils.app-action-log-util.complate'}),
      timeout: formatMessage({id:'utils.app-action-log-util.timeout'}),
      failure: formatMessage({id:'utils.app-action-log-util.failure'}),
      abnormal: formatMessage({id:'utils.app-action-log-util.abnormal'})
    };

    if (log.final_status == 'complete') {
      status = status_json[log.status];
    } else if (log.final_status == 'timeout') {
      status = final_status_json[log.final_status];
    } else {
      status = `${formatMessage({id:'utils.app-action-log-util.ongoing'})}`;
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

const CONTAINER_STARTUP_FAILURE = '容器启动失败，请查看日志';
const PROGRAM_STARTUP_FAILURE = '程序启动失败，请查看日志';

function getOperationRecordMessage(message) {
  if (!message) {
    return '';
  }
  return String(message).replace(CONTAINER_STARTUP_FAILURE, PROGRAM_STARTUP_FAILURE);
}

function getOperationLogTooltipTitle({ defaultTitle, detail }) {
  if (!detail) {
    return defaultTitle;
  }
  return `${defaultTitle}：${detail}`;
}

function getOperationLogTooltipVisible(finalStatus) {
  if (finalStatus === '') {
    return true;
  }
  return undefined;
}

module.exports = {
  getOperationLogTooltipTitle,
  getOperationLogTooltipVisible,
  getOperationRecordMessage
};

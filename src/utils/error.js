/* eslint-disable prefer-destructuring */
import { notification } from 'antd';
import { formatMessage } from '@/utils/intl';
import errorMessage from './errorMessage';

const { getErrorCodeMessage } = errorMessage;
const WARNING_DEDUP_WINDOW_MS = 2000;
const recentWarnings = new Map();

export function notifyAPIWarning(message) {
  if (!message) {
    return;
  }
  const now = Date.now();
  const lastShownAt = recentWarnings.get(message) || 0;
  if (now - lastShownAt < WARNING_DEDUP_WINDOW_MS) {
    return;
  }
  recentWarnings.forEach((shownAt, key) => {
    if (now - shownAt >= WARNING_DEDUP_WINDOW_MS) {
      recentWarnings.delete(key);
    }
  });
  recentWarnings.set(message, now);
  notification.warning({ message });
}

export default function handleAPIError(err) {
  let data = null;
  let messages = null;
  if (err.response && err.response.data) {
    data = err.response.data;
  } else if (err.data) {
    data = err.data;
  }
  if (data) {
    const detailMessage = data.msg_show || data.msg;
    switch (data.code) {
      case 7028:
        messages =  `${formatMessage({id:'utils.errror.install'})}`;
        break;
      case 10411:
        messages = `${formatMessage({id:'utils.errror.Not_available'})}`;
        break;
      case 10412:
        messages = getErrorCodeMessage(data, {
          notExist: `${formatMessage({id:'utils.errror.not_exist'})}`
        });
        break;
      case 20900:
        messages = `${formatMessage({id:'utils.errror.Upgrade_record'})}`;
        break;
      case 20901:
        messages = `${formatMessage({id:'utils.errror.Upgrade_snapshot'})}`;
        break;
      case 20903:
        messages = `${formatMessage({id:'utils.errror.fail'})}`;
        break;
      case 20904:
        messages = `${formatMessage({id:'utils.errror.non_existent'})}`;
        break;
      case 20905:
        messages = `${formatMessage({id:'utils.errror.Incomplete'})}`;
        break;
      case 20906:
        messages = `${formatMessage({id:'utils.errror.record'})}`;
        break;
      case 20907:
        messages = `${formatMessage({id:'utils.errror.rolled_back'})}`;
        break;
      case 20908:
        messages = `${formatMessage({id:'utils.errror.Upgrade_only'})}`;
        break;
      case 500:
        messages = detailMessage || `${formatMessage({id:'utils.errror.try_again'})}`;
        break;
      default:
        if (!messages && detailMessage) {
          notifyAPIWarning(detailMessage);
        }
    }
    if (messages) {
      notifyAPIWarning(messages);
    }
  }
}

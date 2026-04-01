/* eslint-disable prefer-destructuring */
import { notification } from 'antd';
import { formatMessage } from '@/utils/intl';
export default function handleAPIError(err) {
  let data = null;
  let messages = null;
  if (err.response && err.response.data) {
    data = err.response.data;
  } else if (err.data) {
    data = err.data;
  }
  if (data) {
    switch (data.code) {
      case 7028:
        messages =  `${formatMessage({id:'utils.errror.install'})}`;
        break;
      case 10411:
        messages = `${formatMessage({id:'utils.errror.Not_available'})}`;
        break;
      case 10412:
        messages = `${formatMessage({id:'utils.errror.not_exist'})}`;
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
        messages = `${formatMessage({id:'utils.errror.try_again'})}`;
        break;
      default:
        if (!messages && data.msg_show) {
          notification.warning({ message: data.msg_show });
        }
    }
    if (messages) {
      notification.warning({ message: messages });
    }
  }
}

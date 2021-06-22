/* eslint-disable prefer-destructuring */
import { notification } from 'antd';

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
      case 20900:
        messages = '找不到升级记录';
        break;
      case 20901:
        messages = '找不到应用升级快照';
        break;
      case 20903:
        messages = '组件部署失败, 请稍后重试';
        break;
      case 20904:
        messages = '组件从属安装关系不存在，无法进行升级';
        break;
      case 20905:
        messages = '上一个任务未完成';
        break;
      case 20906:
        messages = '无法重新部署该记录';
        break;
      case 20907:
        messages = '无法回滚该记录';
        break;
      case 20908:
        messages = '只能升级未升级的升级记录';
        break;
      case 500:
        messages = '服务端开小差了，请稍后重试';
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

import { notification } from 'antd';

// Uniform handling of API errors.
export default function handleAPIError(err) {
  let data = null;
  if (err.response) {
    data = err.response && err.response.data;
  }
  if (data) {
    switch (data.code) {
      case 20904:
        notification.warning({
          message: '组件从属安装关系不存在，无法进行升级'
        });
        break;
      case 500:
        notification.warning({ message: '服务端开小差了，请稍后重试' });
        break;
      default:
        if (data.msg_show) {
          notification.warning({ message: data.msg_show });
        }
    }
  }
}

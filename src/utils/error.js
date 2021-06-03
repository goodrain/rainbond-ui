import { notification } from 'antd';

// Uniform handling of API errors.
export default function handleAPIError(err) {
  console.log(err);
  if (err.data) {
    switch (err.data.code) {
      case 500:
        notification.warning({ message: '服务端开小差了，请稍后重试' });
        break;
      default:
        if (err.data.msg_show) {
          notification.warning({ message: err.data.msg_show });
        }
    }
  }
}

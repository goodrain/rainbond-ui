import { notification } from 'antd';
import { formatMessage } from '@/utils/intl';
import handleAPIError from './error';

export default function handleApplicationCreationError(err) {
  const data = err && ((err.response && err.response.data) || err.data);
  // request.js already opens the login or installation preflight dialog.
  if (data && (data.code === 10405 || data.code === 10412)) {
    return;
  }
  if (err && (err.response || err.data)) {
    handleAPIError(err);
    return;
  }
  notification.error({
    message: formatMessage({ id: 'utils.request.warning' }),
    description: formatMessage({ id: 'utils.request.server_error' })
  });
}

import { formatMessage } from '@/utils/intl';
export const t = (key, values) =>
  formatMessage({ id: `vmDemo.${key}` }, values);

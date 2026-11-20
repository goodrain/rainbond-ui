import { formatMessage } from '@/utils/intl';
export const t = (key, values) =>
  formatMessage({ id: `vmCreation.${key}` }, values);

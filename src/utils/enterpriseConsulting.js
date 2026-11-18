import { capturePostHogEvent } from '../posthog';

export const ENTERPRISE_CONSULTING_URL =
  'https://rainbond.feishu.cn/share/base/shrcn4dG9z5zvbZZWd1MFf6ILBg';

export function trackEnterpriseConsulting(entry) {
  capturePostHogEvent('enterprise_consultation_clicked', {
    action_type: 'enterprise_consultation',
    entry
  });
}

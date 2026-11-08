import { formatMessage } from '@/utils/intl';
import roleUtil from '../../../utils/newRole';

export const t = (key, values) => formatMessage({ id: `delivery.${key}` }, values);
export const getScope = (params, user) => ({ ...params, enterprise_id: user && user.enterprise_id });
export const deliveryPath = params => `/team/${encodeURIComponent(params.teamName)}/region/${encodeURIComponent(params.regionName)}/apps/${encodeURIComponent(params.appID)}/delivery`;
export function canPublishTemplate(user, team, permissions, params) {
  if (!user) return false;
  if (user.is_enterprise_admin === true) return true;
  const membership = (user.teams || []).find(item => item.team_name === params.teamName);
  if (membership && (String(membership.creater) === String(user.user_id) ||
    (membership.role_name_list || []).some(role => ['owner', 'admin'].includes(role)))) return true;
  if (team && (team.team_name || team.tenant_name) === params.teamName && String(team.creater) === String(user.user_id)) return true;
  return !!(membership && roleUtil.queryTeamOrAppPermissionsInfo(permissions && permissions.team, 'app', `app_${params.appID}`).isAppRelease);
}

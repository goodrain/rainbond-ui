import globalUtile from "@/utils/global"
import roleUtil from '@/utils/newRole';
import sourceUtil from '@/utils/source-unit';
import userUtil from '@/utils/user';
import rainbondUtil from '@/utils/rainbond';
import config from '../../../config/api.config'
import cookie from "@/utils/cookie";
export default {
  enterprise_id: globalUtile.getCurrEnterpriseId(),
  team_name: globalUtile.getCurrTeamName(),
  region_name: globalUtile.getCurrRegionName(),
  app_id: globalUtile.getAppID(),
  component_id: globalUtile.getComponentID(),
  globalUtile: globalUtile,
  roleUtil: roleUtil,
  rainbondUtil: rainbondUtil,
  sourceUtil: sourceUtil,
  userUtil: userUtil,
  colorPrimary: globalUtile.getPublicColor('primary-color'),
  currentLocale: cookie.get('language') === 'zh-CN' ? 'zh' : 'en',
  baseUrl: config.baseUrl,
  imageUploadUrl: config.imageUploadUrl,
  token: cookie.get('token')
}
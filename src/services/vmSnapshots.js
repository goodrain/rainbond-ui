import apiconfig from '../../config/api.config';
import request from '../utils/request';
import { validSnapshotName } from '../utils/vmSnapshotRead';

function read(body, handleError, shouldApply, detail) {
  if (shouldApply && !shouldApply()) return undefined;
  if (!body.team_name || !body.region_name || !body.app_alias || (detail && !validSnapshotName(body.snapshot_name))) {
    throw new Error('Invalid snapshot read context');
  }
  const path = `${apiconfig.baseUrl}/console/teams/${encodeURIComponent(body.team_name)}/apps/${encodeURIComponent(body.app_alias)}/vm-snapshots`;
  return request(detail ? `${path}/${encodeURIComponent(body.snapshot_name)}` : path, {
    method: 'get',
    params: { region_name: body.region_name, ...(detail ? {} : { page: body.page, page_size: body.page_size }) },
    // request.js uses these captured values for X_TEAM_NAME / X_REGION_NAME.
    data: { team_name: body.team_name, region_name: body.region_name },
    showLoading: false, showMessage: false, shouldApply,
    handleError: error => { if ((!shouldApply || shouldApply()) && handleError) handleError(error); }
  });
}
export function getVMSnapshots(body, handleError, shouldApply) { return read(body, handleError, shouldApply, false); }
export function getVMSnapshot(body, handleError, shouldApply) { return read(body, handleError, shouldApply, true); }

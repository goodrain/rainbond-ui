import apiconfig from '../../config/api.config';
import request from '../utils/request';
import { validSnapshotName } from '../utils/vmSnapshotRead';
import { validateSnapshotPrepare, validRequestId } from '../utils/vmSnapshotCreate';

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

export function getVMSnapshotJob(body, handleError, shouldApply) {
  if (shouldApply && !shouldApply()) return undefined;
  if (!validRequestId(body.expected_request_id) || body.request_id !== body.expected_request_id) throw new Error('Invalid snapshot job correlation');
  for (const key of ['team_name', 'region_name', 'app_alias']) {
    if (typeof body[key] !== 'string' || !body[key] || ['.', '..'].includes(body[key])) throw new Error('Invalid snapshot job scope');
  }
  return request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(body.team_name)}/apps/${encodeURIComponent(body.app_alias)}/vm-jobs/${encodeURIComponent(body.expected_request_id)}`, {
    method: 'get', params: { region_name: body.region_name },
    data: { team_name: body.team_name, region_name: body.region_name },
    showLoading: false, showMessage: false, shouldApply,
    handleError: error => { if ((!shouldApply || shouldApply()) && handleError) handleError(error); }
  });
}

export function enqueueVMSnapshot(body, handleError, shouldApply) {
  if (shouldApply && !shouldApply()) return undefined;
  const input = validateSnapshotPrepare(body);
  for (const key of ['team_name', 'region_name', 'app_alias']) {
    if (typeof body[key] !== 'string' || !body[key] || ['.', '..'].includes(body[key])) throw new Error('Invalid snapshot scope');
  }
  return request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(body.team_name)}/apps/${encodeURIComponent(body.app_alias)}/vm-snapshots`, {
    method: 'post', data: { ...input, team_name: body.team_name, region_name: body.region_name },
    showLoading: false, showMessage: false, shouldApply,
    handleError: error => { if ((!shouldApply || shouldApply()) && handleError) handleError(error); }
  });
}

export function getVMExistingSnapshotCapability(body, handleError, shouldApply) {
  if (shouldApply && !shouldApply()) return undefined;
  for (const key of ['team_name', 'region_name', 'app_alias']) {
    if (typeof body[key] !== 'string' || !body[key] || ['.', '..'].includes(body[key])) throw new Error('Invalid VM capability scope');
  }
  return request(`${apiconfig.baseUrl}/console/teams/${encodeURIComponent(body.team_name)}/apps/${encodeURIComponent(body.app_alias)}/vm-snapshot-capability`, {
    method: 'get', params: { region_name: body.region_name },
    data: { team_name: body.team_name, region_name: body.region_name },
    showLoading: false, showMessage: false, shouldApply,
    handleError: error => { if ((!shouldApply || shouldApply()) && handleError) handleError(error); }
  });
}

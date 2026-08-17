const PLATFORM_PLUGIN_NAMESPACE = 'rbd-plugins';
const PLATFORM_PLUGIN_ALIAS = '平台插件';
const PLATFORM_PLUGIN_MARKET = '__platform_plugin__';

function findPlatformPluginTeam(list) {
  if (!Array.isArray(list)) {
    return undefined;
  }
  return list.find(
    team => team && team.namespace === PLATFORM_PLUGIN_NAMESPACE
  );
}

function hasRegion(team, regionName) {
  return Boolean(
    team &&
      Array.isArray(team.region_list) &&
      team.region_list.some(region => region && region.region_name === regionName)
  );
}

function buildCreateTeamPayload(regionName) {
  return {
    team_name: PLATFORM_PLUGIN_ALIAS,
    namespace: PLATFORM_PLUGIN_NAMESPACE,
    useable_regions: [regionName]
  };
}

function buildOpenRegionPayload(teamName, regionName) {
  return {
    team_name: teamName,
    region_names: regionName
  };
}

function buildMarketPreflightPayload(plugin, teamName, regionName) {
  if (!plugin || !plugin.app_key) {
    throw new Error('Platform plugin app_key is required');
  }
  if (!plugin.latest_version) {
    throw new Error('Platform plugin latest_version is required');
  }
  return {
    team_name: teamName,
    region_name: regionName,
    group_id: 0,
    app_id: plugin.app_key,
    group_key: plugin.app_key,
    app_version: plugin.latest_version,
    is_deploy: true,
    install_from_cloud: true,
    marketName: PLATFORM_PLUGIN_MARKET
  };
}

function shouldNotifyPreflightError(error) {
  return !(
    error &&
    error.response &&
    error.response.data &&
    error.response.data.code === 10412
  );
}

function dispatchWithCallbacks(dispatch, action) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const resolveOnce = response => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const rejectOnce = error => {
      if (settled) return;
      settled = true;
      reject(error || new Error(`${action.type} failed`));
    };

    let dispatchResult;
    try {
      dispatchResult = dispatch({
        ...action,
        callback: resolveOnce,
        handleError: rejectOnce
      });
    } catch (error) {
      rejectOnce(error);
      return;
    }

    if (dispatchResult && typeof dispatchResult.then === 'function') {
      dispatchResult.then(() => {
        rejectOnce(new Error(`${action.type} completed without callback`));
      }, rejectOnce);
    }
  });
}

function validateTeamsPage(response) {
  if (
    !response ||
    response.status_code !== 200 ||
    !response.bean ||
    !Array.isArray(response.bean.list) ||
    !Number.isFinite(response.bean.total_count) ||
    !Number.isInteger(response.bean.total_count) ||
    response.bean.total_count < 0
  ) {
    throw new Error('Malformed enterprise teams response');
  }
  return response.bean;
}

function ensurePlatformPluginTeam({
  dispatch,
  enterpriseId,
  regionName,
  onSuccess,
  onError,
  pageSize = 100
}) {
  let finalSettled = false;
  const settleSuccess = team => {
    if (!finalSettled) {
      finalSettled = true;
      if (onSuccess) onSuccess(team);
    }
    return team;
  };
  const settleError = error => {
    if (!finalSettled) {
      finalSettled = true;
      if (onError) onError(error);
    }
    throw error;
  };

  const fetchPage = page =>
    dispatchWithCallbacks(dispatch, {
      type: 'global/fetchEnterpriseTeams',
      payload: {
        enterprise_id: enterpriseId,
        page,
        page_size: pageSize
      }
    }).then(validateTeamsPage);

  const findAcrossPages = (page = 1) =>
    fetchPage(page).then(bean => {
      const team = findPlatformPluginTeam(bean.list);
      if (team) return team;
      if (page * pageSize < bean.total_count) {
        return findAcrossPages(page + 1);
      }
      return undefined;
    });

  const ensureRegion = team => {
    if (hasRegion(team, regionName)) return Promise.resolve(team);
    return dispatchWithCallbacks(dispatch, {
      type: 'teamControl/openRegion',
      payload: buildOpenRegionPayload(team.team_name, regionName)
    }).then(() => team);
  };

  const requeryAfterCreate = createError =>
    fetchPage(1).then(bean => {
      const team = findPlatformPluginTeam(bean.list);
      if (!team) {
        throw createError || new Error('Platform plugin team was not found after creation');
      }
      return ensureRegion(team);
    });

  const workflow =
    Number.isFinite(pageSize) && Number.isInteger(pageSize) && pageSize > 0
      ? findAcrossPages().then(team => {
        if (team) return ensureRegion(team);
        return dispatchWithCallbacks(dispatch, {
          type: 'teamControl/createTeam',
          payload: buildCreateTeamPayload(regionName)
        }).then(
          () => requeryAfterCreate(),
          createError => requeryAfterCreate(createError)
        );
      })
      : Promise.reject(new Error('pageSize must be a positive integer'));

  return workflow.then(settleSuccess, settleError);
}

module.exports = {
  PLATFORM_PLUGIN_ALIAS,
  PLATFORM_PLUGIN_MARKET,
  PLATFORM_PLUGIN_NAMESPACE,
  buildCreateTeamPayload,
  buildMarketPreflightPayload,
  buildOpenRegionPayload,
  ensurePlatformPluginTeam,
  findPlatformPluginTeam,
  hasRegion,
  shouldNotifyPreflightError
};

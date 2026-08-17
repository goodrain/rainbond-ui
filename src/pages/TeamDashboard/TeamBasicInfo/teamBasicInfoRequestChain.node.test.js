const assert = require('assert');
const fs = require('fs');
const path = require('path');

const teamBasicInfoSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const teamDashboardSource = fs.readFileSync(path.join(__dirname, '..', 'Index.js'), 'utf8');
const teamLayoutSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'layouts', 'TeamLayout.js'), 'utf8');
const globalModelSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'models', 'global.js'), 'utf8');

const sourceBetween = (source, start, end) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notStrictEqual(startIndex, -1, `missing source marker: ${start}`);
  assert.notStrictEqual(endIndex, -1, `missing source marker: ${end}`);
  return source.slice(startIndex, endIndex);
};

const loadHotAppSource = sourceBetween(
  teamBasicInfoSource,
  '  loadHotApp = () => {',
  '  // pageNum变化的回调'
);
const teamBasicInfoUnmountSource = sourceBetween(
  teamBasicInfoSource,
  '  componentWillUnmount() {',
  '  setCardListNode = node => {'
);
const teamLayoutReceivePropsSource = sourceBetween(
  teamLayoutSource,
  '  componentWillReceiveProps(nextProps) {',
  '  componentDidUpdate(prevProps) {'
);
const getTeamOverviewSource = sourceBetween(
  teamLayoutSource,
  '  getTeamOverview =',
  '  getLoginRole ='
);
const getTeamOverviewEffectSource = sourceBetween(
  globalModelSource,
  '    *getTeamOverview(',
  '    *syncMarketAppDetail('
);

assert.ok(
  /componentDidMount\(\)\s*\{\s*this\._isMounted\s*=\s*true;\s*this\.loadHotApp\(\);/.test(teamBasicInfoSource),
  'TeamBasicInfo should load the app list directly after marking itself mounted'
);

assert.ok(
  !/import Result from|type:\s*'index\/fetchOverview'|\bloadingOverview\b|\bloadedOverview\b|overviewInfo\?*\.region_health/.test(teamBasicInfoSource),
  'TeamBasicInfo should not keep overview loading, fetching, result, or region-health gates'
);

assert.ok(
  !/@connect\(\(\{[^}]*\bindex\b/.test(teamBasicInfoSource) &&
    !/\bindex\s*,\s*loading\b/.test(teamBasicInfoSource),
  'TeamBasicInfo should not connect or read the index model'
);

assert.ok(
  /type:\s*'global\/getTeamAppList'[\s\S]*?payload:\s*\{[\s\S]*?query,[\s\S]*?page,[\s\S]*?page_size,[\s\S]*?sort:\s*sortValue/.test(loadHotAppSource),
  'getTeamAppList should preserve query, page, page_size, and sort parameters'
);

assert.ok(
  /const errorData\s*=\s*err\s*&&\s*\(err\.data\s*\|\|\s*\(err\.response\s*&&\s*err\.response\.data\)\);/.test(loadHotAppSource) &&
    /errorData\s*&&\s*errorData\.code\s*===\s*10401[\s\S]*?page:\s*1[\s\S]*?this\.loadHotApp\(\);[\s\S]*?else\s*\{\s*this\.setState\(\{\s*appListLoading:\s*false\s*\}\);/.test(loadHotAppSource),
  '10401 should reset to page one and retry while other errors stop app-list loading'
);

assert.ok(
  /this\.appListRequestId\s*=\s*0;/.test(teamBasicInfoSource) &&
    /const requestId\s*=\s*\+\+this\.appListRequestId;/.test(loadHotAppSource) &&
    /let requestHandled\s*=\s*false;/.test(loadHotAppSource),
  'TeamBasicInfo should assign every app-list request a monotonically increasing ID'
);

assert.ok(
  /callback:\s*res\s*=>\s*\{\s*requestHandled\s*=\s*true;\s*if\s*\(!this\._isMounted\s*\|\|\s*requestId\s*!==\s*this\.appListRequestId\)\s*return;/.test(loadHotAppSource) &&
    /handleError:\s*err\s*=>\s*\{\s*requestHandled\s*=\s*true;\s*if\s*\(!this\._isMounted\s*\|\|\s*requestId\s*!==\s*this\.appListRequestId\)\s*return;/.test(loadHotAppSource),
  'TeamBasicInfo should ignore callback and error side effects from stale app-list requests'
);

assert.ok(
  /if\s*\(res\s*&&\s*res\.status_code\s*===\s*200\)[\s\S]*?else\s*\{\s*this\.setState\(\{\s*appListLoading:\s*false\s*\}\);\s*\}/.test(loadHotAppSource),
  'TeamBasicInfo should stop app-list loading for non-200 callbacks'
);

assert.ok(
  /const dispatchResult\s*=\s*this\.props\.dispatch\(/.test(loadHotAppSource) &&
    /const handleRequestSettled\s*=\s*\(\)\s*=>\s*\{[\s\S]*?!requestHandled[\s\S]*?this\._isMounted[\s\S]*?requestId\s*===\s*this\.appListRequestId[\s\S]*?appListLoading:\s*false/.test(loadHotAppSource) &&
    /dispatchResult\.then\(handleRequestSettled,\s*handleRequestSettled\);/.test(loadHotAppSource),
  'TeamBasicInfo should stop loading when a latest request settles without invoking either handler'
);

assert.ok(
  /this\._isMounted\s*=\s*false;\s*this\.appListRequestId\s*\+=\s*1;/.test(teamBasicInfoUnmountSource),
  'TeamBasicInfo should invalidate pending app-list completions during unmount'
);

assert.ok(
  /handlePromptModalOpen\s*=\s*\(\)\s*=>[\s\S]*?status_code\s*===\s*200[\s\S]*?this\.loadHotApp\(\);/.test(teamBasicInfoSource) &&
    /handleDeleteSuccess\s*=\s*\(\)\s*=>\s*\{[\s\S]*?this\.loadHotApp\(\);/.test(teamBasicInfoSource),
  'successful start, stop, and delete actions should refresh the app list'
);

assert.ok(
  !/@connect\(\(\{[^}]*\bindex\b/.test(teamDashboardSource) &&
    !/type:\s*'index\/fetchOverview'|loadOverview\s*=/.test(teamDashboardSource),
  'TeamDashboard should not connect, fetch, or load the legacy index overview'
);

assert.ok(
  /teamOverview:\s*global\.teamOverview/.test(teamDashboardSource),
  'TeamDashboard should connect global.teamOverview'
);

assert.ok(
  !/logoInfo:\s*false/.test(teamDashboardSource) &&
    /currentTeam\.logo/.test(teamDashboardSource) &&
    /currentTeam\.team_id[\s\S]*?teamOverview\.team_id[\s\S]*?String\(currentTeam\.team_id\)\s*===\s*String\(teamOverview\.team_id\)/.test(teamDashboardSource) &&
    /imageUrlTeam=\{logoInfo\}/.test(teamDashboardSource),
  'TeamDashboard should prefer the current-team logo and only use an ID-matched overview logo'
);

assert.ok(
  /this\.teamOverviewRequestKeys\s*=\s*new Set\(\);/.test(teamLayoutSource) &&
    /this\.lastInitializedTeamOverviewKey\s*=\s*'';/.test(teamLayoutSource) &&
    /this\._isUnmounted\s*=\s*false;/.test(teamLayoutSource),
  'TeamLayout should track in-flight and last-successful overview request keys'
);

assert.ok(
  /getTeamOverviewRequestKey\s*=\s*params\s*=>/.test(teamLayoutSource) &&
    /isCurrentTeamOverviewRequest\s*=\s*key\s*=>/.test(teamLayoutSource),
  'TeamLayout should expose request-key and current-route helpers'
);

assert.ok(
  /this\.getTeamOverview\(nextParams\);/.test(teamLayoutReceivePropsSource),
  'route changes should start the next team overview with captured next params'
);

assert.ok(
  /getTeamOverview\s*=\s*params\s*=>/.test(getTeamOverviewSource) &&
    /const overviewParams\s*=\s*params\s*\|\|\s*\(this\.props\.match\s*&&\s*this\.props\.match\.params\)\s*\|\|\s*\{\};/.test(getTeamOverviewSource) &&
    /const \{ teamName, regionName \}\s*=\s*overviewParams;[\s\S]*?const requestKey\s*=\s*this\.getTeamOverviewRequestKey\(overviewParams\);/.test(getTeamOverviewSource),
  'getTeamOverview should accept optional captured params and default to current props'
);

assert.ok(
  !/getTeamOverview\(currentUser\.user_id\)|getTeamOverview\(res\.bean\s*&&\s*res\.bean\.user_id\)/.test(teamLayoutSource),
  'existing overview callers should omit their legacy ignored user ID and use current props'
);

assert.ok(
  /if \(\s*!requestKey\s*\|\|\s*this\.teamOverviewRequestKeys\.has\(requestKey\)\s*\|\|\s*this\.lastInitializedTeamOverviewKey\s*===\s*requestKey\s*\)\s*\{\s*return;\s*\}/.test(teamLayoutSource) &&
    /this\.teamOverviewRequestKeys\.add\(requestKey\);[\s\S]*?if\s*\(isSaas\)\s*\{\s*this\.fetchTeamDetails\(\);/.test(getTeamOverviewSource),
  'TeamLayout should deduplicate before SaaS details and overview dispatches'
);

assert.ok(
  /const finalizeRequest\s*=\s*\(\)\s*=>\s*\{\s*this\.teamOverviewRequestKeys\.delete\(requestKey\);\s*\};/.test(getTeamOverviewSource) &&
    /const dispatchResult\s*=\s*dispatch\(/.test(getTeamOverviewSource) &&
    /dispatchResult\.then\(finalizeRequest,\s*finalizeRequest\);/.test(getTeamOverviewSource),
  'TeamLayout should unconditionally finalize its own key when the dispatch task settles'
);

assert.ok(
  /shouldSave:\s*\(\)\s*=>\s*!this\._isUnmounted\s*&&\s*this\.isCurrentTeamOverviewRequest\(requestKey\)/.test(getTeamOverviewSource),
  'TeamLayout should prevent stale and unmounted overview responses from updating shared state'
);

assert.ok(
  /\{\s*payload,\s*callback,\s*handleError,\s*shouldSave\s*\}/.test(getTeamOverviewEffectSource) &&
    /const data\s*=\s*yield call\(getTeamOverview,\s*payload,\s*handleError\);[\s\S]*?if\s*\(data\s*&&\s*\(!shouldSave\s*\|\|\s*shouldSave\(data\)\)\)\s*\{\s*yield put\(\{\s*type:\s*'saveTeamOverview',\s*payload:\s*data\.bean\s*\}\);\s*\}[\s\S]*?if\s*\(data\s*&&\s*callback\)\s*\{\s*callback\(data\);\s*\}/.test(getTeamOverviewEffectSource),
  'global getTeamOverview should gate reducer writes before put while always retaining data callbacks'
);

assert.ok(
  /callback:\s*res\s*=>\s*\{\s*finalizeRequest\(\);\s*if\s*\(this\._isUnmounted\s*\|\|\s*!this\.isCurrentTeamOverviewRequest\(requestKey\)\)\s*\{\s*return;\s*\}[\s\S]*?status_code\s*===\s*200[\s\S]*?this\.lastInitializedTeamOverviewKey\s*=\s*requestKey;[\s\S]*?sessionStorage\.setItem[\s\S]*?this\.fetchPipePipeline\(res\.bean\.eid\)[\s\S]*?this\.fetchEnterpriseInfo\(res\.bean\.eid\)/.test(getTeamOverviewSource),
  'TeamLayout should clean its own key and suppress stale-success side effects before initializing the current route'
);

assert.ok(
  /handleError:\s*err\s*=>\s*\{\s*finalizeRequest\(\);\s*if\s*\(this\._isUnmounted\s*\|\|\s*!this\.isCurrentTeamOverviewRequest\(requestKey\)\)\s*\{\s*return;\s*\}[\s\S]*?notification\.warning/.test(getTeamOverviewSource),
  'TeamLayout should clean its own key and suppress stale-error warnings and redirects'
);

assert.ok(
  /componentWillUnmount\(\)\s*\{\s*this\._isUnmounted\s*=\s*true;\s*this\.teamOverviewRequestKeys\.clear\(\);\s*\}/.test(teamLayoutSource) &&
    /componentDidMount\(\)\s*\{\s*this\._isUnmounted\s*=\s*false;/.test(teamLayoutSource) &&
    !/handleError:[\s\S]{0,600}lastInitializedTeamOverviewKey\s*=/.test(getTeamOverviewSource),
  'TeamLayout should clear requests on unmount while leaving current-route failures retryable'
);

console.log('team basic info request chain tests passed');

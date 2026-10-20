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
const teamLayoutDidUpdateSource = sourceBetween(
  teamLayoutSource,
  '  componentDidUpdate(prevProps) {',
  '  componentWillUnmount() {'
);
const sharedTeamOverviewSource = sourceBetween(
  teamLayoutSource,
  '  loadSharedTeamOverview =',
  '  getTeamOverview ='
);
const teamOverviewIdentitySource = sourceBetween(
  teamLayoutSource,
  '  getTeamOverviewIdentity =',
  '  loadSharedTeamOverview ='
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
  /this\.teamOverviewBootstrap\s*=\s*createTeamOverviewBootstrap\(/.test(teamLayoutSource) &&
    /this\.teamOverviewScope\s*=\s*createTeamOverviewScope\(\)/.test(teamLayoutSource) &&
    /this\.lastInitializedTeamOverviewKey\s*=\s*'';/.test(teamLayoutSource) &&
    /this\._isUnmounted\s*=\s*false;/.test(teamLayoutSource),
  'TeamLayout should own the shared bootstrap, identity scope and one-time successful initialization'
);

assert.ok(
  /identity\s*=>\s*!this\._isUnmounted\s*&&\s*identity\s*===\s*this\.getTeamOverviewIdentity\(\)/.test(teamLayoutSource) &&
    /userId:[\s\S]*?enterpriseId:[\s\S]*?isEnterpriseAdmin:[\s\S]*?userRoles:[\s\S]*?permissions:/.test(teamOverviewIdentitySource),
  'the mounted owner should validate user, enterprise, permissions and route identity before accepting shared results'
);

assert.ok(
  !/this\.load\(|this\.getTeamOverview\(/.test(teamLayoutReceivePropsSource) &&
    /if\s*\(routeChanged\)\s*this\.load\(\);/.test(teamLayoutDidUpdateSource) &&
    /identity\s*&&\s*\(this\.activeTeamOverviewIdentity\s*!==\s*identity\s*\|\|\s*routeChanged\)/.test(teamLayoutDidUpdateSource) &&
    /this\.getTeamOverview\(\);/.test(teamLayoutDidUpdateSource),
  'route and known identity changes should read only after this.props belongs to the updated owner'
);

assert.ok(
  /payload\.team_name\s*!==\s*params\.teamName\s*\|\|\s*payload\.region_name\s*!==\s*params\.regionName/.test(sharedTeamOverviewSource) &&
    /this\.teamOverviewBootstrap\.load\(identity,\s*payload,\s*\{\s*force\s*\}\)/.test(sharedTeamOverviewSource) &&
    /this\.loadSharedTeamOverview\(\{\s*team_name:\s*params\.teamName,\s*region_name:\s*params\.regionName/.test(getTeamOverviewSource),
  'layout reads should use the current route and share its exact bootstrap while rejecting mismatched consumers'
);

assert.ok(
  !/getTeamOverview\(currentUser\.user_id\)|getTeamOverview\(res\.bean\s*&&\s*res\.bean\.user_id\)/.test(teamLayoutSource),
  'existing overview callers should omit their legacy ignored user ID and use current props'
);

assert.ok(
  /this\.requestSharedTeamOverview,/.test(teamLayoutSource) &&
    /if\s*\(isSaas\s*&&\s*this\.saasTeamOverviewIdentity\s*!==\s*identity\)\s*\{\s*this\.saasTeamOverviewIdentity\s*=\s*identity;\s*this\.fetchTeamDetails\(\);/.test(getTeamOverviewSource) &&
    /teamOverviewLoader:\s*this\.loadSharedTeamOverview/.test(teamLayoutSource),
  'the shared owner should deduplicate before the SaaS side effect and expose its loader through the page context'
);

assert.ok(
  /let settled\s*=\s*false;/.test(getTeamOverviewSource) &&
    /const fail\s*=\s*error\s*=>\s*\{\s*if\s*\(settled\)\s*return;\s*settled\s*=\s*true;\s*reject\(/.test(getTeamOverviewSource) &&
    /dispatchResult\.then\(\(\)\s*=>\s*\{\s*if\s*\(!settled\)\s*fail\(\);\s*\},\s*fail\);/.test(getTeamOverviewSource),
  'each owned transport should settle consumers once, including dispatches that finish without callbacks'
);

assert.ok(
  /shouldSave:\s*response\s*=>\s*isCurrent\(\)\s*&&\s*isTeamOverviewResponse\(response\)/.test(getTeamOverviewSource) &&
    /skipOverviewDedup:\s*true/.test(getTeamOverviewSource),
  'owned requests should gate shared store writes and isolate refreshed transport from the old service pending pool'
);

assert.ok(
  /\{\s*payload,\s*callback,\s*handleError,\s*shouldSave,\s*skipOverviewDedup\s*\}/.test(getTeamOverviewEffectSource) &&
    /yield call\(getTeamOverview,\s*payload,\s*handleError,\s*\{\s*skipDedup:\s*true\s*\}\)/.test(getTeamOverviewEffectSource) &&
    /yield call\(getTeamOverview,\s*payload,\s*handleError\)/.test(getTeamOverviewEffectSource) &&
    /if\s*\(data\s*&&\s*\(!shouldSave\s*\|\|\s*shouldSave\(data\)\)\)\s*\{\s*yield put\(\{\s*type:\s*'saveTeamOverview',\s*payload:\s*data\.bean\s*\}\);\s*\}[\s\S]*?if\s*\(data\s*&&\s*callback\)\s*\{\s*callback\(data\);\s*\}/.test(getTeamOverviewEffectSource),
  'global overview should preserve legacy calls and callbacks, isolate owned transport, and gate reducer writes before put'
);

assert.ok(
  /callback:\s*res\s*=>\s*\{\s*if\s*\(settled\)\s*return;[\s\S]*?!isTeamOverviewResponse\(res\)[\s\S]*?settled\s*=\s*true;\s*succeed\(res\);\s*if\s*\(!isCurrent\(\)\)\s*return;[\s\S]*?sessionStorage\.setItem[\s\S]*?lastInitializedTeamOverviewKey\s*===\s*identity[\s\S]*?lastInitializedTeamOverviewKey\s*=\s*identity[\s\S]*?if\s*\(!isCurrent\(\)\)\s*return;\s*this\.fetchPipePipeline\(res\.bean\.eid\);\s*this\.fetchEnterpriseInfo\(res\.bean\.eid\)/.test(getTeamOverviewSource),
  'valid current successes should retain session/plugin/enterprise initialization while suppressing stale or repeated side effects'
);

assert.ok(
  /const fail\s*=\s*error\s*=>\s*\{[\s\S]*?reject\([\s\S]*?if\s*\(!isCurrent\(\)\)\s*return;[\s\S]*?10411[\s\S]*?10412[\s\S]*?notification\.warning[\s\S]*?routerRedux\.push/.test(getTeamOverviewSource) &&
    /handleError:\s*fail/.test(getTeamOverviewSource),
  'the single owner should suppress stale errors while preserving current 10411/10412 warnings and redirects'
);

assert.ok(
  /componentWillUnmount\(\)\s*\{\s*this\._isUnmounted\s*=\s*true;\s*this\.teamOverviewBootstrap\.dispose\(\);\s*\}/.test(teamLayoutSource) &&
    /componentDidMount\(\)\s*\{\s*this\._isUnmounted\s*=\s*false;/.test(teamLayoutSource) &&
    /\{\s*force\s*=\s*false\s*\}/.test(sharedTeamOverviewSource) &&
    !/const fail[\s\S]*?lastInitializedTeamOverviewKey\s*=/.test(sourceBetween(getTeamOverviewSource, '    const fail =', '    const dispatchResult =')),
  'unmount should dispose the shared owner; explicit force remains available and failures never mark successful initialization'
);

console.log('team basic info request chain tests passed');

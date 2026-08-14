const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pageSource = fs.readFileSync(
  path.join(__dirname, 'create-configFile.js'),
  'utf8'
);
const serviceSource = fs.readFileSync(
  path.join(__dirname, '../../services/createApp.js'),
  'utf8'
);
const modelSource = fs.readFileSync(
  path.join(__dirname, '../../models/createApp.js'),
  'utf8'
);
const marketPreflightSource = fs.readFileSync(
  path.join(__dirname, '../../utils/marketInstallPreflight.js'),
  'utf8'
);
const appControlSource = fs.readFileSync(
  path.join(__dirname, '../../models/appControl.js'),
  'utf8'
);
const presentationSource = fs.readFileSync(
  path.join(__dirname, '../../utils/preflightPresentation.js'),
  'utf8'
);
const modalSource = fs.readFileSync(
  path.join(__dirname, '../../components/CreateComponentModal/index.js'),
  'utf8'
);
const createEntryFiles = [
  'code-custom.js',
  'image-name.js',
  'image-cmd.js',
  'jwar.js',
  'upload-jarwar.js'
].map(file => fs.readFileSync(path.join(__dirname, file), 'utf8'));

assert.match(
  serviceSource,
  /\/apps\/available_resources[\s\S]*?method:\s*'get'[\s\S]*?region_name:\s*body\.region_name/,
  'the create service should request available_resources with the current region'
);

assert.match(
  modelSource,
  /\*fetchAvailableResources\(\{ payload, callback, handleError \}, \{ call \}\)/,
  'the create model should expose an available resources effect'
);

assert.match(
  pageSource,
  /!shouldCheckAvailableResources\(this\.state\.appDetail\) \|\|[\s\S]*?this\.availableResourcesRequested[\s\S]*?return;[\s\S]*?this\.availableResourcesRequested = true;/,
  'the page should request resources once only for supported non-VM components'
);

assert.match(
  pageSource,
  /this\.setState\(\{ appDetail: data \}, this\.loadAvailableResources\);/,
  'the page should request the snapshot only after appDetail loads successfully'
);

assert.match(
  pageSource,
  /type:\s*'createApp\/fetchAvailableResources'/,
  'the page should load the resource snapshot through DVA'
);

const nextHandler = pageSource.slice(
  pageSource.indexOf('handleJumpNext = async () => {'),
  pageSource.indexOf('handleEditInfo =', pageSource.indexOf('handleJumpNext = async () => {'))
);

assert.ok(nextHandler, 'the page should keep an async Next handler');
assert.doesNotMatch(
  nextHandler,
  /fetchAvailableResources|loadAvailableResources/,
  'clicking Next must consume the page snapshot without refreshing it'
);
assert.match(
  nextHandler,
  /await this\.child\.childFn/,
  'Next should await validation and save completion'
);
assert.match(
  nextHandler,
  /finally[\s\S]*nextLoading:\s*false/,
  'Next should always release its local loading lock'
);
assert.match(
  appControlSource,
  /\*editAppCreateInfo\(\{ payload, callback, handleError, complete \}[\s\S]*?finally[\s\S]*?complete\(response\)/,
  'check_update should always complete even when request special-code handling returns no response'
);
assert.match(
  pageSource,
  /handleEditInfo[\s\S]*?complete:\s*data\s*=>\s*\{[\s\S]*?resolve\(!failed\s*&&\s*!!data\)/,
  'the page save Promise should settle false when check_update returns no response'
);

assert.doesNotMatch(
  `${serviceSource}\n${modelSource}`,
  /deploy_preflight|preflightDeploy/,
  'the old deploy preflight service and effect should be removed'
);
assert.doesNotMatch(
  `${marketPreflightSource}\n${modalSource}\n${createEntryFiles.join('\n')}`,
  /runDeployPreflight|buildDeployPreflightPayload|buildOauthDeployPreflightPayload/,
  'all create entry points and shared helpers should drop the deploy preflight branch'
);
assert.match(
  marketPreflightSource,
  /export function runMarketInstallPreflight/,
  'the market and platform plugin preflight helper must remain'
);
assert.doesNotMatch(
  `${marketPreflightSource}\n${presentationSource}`,
  /暂不能部署|仍然继续部署|copyType\s*!==\s*['"]deploy['"]|DEPLOY_REPLACEMENTS/,
  'deploy-only confirmation copy and presentation conversion should be removed'
);
assert.ok(
  !fs.existsSync(path.join(__dirname, '../../services/deployPreflightRequest.js')) &&
    !fs.existsSync(path.join(__dirname, '../../services/deployPreflightRequest.node.test.js')) &&
    !fs.existsSync(path.join(__dirname, '../../components/CreateComponentModal/deployPreflightPayload.js')) &&
    !fs.existsSync(path.join(__dirname, '../../components/CreateComponentModal/deployPreflightPayload.node.test.js')),
  'deploy-only request and payload helpers and their tests should be deleted'
);

console.log('create config available resources source contract tests passed');
